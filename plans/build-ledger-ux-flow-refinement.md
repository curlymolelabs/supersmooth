# Build Ledger: Refine Supersmooth install/uninstall UX for zero-friction onboarding

## Task Ledger

| ID | Component | File(s) | Change Summary | Acceptance Criteria | Status |
|----|-----------|---------|----------------|---------------------|--------|
| T1 | First-run prompt | `src/extension.js` | Modal welcome dialog with 2s delay, "Enable Now" / "Later" | Modal appears ~2s after activation | ✅ DONE |
| T2 | Success messages | `src/extension.js` | showFollowupMessage now uses { modal: true } by default | "Quit and reopen" instruction cannot be missed | ✅ DONE |
| T3 | Status bar fix | `src/extension.js` | 'inactive' kind no longer shows status bar | Hidden when desiredMode=disabled | ✅ DONE |
| T4 | Status messages | `src/extension.js` | Action-oriented messages for setup, inactive, repair | Messages describe what to do, not raw state | ✅ DONE |
| T5 | Activation events | `package.json` | Changed `["*"]` to `["onStartupFinished"]` | Activates only after startup | ✅ DONE |
| T6 | Panel alias fix | `src/patching.js` | Dynamic useMemo/useCallback exclusion via cleanup-return strategy | No hardcoded minified names | ✅ DONE |
| T7 | Tests | `test/extension.test.js` | Updated message assertions, added status bar mock test | All tests pass | ✅ DONE |
| T8 | README | `README.md` | Updated install/uninstall instructions for modal flow | Docs match new UX | ✅ DONE |
