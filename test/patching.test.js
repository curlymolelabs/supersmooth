'use strict';

const assert = require('node:assert/strict');
const fs = require('fs');
const os = require('os');
const path = require('path');
const vm = require('node:vm');
const { syntaxCheckText } = require('../src/engine');
const { appRootFromInstallRoot, normalizeInstallRoot } = require('../src/install');
const { LEGACY_MARKER, SUPER_MARKER, classifyTargetState, planPatchForTarget } = require('../src/patching');
const { SUPPORTED_PROFILES, findMatchingProfile } = require('../src/support');

const workbenchFixture = [
    "'use strict';",
    'const uF={OFF:0,EAGER:1};',
    'const jFo=(value)=>value;',
    'const xi=(value)=>value;',
    'const Zt=(value)=>value;',
    'const fn=(value)=>value;',
    'function Lau(t,e,i,n){',
    '  let s=xi(()=>{let B=i.commandLine;return B===""&&(B=[i.command].concat(i.args).join(" ")),B},[i]),{stepHandler:r,cascadeContext:{events:{cancelInvocation:o,sendUserInteraction:a}}}=Mr(),l=r?.getKeybindingLabel("acceptCascadeStep"),u=r?.terminalAutoExecutionPolicy??uF.OFF,d=r?.secureModeEnabled??!1,h=r?.terminalSandboxEnabled??!1,f=r?.terminalSandboxSupported??!1,p=jFo(d),b=Zt((B,O=!1)=>{a(Hi(hN,{trajectoryId:t,stepIndex:e,interaction:{case:"runCommand",value:Hi(vcn,{confirm:B,proposedCommandLine:s,submittedCommandLine:n||s,sandboxOverride:O})}})),B||o()},[t,e,s,n,a,o]),v=Zt(B=>{r?.setTerminalAutoExecutionPolicy?.(B),B===uF.EAGER&&b(!0)},[r,b]),E=Zt(()=>{b(!1)},[b]),S=Zt(()=>{b(!0)},[b]),I=Zt(()=>{b(!0,!0)},[b]),F=xi(()=>{if(f)return[{value:"sandbox-override",label:h?"Bypass sandbox":"Run in sandbox",isAllowed:!0}]},[f,h]),D=Zt(B=>{B==="sandbox-override"&&I()},[I]),N=xi(()=>({options:p,selectedValue:u,onChange:v}),[p,u,v]),T=xi(()=>({label:"Reject",onClick:E}),[E]),V=xi(()=>({label:"Run",onClick:S,keybindingLabel:l,subOptions:F,onSubOptionChange:D}),[S,l,F,D]);',
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
    'function LSi(e,t,r,n){',
    '  let a=Oe(()=>{let U=r.commandLine;return U===""&&(U=[r.command].concat(r.args).join(" ")),U},[r]),{stepHandler:i,cascadeContext:{events:{cancelInvocation:s,sendUserInteraction:l}}}=Wn(),u=i?.getKeybindingLabel("acceptCascadeStep"),d=i?.terminalAutoExecutionPolicy??Jd.OFF,f=i?.secureModeEnabled??!1,g=i?.terminalSandboxEnabled??!1,b=i?.terminalSandboxSupported??!1,v=Lhn(f),F=Ce((U,W=!1)=>{l(ur(tE,{trajectoryId:e,stepIndex:t,interaction:{case:"runCommand",value:ur(lQr,{confirm:U,proposedCommandLine:a,submittedCommandLine:n||a,sandboxOverride:W})}})),U||s()},[e,t,a,n,l,s]),S=Ce(U=>{i?.setTerminalAutoExecutionPolicy?.(U),U===Jd.EAGER&&F(!0)},[i,F]),C=Ce(()=>{F(!1)},[F]),V=Ce(()=>{F(!0)},[F]),x=Ce(()=>{F(!0,!0)},[F]),T=Oe(()=>{if(b)return[{value:"sandbox-override",label:g?"Bypass sandbox":"Run in sandbox",isAllowed:!0}]},[b,g]),B=Ce(U=>{U==="sandbox-override"&&x()},[x]),G=Oe(()=>({options:v,selectedValue:d,onChange:S}),[v,d,S]),L=Oe(()=>({label:"Reject",onClick:C}),[C]),X=Oe(()=>({label:"Run",onClick:V,keybindingLabel:u,subOptions:T,onSubOptionChange:B}),[V,u,T,B]);',
    '  return {G,L,X};',
    '}'
].join('\n');

function parsesAsJavaScript(filename, content) {
    vm.runInNewContext(content, {}, { filename });
}

function createFakeInstall(appRoot, versions = {}) {
    const appVersion = versions.appVersion || '1.107.0';
    const ideVersion = versions.ideVersion || '1.20.5';
    fs.mkdirSync(path.join(appRoot, 'out', 'vs', 'workbench'), { recursive: true });
    fs.mkdirSync(path.join(appRoot, 'out', 'jetskiAgent'), { recursive: true });
    fs.writeFileSync(path.join(appRoot, 'package.json'), JSON.stringify({ version: appVersion }, null, 2));
    fs.writeFileSync(path.join(appRoot, 'product.json'), JSON.stringify({ ideVersion, checksums: {} }, null, 2));
    fs.writeFileSync(path.join(appRoot, 'out', 'vs', 'workbench', 'workbench.desktop.main.js'), '// fake workbench');
    fs.writeFileSync(path.join(appRoot, 'out', 'jetskiAgent', 'main.js'), '// fake jetski');
}

(function run() {
    const workbenchResult = planPatchForTarget({
        key: 'workbench',
        label: 'workbench',
        effectAlias: 'fn',
        injectedVarName: '__supersmoothAutorunWorkbench'
    }, workbenchFixture);
    assert.equal(workbenchResult.ok, true);
    assert.match(workbenchResult.patchCode, /__supersmoothAutorunWorkbench=fn\(\(\)=>\{/);
    assert.ok(workbenchResult.patchedContent.includes(SUPER_MARKER));
    parsesAsJavaScript('workbench.js', workbenchResult.patchedContent);

    const jetskiResult = planPatchForTarget({
        key: 'jetskiAgent',
        label: 'jetskiAgent',
        effectAlias: 'At',
        injectedVarName: '__supersmoothAutorunJetski'
    }, jetskiFixture);
    assert.equal(jetskiResult.ok, true);
    assert.match(jetskiResult.patchCode, /__supersmoothAutorunJetski=At\(\(\)=>\{/);
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
    } finally {
        fs.rmSync(tempRoot, { recursive: true, force: true });
    }

    const profile = SUPPORTED_PROFILES[0];
    const targetRecords = profile.targets.map(target => ({
        key: target.key,
        activeSha256: target.originalSha256,
        legacyBackupSha256: null,
        activeContent: ''
    }));
    assert.equal(findMatchingProfile({ appVersion: profile.appVersion, ideVersion: profile.ideVersion, hostPlatform: 'win32' }, targetRecords)?.id, profile.id);
    assert.equal(findMatchingProfile({ appVersion: profile.appVersion, ideVersion: profile.ideVersion, hostPlatform: 'darwin' }, targetRecords)?.id, profile.id);
    assert.equal(findMatchingProfile({ appVersion: profile.appVersion, ideVersion: profile.ideVersion, hostPlatform: 'linux' }, targetRecords)?.id, profile.id);
    assert.equal(findMatchingProfile({ appVersion: profile.appVersion, ideVersion: profile.ideVersion, hostPlatform: 'freebsd' }, targetRecords), null);

    const targetSpec = { originalSha256: 'abc' };
    assert.equal(classifyTargetState(targetSpec, { exists: true, activeContent: '', activeSha256: 'abc' }), 'pristine');
    assert.equal(classifyTargetState(targetSpec, { exists: true, activeContent: LEGACY_MARKER, activeSha256: 'zzz' }), 'legacy-patched');
    assert.equal(classifyTargetState(targetSpec, { exists: true, activeContent: SUPER_MARKER, activeSha256: 'zzz' }), 'supersmooth-patched');

    console.log('All Supersmooth tests passed.');
})();
