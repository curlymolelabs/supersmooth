# Supersmooth Extension: Lifecycle Audit v3

## Context

Supersmooth is a VS Code extension for Antigravity (VS Code fork). It patches bundle files on disk to:
1. Auto-confirm terminal execution when saved policy is "Always run"
2. Auto-expand "Steps Require Input" approval section in the agent panel

It also updates integrity checksums in `product.json` so AG does not report corruption.

## Install User Journey

```
1. User installs .vsix in AG Extensions panel
2. AG loads the extension -> activate() fires
3. autoApplyOnStartup() detects state "unpatched"
4. applyPatch() runs:
   - Backs up original files to .supersmooth/backups/
   - Writes patched bundle files
   - Updates checksums in product.json
   - Writes manifest.json
5. Notification: "SuperSmooth Installed!" [Restart Now]
6. User clicks "Restart Now"
7. deactivate() fires -> does nothing (empty)
8. workbench.action.reloadWindow executes
9. Renderer reloads, reads patched bundle from disk
10. activate() fires -> detects state "patched" -> SILENT
11. Done. Patches are live.
```

**Status: Working. Tested on user's laptop. No issues.**

## Uninstall User Journey (Proposed)

```
1. User clicks "Uninstall" in AG Extensions panel
2. AG marks extension for removal
3. AG prompts user to reload
4. User clicks reload or manually restarts AG
5. deactivate() fires -> does nothing (empty)
6. Extension files are removed by AG
7. AG restarts
8. vscode:uninstall hook fires -> runs "node ./src/uninstall.js"
   - uninstall.js calls revertPatch()
   - revertPatch() reads manifest.json
   - Copies backup files over patched files
   - Restores original product.json checksums
   - Deletes manifest.json
9. AG is now running with original unpatched files
10. Done. Clean slate.
```

### Expected user-visible behavior

| Step | What user sees |
|------|---------------|
| 1 | Clicks "Uninstall" button |
| 2-3 | AG shows built-in "Reload Required" indicator |
| 4 | User restarts AG |
| 7-8 | vscode:uninstall runs silently in background |
| 9-10 | AG starts normally with original behavior restored |

### Open questions

- The official docs say vscode:uninstall runs "when VS Code is restarted (shutdown and start) after the extension is uninstalled." Does this mean full process restart, or does reloadWindow count?
- The uninstall script runs as a standalone Node.js process with NO `vscode` API access. Our `revertPatch()` only uses `fs`, `path`, and our own modules. It should work, but needs testing.
- After uninstall, will console.log output from uninstall.js be visible anywhere? Or is it silent?

## Implementation

### New file: src/uninstall.js

```javascript
'use strict';

/**
 * Uninstall hook: runs automatically when VS Code/Antigravity restarts
 * after the Supersmooth extension has been uninstalled.
 *
 * Registered via "vscode:uninstall" in package.json.
 * This is a standalone Node.js script with no VS Code API access.
 */

const { revertPatch } = require('./engine');

try {
    const result = revertPatch();
    if (result.ok) {
        console.log('Supersmooth: Patches reverted. Original behavior restored.');
    } else if (result.code === 'manifest-missing') {
        // No manifest means nothing to revert. Silent.
    } else {
        console.error('Supersmooth: Revert failed.', result.message);
    }
} catch (error) {
    console.error('Supersmooth: Uninstall cleanup error.', error.message);
}
```

### Modified: package.json (scripts section)

```json
{
  "scripts": {
    "vscode:uninstall": "node ./src/uninstall",
    "status": "node bin/supersmooth.js status",
    "verify": "node bin/supersmooth.js verify",
    "watch": "node bin/supersmooth.js watch",
    "test": "node test/patching.test.js"
  }
}
```

### Unchanged: extension.js

`deactivate()` remains empty. The `vscode:uninstall` hook is completely separate from the activate/deactivate lifecycle. No conflict between install and uninstall journeys.

### How revertPatch() works (in engine.js)

1. Reads `.supersmooth/manifest.json` (contains backup file paths + checksums)
2. For each patched file: copies backup over the patched file
3. Restores original `product.json` from backup
4. Deletes `manifest.json`
5. Returns `{ ok: true }` or `{ ok: false, message }` on error

No `vscode` API dependency. Pure `fs` and `path` operations.

## Questions for Auditor

1. **Does Antigravity support the `vscode:uninstall` hook?** It is a VS Code fork. Is this hook preserved or stripped?

2. **Timing:** The docs say the script runs on restart after uninstall. Does `revertPatch()` (which copies ~20MB backup files) have enough time to complete? Is there a timeout?

3. **Working directory:** When `vscode:uninstall` runs `node ./src/uninstall.js`, what is the working directory? Is it the extension's install directory (which may have been partially cleaned up), or somewhere else? If the extension directory is gone, `require('./engine')` would fail.

4. **Dependency chain:** `uninstall.js` requires `engine.js`, which requires `install.js`, `checksum.js`, `patching.js`, `support.js`. All of these must still be on disk when the uninstall script runs. Is that guaranteed?

5. **Is there a better approach?** Should we instead write a self-contained uninstall script that duplicates the revert logic without requiring other modules, in case the extension directory is partially cleaned?

## Source Code Reference

All source files are in the `supersmooth/` directory:

```
supersmooth/
  package.json          # Extension manifest + vscode:uninstall hook
  src/
    extension.js        # activate(), deactivate() (empty), commands
    uninstall.js        # NEW: vscode:uninstall cleanup script
    engine.js           # applyPatch(), revertPatch(), collectStatus()
    patching.js         # Dynamic analysis: planPatchForTarget(), planPanelPatchForTarget()
    support.js          # Constants, profiles, version matching
    checksum.js         # SHA256 + product.json checksum updating
    install.js          # Antigravity install detection (cross-platform)
    watcher.js          # File watcher for auto-re-patch on AG updates
  bin/
    supersmooth.js      # CLI entry point
  test/
    patching.test.js    # Unit tests
```
