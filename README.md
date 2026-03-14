# Supersmooth

Supersmooth smooths out the Antigravity approval flow, but it now does so with an explicit enable and disable model.

The extension can patch local Antigravity files to:

- remove terminal autorun confirmations when your saved policy is already trusted
- auto-expand approval sections so waiting steps are visible
- auto-click specific approval prompts inside Antigravity notifications and dialogs
- auto-scroll the agent side panel during generation
- dismiss the corrupt-install banner after patching

Supersmooth is installed separately from the on-disk patch. That distinction is important:

- installing the extension does not immediately patch files without your consent
- disabling Supersmooth restores the original files without requiring an uninstall hook
- uninstalling the extension only removes the extension package; it is not the cleanup step

## Platform Support

| Platform | Status |
|----------|--------|
| Windows | Verified |
| macOS | Beta |
| Linux | Beta |

Requires Antigravity IDE version `1.20.5` or newer.

## Install Flow

### Option A: Install from VSIX

1. Open Antigravity.
2. Open the Extensions panel.
3. Install `supersmooth-0.1.0.vsix`.
4. A modal dialog appears after a few seconds: "Supersmooth is ready. Enable it now?"
5. Click **Enable Now**.
6. Fully quit Antigravity and reopen it. A window reload is not enough.

If you clicked **Later**, you can enable any time by:

- clicking the `Supersmooth: Enable` status bar action
- running `Supersmooth: Show Status` from the Command Palette

### Option B: Install from Open VSX

If Supersmooth is published, the flow is the same:

1. Install the extension.
2. Click **Enable Now** in the modal dialog that appears.
3. Fully quit and reopen Antigravity.

### Option C: CLI

The CLI patches files directly and does not manage extension state:

```bash
supersmooth status
supersmooth apply
supersmooth verify
```

If you use the CLI, fully quit and reopen Antigravity after `apply` or `revert`.

## Daily Use

Once Supersmooth has been enabled for an installation, the extension remembers that choice.

- if Antigravity starts with the patched files still present, Supersmooth stays quiet
- if Antigravity updates and replaces the patched files, Supersmooth re-applies them and shows a modal asking you to quit and reopen
- if you disable Supersmooth, it stays disabled and will not silently re-patch on the next launch

## Clean Disable And Uninstall

The smooth removal flow is:

1. Open the Command Palette.
2. Run `Supersmooth: Remove Cleanly`.
3. Let Supersmooth restore the original files.
4. Fully quit Antigravity and reopen it to load the restored files.
5. Uninstall the extension from the Extensions panel whenever you are ready.

You can also run `Supersmooth: Disable Supersmooth` if you want to keep the extension installed but inactive.

## Commands

| Command | What it does |
|---------|---------------|
| `Supersmooth: Show Status` | Opens guided setup or health actions for this install instead of only showing raw patch state |
| `Supersmooth: Enable Supersmooth` | Patches the local Antigravity files and marks Supersmooth as enabled |
| `Supersmooth: Disable Supersmooth` | Restores the original files and marks Supersmooth as disabled |
| `Supersmooth: Remove Cleanly` | Disables Supersmooth, restores the original files, and helps you finish uninstalling |
| `Supersmooth: Verify Installation` | Checks the current patched state and checksum integrity |

## CLI Reference

```bash
supersmooth status
supersmooth apply
supersmooth revert
supersmooth verify
supersmooth watch
supersmooth apply --force
```

## Safety Notes

Supersmooth is designed to be reversible:

- it creates manifest-backed backups before writing files
- it restores those backups during disable and remove-cleanly flows
- it updates only the relevant integrity checksums
- it validates patched JavaScript before writing bundle changes

Two practical notes:

- a full quit and reopen is safer than `Reload Window` after patch changes
- uninstalling the extension is not the cleanup step; disabling via `Remove Cleanly` is the cleanup step

## Packaging

To build a fresh VSIX from this folder:

```bash
npx @vscode/vsce package
```
