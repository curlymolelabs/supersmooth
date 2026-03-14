# Changelog

All notable changes to the Supersmooth extension will be documented in this file.

## 0.1.1 (2026-03-15)

### Bug Fixes

- Fix welcome modal not appearing on Extensions panel install when stale globalState exists from a previous install cycle
- Universal stale-state detection: any saved mode (deferred, disabled, enabled) with unpatched files and no manifest on disk is now treated as a fresh install

---

## 0.1.0 (2026-03-14)

Initial release.

### Features

- Remove terminal autorun confirmations when saved policy is "Always run"
- Auto-expand approval prompts so "Steps Require Input" sections are never hidden
- Auto-click approval buttons (Allow, Accept, Run) in permission dialogs
- Auto-scroll the agent panel during generation, pause on manual scroll
- Dismiss "corrupt installation" warnings after patching
- Auto-detect Antigravity updates and re-apply patches when files are overwritten
- Explicit enable/disable model with modal confirmations
- Manifest-backed backups with one-click revert
- Guided first-run wizard (Enable Now / Later)
- Status bar indicator showing current patch state
- Clean disable and uninstall flow via Remove Cleanly command
- Diagnostic output channel for troubleshooting silent failures
- Chinese, Japanese, and Korean translations in README

### Commands

- `Supersmooth: Show Status` - guided wizard for setup and health checks
- `Supersmooth: Enable Supersmooth` - patch local Antigravity files
- `Supersmooth: Disable Supersmooth` - restore original files
- `Supersmooth: Remove Cleanly` - restore files and assist with uninstall
- `Supersmooth: Verify Installation` - check patch integrity and checksums

### Platform Support

- Windows: optimized and verified
- macOS: beta (not yet verified)
- Linux: beta (not yet verified)
