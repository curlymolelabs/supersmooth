'use strict';

const { applyPatch, collectStatus, revertPatch, verifyInstallation } = require('./engine');

const DESIRED_MODE_KEY = 'supersmooth.desiredMode';
const PROMPTED_ENABLE_KEY = 'supersmooth.promptedEnable';
const DESIRED_MODE_ENABLED = 'enabled';
const DESIRED_MODE_DISABLED = 'disabled';

function statusOptions(vscode) {
    const config = vscode.workspace.getConfiguration('supersmooth');
    return {
        explicitPath: config.get('installPath') || '',
        hostAppRoot: vscode.env.appRoot || ''
    };
}

function describeDesiredMode(mode) {
    switch (mode) {
        case DESIRED_MODE_ENABLED:
            return 'enabled';
        case DESIRED_MODE_DISABLED:
            return 'disabled';
        default:
            return 'not active yet';
    }
}

function getDesiredMode(context) {
    return context.globalState.get(DESIRED_MODE_KEY, '');
}

function hasPromptedEnable(context) {
    return Boolean(context.globalState.get(PROMPTED_ENABLE_KEY, false));
}

async function setDesiredMode(context, mode) {
    await context.globalState.update(DESIRED_MODE_KEY, mode);
}

async function markEnablePromptSeen(context) {
    await context.globalState.update(PROMPTED_ENABLE_KEY, true);
}

function getStatusSummary(status, desiredMode) {
    if (!status.ok) {
        return {
            kind: 'error',
            message: `Supersmooth could not inspect this Antigravity installation. ${status.message}`
        };
    }

    switch (status.overallState) {
        case 'unpatched':
            if (desiredMode === DESIRED_MODE_ENABLED) {
                return {
                    kind: 'repair',
                    message: 'Antigravity updated and replaced the patched files. Choose Restore Supersmooth to re-apply.'
                };
            }
            if (desiredMode === DESIRED_MODE_DISABLED) {
                return {
                    kind: 'inactive',
                    message: `Supersmooth is disabled on Antigravity ${status.installInfo.ideVersion}. You can re-enable it any time from the Command Palette.`
                };
            }
            return {
                kind: 'setup',
                message: `Supersmooth is ready on Antigravity ${status.installInfo.ideVersion}. Enable it to smooth your workflow. Requires one full quit and reopen.`
            };

        case 'patched':
            if (desiredMode === DESIRED_MODE_DISABLED) {
                return {
                    kind: 'attention',
                    message: 'Supersmooth is marked inactive, but this Antigravity installation is still patched. Choose Remove Cleanly to restore the original files.'
                };
            }
            return {
                kind: 'active',
                message: `Supersmooth is active on Antigravity ${status.installInfo.ideVersion}.`
            };

        case 'mixed':
            return {
                kind: 'attention',
                message: 'Supersmooth needs attention because this Antigravity installation is only partially patched. Verify the installation or remove it cleanly before continuing.'
            };

        case 'legacy':
            return {
                kind: 'legacy',
                message: 'A legacy AGFIX patch was detected. Restore the original Antigravity files before using Supersmooth.'
            };

        case 'unsupported':
            return {
                kind: 'unsupported',
                message: `Antigravity ${status.installInfo.ideVersion} is not supported by this Supersmooth build.`
            };

        case 'missing':
            return {
                kind: 'missing',
                message: 'Supersmooth could not find all required Antigravity files in this installation.'
            };

        default:
            return {
                kind: 'attention',
                message: `Supersmooth found an unexpected install state: ${status.overallState}.`
            };
    }
}

function updateStatusBar(statusBarItem, status, desiredMode) {
    if (!statusBarItem) {
        return;
    }

    const summary = getStatusSummary(status, desiredMode);
    switch (summary.kind) {
        case 'setup':
            statusBarItem.text = '$(rocket) Supersmooth: Enable';
            statusBarItem.tooltip = summary.message;
            statusBarItem.command = 'supersmooth.apply';
            statusBarItem.show();
            return;

        case 'repair':
        case 'attention':
        case 'legacy':
        case 'missing':
            statusBarItem.text = '$(warning) Supersmooth: Needs attention';
            statusBarItem.tooltip = summary.message;
            statusBarItem.command = 'supersmooth.status';
            statusBarItem.show();
            return;

        default:
            // 'active', 'inactive', 'unsupported', 'error' -- hide status bar
            statusBarItem.hide();
    }
}

async function showFollowupMessage(vscode, message, buttons = [], options = {}) {
    const useModal = options.modal !== false;
    const choice = await vscode.window.showInformationMessage(
        message,
        useModal ? { modal: true } : {},
        ...buttons
    );
    if (choice === 'Open Extensions') {
        await vscode.commands.executeCommand('workbench.view.extensions');
    }
}

async function showSummaryToast(vscode, summary) {
    switch (summary.kind) {
        case 'attention':
        case 'repair':
        case 'legacy':
        case 'missing':
            await vscode.window.showWarningMessage(`Supersmooth: ${summary.message}`);
            return;

        case 'error':
            await vscode.window.showErrorMessage(`Supersmooth: ${summary.message}`);
            return;

        default:
            await vscode.window.showInformationMessage(`Supersmooth: ${summary.message}`);
    }
}

function determineStartupAction(desiredMode, promptedEnable, status) {
    if (!status.ok) {
        return 'noop';
    }

    if (!desiredMode) {
        if (status.overallState === 'patched') {
            return 'adopt-enabled';
        }
        if (status.overallState === 'unpatched' && !promptedEnable) {
            return 'prompt-enable';
        }
        return 'noop';
    }

    if (desiredMode === DESIRED_MODE_DISABLED) {
        return 'noop';
    }

    if (desiredMode !== DESIRED_MODE_ENABLED) {
        return 'noop';
    }

    switch (status.overallState) {
        case 'patched':
            return 'noop';
        case 'unpatched':
            return 'apply';
        case 'legacy':
            return 'warn-legacy';
        case 'unsupported':
            return 'show-unsupported';
        default:
            return 'show-status';
    }
}

async function enableSupersmooth(context, vscode, options = {}) {
    const promptForConfirmation = options.promptForConfirmation !== false;

    if (promptForConfirmation) {
        const choice = await vscode.window.showWarningMessage(
            'Enable Supersmooth for this Antigravity installation now? This patches local app files. You will need one full quit and reopen when it finishes.',
            { modal: true },
            'Enable Supersmooth'
        );
        if (choice !== 'Enable Supersmooth') {
            return { ok: false, code: 'cancelled', message: 'Enable cancelled.' };
        }
    }

    await markEnablePromptSeen(context);

    const result = applyPatch(statusOptions(vscode));
    if (!result.ok) {
        await vscode.window.showErrorMessage(`Supersmooth: ${result.message}`);
        return result;
    }

    await setDesiredMode(context, DESIRED_MODE_ENABLED);

    if (result.code === 'already-patched') {
        await showFollowupMessage(
            vscode,
            'Supersmooth is enabled for this installation.'
        );
    } else {
        await showFollowupMessage(
            vscode,
            'Supersmooth is enabled. Fully quit and reopen Antigravity to load the patched files. A window reload is not enough.'
        );
    }

    return result;
}

async function disableSupersmooth(context, vscode, options = {}) {
    const promptForConfirmation = options.promptForConfirmation !== false;
    const offerOpenExtensions = Boolean(options.offerOpenExtensions);

    if (promptForConfirmation) {
        const choice = await vscode.window.showWarningMessage(
            'Disable Supersmooth and restore the original Antigravity files? Supersmooth will stay installed until you uninstall it separately.',
            { modal: true },
            'Disable Supersmooth'
        );
        if (choice !== 'Disable Supersmooth') {
            return { ok: false, code: 'cancelled', message: 'Disable cancelled.' };
        }
    }

    await markEnablePromptSeen(context);
    await setDesiredMode(context, DESIRED_MODE_DISABLED);

    const result = revertPatch(statusOptions(vscode));
    if (!result.ok) {
        if (result.code === 'manifest-missing' && result.status && result.status.overallState === 'unpatched') {
            await showFollowupMessage(
                vscode,
                offerOpenExtensions
                    ? 'Supersmooth is already disabled and the original files are on disk. Fully quit and reopen Antigravity, then uninstall the extension when convenient.'
                    : 'Supersmooth is already disabled and the original files are on disk.',
                offerOpenExtensions ? ['Open Extensions'] : []
            );
            return {
                ok: true,
                code: 'already-disabled',
                status: result.status,
                message: 'Supersmooth is already disabled.'
            };
        }

        await vscode.window.showErrorMessage(`Supersmooth: ${result.message}`);
        return result;
    }

    await showFollowupMessage(
        vscode,
        offerOpenExtensions
            ? 'Supersmooth is disabled and the original files were restored. Fully quit and reopen Antigravity to load them, then uninstall the extension when you are ready.'
            : 'Supersmooth is disabled and the original files were restored. Fully quit and reopen Antigravity to load them.',
        offerOpenExtensions ? ['Open Extensions'] : []
    );

    return result;
}

async function handleVerify(vscode) {
    const result = verifyInstallation(statusOptions(vscode));
    if (result.ok) {
        await vscode.window.showInformationMessage(`Supersmooth: ${result.message}`);
        return;
    }
    await vscode.window.showWarningMessage(`Supersmooth: ${result.message}`);
}

async function handleStatus(context, vscode) {
    const status = collectStatus(statusOptions(vscode));
    const desiredMode = getDesiredMode(context);
    const summary = getStatusSummary(status, desiredMode);

    switch (summary.kind) {
        case 'setup':
        case 'inactive': {
            const choice = await vscode.window.showInformationMessage(
                summary.message,
                'Enable Supersmooth',
                'Not Now'
            );
            if (choice === 'Enable Supersmooth') {
                await enableSupersmooth(context, vscode, { promptForConfirmation: false });
            } else if (choice === 'Not Now') {
                await markEnablePromptSeen(context);
            }
            return;
        }

        case 'repair': {
            const choice = await vscode.window.showWarningMessage(
                summary.message,
                'Restore Supersmooth',
                'Not Now'
            );
            if (choice === 'Restore Supersmooth') {
                await enableSupersmooth(context, vscode, { promptForConfirmation: false });
            }
            return;
        }

        case 'active': {
            const choice = await vscode.window.showInformationMessage(
                summary.message,
                'Verify Installation',
                'Disable Supersmooth'
            );
            if (choice === 'Verify Installation') {
                await handleVerify(vscode);
            } else if (choice === 'Disable Supersmooth') {
                await disableSupersmooth(context, vscode);
            }
            return;
        }

        case 'attention': {
            const choice = await vscode.window.showWarningMessage(
                summary.message,
                'Remove Cleanly',
                'Verify Installation'
            );
            if (choice === 'Remove Cleanly') {
                await disableSupersmooth(context, vscode, { offerOpenExtensions: true });
            } else if (choice === 'Verify Installation') {
                await handleVerify(vscode);
            }
            return;
        }

        case 'legacy':
        case 'missing':
            await vscode.window.showWarningMessage(`Supersmooth: ${summary.message}`);
            return;

        case 'unsupported':
            await vscode.window.showInformationMessage(`Supersmooth: ${summary.message}`);
            return;

        case 'error':
        default:
            await vscode.window.showErrorMessage(`Supersmooth: ${summary.message}`);
    }
}

async function promptToEnableOnFirstRun(context, vscode) {
    const choice = await vscode.window.showWarningMessage(
        'Supersmooth is ready. Enable it now to smooth your Antigravity workflow? This patches local app files and requires one full quit and reopen.',
        { modal: true },
        'Enable Now',
        'Later'
    );

    if (choice === 'Enable Now') {
        await enableSupersmooth(context, vscode, { promptForConfirmation: false });
        return;
    }

    // 'Later' or dismiss: mark as seen so we do not re-prompt,
    // but leave desiredMode unset so the status bar stays visible.
    await markEnablePromptSeen(context);
}

async function syncDesiredStateOnStartup(context, vscode) {
    const status = collectStatus(statusOptions(vscode));
    const desiredMode = getDesiredMode(context);
    const action = determineStartupAction(desiredMode, hasPromptedEnable(context), status);

    switch (action) {
        case 'adopt-enabled':
            await setDesiredMode(context, DESIRED_MODE_ENABLED);
            await markEnablePromptSeen(context);
            return;

        case 'prompt-enable':
            await promptToEnableOnFirstRun(context, vscode);
            return;

        case 'apply': {
            const result = applyPatch(statusOptions(vscode));
            if (!result.ok) {
                await vscode.window.showErrorMessage(`Supersmooth: Could not keep itself enabled. ${result.message}`);
                return;
            }
            if (result.code !== 'already-patched') {
                await showFollowupMessage(
                    vscode,
                    'Supersmooth restored its patch after Antigravity replaced the patched files. Fully quit and reopen Antigravity to load the patched files.'
                );
            }
            return;
        }

        case 'warn-legacy':
            await vscode.window.showWarningMessage(
                'Supersmooth is enabled, but a legacy AGFIX patch was detected. Restore the original bundles before re-enabling Supersmooth.'
            );
            return;

        case 'show-unsupported':
            await vscode.window.showInformationMessage(
                `Supersmooth is enabled, but Antigravity ${status.installInfo.ideVersion} is not yet supported. No patch was applied.`
            );
            return;

        case 'show-status':
            await showSummaryToast(vscode, getStatusSummary(status, desiredMode));
            return;

        case 'noop':
        default:
            return;
    }
}

function activate(context) {
    const vscode = require('vscode');
    const setupStatusBarItem = vscode.window.createStatusBarItem(vscode.StatusBarAlignment.Left, 1000);
    context.subscriptions.push(setupStatusBarItem);

    const refreshUi = () => {
        const status = collectStatus(statusOptions(vscode));
        updateStatusBar(setupStatusBarItem, status, getDesiredMode(context));
    };

    context.subscriptions.push(vscode.commands.registerCommand('supersmooth.status', async () => {
        await handleStatus(context, vscode);
        refreshUi();
    }));

    context.subscriptions.push(vscode.commands.registerCommand('supersmooth.apply', async () => {
        await enableSupersmooth(context, vscode);
        refreshUi();
    }));

    context.subscriptions.push(vscode.commands.registerCommand('supersmooth.revert', async () => {
        await disableSupersmooth(context, vscode);
        refreshUi();
    }));

    context.subscriptions.push(vscode.commands.registerCommand('supersmooth.removeCleanly', async () => {
        await disableSupersmooth(context, vscode, { offerOpenExtensions: true });
        refreshUi();
    }));

    context.subscriptions.push(vscode.commands.registerCommand('supersmooth.verify', async () => {
        await handleVerify(vscode);
        refreshUi();
    }));

    refreshUi();
    // Delay startup sync by 2 seconds so the welcome dialog appears
    // after Antigravity's own "extension installed" toast clears.
    const startupTimer = setTimeout(() => {
        void syncDesiredStateOnStartup(context, vscode).finally(refreshUi);
    }, 2000);
    context.subscriptions.push({ dispose: () => clearTimeout(startupTimer) });
}

function deactivate() {}

module.exports = {
    activate,
    deactivate,
    __internal: {
        DESIRED_MODE_DISABLED,
        DESIRED_MODE_ENABLED,
        determineStartupAction,
        describeDesiredMode,
        getStatusSummary,
        updateStatusBar
    }
};
