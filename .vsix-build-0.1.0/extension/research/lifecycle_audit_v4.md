# Supersmooth Extension: Lifecycle Audit v4

## Summary of Previous Findings

| Round | Finding | Status |
|-------|---------|--------|
| v2 | `deactivate()` can't distinguish reload from uninstall | Confirmed |
| v2 | `vscode.extensions.onDidChange` suggested as alternative | Not yet tried |
| v3 | `vscode:uninstall` hook proposed | **Rejected: AG does not fire it** (user tested) |
| v3 | Uninstall script has no reliable install target | Moot (hook doesn't fire) |
| All | useEffect alias detector picks useMemo alias | Confirmed (separate fix planned) |

## Confirmed Test Results (User's Laptop)

1. Install .vsix -> auto-apply -> "Restart Now" -> reload -> **"AG corrupt" on reload** (expected: AG caches checksums in memory, mismatch on reload). Full close+reopen: **no warning, patch works.**
2. Uninstall -> "Restart Extension" button -> **patch still works** (only restarts extension host, not renderer)
3. Uninstall -> full close+reopen -> **"AG corrupt" warning appears, but patch still works**
4. `vscode:uninstall` hook: **does NOT fire in Antigravity**. Patches persist after uninstall+restart.

## Current Problem

After uninstalling Supersmooth, patched files remain on disk permanently. There is no automatic cleanup. The user wants: uninstall should revert patches to restore stock AG behavior.

## Proposed Fix: `vscode.extensions.onDidChange`

### Approach

When the user clicks "Uninstall" in the Extensions panel, VS Code marks the extension for removal but does NOT immediately deactivate it. The `vscode.extensions.onDidChange` event should fire at this point while our code is still running.

### Implementation

In `activate()`, subscribe to the event. When it fires, check if our extension is disappearing:

```javascript
function activate(context) {
    const vscode = require('vscode');
    const selfId = context.extension.id;

    // Listen for extension changes (install/uninstall/enable/disable)
    context.subscriptions.push(
        vscode.extensions.onDidChange(() => {
            const self = vscode.extensions.getExtension(selfId);
            if (!self) {
                // We are being removed. Revert patches.
                try {
                    const result = revertPatch(statusOptions(vscode));
                    if (result.ok) {
                        vscode.window.showInformationMessage(
                            'Supersmooth removed. Patches reverted. Restart to complete.');
                    }
                } catch (_) {
                    // Best effort.
                }
            }
        })
    );

    // ... rest of activate (commands, autoApplyOnStartup)
}
```

### Cleanup of Dead Code

| File | Change |
|------|--------|
| `src/uninstall.js` | **Delete.** AG doesn't execute `vscode:uninstall`. |
| `package.json` | **Remove** `"vscode:uninstall"` script entry. |
| `src/extension.js` | **Add** `onDidChange` listener. `deactivate()` stays empty. |

### Why This Doesn't Conflict with Install

- `onDidChange` fires when ANY extension is added/removed/enabled/disabled
- We only revert when `getExtension(selfId)` returns `undefined` (we are disappearing)
- Installing other extensions, reloads, normal restarts: our extension is still present, `getExtension` returns it, no revert triggered
- `deactivate()` remains empty, no loop possible

### Risks

| Risk | Impact |
|------|--------|
| AG doesn't fire `onDidChange` | No-op. Same as current behavior. Safe fallback. |
| `getExtension(selfId)` still returns us after "Uninstall" click | Can't detect removal. Also a no-op. |
| Event fires but extension directory is already gone | `revertPatch()` still works because it reads `.supersmooth/manifest.json` from the AG install directory, not the extension directory. |

## Questions for Auditor

1. **Does `vscode.extensions.onDidChange` fire in AG when an extension is uninstalled?** If AG stripped this event, we're back to square one.

2. **At the moment `onDidChange` fires, does `getExtension(selfId)` return `undefined` or the still-loaded extension?** In stock VS Code, when you click "Uninstall", the extension is marked for removal but may still appear in the extensions list until reload.

3. **Is `context.extension.id` the correct identifier?** Should we use the full publisher ID (`curly-mole-labs.supersmooth`) or does `context.extension.id` already resolve to that?

4. **Is there a better signal?** For example, checking if the extension directory is marked `.obsolete`, polling, or any AG-specific API we haven't considered?

5. **Regarding the "AG corrupt" warning on first reload after install:** This happens because AG caches checksums in memory at startup. When we modify files + update checksums mid-session, reload compares new disk state against stale in-memory values. Is there an API to force AG to re-read product.json checksums? Or is the only workaround to tell users "fully close and reopen" instead of reload?

## Separate Fix: useEffect Alias Bug

### Evidence

Analysis of workbench.desktop.main.js, 100k region around `setTerminalAutoExecutionPolicy`:

| Alias | Cleanup returns | Total calls | Identity |
|-------|----------------|-------------|----------|
| **fn** | **2** | 8 | **useEffect** (only useEffect returns cleanup functions) |
| xi | 0 | 15 | useMemo/useCallback |
| Zt | 0 | 15 | useMemo/useCallback |

Root cause: `fn` is excluded from the candidate set at `patching.js:194`:
```javascript
const exclude = new Set(['var', 'new', 'for', 'if', 'fn']);
//                                                    ^^^ this excludes the real useEffect
```

### Proposed fix

1. Remove `'fn'` from the exclude set
2. Expand the search window from 20k to 60k so Phase 1 (cleanup-return detector) finds `fn`'s cleanup returns
3. Update test assertions to expect `fn` instead of `xi`

### Why it works today despite the bug

`xi()` (useMemo) with empty deps `[]` runs once on mount, which accidentally produces the desired side effect. But this depends on React internals and could break in a future AG update.

## Source Files

All source in `supersmooth/` directory. Key files for this audit:

```
src/extension.js    # Lifecycle hooks (the change goes here)
src/uninstall.js    # Dead code to delete
src/engine.js       # applyPatch(), revertPatch() (unchanged)
src/patching.js     # useEffect alias detection (separate fix)
package.json        # Remove vscode:uninstall entry
```
