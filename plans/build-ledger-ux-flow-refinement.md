# Build Ledger: Refine Supersmooth install/uninstall UX for zero-friction onboarding

## Task Ledger

| ID | Component | File(s) | Change Summary | Acceptance Criteria | Status |
|----|-----------|---------|----------------|---------------------|--------|
| T1 | First-run prompt | `src/extension.js` | Replace dismissible info toast with modal welcome dialog; add 2s delay | Modal appears ~2s after activation with "Enable Now" / "Later" buttons | TODO |
| T2 | Success messages | `src/extension.js` | Make enable/disable success messages modal | "Quit and reopen" instruction cannot be missed | TODO |
| T3 | Status bar fix | `src/extension.js` | Hide status bar for disabled state instead of showing "Finish setup" | Status bar hidden when desiredMode=disabled, visible for setup only | TODO |
| T4 | Status messages | `src/extension.js` | Update getStatusSummary() messages to be more action-oriented | Messages describe what to do, not raw state | TODO |
| T5 | Activation events | `package.json` | Change `["*"]` to `["onStartupFinished"]` | Extension activates only after startup completes | TODO |
| T6 | Panel alias fix | `src/patching.js` | Remove hardcoded `xi`/`Zt` exclusions; use dynamic exclusion | Panel patch works across AG versions without hardcoded minified names | TODO |
| T7 | Tests | `test/extension.test.js` | Update tests for new status bar behavior and status messages | All existing tests pass; new assertions for inactive/disabled distinction | TODO |
| T8 | README | `README.md` | Update install/uninstall sections to match new UX | README reflects modal flow and correct command names | TODO |

## Plan-to-Implementation Mapping

- Plan: Replace promptToEnableOnFirstRun with modal welcome dialog -> T1
- Plan: Add 2-second delay in activate() -> T1
- Plan: Make success messages modal -> T2
- Plan: Fix status bar for disabled state -> T3
- Plan: Update getStatusSummary() messages -> T4
- Plan: Change activationEvents -> T5
- Plan: Remove hardcoded alias exclusions in panel patch -> T6
- Plan: Update tests -> T7
- Plan: Update README -> T8

## Dependencies

- T3/T4 change test expectations, so T7 must come after T3/T4
- T1-T4 are all in extension.js and will be done as one file edit
- T5, T6, T7, T8 are independent files

## Next Steps

1. Git checkpoint before starting
2. Implement T1-T4 together (single file: extension.js)
3. Implement T5 (package.json)
4. Implement T6 (patching.js)
5. Implement T7 (extension.test.js)
6. Implement T8 (README.md)
7. Run tests to verify
8. Create build report
