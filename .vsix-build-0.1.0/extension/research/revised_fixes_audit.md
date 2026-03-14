# Supersmooth v0.2.0: Agent Panel UX Fixes (SSOT)

## Audit Summary

External auditor identified two critical issues with the original proposals:

1. **P1 (Scroll):** `this.gb=true` is a **no-op** for the reported bug. In agent mode, `isLockedToCodingAgent` already makes `this.gb` truthy. The actual intermittent gate is the separate layout-path expression `a&&(!d||a7e(...))&&this.bc()`. Fixing `this.gb` widens non-agent behavior without fixing the agent miss.

2. **P2 (Expand):** `ksu(a,true)` can open **both** "Progress Updates" and "Steps Require Input" simultaneously, making the panel taller and pushing approval buttons below the fold, working against the UX goal.

**Auditor confirmed:**
- The useEffect `fn(()=>{a||u(!1)},[a,u])` only resets `u` (first state), not `h` (second state)
- Patching `a7e` globally is unsafe (7 call sites)
- Semantic anchor approach is viable for this version
- Existing tests pass

---

## Revised Fix Strategies

### Fix 1: Always Render Waiting Steps (Revised)

**Problem:** `Tsu` conditionally renders waiting steps behind `n&&` (expanded guard).

**Old approach (rejected):** Change `ksu(a,!a)` to `ksu(a,true)`. Causes both sections to expand.

**New approach:** Remove the `n&&` guard from `Tsu`'s waiting steps render. The steps are always visible regardless of expand/collapse state. The Expand/Collapse toggle remains for the header but does not hide the approval prompts.

**Patch:**
```diff
# In the Tsu component, after the header div:
-n&&L("div",{className:"flex flex-col space-y-2"
+L("div",{className:"flex flex-col space-y-2"
```

**Semantic anchor:** `"Steps Require Input"` (unique string, survives minification).

**Search logic:**
1. Find `"Steps Require Input"` in source
2. Scan forward to find the pattern `&&L("div",{className:"flex flex-col space-y-2"`
3. Remove the preceding variable reference and `&&` (the `n&&` guard)
4. Validate with syntax gate

**Side effects:** The Collapse/Expand toggle still changes the header style class but no longer hides content. This is acceptable because approval prompts should never be hidden.

---

### Fix 2: Remove Auto-Scroll Config Gate (Revised)

**Problem:** The scroll-to-bottom call `this.bc()` is gated by `a7e(mode, autoScroll)` which returns `undefined` when the autoScroll config is not set, preventing scroll.

**Old approach (rejected):** Set `this.gb=true`. This is a no-op in agent mode since `isLockedToCodingAgent` already makes it true.

**New approach:** Patch the scroll execution gate to remove the `a7e` config check:

**Patch:**
```diff
-a&&(!d||a7e(this.input.currentModeKind,this.yb.autoScroll))&&this.bc()
+a&&this.bc()
```

**Semantic anchor:** The string `autoScroll` combined with `this.bc()` is unique in the scroll execution context.

**Search logic:**
1. Find `autoScroll` near `this.bc()` in the bundle
2. Match the full pattern `a&&(!d||a7e(...autoScroll...))&&this.bc()`
3. Replace with simplified `a&&this.bc()`
4. Validate with syntax gate

**Side effects:** `this.bc()` fires whenever `a` is truthy, regardless of autoScroll config. The variable `a` appears to be a condition related to whether there's an active response being rendered. Since `a` is already checked, this is safe: it just removes the additional "is autoScroll configured" check that was causing intermittent misses.

---

## Key Offsets (AG 1.107.0)

| Component | Offset | Verified |
|---|---|---|
| `Tsu` ("Steps Require Input") | ~12720006 | Yes |
| `n&&L("div"` guard in Tsu | ~12720400 | Yes |
| Scroll gate `a&&(!d||a7e(...))&&this.bc()` | ~18368656 | Yes |
| `a7e` function definition | ~14940874 | Yes |
| `ksu` hook definition | ~12719422 | Yes |

---

## Research Status

| Item | Status |
|---|---|
| Identify expand/collapse component | DONE |
| Map expand state flow | DONE |
| Identify auto-scroll mechanism | DONE |
| External audit | DONE |
| Revise fix strategies | DONE |
| Prototype patches in patching.js | TODO |
| Dynamic analysis (anchor search) | TODO |
| Integration testing | TODO |
