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

async function handleApply(vscode) {
    const choice = await vscode.window.showWarningMessage(
        'Apply the Supersmooth patch to this Antigravity installation?',
        { modal: true },
        'Apply'
    );
    if (choice !== 'Apply') {
        return;
    }

    const result = applyPatch(statusOptions(vscode));
    if (!result.ok) {
        await vscode.window.showErrorMessage(`Supersmooth: ${result.message}`);
        return;
    }

    await promptRestart(vscode, 'Supersmooth applied! Close and reopen Antigravity to activate.');
}

async function handleRevert(vscode) {
    const choice = await vscode.window.showWarningMessage(
        'Revert the Supersmooth patch and restore the backed up Antigravity bundles?',
        { modal: true },
        'Revert'
    );
    if (choice !== 'Revert') {
        return;
    }

    const result = revertPatch(statusOptions(vscode));
    if (!result.ok) {
        await vscode.window.showErrorMessage(`Supersmooth: ${result.message}`);
        return;
    }

    await promptRestart(vscode, 'Supersmooth reverted. Close and reopen Antigravity to restore original behavior.');
}

async function handleVerify(vscode) {
    const result = verifyInstallation(statusOptions(vscode));
    if (result.ok) {
        await vscode.window.showInformationMessage(`Supersmooth: ${result.message}`);
        return;
    }
    await vscode.window.showWarningMessage(`Supersmooth: ${result.message}`);
}

async function autoApplyOnStartup(vscode) {
    const status = collectStatus(statusOptions(vscode));
    if (!status.ok) {
        await vscode.window.showWarningMessage(
            `Supersmooth: Could not detect Antigravity. ${status.message || 'Set the install path in Settings if needed.'}`
        );
        return;
    }

    switch (status.overallState) {
        case 'patched':
            // Already patched, nothing to do. Silent.
            return;

        case 'unpatched': {
            const result = applyPatch(statusOptions(vscode));
            if (result.ok) {
                await promptRestart(vscode, 'SuperSmooth Installed! Close and reopen Antigravity to activate.');
            } else {
                await vscode.window.showErrorMessage(`Supersmooth: Auto-apply failed. ${result.message}`);
            }
            return;
        }

        case 'legacy':
            await vscode.window.showWarningMessage(
                'Supersmooth: A legacy AGFIX patch was detected. Please revert it before Supersmooth can be applied.'
            );
            return;

        case 'unsupported':
            await vscode.window.showInformationMessage(
                `Supersmooth: Antigravity ${status.installInfo.appVersion} is not yet supported. No patch available.`
            );
            return;

        default:
            void showStatusMessage(vscode, status);
            return;
    }
}

function activate(context) {
    const vscode = require('vscode');

    context.subscriptions.push(vscode.commands.registerCommand('supersmooth.status', async () => {
        await showStatusMessage(vscode, collectStatus(statusOptions(vscode)));
    }));

    context.subscriptions.push(vscode.commands.registerCommand('supersmooth.apply', async () => {
        await handleApply(vscode);
    }));

    context.subscriptions.push(vscode.commands.registerCommand('supersmooth.revert', async () => {
        await handleRevert(vscode);
    }));

    context.subscriptions.push(vscode.commands.registerCommand('supersmooth.verify', async () => {
        await handleVerify(vscode);
    }));

    // Detect self-uninstall via extension change event.
    // When user clicks Uninstall, onDidChange fires while we are still loaded.
    // If getExtension(selfId) returns undefined, we are being removed.
    const selfId = context.extension.id;
    context.subscriptions.push(
        vscode.extensions.onDidChange(() => {
            const self = vscode.extensions.getExtension(selfId);

            // Log for instrumentation (helps verify event fires in AG)
            try {
                const fs = require('fs');
                const path = require('path');
                const logDir = path.join(vscode.env.appRoot, '..', '.supersmooth');
                fs.mkdirSync(logDir, { recursive: true });
                const logFile = path.join(logDir, 'events.log');
                const entry = `[${new Date().toISOString()}] onDidChange fired. selfId=${selfId} self=${self ? 'present' : 'GONE'}\n`;
                fs.appendFileSync(logFile, entry);
            } catch (_) {
                // Logging is best-effort.
            }

            if (!self) {
                // We are being removed. Revert patches.
                try {
                    const result = revertPatch(statusOptions(vscode));
                    if (result.ok) {
                        vscode.window.showInformationMessage(
                            'Supersmooth removed. Patches reverted. Restart to complete.');
                    }
                } catch (_) {
                    // Best effort. Extension is going away.
                }
            }
        })
    );

    // Auto-apply on startup: detect state and act.
    void autoApplyOnStartup(vscode);
}

function deactivate() {}

module.exports = { activate, deactivate };
