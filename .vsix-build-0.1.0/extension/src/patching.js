'use strict';

const { SUPER_MARKER, PANEL_MARKER, LEGACY_MARKER } = require('./support');

function classifyTargetState(targetSpec, record) {
    if (!record.exists) {
        return 'missing';
    }
    if (record.activeContent.includes(SUPER_MARKER) || record.activeContent.includes(PANEL_MARKER)) {
        return 'supersmooth-patched';
    }
    if (record.activeContent.includes(LEGACY_MARKER)) {
        return 'legacy-patched';
    }
    return 'unknown';
}

/**
 * Dynamically analyze minified AG source and produce a patch plan.
 *
 * Uses four-layer structural pattern matching (ported from antigravity-autorun's
 * analyzer.js) instead of hardcoded alias names. This makes the patch work
 * across AG versions and platforms (Windows, macOS, Linux) where minified
 * variable names may differ.
 *
 * Layers:
 *   1. Find `setTerminalAutoExecutionPolicy` literal (semantic anchor)
 *   2. Match the enclosing useCallback structure
 *   3. Extract policyVar, secureVar from surrounding code
 *   4. Determine useEffect alias via cleanup-return + frequency analysis
 *
 * @param {object} targetSpec  Profile target (needs injectedVarName)
 * @param {string} content     Full file content (minified JS)
 * @returns {{ ok: boolean, reason?: string, diagnostics: string[], patchCode?: string, patchedContent?: string, plan?: object }}
 */
function planPatchForTarget(targetSpec, content) {
    const diagnostics = [];

    if (content.includes(SUPER_MARKER)) {
        return { ok: false, reason: 'already-patched', diagnostics };
    }
    if (content.includes(LEGACY_MARKER)) {
        return { ok: false, reason: 'legacy-patched', diagnostics };
    }
    if (content.includes(targetSpec.injectedVarName)) {
        return { ok: false, reason: 'injected-var-conflict', diagnostics };
    }

    // ---- Layer 1: Semantic anchor ----
    const anchorIndices = findAllIndices(content, 'setTerminalAutoExecutionPolicy');
    diagnostics.push(`anchor count=${anchorIndices.length}`);

    if (anchorIndices.length === 0) {
        return { ok: false, reason: 'anchor-not-found', diagnostics };
    }

    // ---- Layer 2: onChange handler pattern ----
    let onChangeMatch = null;
    let onChangeOffset = -1;

    for (const idx of anchorIndices) {
        const windowStart = Math.max(0, idx - 200);
        const windowEnd = Math.min(content.length, idx + 300);
        const window = content.slice(windowStart, windowEnd);

        if (!window.includes('.EAGER')) continue;

        const re = /(\w+)=(\w+)\((\w+)=>\{(\w+)\?\.\s*setTerminalAutoExecutionPolicy\?\.\(\3\),\3===(\w+)\.EAGER&&(\w+)\(!0\)\},\[([^\]]*)\]\)/;
        const match = window.match(re);

        if (match) {
            onChangeMatch = {
                full: match[0],
                assignVar: match[1],
                useCallbackFn: match[2],
                argName: match[3],
                enumName: match[5],
                confirmFn: match[6],
                globalOffset: windowStart + window.indexOf(match[0])
            };
            onChangeOffset = onChangeMatch.globalOffset;
            break;
        }
    }

    if (!onChangeMatch) {
        return { ok: false, reason: 'onchange-not-found', diagnostics };
    }

    diagnostics.push(`useCallback=${onChangeMatch.useCallbackFn}`);

    // ---- Layer 3: Context variables ----
    const contextBefore = content.slice(Math.max(0, onChangeOffset - 2000), onChangeOffset);

    const policyRe = new RegExp(`(\\w+)=\\w+\\?\\.terminalAutoExecutionPolicy\\?\\?${escapeRegex(onChangeMatch.enumName)}\\.OFF`);
    const policyMatch = contextBefore.match(policyRe);
    if (!policyMatch) {
        return { ok: false, reason: 'policy-var-not-found', diagnostics };
    }

    const secureRe = /(\w+)=\w+\?\.secureModeEnabled\?\?!1/;
    const secureMatch = contextBefore.match(secureRe);
    if (!secureMatch) {
        return { ok: false, reason: 'secure-var-not-found', diagnostics };
    }

    const policyVar = policyMatch[1];
    const secureVar = secureMatch[1];
    diagnostics.push(`policyVar=${policyVar}, secureVar=${secureVar}`);

    // ---- Layer 4: useEffect alias detection ----
    const effectWindow = content.slice(
        Math.max(0, onChangeOffset - 50000),
        Math.min(content.length, onChangeOffset + 10000)
    );

    const useEffectResult = findUseEffectAlias(effectWindow, onChangeMatch.useCallbackFn);
    if (!useEffectResult.alias) {
        return { ok: false, reason: 'useeffect-not-found', diagnostics };
    }

    const effectAlias = useEffectResult.alias;
    diagnostics.push(`effectAlias=${effectAlias} (confidence=${useEffectResult.confidence})`);

    // ---- Build patch ----
    const matchEnd = onChangeOffset + onChangeMatch.full.length;
    const nextChar = content[matchEnd];

    let insertOffset = matchEnd;
    let patchCode = null;

    if (nextChar === ',') {
        // Inside a let/var declaration chain: insert as a new declarator
        insertOffset = matchEnd + 1;
        patchCode = `${SUPER_MARKER}${targetSpec.injectedVarName}=${effectAlias}(()=>{${policyVar}===${onChangeMatch.enumName}.EAGER&&!${secureVar}&&${onChangeMatch.confirmFn}(!0)},[]),`;
    } else if (nextChar === ';') {
        // Statement boundary: insert as a new statement with declarator
        insertOffset = matchEnd + 1;
        patchCode = `${SUPER_MARKER}${targetSpec.injectedVarName}=${effectAlias}(()=>{${policyVar}===${onChangeMatch.enumName}.EAGER&&!${secureVar}&&${onChangeMatch.confirmFn}(!0)},[]);`;
    } else {
        return { ok: false, reason: `unexpected-separator:${nextChar || 'EOF'}`, diagnostics };
    }

    const patchedContent = content.slice(0, insertOffset) + patchCode + content.slice(insertOffset);
    diagnostics.push(`insertOffset=${insertOffset}`);
    diagnostics.push(`patchBytes=${patchCode.length}`);

    return {
        ok: true,
        diagnostics,
        patchCode,
        patchedContent,
        plan: {
            insertOffset,
            policyVar,
            secureVar,
            effectAlias,
            confirmFn: onChangeMatch.confirmFn,
            enumName: onChangeMatch.enumName
        }
    };
}

// ---- Helpers ----

function findAllIndices(content, needle) {
    const indices = [];
    let index = 0;
    while ((index = content.indexOf(needle, index)) >= 0) {
        indices.push(index);
        index += 1;
    }
    return indices;
}

function escapeRegex(value) {
    return value.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
}

/**
 * Find the useEffect alias by analyzing call patterns.
 *
 * Strategy (priority order):
 *   1. CLEANUP RETURN (definitive): FN(()=>{...return ()=>...},[...])
 *      Only useEffect returns cleanup functions.
 *   2. FREQUENCY (fallback): Count FN(()=>{...},[ patterns,
 *      excluding known useCallback alias.
 *
 * @param {string} context  Code window to analyze (~20k chars)
 * @param {string} useCallbackAlias  Known useCallback name to exclude
 * @returns {{ alias: string|null, confidence: number }}
 */
function findUseEffectAlias(context, useCallbackAlias) {
    const exclude = new Set(['var', 'new', 'for', 'if']);

    // Phase 1: Cleanup return pattern (definitive)
    const cleanupCandidates = {};
    const cleanupRe = /\b(\w{1,4})\(\(\)=>\{[\s\S]{1,500}?return\s*\(\)=>/g;
    let m;
    while ((m = cleanupRe.exec(context)) !== null) {
        const fn = m[1];
        if (!exclude.has(fn)) {
            cleanupCandidates[fn] = (cleanupCandidates[fn] || 0) + 1;
        }
    }

    if (Object.keys(cleanupCandidates).length > 0) {
        let best = null;
        let bestCount = 0;
        for (const [fn, count] of Object.entries(cleanupCandidates)) {
            if (count > bestCount) {
                best = fn;
                bestCount = count;
            }
        }
        if (best) {
            return { alias: best, confidence: bestCount * 10 };
        }
    }

    // Phase 2: Frequency analysis (fallback)
    const candidates = {};
    const effectRe = /\b(\w{1,4})\(\(\)=>\{/g;
    while ((m = effectRe.exec(context)) !== null) {
        const fn = m[1];
        if (fn !== useCallbackAlias && !exclude.has(fn)) {
            candidates[fn] = (candidates[fn] || 0) + 1;
        }
    }

    let bestAlias = null;
    let bestScore = 0;
    for (const [fn, score] of Object.entries(candidates)) {
        if (score > bestScore) {
            bestAlias = fn;
            bestScore = score;
        }
    }

    return { alias: bestAlias, confidence: bestScore };
}

/**
 * Plan a patch for the agent panel "Steps Require Input" auto-expand.
 *
 * Injects a useEffect that calls setExpanded(true) when waiting steps exist,
 * ensuring the approval prompt section is always visible.
 *
 * Only applies to the workbench target. Returns { ok: false } gracefully
 * for targets that don't contain the anchor (e.g., jetskiAgent).
 *
 * @param {string} content  Full file content (possibly already autorun-patched)
 * @returns {{ ok: boolean, reason?: string, patchedContent?: string }}
 */
function planPanelPatchForTarget(content) {
    if (content.includes(PANEL_MARKER)) {
        return { ok: false, reason: 'panel-already-patched' };
    }

    // ---- Anchor: "1 Step Requires Input" ----
    const anchor = '"1 Step Requires Input"';
    const anchorIdx = content.indexOf(anchor);
    if (anchorIdx === -1) {
        return { ok: false, reason: 'panel-anchor-not-found' };
    }

    // ---- Extract Tsu function signature ----
    const searchRegion = content.substring(Math.max(0, anchorIdx - 1200), anchorIdx);
    const sigMatch = searchRegion.match(
        /\(\{steps:(\w+),\w+:(\w+),\w+:(\w+),expanded:(\w+),setExpanded:(\w+),\w+:(\w+)\}\)=>\{/
    );
    if (!sigMatch) {
        return { ok: false, reason: 'panel-signature-not-found' };
    }
    const setExpandedVar = sigMatch[5];

    // ---- Find useMemo guard pattern ----
    const nearAnchor = content.substring(anchorIdx - 600, anchorIdx);
    const guardMatch = nearAnchor.match(/(\w+),(\w+)\]\);if\((\w+)\.length===0\)return null/);
    if (!guardMatch) {
        return { ok: false, reason: 'panel-guard-not-found' };
    }
    const memoDepA = guardMatch[1];
    const memoDepB = guardMatch[2];
    const waitVar = guardMatch[3];

    // ---- Find injection point in full source ----
    const splitPattern = memoDepA + ',' + memoDepB + ']);';
    const guardStr = 'if(' + waitVar + '.length===0)return null';
    const fullPattern = splitPattern + guardStr;
    const fullPatternIdx = content.indexOf(fullPattern);
    if (fullPatternIdx === -1) {
        return { ok: false, reason: 'panel-injection-point-not-found' };
    }
    const splitPoint = fullPatternIdx + splitPattern.length;

    // ---- Find useEffect alias ----
    const wideRegion = content.substring(Math.max(0, anchorIdx - 100000), anchorIdx);
    const hookPattern = /\b([a-zA-Z_$]\w{0,2})\(\(\)=>\{/g;
    const aliasCounts = {};
    let hm;
    while ((hm = hookPattern.exec(wideRegion)) !== null) {
        const name = hm[1];
        if (name === 'xi' || name === 'Zt') continue;
        aliasCounts[name] = (aliasCounts[name] || 0) + 1;
    }

    let useEffectAlias;
    if (aliasCounts['fn']) {
        useEffectAlias = 'fn';
    } else {
        const sorted = Object.entries(aliasCounts).sort((a, b) => b[1] - a[1]);
        if (sorted.length === 0) {
            return { ok: false, reason: 'panel-useeffect-not-found' };
        }
        useEffectAlias = sorted[0][0];
    }

    // ---- Build and inject ----
    const injectedEffect = PANEL_MARKER + useEffectAlias +
        '(()=>{' + waitVar + '.length>0&&' + setExpandedVar + '(!0)},[' +
        waitVar + '.length,' + setExpandedVar + ']);';

    const patchedContent = content.substring(0, splitPoint) + injectedEffect + content.substring(splitPoint);

    return {
        ok: true,
        patchedContent,
        patchCode: injectedEffect
    };
}

module.exports = {
    LEGACY_MARKER,
    PANEL_MARKER,
    SUPER_MARKER,
    classifyTargetState,
    planPatchForTarget,
    planPanelPatchForTarget
};
