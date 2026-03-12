'use strict';

const LEGACY_MARKER = '/*AGFIX:autorun*/';
const SUPER_MARKER = '/*SUPERSMOOTH:autorun*/';

function classifyTargetState(targetSpec, record) {
    if (!record.exists) {
        return 'missing';
    }
    if (record.activeContent.includes(SUPER_MARKER)) {
        return 'supersmooth-patched';
    }
    if (record.activeContent.includes(LEGACY_MARKER)) {
        return 'legacy-patched';
    }
    if (record.activeSha256 === targetSpec.originalSha256) {
        return 'pristine';
    }
    return 'unknown';
}

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

    const anchorIndices = findAllIndices(content, 'setTerminalAutoExecutionPolicy');
    diagnostics.push(`anchor count=${anchorIndices.length}`);
    if (anchorIndices.length === 0) {
        return { ok: false, reason: 'anchor-not-found', diagnostics };
    }

    let onChangeMatch = null;
    let onChangeOffset = -1;
    for (const idx of anchorIndices) {
        const windowStart = Math.max(0, idx - 200);
        const windowEnd = Math.min(content.length, idx + 300);
        const window = content.slice(windowStart, windowEnd);
        if (!window.includes('.EAGER')) {
            continue;
        }

        const match = window.match(/(\w+)=(\w+)\((\w+)=>\{(\w+)\?\.\s*setTerminalAutoExecutionPolicy\?\.\(\3\),\3===(\w+)\.EAGER&&(\w+)\(!0\)\},\[([^\]]*)\]\)/);
        if (!match) {
            continue;
        }

        onChangeMatch = {
            full: match[0],
            useCallbackFn: match[2],
            enumName: match[5],
            confirmFn: match[6],
            globalOffset: windowStart + window.indexOf(match[0])
        };
        onChangeOffset = onChangeMatch.globalOffset;
        break;
    }

    if (!onChangeMatch) {
        return { ok: false, reason: 'onchange-not-found', diagnostics };
    }

    diagnostics.push(`useCallback=${onChangeMatch.useCallbackFn}`);
    diagnostics.push(`effectAlias=${targetSpec.effectAlias}`);

    const contextBefore = content.slice(Math.max(0, onChangeOffset - 2000), onChangeOffset);
    const policyMatch = contextBefore.match(new RegExp(`(\\w+)=\\w+\\?\\.terminalAutoExecutionPolicy\\?\\?${escapeRegex(onChangeMatch.enumName)}\\.OFF`));
    if (!policyMatch) {
        return { ok: false, reason: 'policy-var-not-found', diagnostics };
    }

    const secureMatch = contextBefore.match(/(\w+)=\w+\?\.secureModeEnabled\?\?!1/);
    if (!secureMatch) {
        return { ok: false, reason: 'secure-var-not-found', diagnostics };
    }

    const policyVar = policyMatch[1];
    const secureVar = secureMatch[1];
    const matchEnd = onChangeOffset + onChangeMatch.full.length;
    const nextChar = content[matchEnd];

    let insertOffset = matchEnd;
    let patchCode = null;
    if (nextChar === ',') {
        insertOffset = matchEnd + 1;
        patchCode = `${SUPER_MARKER}${targetSpec.injectedVarName}=${targetSpec.effectAlias}(()=>{${policyVar}===${onChangeMatch.enumName}.EAGER&&!${secureVar}&&${onChangeMatch.confirmFn}(!0)},[]),`;
    } else if (nextChar === ';') {
        insertOffset = matchEnd + 1;
        patchCode = `${SUPER_MARKER}${targetSpec.effectAlias}(()=>{${policyVar}===${onChangeMatch.enumName}.EAGER&&!${secureVar}&&${onChangeMatch.confirmFn}(!0)},[]);`;
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
            confirmFn: onChangeMatch.confirmFn,
            enumName: onChangeMatch.enumName
        }
    };
}

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

module.exports = {
    LEGACY_MARKER,
    SUPER_MARKER,
    classifyTargetState,
    planPatchForTarget
};
