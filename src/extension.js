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
        'Restart Now',
        'Later'
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

    await promptRestart(vscode, 'Supersmooth applied. Restart to activate.');
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

    await promptRestart(vscode, 'Supersmooth reverted. Restart to restore original behavior.');
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
        return;
    }

    switch (status.overallState) {
        case 'patched':
            // Already patched, nothing to do. Silent.
            return;

        case 'unpatched': {
            // Auto-apply the patch silently, then prompt restart.
            const result = applyPatch(statusOptions(vscode));
            if (result.ok) {
                await promptRestart(vscode, 'Supersmooth installed and applied. Restart to activate.');
            } else {
                await vscode.window.showErrorMessage(`Supersmooth auto-apply failed: ${result.message}`);
            }
            return;
        }

        case 'legacy':
            await vscode.window.showWarningMessage(
                'Supersmooth: Legacy AGFIX patch detected. Please revert the old patch before Supersmooth can be applied.'
            );
            return;

        case 'unsupported':
            await vscode.window.showInformationMessage(
                `Supersmooth: Unsupported Antigravity build (${status.installInfo.appVersion}). No patch available.`
            );
            return;

        default:
            // mixed, missing, or unknown states: show status for diagnostics
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

    // Auto-apply on startup: detect state and act.
    void autoApplyOnStartup(vscode);
}

function deactivate() {}

module.exports = { activate, deactivate };
