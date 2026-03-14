# Supersmooth Extension: Lifecycle Audit v5

## Status: All VS Code Uninstall APIs Exhausted

We have tested every known VS Code extension lifecycle mechanism for detecting uninstall in Antigravity. None work.

### Test Results (Two Separate Machines)

| Mechanism | VS Code Support | AG Result | Evidence |
|---|---|---|---|
| `vscode:uninstall` script in package.json | Documented in [Extension Manifest](https://code.visualstudio.com/api/references/extension-manifest) | **Does not fire.** Patches persist after uninstall + full restart. | User tested on machine 1 |
| `vscode.extensions.onDidChange` event | Documented in [vscode API](https://code.visualstudio.com/api/references/vscode-api) | **Does not fire.** Instrumented with file logging. No `events.log` created. | User tested on machine 2. Verified no log at `%LOCALAPPDATA%\Programs\Antigravity\.supersmooth\events.log` or `resources\.supersmooth\events.log` |
| `deactivate()` | Works in AG | **Fires on ALL shutdowns** (reload, close, uninstall). No way to distinguish. | Auto-revert in deactivate causes install loop (apply -> restart -> revert -> re-apply) |

### What We Implemented and Tested

```javascript
// In activate(), we added:
const selfId = context.extension.id;
context.subscriptions.push(
    vscode.extensions.onDidChange(() => {
        const self = vscode.extensions.getExtension(selfId);
        // Log to file for diagnostics
        fs.appendFileSync(logFile, `onDidChange fired. self=${self ? 'present' : 'GONE'}\n`);
        if (!self) {
            revertPatch(statusOptions(vscode)); // Revert if we're disappearing
        }
    })
);
```

The log file was never created on either machine. The event handler never executes.

## The Core Constraint

AG appears to strip or not implement extension lifecycle events beyond `activate()` and `deactivate()`. From an extension, there is no programmatic way to detect our own uninstall.

## Current Fallback

The `onDidChange` listener remains in the code as a zero-cost fallback (if AG adds support later, it will just work). The practical uninstall flow is:

1. User runs "Supersmooth: Revert Patch" from Command Palette
2. User clicks "Uninstall" in Extensions panel
3. User restarts AG

## Questions for Auditor

1. **Are there other VS Code APIs we haven't tried?** We tested `vscode:uninstall`, `onDidChange`, and `deactivate()`. Is there any other mechanism (filesystem watcher on the extensions directory, `ExtensionContext` properties, `globalState` tricks) that could detect self-uninstall?

2. **Is there a deactivate() state-machine approach that avoids the install loop?** For example:
   - `activate()` sets a flag
   - `deactivate()` always reverts (including on install reload)
   - Next `activate()` sees "I was just deactivated" and re-applies silently
   - If next `activate()` never comes (uninstall), patches stay reverted
   
   Problem: this causes the renderer to load the unpatched bundle on reload (deactivate reverted it before reload), then activate re-patches on disk, but the renderer already loaded the old file. User needs a second restart.

3. **Is the two-restart tradeoff acceptable?** The deactivate-always-revert approach guarantees clean uninstall but requires two restarts for install. Is this a better UX than asking users to run "Revert" before uninstalling?

4. **Is there an AG-specific API?** Since AG is a VS Code fork, it might have custom extension APIs not in the standard VS Code docs. Any way to discover these?

5. **Should we accept the constraint?** Given that AG doesn't implement `vscode:uninstall` or `onDidChange`, is "revert before uninstalling" the standard practice for similar extensions (e.g., custom-css-loader, monkey-patch, vscode-custom-css)?

## Separate Issue: useEffect Alias Fix (Completed)

The autorun patch was injecting through `xi()` (useMemo alias) instead of `fn()` (real useEffect). This has been fixed and committed.

| Bundle | Old alias (wrong) | New alias (correct) | Evidence |
|---|---|---|---|
| workbench | xi (0 cleanup returns) | **fn** (2 cleanup returns) | Real bundle analysis |
| jetski | Oe (0 cleanup returns) | **At** (8 cleanup returns) | Real bundle analysis |

Fix: Removed `'fn'` from detector exclude set, expanded search window from 20k to 60k chars. Tests updated and passing.

## Source Files

All source in `supersmooth/` directory. Key files:

```
src/extension.js    # activate() with onDidChange listener, empty deactivate()
src/engine.js       # applyPatch(), revertPatch(), collectStatus()
src/patching.js     # useEffect alias detection (fixed)
package.json        # Extension manifest
test/patching.test.js  # Updated assertions
```
