'use strict';

const path = require('path');

const SUPER_MARKER = '/*SUPERSMOOTH:autorun*/';
const LEGACY_MARKER = '/*AGFIX:autorun*/';
const SUPER_DIR = '.supersmooth';
const MANIFEST_VERSION = 1;

/**
 * Supported build profiles.
 *
 * effectAlias and originalSha256 are no longer listed here because:
 *   - effectAlias is detected dynamically by the analyzer in patching.js
 *   - originalSha256 was used for pristine detection but is redundant now
 *     that classifyTargetState uses marker detection and content analysis
 *
 * Only stable, non-minified identifiers remain:
 *   - key:            internal identifier for this target
 *   - label:          human-readable name
 *   - relativePath:   path within appRoot
 *   - checksumKey:    key in product.json checksums object
 *   - injectedVarName: the variable name we inject (we control this, so it is stable)
 */
const SUPPORTED_PROFILES = [
    {
        id: 'antigravity-1.107.x',
        minAppVersion: '1.107.0',
        platforms: ['win32', 'darwin', 'linux'],
        targets: [
            {
                key: 'workbench',
                label: 'workbench',
                relativePath: path.join('out', 'vs', 'workbench', 'workbench.desktop.main.js'),
                checksumKey: 'vs/workbench/workbench.desktop.main.js',
                injectedVarName: '__supersmoothAutorunWorkbench'
            },
            {
                key: 'jetskiAgent',
                label: 'jetskiAgent',
                relativePath: path.join('out', 'jetskiAgent', 'main.js'),
                checksumKey: 'jetskiAgent/main.js',
                injectedVarName: '__supersmoothAutorunJetski'
            }
        ]
    }
];

/**
 * Check if an install matches a profile.
 *
 * Uses version-range matching: the install's appVersion must be >=
 * the profile's minAppVersion. Platform must also match.
 */
function matchesProfile(profile, installInfo, options = {}) {
    const platformMatches = !profile.platforms || profile.platforms.includes(installInfo.hostPlatform);
    if (!platformMatches) return false;

    if (options.force) return true;

    return compareVersions(installInfo.appVersion, profile.minAppVersion) >= 0;
}

/**
 * Find the first matching profile for this installation.
 *
 * No longer requires originalSha256 matching. Profile matching is based
 * on version range and the presence of target files (checked by engine.js).
 */
function findMatchingProfile(installInfo, options = {}) {
    for (const profile of SUPPORTED_PROFILES) {
        if (matchesProfile(profile, installInfo, options)) {
            return profile;
        }
    }
    return null;
}

/**
 * Simple semver comparison (major.minor.patch).
 * Returns negative if a < b, 0 if equal, positive if a > b.
 */
function compareVersions(a, b) {
    const pa = (a || '0.0.0').split('.').map(Number);
    const pb = (b || '0.0.0').split('.').map(Number);
    for (let i = 0; i < 3; i++) {
        const diff = (pa[i] || 0) - (pb[i] || 0);
        if (diff !== 0) return diff;
    }
    return 0;
}

module.exports = {
    LEGACY_MARKER,
    MANIFEST_VERSION,
    SUPER_DIR,
    SUPER_MARKER,
    SUPPORTED_PROFILES,
    findMatchingProfile,
    compareVersions
};
