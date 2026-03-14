# Supersmooth v0.2.0: Agent Panel UX Audit Request

## Context

**Supersmooth** is a VS Code extension that patches Antigravity (a VS Code fork, similar to Cursor) to auto-accept terminal command execution when the saved policy is "Always run." It modifies the minified JavaScript bundles on disk.

**Current state:** Supersmooth v0.1.0 successfully patches the terminal autorun confirmation. The patch uses dynamic analysis to find semantic anchors in minified code, making it resilient to variable name changes across versions.

**This document** covers two additional UX issues we want to fix in v0.2.0 by adding new patches to the same bundle file.

---

## The Two Problems

### Problem 1: "Steps Require Input" Section Stays Collapsed

When the AI agent runs terminal commands, Antigravity shows a "Steps Require Input" bar in the agent panel. This bar has an Expand/Collapse toggle. **The section often starts collapsed**, hiding the approval prompt ("Run command?", "Always run" button). The user must manually click "Expand" to reveal it. Only after expanding can the existing Supersmooth autorun patch fire.

### Problem 2: Chat Panel Doesn't Auto-Scroll to Approval Prompt

When commands produce long output, the chat panel doesn't always scroll down to the approval prompt at the bottom. The user must manually scroll down or click a down arrow to reach it.

Both issues are intermittent, correlating with long/complex terminal commands.

---

## Target File

All patches target:
```
{appRoot}/out/vs/workbench/workbench.desktop.main.js
```
This is the same file the existing Supersmooth autorun patch modifies. It is a single massive minified JavaScript bundle (~20MB).

---

## Extracted Code Analysis

### Issue 1: Expand/Collapse State

#### Component: `Tsu` (renders "Steps Require Input" section)

Location: offset ~12720006 in bundle (AG 1.107.0)

Decompiled (variable names are minified and version-specific):

```js
Tsu = ({steps:t, trajectoryId:e, debugMode:i, expanded:n, setExpanded:s, TaskSectionCascadeStepItem:r}) => {
    // Collect all steps with WAITING status (includes browserSubagent subtrajectories)
    let waitingSteps = useMemo(() => {
        let l = [];
        t.forEach(u => {
            if (u.step.case === "browserSubagent" && u.subtrajectory)
                for (let d of u.subtrajectory.steps)
                    d.status === wl.WAITING && l.push({step:d, trajectoryId:u.subtrajectory.trajectoryId});
            else
                u.status === wl.WAITING && l.push({step:u, trajectoryId:e});
        });
        return l;
    }, [t, e]);

    if (waitingSteps.length === 0) return null;

    let label = waitingSteps.length === 1
        ? "1 Step Requires Input"
        : `${waitingSteps.length} Steps Require Input`;

    return (
        <div className="flex flex-col border-t border-gray-500/20 p-2 text-sm">
            <div className="text-sm flex items-center justify-between ...">
                <div className="flex items-center gap-2">
                    <Icon className="w-4 h-4 stroke-[1.5] opacity-50" />
                    <span>{label}</span>
                </div>
                <ExpandCollapseToggle
                    setExpanded={s}
                    expanded={n}                              // <-- THIS CONTROLS VISIBILITY
                    text={n ? "Collapse" : "Expand"}
                    chevronAnimation="half-spin"
                    chevronOnRight={true}
                />
            </div>
            {n && <div className="flex flex-col space-y-2">   // <-- ONLY RENDERED WHEN EXPANDED
                {waitingSteps.map(...)}
            </div>}
        </div>
    );
};
```

Raw minified (exact text from bundle):
```
Tsu=({steps:t,trajectoryId:e,debugMode:i,expanded:n,setExpanded:s,TaskSectionCascadeStepItem:r})=>{let o=xi(()=>{let l=[];return t.forEach(u=>{if(u.step.case==="browserSubagent"&&u.subtrajectory)for(let d of u.subtrajectory.steps)d.status===wl.WAITING&&l.push({step:d,trajectoryId:u.subtrajectory.trajectoryId});else u.status===wl.WAITING&&l.push({step:u,trajectoryId:e})}),l},[t,e]);if(o.length===0)return null;let a=o.length===1?"1 Step Requires Input":`${o.length} Steps Require Input`;return L("div",{className:"flex flex-col border-t border-gray-500/20 p-2 text-sm",children:[L("div",{className:Fn("text-sm flex items-center justify-between",n?"mb-1":""),children:[L("div",{className:"flex items-center gap-2",children:[L(Klc,{className:"w-4 h-4 stroke-[1.5] opacity-50"}),L("span",{children:a})]}),L(c1o,{setExpanded:s,expanded:n,text:n?"Collapse":"Expand",chevronAnimation:"half-spin",chevronClassName:"duration-200 !w-3.5 !h-3.5",chevronOnRight:!0})]}),n&&L("div",{className:"flex flex-col space-y-2",children:o.map(...)})]})}
```

#### Hook: `ksu` (manages dual expand state)

Location: offset ~12719422

```js
ksu = (initialA, initialB) => {
    let [stateA, setA] = useState(initialA),
        [stateB, setB] = useState(initialB);
    // Expanding one collapses the other
    let toggleA = useCallback(val => { setA(val); val && setB(false); }, []);
    let toggleB = useCallback(val => { setB(val); val && setA(false); }, []);
    return [[stateA, toggleA], [stateB, toggleB]];
};
```

Raw minified:
```
ksu=(t,e)=>{let[i,n]=Ui(t),[s,r]=Ui(e),o=Zt(l=>{n(l),l&&r(!1)},[]),a=Zt(l=>{r(l),l&&n(!1)},[]);return[[i,o],[s,a]]}
```

#### Call Site (where expand state is initialized)

Location: offset ~12724487

```js
let a = !!(s && r);              // boolean: true only when both s and r are truthy
let [[l, u], [d, h]] = ksu(a, !a);  // first section: expanded=a, second: expanded=!a
```

There is also a useEffect that resets expand state:
```js
useEffect(() => { a || u(false); }, [a, u]);
```

Raw minified:
```
let a=!!(s&&r),[[l,u],[d,h]]=ksu(a,!a)
```

And the useEffect:
```
fn(()=>{a||u(!1)},[a,u])
```

#### Individual Card Toggle: `_4e`

Location: offset ~12708858

Each step card also has its own expand/collapse, managed separately:

```js
_4e = ({icon, isExpanded, onToggle, hasSupplementaryView}) =>
    hasSupplementaryView ? (
        <div onClick={onToggle}>
            <div>{icon}</div>
            <div><Chevron expanded={isExpanded} /></div>
        </div>
    ) : icon;
```

Raw minified:
```
_4e=({icon:t,isExpanded:e,onToggle:i,hasSupplementaryView:n})=>n?L("div",{className:"relative flex h-4 w-4 flex-none cursor-pointer items-center justify-start rounded-sm transition-opacity duration-150",onClick:i,children:[L("div",{className:"absolute inset-0 flex items-center justify-center transition-opacity duration-150 group-hover:opacity-0",children:t}),L("div",{className:"absolute inset-0 flex items-center justify-center transition-opacity duration-150 opacity-0 group-hover:opacity-100",children:L(e?k8:mcc,{className:"h-3.5 w-3.5 flex-none opacity-50"})})]}):L(ps,{children:t})
```

---

### Issue 2: Auto-Scroll

#### Function: `a7e` (auto-scroll config helper)

Location: offset ~14940874

```js
function a7e(t, e) {
    if (e !== void 0) return typeof e == "function" ? e(t) : e;
}
```

Returns the `autoScroll` config value if defined, or `undefined` (falsy) if not.

Raw minified:
```
function a7e(t,e){if(e!==void 0)return typeof e=="function"?e(t):e}
```

#### Auto-Scroll Flag Assignment

Location: offset ~18365079

```js
this.gb = this.isLockedToCodingAgent || !!a7e(this.input.currentModeKind, this.yb.autoScroll);
```

`this.gb` controls whether the chat auto-scrolls to new content. It is `true` when:
- `this.isLockedToCodingAgent` is true, OR
- `a7e(mode, autoScroll)` returns truthy

Raw minified:
```
this.gb=this.isLockedToCodingAgent||!!a7e(this.input.currentModeKind,this.yb.autoScroll)
```

#### Scroll Execution

Location: offset ~18368695

```js
const d = Qa(l) && l.renderData;
a && (!d || a7e(this.input.currentModeKind, this.yb.autoScroll)) && this.bc();
```

`this.bc()` is the actual scroll-to-bottom method. Only called when conditions pass.

Raw minified:
```
a&&(!d||a7e(this.input.currentModeKind,this.yb.autoScroll))&&this.bc()
```

#### Chat Widget Constructor (shows autoScroll is a valid config)

Location: offset ~18372877

```js
{
    autoScroll: true,
    defaultElementHeight: 32,
    renderStyle: "minimal",
    renderInputOnTop: false,
    renderFollowups: true,
    ...
}
```

---

## Proposed Fixes

### Fix 1: Auto-Expand "Steps Require Input"

#### Option A: Override initial state (RECOMMENDED)

Change the second argument of the `ksu` call from `!a` to `true`:

```diff
-[[l,u],[d,h]]=ksu(a,!a)
+[[l,u],[d,h]]=ksu(a,true)
```

**Effect:** "Steps Require Input" section always starts expanded. The toggle still works if user wants to collapse it.

**Semantic anchor for dynamic analysis:** The string `"Steps Require Input"` appears as `"1 Step Requires Input"` and `"Steps Require Input"` in the same function. These are human-readable strings that survive minification.

**Strategy:** Search backwards from the `"Steps Require Input"` string to find the `ksu(` call pattern, then replace the second argument.

#### Option B: Inject useEffect

After `Tsu`'s `if (o.length === 0) return null;` guard, inject:
```js
useEffect(() => { if (o.length > 0) s(true); }, [o.length]);
```

More surgical but requires injecting new code and correctly referencing the minified `useEffect` alias.

#### Option C: Remove conditional rendering

Change `n&&L("div",...` to just `L("div",...` (remove the `n&&` guard).

Simpler but removes the ability to collapse entirely.

---

### Fix 2: Auto-Scroll to Bottom

#### Option A: Force auto-scroll flag to true (RECOMMENDED)

```diff
-this.gb=this.isLockedToCodingAgent||!!a7e(this.input.currentModeKind,this.yb.autoScroll)
+this.gb=true
```

**Effect:** Chat always auto-scrolls to bottom when new content arrives.

**Semantic anchor:** `isLockedToCodingAgent` is a descriptive property name that survives minification (it's a class property, not a local variable). The string `autoScroll` also appears in config objects.

**Risk:** Forces auto-scroll in ALL chat modes, not just agent mode. If there are modes where the user explicitly scrolls up to read previous messages, this could be disruptive. However, since `this.isLockedToCodingAgent` was already part of the condition, this primarily affects cases where auto-scroll was expected but not triggered.

#### Option B: Patch `a7e` to always return true

```diff
-function a7e(t,e){if(e!==void 0)return typeof e=="function"?e(t):e}
+function a7e(t,e){return true}
```

Broader impact since `a7e` might be used elsewhere (need to verify).

#### Option C: Patch only the scroll execution gate

Change:
```diff
-a&&(!d||a7e(this.input.currentModeKind,this.yb.autoScroll))&&this.bc()
+a&&this.bc()
```

Removes the auto-scroll config check from the scroll execution path specifically.

---

## Questions for Auditor

1. **Fix 1 (expand):** Is Option A (changing `ksu(a, !a)` to `ksu(a, true)`) safe? Are there scenarios where starting expanded could cause issues (e.g., performance with many waiting steps, or UI overflow)?

2. **Fix 1 (expand):** The `useEffect` `fn(()=>{a||u(!1)},[a,u])` resets expand to false when `a` becomes false. If we change the initial state to `true`, does this useEffect negate our fix? Should we also patch or remove this useEffect?

3. **Fix 2 (scroll):** Is Option A (setting `this.gb=true`) too aggressive? Could it break scrolling behavior in non-agent chat modes (e.g., inline chat, ask mode)?

4. **Fix 2 (scroll):** Are there other places where `this.gb` is read that we should be aware of?

5. **General:** Is the dynamic analysis approach (using string literal anchors like `"Steps Require Input"` and property names like `isLockedToCodingAgent`) robust enough for version resilience?

6. **General:** Are there any side effects or edge cases we might have missed?

---

## Existing Supersmooth Architecture (for context)

The existing Supersmooth patch in v0.1.0 uses this approach:
1. Find `setTerminalAutoExecutionPolicy` semantic anchor in the minified bundle
2. Match the enclosing `useCallback` handler structure
3. Extract minified variable names from surrounding context
4. Inject a `useEffect` that auto-accepts execution when policy is EAGER

The new patches would follow the same pattern:
1. Find semantic anchors (string literals, property names)
2. Match the surrounding code structure
3. Make minimal targeted replacements
4. Validate with syntax gate (parse the modified file to ensure valid JS)
