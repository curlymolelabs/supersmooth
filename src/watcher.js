'use strict';

/**
 * File watcher for auto-repair after Antigravity updates.
 *
 * Monitors target files using Node.js fs.watch(). When a change is detected
 * (Antigravity auto-updated), waits for the write to settle, then re-applies
 * the patch.
 *
 * Ported from antigravity-autorun/src/watcher.js, adapted for supersmooth's
 * engine API (applyPatch, collectStatus, updateChecksums).
 */

const fs = require('fs');
const path = require('path');
const { applyPatch, collectStatus } = require('./engine');

/** Debounce window (ms). Antigravity writes may take a moment to complete. */
const DEBOUNCE_MS = 3000;

/**
 * Watch target files and auto-repatch when they change.
 *
 * @param {object} options  Same options passed to collectStatus/applyPatch
 * @param {{ log: (msg: string) => void }} extra
 * @returns {{ close: () => void }}  Call close() to stop watching.
 */
function watchAndRepatch(options = {}, extra = {}) {
    const log = extra.log || console.log;

    const status = collectStatus(options);
    if (!status.ok) {
        log(`[watch] Cannot start: ${status.message}`);
        return { close: () => {} };
    }

    if (!status.profile) {
        log('[watch] No supported profile matched. Cannot determine files to watch.');
        return { close: () => {} };
    }

    const appRoot = status.installInfo.appRoot;
    const filesToWatch = status.profile.targets.map(target => ({
        label: target.label,
        path: path.join(appRoot, target.relativePath)
    }));

    const watchers = [];
    const timers = {};

    function onFileEvent(file) {
        if (timers[file.label]) clearTimeout(timers[file.label]);
        timers[file.label] = setTimeout(() => {
            if (!fs.existsSync(file.path)) return;

            const ts = new Date().toISOString().substring(11, 19);
            log(`[${ts}] [watch] ${file.label} changed, re-patching...`);

            const result = applyPatch(options);
            if (result.ok) {
                log(`[${ts}] [watch] ${file.label}: ${result.code}`);
            } else {
                log(`[${ts}] [watch] ${file.label}: FAILED (${result.code}: ${result.message})`);
            }
        }, DEBOUNCE_MS);
    }

    for (const file of filesToWatch) {
        if (!fs.existsSync(file.path)) {
            log(`[watch] Skipping ${file.label}: file not found`);
            continue;
        }

        // Watch the parent directory instead of the file directly.
        // On Windows, atomic file replacement (delete + rename) fires 'rename'
        // on the directory but invalidates the file-level watcher.
        const dir = path.dirname(file.path);
        const filename = path.basename(file.path);

        const watcher = fs.watch(dir, (eventType, changedFile) => {
            if (changedFile === filename) {
                onFileEvent(file);
            }
        });

        watchers.push(watcher);
        log(`[watch] Monitoring ${file.label}`);
    }

    const cleanup = () => {
        for (const w of watchers) w.close();
        for (const t of Object.values(timers)) clearTimeout(t);
        log('[watch] Stopped');
    };

    process.on('SIGINT', () => { cleanup(); process.exit(0); });
    process.on('SIGTERM', () => { cleanup(); process.exit(0); });

    return { close: cleanup };
}

module.exports = { watchAndRepatch };
