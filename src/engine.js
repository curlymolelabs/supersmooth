'use strict';

const fs = require('fs');
const path = require('path');
const vm = require('node:vm');
const { detectInstallRoot, readInstallInfo, appRootFromInstallRoot } = require('./install');
const { checksumMatches, sha256File, updateChecksums } = require('./checksum');
const { classifyTargetState, SUPER_MARKER, LEGACY_MARKER, planPatchForTarget } = require('./patching');
const { MANIFEST_VERSION, SUPER_DIR, SUPPORTED_PROFILES, findMatchingProfile } = require('./support');

function getSupportRoot(basePath) {
    return path.join(basePath, SUPER_DIR);
}

function getManifestPath(basePath) {
    return path.join(getSupportRoot(basePath), 'manifest.json');
}

function ensureDir(dirPath) {
    fs.mkdirSync(dirPath, { recursive: true });
}

function readManifest(basePath) {
    const manifestPath = getManifestPath(basePath);
    if (!fs.existsSync(manifestPath)) {
        return null;
    }
    return JSON.parse(fs.readFileSync(manifestPath, 'utf8'));
}

function writeManifest(basePath, manifest) {
    ensureDir(getSupportRoot(basePath));
    fs.writeFileSync(getManifestPath(basePath), JSON.stringify(manifest, null, 2));
}

function candidateTargets() {
    const seen = new Set();
    const targets = [];
    for (const profile of SUPPORTED_PROFILES) {
        for (const target of profile.targets) {
            const signature = `${target.key}|${target.relativePath}|${target.checksumKey}`;
            if (!seen.has(signature)) {
                seen.add(signature);
                targets.push(target);
            }
        }
    }
    return targets;
}

function readTargetRecord(appRoot, targetSpec) {
    const filePath = path.join(appRoot, targetSpec.relativePath);
    const legacyBackupPath = `${filePath}.autorun-backup`;
    const exists = fs.existsSync(filePath);
    const activeContent = exists ? fs.readFileSync(filePath, 'utf8') : '';
    const legacyBackupExists = fs.existsSync(legacyBackupPath);

    return {
        key: targetSpec.key,
        label: targetSpec.label,
        path: filePath,
        exists,
        activeContent,
        activeSha256: exists ? sha256File(filePath) : null,
        legacyBackupPath,
        legacyBackupExists,
        legacyBackupSha256: legacyBackupExists ? sha256File(legacyBackupPath) : null
    };
}

function classifyRecords(profile, records) {
    return records.map(record => {
        const targetSpec = profile.targets.find(item => item.key === record.key);
        return { ...record, state: classifyTargetState(targetSpec, record) };
    });
}

function detectState(profile, records) {
    if (!profile) {
        if (records.some(record => record.activeContent.includes(LEGACY_MARKER))) {
            return 'legacy';
        }
        return 'unsupported';
    }
    if (records.some(record => record.state === 'missing')) {
        return 'missing';
    }
    if (records.every(record => record.state === 'supersmooth-patched')) {
        return 'patched';
    }
    if (records.some(record => record.state === 'legacy-patched')) {
        return 'legacy';
    }
    // 'unknown' means file exists but is not patched (no marker found).
    // This is the normal state for an unpatched installation.
    if (records.every(record => record.state === 'unknown')) {
        return 'unpatched';
    }
    return 'mixed';
}

function collectStatus(options = {}) {
    const detection = detectInstallRoot(options);
    if (!detection.basePath) {
        return {
            ok: false,
            code: 'install-not-found',
            detection,
            message: 'Antigravity installation not found.'
        };
    }

    const installInfo = readInstallInfo(detection.basePath);
    const rawRecords = candidateTargets().map(target => readTargetRecord(installInfo.appRoot, target));
    const profile = findMatchingProfile(installInfo);
    const records = profile ? classifyRecords(profile, rawRecords) : rawRecords.map(record => ({ ...record, state: 'unknown' }));
    const manifest = readManifest(detection.basePath);

    return {
        ok: true,
        basePath: detection.basePath,
        detection,
        installInfo,
        profile,
        records,
        manifest,
        overallState: detectState(profile, records)
    };
}

function normalizeForSyntaxCheck(content) {
    return content
        .replace(/\bimport\.meta\b/g, '__supersmooth_import_meta__')
        .replace(/\bexport\s*\{[^}]*\}\s*(?:from\s*(?:"[^"]*"|'[^']*'))?\s*;?/g, ';')
        .replace(/\bexport\s*\*\s*from\s*(?:"[^"]*"|'[^']*')\s*;?/g, ';')
        .replace(/\bexport\s+default\s+/g, '')
        .replace(/\bexport(?=\s*(?:async\b|const\b|function\b|class\b|let\b|var\b))\s*/g, '');
}

function syntaxCheckText(filename, content) {
    try {
        new vm.Script(normalizeForSyntaxCheck(content), { filename });
        return { ok: true };
    } catch (error) {
        return { ok: false, message: error.message };
    }
}

function syntaxCheckFile(filePath) {
    return syntaxCheckText(filePath, fs.readFileSync(filePath, 'utf8'));
}

function relativeToBase(basePath, filePath) {
    return path.relative(basePath, filePath);
}

function buildBackupPath(backupRoot, record) {
    const parsed = path.parse(record.path);
    return path.join(backupRoot, `${record.key}-${record.activeSha256}${parsed.ext || '.bak'}`);
}

function applyPatch(options = {}) {
    const status = collectStatus(options);
    if (!status.ok) {
        return status;
    }
    if (!status.profile) {
        return {
            ok: false,
            code: 'unsupported-build',
            status,
            message: `Unsupported Antigravity build ${status.installInfo.appVersion} / ${status.installInfo.ideVersion}.`
        };
    }
    if (status.overallState === 'legacy') {
        return {
            ok: false,
            code: 'legacy-detected',
            status,
            message: 'Legacy AGFIX patch detected. Restore the original bundles before applying Supersmooth.'
        };
    }
    if (status.overallState === 'patched') {
        return {
            ok: true,
            code: 'already-patched',
            status,
            message: 'Supersmooth is already applied.'
        };
    }
    if (status.overallState !== 'unpatched') {
        return {
            ok: false,
            code: 'unsafe-state',
            status,
            message: `Cannot patch from state "${status.overallState}".`
        };
    }

    const plans = [];
    for (const targetSpec of status.profile.targets) {
        const record = status.records.find(item => item.key === targetSpec.key);
        const patch = planPatchForTarget(targetSpec, record.activeContent);
        if (!patch.ok) {
            return {
                ok: false,
                code: 'planning-failed',
                status,
                target: targetSpec.key,
                diagnostics: patch.diagnostics,
                message: `Failed to plan patch for ${targetSpec.label}: ${patch.reason}`
            };
        }

        const syntax = syntaxCheckText(path.basename(record.path), patch.patchedContent);
        if (!syntax.ok) {
            return {
                ok: false,
                code: 'syntax-check-failed',
                status,
                target: targetSpec.key,
                diagnostics: patch.diagnostics,
                message: syntax.message
            };
        }

        plans.push({ record, targetSpec, patch });
    }

    const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
    const backupRoot = path.join(getSupportRoot(status.basePath), 'backups', timestamp);
    ensureDir(backupRoot);

    const appRoot = appRootFromInstallRoot(status.basePath);
    const productPath = path.join(appRoot, 'product.json');
    const productBackupPath = path.join(backupRoot, 'product.json');
    fs.copyFileSync(productPath, productBackupPath);

    const backupEntries = [];
    try {
        for (const plan of plans) {
            const backupPath = buildBackupPath(backupRoot, plan.record);
            fs.copyFileSync(plan.record.path, backupPath);
            backupEntries.push({ key: plan.record.key, filePath: plan.record.path, backupPath });
        }

        for (const plan of plans) {
            fs.writeFileSync(plan.record.path, plan.patch.patchedContent);
        }

        const checksumResult = updateChecksums(status.basePath, plans.map(plan => ({
            checksumKey: plan.targetSpec.checksumKey,
            path: plan.record.path
        })));

        const manifest = {
            version: MANIFEST_VERSION,
            createdAt: new Date().toISOString(),
            profileId: status.profile.id,
            appVersion: status.installInfo.appVersion,
            ideVersion: status.installInfo.ideVersion,
            files: {},
            productJson: {
                backupPath: relativeToBase(status.basePath, productBackupPath),
                currentSha256: sha256File(productPath)
            }
        };

        for (const plan of plans) {
            const backupEntry = backupEntries.find(entry => entry.key === plan.record.key);
            manifest.files[plan.record.key] = {
                path: relativeToBase(status.basePath, plan.record.path),
                backupPath: relativeToBase(status.basePath, backupEntry.backupPath),
                originalSha256: plan.record.activeSha256,
                patchedSha256: sha256File(plan.record.path)
            };
        }

        writeManifest(status.basePath, manifest);

        return {
            ok: true,
            code: 'patched',
            status: collectStatus(options),
            checksumResult,
            manifest,
            message: 'Supersmooth applied successfully. Restart Antigravity to load the patched bundles.'
        };
    } catch (error) {
        for (const entry of backupEntries) {
            if (fs.existsSync(entry.backupPath)) {
                fs.copyFileSync(entry.backupPath, entry.filePath);
            }
        }
        if (fs.existsSync(productBackupPath)) {
            fs.copyFileSync(productBackupPath, productPath);
        }
        return {
            ok: false,
            code: 'apply-failed',
            status,
            message: error.message
        };
    }
}

function revertPatch(options = {}) {
    const status = collectStatus(options);
    if (!status.ok) {
        return status;
    }

    const manifest = status.manifest;
    if (!manifest) {
        return {
            ok: false,
            code: 'manifest-missing',
            status,
            message: 'No Supersmooth manifest found. Nothing to revert.'
        };
    }

    for (const fileEntry of Object.values(manifest.files)) {
        const activePath = path.join(status.basePath, fileEntry.path);
        const backupPath = path.join(status.basePath, fileEntry.backupPath);
        fs.copyFileSync(backupPath, activePath);
    }

    const productBackupPath = path.join(status.basePath, manifest.productJson.backupPath);
    fs.copyFileSync(productBackupPath, path.join(appRootFromInstallRoot(status.basePath), 'product.json'));
    fs.rmSync(getManifestPath(status.basePath), { force: true });

    return {
        ok: true,
        code: 'reverted',
        status: collectStatus(options),
        message: 'Supersmooth reverted successfully.'
    };
}

function verifyInstallation(options = {}) {
    const status = collectStatus(options);
    if (!status.ok) {
        return status;
    }

    if (!status.profile) {
        return {
            ok: false,
            code: 'unsupported-build',
            status,
            message: `Unsupported Antigravity build ${status.installInfo.appVersion} / ${status.installInfo.ideVersion}.`
        };
    }

    if (status.overallState === 'legacy') {
        return {
            ok: false,
            code: 'legacy-detected',
            status,
            message: 'Legacy AGFIX patch detected. Verification stopped.'
        };
    }

    if (status.overallState === 'unpatched') {
        return {
            ok: true,
            code: 'unpatched',
            status,
            message: 'Supported Antigravity build detected and no Supersmooth patch is currently applied.'
        };
    }

    if (status.overallState !== 'patched') {
        return {
            ok: false,
            code: 'mixed-state',
            status,
            message: `Verification failed because the install is in a mixed state: ${status.overallState}.`
        };
    }

    for (const targetSpec of status.profile.targets) {
        const record = status.records.find(item => item.key === targetSpec.key);
        const syntax = syntaxCheckFile(record.path);
        if (!syntax.ok) {
            return {
                ok: false,
                code: 'syntax-check-failed',
                status,
                target: targetSpec.key,
                message: syntax.message
            };
        }
        if (!record.activeContent.includes(SUPER_MARKER)) {
            return {
                ok: false,
                code: 'marker-missing',
                status,
                target: targetSpec.key,
                message: `Supersmooth marker missing from ${targetSpec.label}.`
            };
        }
        if (!checksumMatches(status.basePath, { checksumKey: targetSpec.checksumKey, path: record.path })) {
            return {
                ok: false,
                code: 'checksum-mismatch',
                status,
                target: targetSpec.key,
                message: `Checksum mismatch for ${targetSpec.label}.`
            };
        }
    }

    return {
        ok: true,
        code: 'verified',
        status,
        message: 'Supersmooth verification passed.'
    };
}

module.exports = {
    applyPatch,
    collectStatus,
    revertPatch,
    syntaxCheckText,
    verifyInstallation
};

