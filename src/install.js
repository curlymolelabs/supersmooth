'use strict';

const fs = require('fs');
const os = require('os');
const path = require('path');
const { execSync } = require('child_process');

function isAppRoot(dir) {
    if (!dir) {
        return false;
    }

    try {
        return fs.existsSync(path.join(dir, 'out', 'vs', 'workbench', 'workbench.desktop.main.js'))
            && fs.existsSync(path.join(dir, 'package.json'))
            && fs.existsSync(path.join(dir, 'product.json'));
    } catch {
        return false;
    }
}

function joinCaseAware(parent, childName) {
    try {
        for (const entry of fs.readdirSync(parent, { withFileTypes: true })) {
            if (entry.name.toLowerCase() === childName.toLowerCase()) {
                return path.join(parent, entry.name);
            }
        }
    } catch {
        // Fall back to the requested segment when the parent does not exist.
    }

    return path.join(parent, childName);
}

function joinCaseAwareSegments(basePath, segments) {
    let current = basePath;
    for (const segment of segments) {
        current = joinCaseAware(current, segment);
    }
    return current;
}

function appRootCandidates(dir) {
    return [
        dir,
        joinCaseAwareSegments(dir, ['app']),
        joinCaseAwareSegments(dir, ['resources', 'app']),
        joinCaseAwareSegments(dir, ['Resources', 'app']),
        joinCaseAwareSegments(dir, ['Contents', 'resources', 'app']),
        joinCaseAwareSegments(dir, ['Contents', 'Resources', 'app'])
    ];
}

function findAppRoot(inputPath) {
    if (!inputPath) {
        return null;
    }

    for (const candidate of appRootCandidates(path.resolve(inputPath))) {
        if (isAppRoot(candidate)) {
            return candidate;
        }
    }

    return null;
}

function installRootFromAppRoot(appRoot) {
    return path.dirname(path.dirname(appRoot));
}

function appRootFromInstallRoot(basePath) {
    return findAppRoot(basePath) || path.join(basePath, 'resources', 'app');
}

function isInstallRoot(dir) {
    if (!dir) {
        return false;
    }

    const appRoot = findAppRoot(dir);
    return Boolean(appRoot && path.resolve(appRoot) !== path.resolve(dir));
}

function normalizeInstallRoot(inputPath) {
    if (!inputPath) {
        return null;
    }

    let current = path.resolve(inputPath);
    const root = path.parse(current).root;
    const seen = new Set();

    while (current && !seen.has(current)) {
        seen.add(current);
        const appRoot = findAppRoot(current);
        if (appRoot) {
            return installRootFromAppRoot(appRoot);
        }
        if (current === root) {
            break;
        }
        current = path.dirname(current);
    }

    return null;
}

function fromEnv() {
    return normalizeInstallRoot(process.env.SUPERSMOOTH_ANTIGRAVITY_PATH || process.env.ANTIGRAVITY_HOME || '');
}

function fromCwd() {
    return normalizeInstallRoot(process.cwd());
}

function fromRegistry() {
    if (process.platform !== 'win32') {
        return null;
    }

    const regPaths = [
        'HKCU\\Software\\Microsoft\\Windows\\CurrentVersion\\Uninstall\\Antigravity_is1',
        'HKLM\\Software\\Microsoft\\Windows\\CurrentVersion\\Uninstall\\Antigravity_is1',
        'HKLM\\Software\\WOW6432Node\\Microsoft\\Windows\\CurrentVersion\\Uninstall\\Antigravity_is1'
    ];

    for (const regPath of regPaths) {
        try {
            const output = execSync(`reg query "${regPath}" /v InstallLocation`, {
                encoding: 'utf8',
                stdio: ['pipe', 'pipe', 'pipe'],
                timeout: 3000
            });
            const match = output.match(/InstallLocation\s+REG_SZ\s+(.+)/i);
            if (match) {
                const normalized = normalizeInstallRoot(match[1].trim().replace(/\\$/, ''));
                if (normalized) {
                    return normalized;
                }
            }
        } catch {
            // Ignore missing or inaccessible registry keys.
        }
    }

    return null;
}

function fromDefaults() {
    const candidates = [];
    if (process.platform === 'win32') {
        candidates.push(
            path.join(process.env.LOCALAPPDATA || '', 'Programs', 'Antigravity'),
            path.join(process.env.PROGRAMFILES || '', 'Antigravity')
        );
    } else if (process.platform === 'darwin') {
        candidates.push(
            '/Applications/Antigravity.app',
            '/Applications/Antigravity.app/Contents',
            path.join(os.homedir(), 'Applications', 'Antigravity.app'),
            path.join(os.homedir(), 'Applications', 'Antigravity.app', 'Contents')
        );
    } else {
        candidates.push(
            '/opt/Antigravity',
            '/opt/antigravity',
            '/usr/share/antigravity',
            '/usr/lib/antigravity',
            path.join(os.homedir(), '.local', 'share', 'antigravity')
        );
    }

    for (const candidate of candidates) {
        const normalized = normalizeInstallRoot(candidate);
        if (normalized) {
            return normalized;
        }
    }

    return null;
}

function detectInstallRoot(options = {}) {
    const strategies = [
        { name: 'explicit path', value: normalizeInstallRoot(options.explicitPath || '') },
        { name: 'host app root', value: normalizeInstallRoot(options.hostAppRoot || '') },
        { name: 'environment', value: fromEnv() },
        { name: 'cwd', value: fromCwd() },
        { name: 'registry', value: fromRegistry() },
        { name: 'default location', value: fromDefaults() }
    ];

    for (const strategy of strategies) {
        if (strategy.value) {
            return { basePath: strategy.value, method: strategy.name };
        }
    }

    return { basePath: null, method: 'not found' };
}

function readInstallInfo(basePath) {
    const appRoot = appRootFromInstallRoot(basePath);
    const packageJson = JSON.parse(fs.readFileSync(path.join(appRoot, 'package.json'), 'utf8'));
    const productJson = JSON.parse(fs.readFileSync(path.join(appRoot, 'product.json'), 'utf8'));
    return {
        appRoot,
        appVersion: packageJson.version || 'unknown',
        ideVersion: productJson.ideVersion || productJson.version || 'unknown',
        hostPlatform: process.platform,
        packageJson,
        productJson
    };
}

module.exports = {
    appRootFromInstallRoot,
    detectInstallRoot,
    isAppRoot,
    isInstallRoot,
    normalizeInstallRoot,
    readInstallInfo
};

