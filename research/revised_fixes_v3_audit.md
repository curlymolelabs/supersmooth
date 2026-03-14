# Supersmooth v0.2.0: Agent Panel UX Fixes (SSOT v3)

## Audit History

### Round 1 (Rejected)
- **Expand:** `ksu(a,true)` opens both sections, pushes buttons below fold
- **Scroll:** `this.gb=true` is a no-op for agent mode (already truthy via `isLockedToCodingAgent`)

### Round 2 (Rejected)
- **Expand:** Removing `n&&` guard leaves broken Expand/Collapse toggle (label flips but does nothing)
- **Scroll:** `a&&this.bc()` overrides Ask-mode's intentional auto-scroll disable; `a` is "already at bottom" check, not "active response"

### Round 3 (Current Proposal)

---

## Revised Fix 1: Swap Accordion Priority

**Problem:** When both Progress Updates and Steps Require Input have content, `ksu(a,!a)` expands Progress first and collapses Steps. The approval prompt is hidden.

**Fix:** Swap the arguments: `ksu(a,!a)` → `ksu(!a,a)`

```diff
-[[l,u],[d,h]]=ksu(a,!a)
+[[l,u],[d,h]]=ksu(!a,a)
```

**Effect:**
- When `a=true` (both sections have content): Progress starts collapsed, Steps Require Input starts expanded. Approval prompts are visible.
- When `a=false`: Progress starts expanded, Steps collapsed. But Tsu returns null when there are no waiting steps, so the collapsed state is invisible.
- Accordion behavior preserved: toggling one still collapses the other.
- Toggle UI works correctly: "Expand/Collapse" label and state remain consistent since we're just swapping initial values, not breaking the state machine.

**Tradeoff:** Progress Updates starts collapsed when there are pending approvals. This is the right priority: approval prompts are more time-sensitive than progress summaries. Users can still click to expand Progress if they want.

**Semantic anchor:** `"Steps Require Input"` string, search backwards to find `ksu(` call.

---

## Revised Fix 2: Targeted scrollIntoView in Tsu

**Problem:** The global scroll gate `a&&(!d||a7e(...))&&this.bc()` is shared across chat modes (Agent, Ask, inline). Patching it affects all modes.

**Fix:** Instead of patching the global scroll gate, inject a `scrollIntoView` call directly in the Tsu component when waiting steps are rendered. This is fully scoped to the approval prompt context.

**Approach:** After the `if(o.length===0)return null;` guard in Tsu, find the returned JSX div and add a `ref` callback that scrolls into view.

The existing Supersmooth autorun patch already injects a `useEffect` by:
1. Dynamically detecting the `useEffect` alias from surrounding code
2. Injecting the call with the correct alias

We use the same pattern here. In the Tsu component, inject after the guard:

```js
// Pseudocode of what gets injected:
EFFECT_ALIAS(() => {
    let el = document.querySelector('[data-supersmooth-steps]');
    if (el) el.scrollIntoView({ block: 'nearest', behavior: 'smooth' });
}, [o.length]);
```

And add a `data-supersmooth-steps` attribute to the Tsu wrapper div.

**Alternatively (simpler):** Inject a call to `s(true)` (setExpanded) inside a `useEffect` when `o.length > 0` AND `!n` (not already expanded). This auto-clicks "Expand" for the user AND would trigger the standard React scroll-on-update behavior.

```js
EFFECT_ALIAS(() => { o.length > 0 && !n && s(true); }, [o.length, n, s]);
```

Wait: this approach conflates Fix 1 and Fix 2. If we use the accordion swap (Fix 1), the section already starts expanded. The scroll issue is about the CHAT PANEL not scrolling to show the Tsu section.

**Simplest targeted scroll fix:** After Tsu renders, use a `ref` callback on the wrapper div to scroll it into view:

```diff
-return L("div",{className:"flex flex-col border-t border-gray-500/20 p-2 text-sm"
+return L("div",{ref:function(el){el&&el.scrollIntoView({block:"nearest",behavior:"smooth"})},className:"flex flex-col border-t border-gray-500/20 p-2 text-sm"
```

This adds a `ref` callback that scrolls the "Steps Require Input" section into view whenever it mounts. No global scroll gate changes. Completely scoped to when approval prompts appear.

**Risk:** The ref callback fires on every render, not just mount. Could cause repeated scrolling. Mitigation: wrap in a check or use a flag. But since Tsu returns null when there are no waiting steps (unmounts), the ref only fires when waiting steps appear (mount).

**Semantic anchor:** Same as Fix 1: `"Steps Require Input"` string. Find the returned `L("div",{className:"flex flex-col border-t` and inject the `ref` property.

---

## Summary of v3 Fixes

| Issue | Fix | Approach | Side Effects |
|---|---|---|---|
| Expand | Swap `ksu(a,!a)` to `ksu(!a,a)` | Swap accordion priority | Progress starts collapsed when approvals pending |
| Scroll | Inject `ref` with `scrollIntoView` on Tsu div | Targeted mount-time scroll | Only fires when Tsu mounts with waiting steps |

Both fixes:
- Use the same semantic anchor (`"Steps Require Input"`)
- Only affect the agent panel, not Ask/inline modes
- Preserve all existing toggle/accordion behavior
- Are structurally verifiable via syntax gate

---

## Questions for Auditor (Round 3)

1. Does swapping `ksu(a,!a)` to `ksu(!a,a)` break any behavior when `a` is false? The Tsu component returns null when there are no waiting steps, so the collapsed second section should be invisible.

2. Is injecting `ref:function(el){el&&el.scrollIntoView({block:"nearest",behavior:"smooth"})}` on the Tsu wrapper div safe? The callback fires on mount and every re-render. Since Tsu unmounts when no waiting steps exist, it primarily fires on mount.

3. Are there concerns about the ref callback causing scroll jitter during rapid re-renders (e.g., multiple commands running)?

4. Is `{block:"nearest",behavior:"smooth"}` the right scrollIntoView option, or should we use `{block:"end"}` to ensure the approval buttons at the bottom are visible?
