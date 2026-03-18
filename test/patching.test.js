'use strict';

const assert = require('node:assert/strict');
const fs = require('fs');
const os = require('os');
const path = require('path');
const vm = require('node:vm');
const { applyPatch, syntaxCheckText, verifyInstallation } = require('../src/engine');
const { appRootFromInstallRoot, normalizeInstallRoot } = require('../src/install');
const { LEGACY_MARKER, SUPER_MARKER, classifyTargetState, planPatchForTarget } = require('../src/patching');
const {
    SUPPORTED_PROFILES,
    WORKBENCH_HTML_CHECKSUM_KEY,
    WORKBENCH_HTML_PATH,
    findMatchingProfile
} = require('../src/support');

const workbenchFixture = [
    "'use strict';",
    'const uF={OFF:0,EAGER:1};',
    'const jFo=(value)=>value;',
    'const xi=(value)=>value;',
    'const Zt=(value)=>value;',
    'const fn=(value)=>value;',
    // Simulate surrounding code with fn() cleanup returns (useEffect signature)
    'function PrevComponent(){let _a=fn(()=>{let h=setInterval(()=>{},1000);return ()=>clearInterval(h)},[]);let _b=fn(()=>{document.addEventListener("x",()=>{});return ()=>document.removeEventListener("x",()=>{})},[]);}',
    'function Lau(t,e,i,n){',
    '  let s=xi(()=>{let B=i.commandLine;return B===""&&(B=[i.command].concat(i.args).join(" ")),B},[i]),{stepHandler:r,cascadeContext:{events:{cancelInvocation:o,sendUserInteraction:a}}}=Mr(),l=r?.getKeybindingLabel("acceptCascadeStep"),u=r?.terminalAutoExecutionPolicy??uF.OFF,d=r?.secureModeEnabled??!1,h=r?.terminalSandboxEnabled??!1,f=r?.terminalSandboxSupported??!1,p=jFo(d),b=Zt((B,O=!1)=>{a(Hi(hN,{trajectoryId:t,stepIndex:e,interaction:{case:"runCommand",value:Hi(vcn,{confirm:B,proposedCommandLine:s,submittedCommandLine:n||s,sandboxOverride:O})}})),B||o()},[t,e,s,n,a,o]),v=Zt(B=>{r?.setTerminalAutoExecutionPolicy?.(B),B===uF.EAGER&&b(!0)},[r,b]),E=Zt(()=>{b(!1)},[b]),S=Zt(()=>{b(!0)},[b]),I=Zt(()=>{b(!0,!0)},[b]),F=xi(()=>{if(f)return[{value:"sandbox-override",label:h?"Bypass sandbox":"Run in sandbox",isAllowed:!0}]},[f,h]),D=Zt(B=>{B==="sandbox-override"&&I()},[I]),N=xi(()=>({options:p,selectedValue:d,onChange:v}),[p,u,v]),T=xi(()=>({label:"Reject",onClick:E}),[E]),V=xi(()=>({label:"Run",onClick:S,keybindingLabel:l,subOptions:F,onSubOptionChange:D}),[S,l,F,D]);',
    '  return {N,T,V};',
    '}'
].join('\n');

const jetskiFixture = [
    "'use strict';",
    'const Jd={OFF:0,EAGER:1};',
    'const Lhn=(value)=>value;',
    'const Oe=(value)=>value;',
    'const Ce=(value)=>value;',
    'const At=(value)=>value;',
    // Simulate surrounding code with At() cleanup returns (useEffect signature)
    'function PrevComponent(){let _a=At(()=>{let h=setInterval(()=>{},1000);return ()=>clearInterval(h)},[]);let _b=At(()=>{document.addEventListener("x",()=>{});return ()=>document.removeEventListener("x",()=>{})},[]);}',
    'function LSi(e,t,r,n){',
    '  let a=Oe(()=>{let U=r.commandLine;return U===""&&(U=[r.command].concat(r.args).join(" ")),U},[r]),{stepHandler:i,cascadeContext:{events:{cancelInvocation:s,sendUserInteraction:l}}}=Wn(),u=i?.getKeybindingLabel("acceptCascadeStep"),d=i?.terminalAutoExecutionPolicy??Jd.OFF,f=i?.secureModeEnabled??!1,g=i?.terminalSandboxEnabled??!1,b=i?.terminalSandboxSupported??!1,v=Lhn(f),F=Ce((U,W=!1)=>{l(ur(tE,{trajectoryId:e,stepIndex:t,interaction:{case:"runCommand",value:ur(lQr,{confirm:U,proposedCommandLine:a,submittedCommandLine:n||a,sandboxOverride:W})}})),U||s()},[e,t,a,n,l,s]),S=Ce(U=>{i?.setTerminalAutoExecutionPolicy?.(U),U===Jd.EAGER&&F(!0)},[i,F]),C=Ce(()=>{F(!1)},[F]),V=Ce(()=>{F(!0)},[F]),x=Ce(()=>{F(!0,!0)},[F]),T=Oe(()=>{if(b)return[{value:"sandbox-override",label:g?"Bypass sandbox":"Run in sandbox",isAllowed:!0}]},[b,g]),B=Ce(U=>{U==="sandbox-override"&&x()},[x]),G=Oe(()=>({options:v,selectedValue:d,onChange:S}),[v,d,S]),L=Oe(()=>({label:"Reject",onClick:C}),[C]),X=Oe(()=>({label:"Run",onClick:V,keybindingLabel:u,subOptions:T,onSubOptionChange:B}),[V,u,T,B]);',
    '  return {G,L,X};',
    '}'
].join('\n');

function parsesAsJavaScript(filename, content) {
    vm.runInNewContext(content, {}, { filename });
}

function createFakeInstall(appRoot, versions = {}, contents = {}) {
    const appVersion = versions.appVersion || '1.107.0';
    const ideVersion = versions.ideVersion || '1.20.5';
    fs.mkdirSync(path.join(appRoot, 'out', 'vs', 'workbench'), { recursive: true });
    fs.mkdirSync(path.join(appRoot, 'out', 'jetskiAgent'), { recursive: true });
    fs.mkdirSync(path.join(appRoot, 'out', 'vs', 'code', 'electron-browser', 'workbench'), { recursive: true });
    fs.writeFileSync(path.join(appRoot, 'package.json'), JSON.stringify({ version: appVersion }, null, 2));
    fs.writeFileSync(path.join(appRoot, 'product.json'), JSON.stringify({
        ideVersion,
        checksums: {
            'vs/workbench/workbench.desktop.main.js': 'initial-workbench',
            'jetskiAgent/main.js': 'initial-jetski',
            [WORKBENCH_HTML_CHECKSUM_KEY]: 'initial-html'
        }
    }, null, 2));
    fs.writeFileSync(
        path.join(appRoot, 'out', 'vs', 'workbench', 'workbench.desktop.main.js'),
        contents.workbenchJs || '// fake workbench'
    );
    fs.writeFileSync(
        path.join(appRoot, 'out', 'jetskiAgent', 'main.js'),
        contents.jetskiJs || '// fake jetski'
    );
    fs.writeFileSync(
        path.join(appRoot, WORKBENCH_HTML_PATH),
        contents.workbenchHtml || '<!DOCTYPE html><html><body><div id="app"></div></body></html>'
    );
}

(function run() {
    const workbenchResult = planPatchForTarget({
        key: 'workbench',
        label: 'workbench',
        injectedVarName: '__supersmoothAutorunWorkbench'
    }, workbenchFixture);
    assert.equal(workbenchResult.ok, true);
    assert.match(workbenchResult.patchCode, /__supersmoothAutorunWorkbench=fn\(\(\)=>{/);
    assert.ok(workbenchResult.patchedContent.includes(SUPER_MARKER));
    parsesAsJavaScript('workbench.js', workbenchResult.patchedContent);

    const jetskiResult = planPatchForTarget({
        key: 'jetskiAgent',
        label: 'jetskiAgent',
        injectedVarName: '__supersmoothAutorunJetski'
    }, jetskiFixture);
    assert.equal(jetskiResult.ok, true);
    assert.match(jetskiResult.patchCode, /__supersmoothAutorunJetski=At\(\(\)=>{/);
    assert.ok(jetskiResult.patchedContent.includes(SUPER_MARKER));
    parsesAsJavaScript('jetski.js', jetskiResult.patchedContent);

    assert.equal(syntaxCheckText('esm-export.js', 'const a=1;export{a as main};').ok, true);
    assert.equal(syntaxCheckText('esm-default.js', 'const value=1;export default async function main(){return import.meta.resolve?.(value)}').ok, true);

    const tempRoot = fs.mkdtempSync(path.join(os.tmpdir(), 'supersmooth-'));
    try {
        const windowsInstallRoot = path.join(tempRoot, 'windows-install');
        const windowsAppRoot = path.join(windowsInstallRoot, 'resources', 'app');
        createFakeInstall(windowsAppRoot);
        assert.equal(normalizeInstallRoot(windowsInstallRoot), windowsInstallRoot);
        assert.equal(normalizeInstallRoot(windowsAppRoot), windowsInstallRoot);
        assert.equal(appRootFromInstallRoot(windowsInstallRoot), windowsAppRoot);

        const macBundleRoot = path.join(tempRoot, 'Antigravity.app');
        const macContentsRoot = path.join(macBundleRoot, 'Contents');
        const macResourcesRoot = path.join(macContentsRoot, 'Resources');
        const macAppRoot = path.join(macResourcesRoot, 'app');
        createFakeInstall(macAppRoot);
        assert.equal(normalizeInstallRoot(macBundleRoot), macContentsRoot);
        assert.equal(normalizeInstallRoot(macContentsRoot), macContentsRoot);
        assert.equal(normalizeInstallRoot(macResourcesRoot), macContentsRoot);
        assert.equal(normalizeInstallRoot(macAppRoot), macContentsRoot);
        assert.equal(appRootFromInstallRoot(macContentsRoot), macAppRoot);
        assert.equal(normalizeInstallRoot(path.join(macAppRoot, 'out', 'vs', 'workbench', 'workbench.desktop.main.js')), macContentsRoot);

        const linuxInstallRoot = path.join(tempRoot, 'linux-install');
        const linuxAppRoot = path.join(linuxInstallRoot, 'resources', 'app');
        createFakeInstall(linuxAppRoot);
        assert.equal(normalizeInstallRoot(linuxInstallRoot), linuxInstallRoot);
        assert.equal(normalizeInstallRoot(path.join(linuxInstallRoot, 'resources')), linuxInstallRoot);
        assert.equal(normalizeInstallRoot(linuxAppRoot), linuxInstallRoot);
        assert.equal(appRootFromInstallRoot(linuxInstallRoot), linuxAppRoot);

        const patchInstallRoot = path.join(tempRoot, 'patch-install');
        const patchAppRoot = path.join(patchInstallRoot, 'resources', 'app');
        createFakeInstall(patchAppRoot, {}, {
            workbenchJs: workbenchFixture,
            jetskiJs: jetskiFixture,
            workbenchHtml: '<!DOCTYPE html><html><body><div id="app"></div></body></html>'
        });
        const applyResult = applyPatch({ explicitPath: patchInstallRoot });
        assert.equal(applyResult.ok, true);
        const verifyResult = verifyInstallation({ explicitPath: patchInstallRoot });
        assert.equal(verifyResult.ok, true, verifyResult.message);
        const patchedHtml = fs.readFileSync(path.join(patchAppRoot, WORKBENCH_HTML_PATH), 'utf8');
        assert.ok(patchedHtml.includes('SUPERSMOOTH-START'), 'workbench.html should contain the DOM script marker');

        // Verify DOM script is also embedded in workbench JS (for CSP compatibility)
        const patchedWb = fs.readFileSync(
            path.join(patchAppRoot, 'out', 'vs', 'workbench', 'workbench.desktop.main.js'), 'utf8'
        );
        assert.ok(patchedWb.includes('SUPERSMOOTH-DOM-START'), 'Workbench JS should contain JS DOM marker');
        assert.ok(patchedWb.includes('__supersmoothLoaded'), 'Workbench JS should contain DOM script guard');
    } finally {
        fs.rmSync(tempRoot, { recursive: true, force: true });
    }

    const profile = SUPPORTED_PROFILES[0];
    assert.equal(findMatchingProfile({ appVersion: '1.107.0', hostPlatform: 'win32' })?.id, profile.id);
    assert.equal(findMatchingProfile({ appVersion: '1.107.0', hostPlatform: 'darwin' })?.id, profile.id);
    assert.equal(findMatchingProfile({ appVersion: '1.107.0', hostPlatform: 'linux' })?.id, profile.id);
    assert.equal(findMatchingProfile({ appVersion: '1.107.0', hostPlatform: 'freebsd' }), null);
    assert.equal(findMatchingProfile({ appVersion: '1.106.0', hostPlatform: 'win32' }), null);

    // classifyTargetState returns 'unknown' for unmarked files (was 'pristine' before dynamic analysis)
    assert.equal(classifyTargetState({}, { exists: true, activeContent: '' }), 'unknown');
    assert.equal(classifyTargetState({}, { exists: true, activeContent: LEGACY_MARKER }), 'legacy-patched');
    assert.equal(classifyTargetState({}, { exists: true, activeContent: SUPER_MARKER }), 'supersmooth-patched');
    assert.equal(classifyTargetState({}, { exists: false, activeContent: '' }), 'missing');

    // --force: bypasses version check but still requires platform match
    assert.equal(findMatchingProfile({ appVersion: '0.1.0', hostPlatform: 'win32' }), null);
    assert.equal(findMatchingProfile({ appVersion: '0.1.0', hostPlatform: 'win32' }, { force: true })?.id, profile.id);
    assert.equal(findMatchingProfile({ appVersion: '0.1.0', hostPlatform: 'darwin' }, { force: true })?.id, profile.id);
    assert.equal(findMatchingProfile({ appVersion: '0.1.0', hostPlatform: 'linux' }, { force: true })?.id, profile.id);
    assert.equal(findMatchingProfile({ appVersion: '0.1.0', hostPlatform: 'freebsd' }, { force: true }), null);

    // watcher module exports
    const watcher = require('../src/watcher');
    assert.equal(typeof watcher.watchAndRepatch, 'function');

    // ===================================================================
    // DOM script structural tests
    // ===================================================================
    const { buildDomScript } = require('../src/domScript');
    const domOutput = buildDomScript();

    // Container scoping: must scan inside specific containers, not globally
    assert.ok(domOutput.includes('APPROVAL_CONTAINERS'), 'DOM script should define APPROVAL_CONTAINERS');
    assert.ok(domOutput.includes('.notifications-toasts'), 'DOM script should scope to notification toasts');
    assert.ok(domOutput.includes('.monaco-dialog-box'), 'DOM script should scope to modal dialogs');

    // Pattern safety: Continue should NOT be in click patterns
    // Extract the CLICK_PATTERNS array content from the script
    const patternsMatch = domOutput.match(/CLICK_PATTERNS\s*=\s*\[([\s\S]*?)\]/);
    assert.ok(patternsMatch, 'DOM script should define CLICK_PATTERNS');
    const patternsContent = patternsMatch[1];
    assert.ok(!patternsContent.includes("'Continue'"), 'CLICK_PATTERNS should not include Continue');
    assert.ok(patternsContent.includes("'Allow'"), 'CLICK_PATTERNS should include Allow');
    assert.ok(patternsContent.includes("'Retry'"), 'CLICK_PATTERNS should include Retry');
    assert.ok(patternsContent.includes("'Run'"), 'CLICK_PATTERNS should include Run');

    // v0.1.2: agent panel container and body fallback
    assert.ok(domOutput.includes('.antigravity-agent-side-panel'), 'DOM script should scope to agent side panel');
    assert.ok(domOutput.includes('FALLBACK_CONTAINER'), 'DOM script should define FALLBACK_CONTAINER for body scan');

    // v0.1.2: priority patterns for persistent approvals
    assert.ok(domOutput.includes('PRIORITY_PATTERNS'), 'DOM script should define PRIORITY_PATTERNS');
    assert.ok(domOutput.includes("'Always Allow'"), 'PRIORITY_PATTERNS should include Always Allow');
    assert.ok(domOutput.includes("'Allow This Conversation'"), 'PRIORITY_PATTERNS should include Allow This Conversation');

    // v0.1.2: scanBtn helper exists
    assert.ok(domOutput.includes('function scanBtn'), 'DOM script should define scanBtn helper');

    // v0.1.2: isApprovalButton uses textContent fallback (not just innerText)
    assert.ok(domOutput.includes('sib.innerText || sib.textContent'), 'isApprovalButton should use textContent fallback');

    // v0.1.2: every PRIORITY_PATTERNS entry must also be in CLICK_PATTERNS (no dead data)
    const priorityMatch = domOutput.match(/PRIORITY_PATTERNS\s*=\s*\[([^\]]*)\]/);
    assert.ok(priorityMatch, 'DOM script should define PRIORITY_PATTERNS array');
    const priorityEntries = priorityMatch[1].match(/'[^']+'/g) || [];
    for (const entry of priorityEntries) {
        assert.ok(patternsContent.includes(entry),
            `PRIORITY_PATTERNS entry ${entry} must also be in CLICK_PATTERNS`);
    }

    // ===================================================================
    // Engine htmlBackupPath scope test
    // ===================================================================
    // Verify that htmlBackupPath is declared before the try block by checking
    // the source code structure. If it were inside try, the catch block would
    // throw ReferenceError at runtime.
    const engineSource = fs.readFileSync(path.join(__dirname, '..', 'src', 'engine.js'), 'utf8');
    const tryIndex = engineSource.indexOf('try {', engineSource.indexOf('const backupEntries'));
    const htmlBackupDeclIndex = engineSource.indexOf('let htmlBackupPath');
    assert.ok(htmlBackupDeclIndex < tryIndex, 'htmlBackupPath must be declared before the try block');

    // ===================================================================
    // Watcher module structure tests
    // ===================================================================
    // Verify watcher imports WORKBENCH_HTML_PATH for HTML watch coverage
    const watcherSource = fs.readFileSync(path.join(__dirname, '..', 'src', 'watcher.js'), 'utf8');
    assert.ok(watcherSource.includes('WORKBENCH_HTML_PATH'), 'Watcher should import WORKBENCH_HTML_PATH');
    assert.ok(watcherSource.includes('workbench.html'), 'Watcher should add workbench.html to watch set');
    // Verify install-level debounce (single timer, not per-file map)
    assert.ok(!watcherSource.includes('timers['), 'Watcher should not use per-file timer map');
    assert.ok(watcherSource.includes('repatchTimer'), 'Watcher should use install-level repatchTimer');
    // Verify retry logic exists
    assert.ok(watcherSource.includes('MAX_RETRIES'), 'Watcher should define MAX_RETRIES');
    assert.ok(watcherSource.includes('unsafe-state'), 'Watcher should retry on unsafe-state');

    console.log('All Supersmooth tests passed.');
})();
