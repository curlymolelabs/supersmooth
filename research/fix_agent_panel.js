/**
 * Supersmooth Agent Panel UX Fix (Standalone Test)
 *
 * Patches workbench.desktop.main.js to auto-expand the
 * "Steps Require Input" section when approval prompts appear.
 *
 * Usage: node fix_agent_panel.js
 *        node fix_agent_panel.js --revert
 */
'use strict';

const fs = require('fs');
const path = require('path');

const APPROOT = process.env.LOCALAPPDATA
    ? path.join(process.env.LOCALAPPDATA, 'Programs', 'Antigravity', 'resources', 'app')
    : null;

if (!APPROOT || !fs.existsSync(APPROOT)) {
    console.error('Could not find Antigravity install at', APPROOT);
    process.exit(1);
}

const BUNDLE = path.join(APPROOT, 'out', 'vs', 'workbench', 'workbench.desktop.main.js');
const BACKUP = BUNDLE + '.ss-panel-backup';
const MARKER = '/*SUPERSMOOTH:panel*/';

// --- Revert mode ---
if (process.argv.includes('--revert')) {
    if (!fs.existsSync(BACKUP)) {
        console.log('No backup found. Nothing to revert.');
        process.exit(0);
    }
    fs.copyFileSync(BACKUP, BUNDLE);
    fs.unlinkSync(BACKUP);
    console.log('Reverted to original. Restart Antigravity to apply.');
    process.exit(0);
}

// --- Already patched? ---
const code = fs.readFileSync(BUNDLE, 'utf8');
if (code.includes(MARKER)) {
    console.log('Already patched. Use --revert to undo.');
    process.exit(0);
}

// --- Step 1: Find anchor ---
const ANCHOR = '"1 Step Requires Input"';
const anchorIdx = code.indexOf(ANCHOR);
if (anchorIdx === -1) {
    console.error('Anchor string not found. Bundle version may be incompatible.');
    process.exit(1);
}
console.log('[1/6] Found anchor at offset', anchorIdx);

// --- Step 2: Find Tsu function signature ---
const searchRegion = code.substring(Math.max(0, anchorIdx - 1200), anchorIdx);
const sigMatch = searchRegion.match(
    /\(\{steps:(\w+),\w+:(\w+),\w+:(\w+),expanded:(\w+),setExpanded:(\w+),\w+:(\w+)\}\)=>\{/
);
if (!sigMatch) {
    console.error('Could not find Tsu function signature.');
    process.exit(1);
}
const expandedVar = sigMatch[4];
const setExpandedVar = sigMatch[5];
console.log('[2/6] Tsu vars: expanded=' + expandedVar + ', setExpanded=' + setExpandedVar);

// --- Step 3: Find the injection point in full source ---
// Look for the exact pattern: VAR,VAR]);if(WAITVAR.length===0)return null
// near the anchor
const nearAnchor = code.substring(anchorIdx - 600, anchorIdx);
const guardMatch = nearAnchor.match(/(\w+),(\w+)\]\);if\((\w+)\.length===0\)return null/);
if (!guardMatch) {
    console.error('Could not find useMemo guard pattern.');
    process.exit(1);
}
const memoDepA = guardMatch[1];
const memoDepB = guardMatch[2];
const waitVar = guardMatch[3];
console.log('[3/6] Guard vars: waitingSteps=' + waitVar + ', memoDeps=[' + memoDepA + ',' + memoDepB + ']');

// Find the exact injection point: after ]);  before if(
const splitPattern = memoDepA + ',' + memoDepB + ']);';
const guardStr = 'if(' + waitVar + '.length===0)return null';
const fullPattern = splitPattern + guardStr;
const fullPatternIdx = code.indexOf(fullPattern);
if (fullPatternIdx === -1) {
    console.error('Could not locate injection point in full source.');
    process.exit(1);
}
const splitPoint = fullPatternIdx + splitPattern.length;
console.log('[4/6] Injection point at offset', splitPoint);

// --- Step 4: Find useEffect alias ---
// Search the wider region for fn(()=>{ pattern, which is the module-scoped useEffect
const wideRegion = code.substring(Math.max(0, anchorIdx - 100000), anchorIdx);
// Count all 2-char identifiers used as hooks: ID(()=>{...},[...])
const hookPattern = /\b([a-zA-Z_$]\w{0,2})\(\(\)=>\{/g;
const aliasCounts = {};
let hm;
while ((hm = hookPattern.exec(wideRegion)) !== null) {
    const name = hm[1];
    // Skip known non-useEffect aliases (useMemo, useCallback, etc.)
    if (name === 'xi' || name === 'Zt') continue;
    aliasCounts[name] = (aliasCounts[name] || 0) + 1;
}

// Pick 'fn' if present (known alias), otherwise most frequent short one
let useEffectAlias;
if (aliasCounts['fn']) {
    useEffectAlias = 'fn';
} else {
    const sorted = Object.entries(aliasCounts).sort((a, b) => b[1] - a[1]);
    if (sorted.length === 0) {
        console.error('Could not find useEffect alias.');
        process.exit(1);
    }
    useEffectAlias = sorted[0][0];
}
console.log('[5/6] useEffect alias: ' + useEffectAlias + ' (' + (aliasCounts[useEffectAlias] || 0) + ' uses in region)');

// --- Step 5: Build and inject ---
const injectedEffect = MARKER + useEffectAlias +
    '(()=>{' + waitVar + '.length>0&&' + setExpandedVar + '(!0)},[' +
    waitVar + '.length,' + setExpandedVar + ']);';

const patched = code.substring(0, splitPoint) + injectedEffect + code.substring(splitPoint);

// --- Step 6: Validate ---
if (!patched.includes(MARKER)) {
    console.error('Injection verification failed.');
    process.exit(1);
}

// Bracket balance check on the injected code itself
let braces = 0, parens = 0, brackets = 0;
for (const ch of injectedEffect) {
    if (ch === '{') braces++;
    if (ch === '}') braces--;
    if (ch === '(') parens++;
    if (ch === ')') parens--;
    if (ch === '[') brackets++;
    if (ch === ']') brackets--;
}
if (braces !== 0 || parens !== 0 || brackets !== 0) {
    console.error('Injected code syntax check FAILED:', { braces, parens, brackets });
    process.exit(1);
}

// --- Step 7: Backup and write ---
fs.copyFileSync(BUNDLE, BACKUP);
console.log('Backup saved.');

fs.writeFileSync(BUNDLE, patched, 'utf8');
console.log('[6/6] Patch applied!');
console.log('');
console.log('Injected: ' + injectedEffect);
console.log('');
console.log('Restart Antigravity to test.');
console.log('To revert: node fix_agent_panel.js --revert');
