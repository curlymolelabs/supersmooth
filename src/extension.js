'use strict';

const { applyPatch, collectStatus, revertPatch, verifyInstallation } = require('./engine');

function showStatusMessage(vscode, status) {
    const message = status.ok
        ? `Supersmooth: ${status.overallState} on Antigravity ${status.installInfo.appVersion}`
        : `Supersmooth: ${status.message}`;
    return vscode.window.showInformationMessage(message);
}

function statusOptions(vscode) {
    const config = vscode.workspace.getConfiguration('supersmooth');
    return {
        explicitPath: config.get('installPath') || '',
        hostAppRoot: vscode.env.appRoot || ''
    };
}

async function handleApply(vscode) {
    const choice = await vscode.window.showWarningMessage(
        'Apply the Supersmooth patch to this Antigravity installation? A restart will be required.',
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

    await vscode.window.showInformationMessage(result.message);
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

    await vscode.window.showInformationMessage(result.message);
}

async function handleVerify(vscode) {
    const result = verifyInstallation(statusOptions(vscode));
    if (result.ok) {
        await vscode.window.showInformationMessage(`Supersmooth: ${result.message}`);
        return;
    }
    await vscode.window.showWarningMessage(`Supersmooth: ${result.message}`);
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

    const config = vscode.workspace.getConfiguration('supersmooth');
    if (config.get('promptOnStartup')) {
        const status = collectStatus(statusOptions(vscode));
        if (!status.ok || status.overallState === 'legacy' || status.overallState === 'unsupported' || status.overallState === 'unpatched') {
            void showStatusMessage(vscode, status);
        }
    }
}

function deactivate() {}

module.exports = { activate, deactivate };
