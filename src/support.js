'use strict';

const path = require('path');

const SUPER_MARKER = '/*SUPERSMOOTH:autorun*/';
const LEGACY_MARKER = '/*AGFIX:autorun*/';
const SUPER_DIR = '.supersmooth';
const MANIFEST_VERSION = 1;

const SUPPORTED_PROFILES = [
    {
        id: 'antigravity-1.107.0-ide-1.20.5',
        appVersion: '1.107.0',
        ideVersion: '1.20.5',
        platforms: ['win32', 'darwin', 'linux'],
        targets: [
            {
                key: 'workbench',
                label: 'workbench',
                relativePath: path.join('out', 'vs', 'workbench', 'workbench.desktop.main.js'),
                checksumKey: 'vs/workbench/workbench.desktop.main.js',
                originalSha256: 'fbdf1948820e772650d40d6e2367df8f487d8caf4d34d71d0969fc85d0ea3e6d',
                effectAlias: 'fn',
                injectedVarName: '__supersmoothAutorunWorkbench'
            },
            {
                key: 'jetskiAgent',
                label: 'jetskiAgent',
                relativePath: path.join('out', 'jetskiAgent', 'main.js'),
                checksumKey: 'jetskiAgent/main.js',
                originalSha256: 'c0fdda28543a1fc50b6eeba3632ababc9973ad8400cad2432aab90fb84cfbe7c',
                effectAlias: 'At',
                injectedVarName: '__supersmoothAutorunJetski'
            }
        ]
    }
];

function matchesProfile(profile, installInfo) {
    const platformMatches = !profile.platforms || profile.platforms.includes(installInfo.hostPlatform);
    return platformMatches
        && profile.appVersion === installInfo.appVersion
        && profile.ideVersion === installInfo.ideVersion;
}

function findMatchingProfile(installInfo, targetRecords) {
    for (const profile of SUPPORTED_PROFILES) {
        if (!matchesProfile(profile, installInfo)) {
            continue;
        }

        let allMatch = true;
        for (const target of profile.targets) {
            const record = targetRecords.find(item => item.key === target.key);
            if (!record) {
                allMatch = false;
                break;
            }

            const hashMatches = record.activeSha256 === target.originalSha256 || record.legacyBackupSha256 === target.originalSha256;
            const markerMatches = record.activeContent.includes(SUPER_MARKER) || record.activeContent.includes(LEGACY_MARKER);
            if (!hashMatches && !markerMatches) {
                allMatch = false;
                break;
            }
        }

        if (allMatch) {
            return profile;
        }
    }

    return null;
}

module.exports = {
    LEGACY_MARKER,
    MANIFEST_VERSION,
    SUPER_DIR,
    SUPER_MARKER,
    SUPPORTED_PROFILES,
    findMatchingProfile
};
