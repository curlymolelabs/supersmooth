# Supersmooth Extension: Lifecycle Audit Request

## What is Supersmooth

A VS Code extension running inside Antigravity (a VS Code fork). It patches two Antigravity bundle files on disk to:
1. Auto-confirm terminal execution when saved policy is "Always run"
2. Auto-expand the "Steps Require Input" approval section in the agent panel

It also updates the integrity checksums in `product.json` so AG doesn't flag the modified files.

## What Works Today

- **Install**: User installs `.vsix` -> extension auto-patches files -> notification with "Restart Now" -> user clicks -> AG reloads -> patch is live. No issues.
- **Patches**: Both autorun and panel-expand patches work correctly.
- **Checksums**: `applyPatch()` updates `product.json` checksums to match patched files. No "corrupt installation" warning.

## The Problem: Uninstall UX

### Current behavior (tested on user's laptop)
1. User clicks "Uninstall" in Extensions panel
2. User restarts AG manually
3. **No notification at all** (no "corrupt" warning, no confirmation)
4. **Patched files remain active** on disk (patches keep working even without the extension)
5. User has no way to revert patches without reinstalling the extension or using the CLI

### Desired behavior
1. User clicks "Uninstall" -> notification: "Supersmooth uninstalled. Restart to complete." **[Restart]**
2. User clicks Restart -> AG fully restarts
3. After restart -> notification: "Supersmooth uninstalled. Original behavior restored."
4. Patched files are reverted to originals. Clean state.

## The VS Code Lifecycle Constraint

VS Code provides two extension lifecycle hooks:

```
activate(context)  - fires when extension loads
deactivate()       - fires on EVERY shutdown
```

**The core problem:** `deactivate()` fires on ALL of these events with no way to distinguish them:
- Window reload (user clicked "Restart Now" during install)
- Window close (user closing AG)
- Extension uninstall (user removing the extension)

### What we tried

| Approach | Result |
|---|---|
| Auto-revert in `deactivate()` | **Breaks install.** Reverts patch on reload, install flow loops infinitely (apply -> restart -> revert -> re-apply -> restart -> ...) |
| Empty `deactivate()` | **Install works.** But uninstall leaves patched files with no cleanup. |
| Remove "Restart Now" button | Worked around the loop but removed a good UX element for no reason. |

### Additional API surface (from previous auditor)

The previous auditor noted that `vscode.extensions.onDidChange` exists and fires when extensions are installed/uninstalled/enabled/disabled. This was not explored yet. Questions:
- Does it fire when OUR OWN extension is being uninstalled?
- Does it fire BEFORE the extension is deactivated (giving us time to act)?
- Can we use it to set a flag that `deactivate()` reads to decide whether to revert?

## Specific Questions for Auditor

1. **How can we detect self-uninstall?** Is there any VS Code API, event, or pattern that lets an extension know it's being uninstalled (not just reloaded)?

2. **Is `vscode.extensions.onDidChange` viable?** Can we listen for our own removal and trigger a revert before shutdown?

3. **State flag approach:** Could we set a flag in `activate()` and check it in `deactivate()` to distinguish reload from uninstall? For example:
   - `activate()`: sets globalState `supersmooth.active = true`
   - `deactivate()`: checks if extension is still in the extensions list
   - If still listed: it's a reload, don't revert
   - If not listed: it's an uninstall, revert

4. **Post-uninstall notification:** After uninstall and restart, our code is gone. How can we show "Uninstall completed"? Is there a marker file approach or any other mechanism?

5. **Is cleanup even necessary?** The patched files work fine without the extension. The checksums match (no "corrupt" warning). Should we just document that patches persist after uninstall and let them be overwritten naturally by AG updates?

6. **Architecture redesign:** Should we rethink the architecture entirely? For example: instead of patching files directly, could we use a different mechanism that naturally cleans up when the extension is removed?

## Source Code

All source files are in the `supersmooth/` directory. The auditor should review:

### File Structure
```
supersmooth/
  package.json          # Extension manifest, commands, activation events
  src/
    extension.js        # VS Code lifecycle: activate(), deactivate(), commands
    engine.js           # Core logic: applyPatch(), revertPatch(), collectStatus()
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

### Key file: extension.js (the lifecycle problem lives here)

```javascript
'use strict';

const { applyPatch, collectStatus, revertPatch, verifyInstallation } = require('./engine');

function statusOptions(vscode) {
    const config = vscode.workspace.getConfiguration('supersmooth');
    return {
        explicitPath: config.get('installPath') || '',
        hostAppRoot: vscode.env.appRoot || ''
    };
}

function showStatusMessage(vscode, status) {
    const message = status.ok
        ? `Supersmooth: ${status.overallState} on Antigravity ${status.installInfo.appVersion}`
        : `Supersmooth: ${status.message}`;
    return vscode.window.showInformationMessage(message);
}

async function promptRestart(vscode, message) {
    const choice = await vscode.window.showInformationMessage(
        message,
        'Restart Now'
    );
    if (choice === 'Restart Now') {
        await vscode.commands.executeCommand('workbench.action.reloadWindow');
    }
}

async function autoApplyOnStartup(vscode) {
    const status = collectStatus(statusOptions(vscode));
    if (!status.ok) {
        await vscode.window.showWarningMessage(
            `Supersmooth: Could not detect Antigravity. ${status.message || ''}`
        );
        return;
    }

    switch (status.overallState) {
        case 'patched':
            // Already patched. Silent.
            return;

        case 'unpatched': {
            const result = applyPatch(statusOptions(vscode));
            if (result.ok) {
                await promptRestart(vscode,
                    'SuperSmooth Installed! Close and reopen Antigravity to activate.');
            } else {
                await vscode.window.showErrorMessage(
                    `Supersmooth: Auto-apply failed. ${result.message}`);
            }
            return;
        }

        case 'legacy':
            await vscode.window.showWarningMessage(
                'Supersmooth: A legacy AGFIX patch was detected. Please revert it first.');
            return;

        case 'unsupported':
            await vscode.window.showInformationMessage(
                `Supersmooth: AG ${status.installInfo.appVersion} is not supported.`);
            return;

        default:
            void showStatusMessage(vscode, status);
            return;
    }
}

function activate(context) {
    const vscode = require('vscode');

    // Register manual commands
    context.subscriptions.push(
        vscode.commands.registerCommand('supersmooth.status', async () => {
            await showStatusMessage(vscode, collectStatus(statusOptions(vscode)));
        }),
        vscode.commands.registerCommand('supersmooth.apply', async () => {
            /* manual apply with confirmation */ }),
        vscode.commands.registerCommand('supersmooth.revert', async () => {
            /* manual revert with confirmation */ }),
        vscode.commands.registerCommand('supersmooth.verify', async () => {
            const result = verifyInstallation(statusOptions(vscode));
            await vscode.window.showInformationMessage(`Supersmooth: ${result.message}`);
        })
    );

    // Auto-apply on startup
    void autoApplyOnStartup(vscode);
}

// THIS IS THE UNSOLVED PROBLEM.
// Empty = install works, uninstall leaves patches.
// Revert here = install loops infinitely.
function deactivate() {}

module.exports = { activate, deactivate };
```

### Key file: engine.js (what applyPatch and revertPatch do)

- `applyPatch()`: Reads bundles, plans patches via dynamic 4-layer analysis, syntax-checks the result, backs up originals to `.supersmooth/backups/`, writes patched content, updates checksums in `product.json`, writes a manifest.
- `revertPatch()`: Reads manifest, copies backup files over patched files, restores `product.json`, deletes manifest.
- `collectStatus()`: Detects AG install, reads target files, checks for markers, returns overall state: `patched | unpatched | legacy | unsupported | mixed | missing`.

Full source for all files is in the `supersmooth/` directory provided alongside this document.
