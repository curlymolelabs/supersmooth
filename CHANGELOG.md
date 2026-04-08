# Changelog

All notable changes to the Supersmooth extension will be documented in this file.

## 0.2.1 (2026-04-08)

### Fixes

- Fixed "partially patched" warning on AG 1.22.2+ (DOM-only mode was incorrectly detected as mixed state)
- Updated README across all languages to match 0.2.0 messaging

## 0.2.0 (2026-04-08)

### Features

- AG 1.22.2 compatibility: DOM-only fallback mode for browser URL auto-approval
- When terminal autorun patch fails (AG 1.22.2 changed the bundle structure), Supersmooth now falls back to injecting only the DOM auto-clicker script
- New button labels: "Allow for Workspace", "Allow Globally" added to auto-click patterns
- New priority patterns: "Allow for Workspace", "Allow Globally" preferred over one-time approvals
- New reject word: "Block" added to safety gate
- For older AG versions (before 1.22.0), stay on Supersmooth 0.1.2

### What AG 1.22.2 Fixed Natively

- Terminal autorun confirmations (Turbo mode + Allow/Deny lists)
- Panel auto-expand ("Requires Input" sections)
- Agent panel auto-scroll
- Auto-click for terminal, file, and MCP approval prompts

### What Still Needs Supersmooth

- Browser URL approval auto-click (not covered by AG 1.22.2 native controls)
- Corrupt banner dismissal (triggered by any file patching)

## 0.1.2 (2026-03-17)

### Features

- Auto-click now covers browser URL approval prompts inside the agent panel (e.g., "Opening URL in Browser" with Deny / Always Allow / Allow Once)
- Auto-click now covers file access approval prompts (e.g., "Allow file access to /tmp/..." with Deny / Allow Once / Allow This Conversation)
- Smart approval priority: prefers persistent options ("Always Allow", "Allow This Conversation") over one-time approvals

### Bug Fixes

- Fix reject-sibling safety gate only reading `innerText`, missing buttons that use `textContent`
- Fix priority selection loop iterating unnecessarily when the first candidate was already a priority match
- Fix "Always Proceed" unreachable in priority scanner (was in PRIORITY_PATTERNS but not in CLICK_PATTERNS)
- Fix DOM script not injected into workbench.html during version upgrades (already-patched path returned before HTML injection)
- Fix DOM script blocked by Content Security Policy: moved from HTML `<script>` tag to embedded IIFE in workbench JS bundle

### Internal

- Body-fallback scan: if known containers find no candidates, scans entire document (catches agent chat in editor tabs)
- Narrowed `isInsideEditor` guard to only block diff/merge editors, no longer blocks agent chat tabs
- Extracted `scanBtn` helper for cleaner scan logic
- Added 9 new test assertions including a cross-reference check preventing future dead-data bugs

---

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
