#!/usr/bin/env node
'use strict';

const { applyPatch, collectStatus, revertPatch, verifyInstallation } = require('../src/engine');
const { watchAndRepatch } = require('../src/watcher');

function parseArgs(argv) {
    const args = argv.slice(2);
    const options = {
        command: 'status',
        explicitPath: null,
        json: args.includes('--json'),
        force: args.includes('--force')
    };

    for (const candidate of ['status', 'apply', 'revert', 'verify', 'watch']) {
        if (args.includes(candidate)) {
            options.command = candidate;
        }
    }

    const pathIndex = args.indexOf('--path');
    if (pathIndex >= 0 && args[pathIndex + 1]) {
        options.explicitPath = args[pathIndex + 1];
    }

    return options;
}

function renderStatus(result) {
    if (!result.ok) {
        return `Status: ${result.code}\n${result.message}`;
    }

    const lines = [
        `Antigravity: ${result.installInfo.appVersion} (IDE ${result.installInfo.ideVersion})`,
        `Detected via: ${result.detection.method}`,
        `Install root: ${result.basePath}`,
        `Overall state: ${result.overallState}`,
        `Supported profile: ${result.profile ? result.profile.id : 'none'}`
    ];

    for (const record of result.records) {
        lines.push(`- ${record.label}: ${record.state}`);
    }

    if (result.manifest) {
        lines.push(`Manifest: ${result.manifest.profileId}`);
    }

    return lines.join('\n');
}

function renderResult(result) {
    if (result.status) {
        return `${result.message}\n\n${renderStatus(result.status)}`;
    }
    return result.message;
}

function main() {
    const options = parseArgs(process.argv);
    let result;
    switch (options.command) {
        case 'apply':
            result = applyPatch(options);
            break;
        case 'revert':
            result = revertPatch(options);
            break;
        case 'verify':
            result = verifyInstallation(options);
            break;
        case 'watch': {
            const applyResult = applyPatch(options);
            console.log(renderResult(applyResult));
            if (!applyResult.ok && applyResult.code !== 'already-patched') {
                process.exitCode = 1;
                return;
            }
            console.log('\nStarting file watcher (Ctrl+C to stop)...');
            watchAndRepatch(options);
            return;
        }
        case 'status':
        default:
            result = collectStatus(options);
            break;
    }

    if (options.json) {
        console.log(JSON.stringify(result, null, 2));
    } else if (options.command === 'status') {
        console.log(renderStatus(result));
    } else {
        console.log(renderResult(result));
    }

    process.exitCode = result.ok ? 0 : 1;
}

main();
