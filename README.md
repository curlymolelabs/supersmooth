# Supersmooth

Supersmooth makes your Antigravity workflow truly seamless. It automatically patches your installation to remove unnecessary terminal confirmation prompts and auto-expand approval sections, so you can focus on building instead of clicking.

## What It Does

- **Removes terminal autorun confirmations** when your saved policy is "Always run"
- **Auto-expands approval prompts** so "Steps Require Input" sections are never hidden
- **Safely reversible** with full backup and one-click revert
- **Auto-detects updates** and re-applies when Antigravity overwrites patched files

## Platform Support

| Platform | Status |
|----------|--------|
| **Windows** | Optimized and verified |
| macOS | Beta (not yet verified) |
| Linux | Beta (not yet verified) |

Requires Antigravity 1.20.5 or above.

## Installation

There are three ways to install Supersmooth. All three result in the same outcome.

### Option A: Extensions Panel (Recommended)

The simplest method if Supersmooth is published to Open VSX.

1. Open Extensions panel (Ctrl+Shift+X)
2. Search for **Supersmooth**
3. Click **Install**
4. A notification appears: "SuperSmooth Installed!"
5. **Close Antigravity completely and reopen it**
6. Done. Patches are active.

### Option B: Download from Open VSX

If you prefer to download manually from the marketplace.

1. Go to the Supersmooth page on [Open VSX](https://open-vsx.org/)
2. Download the `.vsix` file
3. In Antigravity, open Extensions panel (Ctrl+Shift+P)
4. Click the `...` menu at the top of the panel
5. Select **Install from VSIX...**
6. Choose the downloaded `.vsix` file
7. A notification appears: "SuperSmooth Installed!"
8. **Close Antigravity completely and reopen it**
9. Done. Patches are active.

### Option C: CLI

Install directly from the terminal.

```bash
antigravity --install-extension supersmooth-0.1.0.vsix
```

Then close and reopen Antigravity. On next launch, Supersmooth activates automatically, applies the patch, and prompts you to restart one more time.

> **Note:** Using the "Restart Now" button reloads the window but may trigger a temporary "corrupt installation" warning. This is harmless and clears on a full restart. For the cleanest experience, always close and reopen Antigravity manually instead of using the restart button.

## Uninstallation

Supersmooth patches files on disk. Uninstalling the extension alone does not remove these patches. To fully restore original Antigravity behavior:

1. Open the Command Palette (Ctrl+Shift+P)
2. Run **Supersmooth: Revert Patch**
3. Confirm "Revert" when prompted
4. **Close Antigravity completely and reopen it**
5. Uninstall the extension from the Extensions panel
6. Done. Original behavior restored.

> **What happens if I skip the revert?** The patches continue to work even without the extension installed. This is harmless but means you keep the modified behavior. To clean up later, reinstall Supersmooth, run Revert Patch, then uninstall again.

## Admin Commands (Command Palette)

Available via Ctrl+Shift+P for diagnostics and recovery:

| Command | Description |
|---------|-------------|
| **Supersmooth: Show Status** | Current patch state |
| **Supersmooth: Apply Patch** | Re-apply after an update |
| **Supersmooth: Revert Patch** | Restore original files from backup |
| **Supersmooth: Verify Installation** | Check patch integrity |

## CLI Reference

```bash
supersmooth status                    # Show current state
supersmooth apply                     # Apply the patch
supersmooth revert                    # Restore from backup
supersmooth verify                    # Check patch integrity
supersmooth watch                     # Apply + monitor for updates
supersmooth apply --force             # Bypass version check
```

### Watch Mode

When Antigravity auto-updates, it overwrites patched files. The `watch` command applies the patch, then monitors and re-patches automatically.

## Safety

Supersmooth is designed to fail closed:

- Creates manifest-backed backups before any changes
- Validates all modifications with a syntax gate before writing
- Updates only the touched integrity checksums
- Atomic rollback on any error during patch application
- Detects incompatible or pre-existing patches and refuses to overwrite

## License

MIT
