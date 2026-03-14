'use strict';

/**
 * File watcher for auto-repair after Antigravity updates.
 *
 * Monitors target files using Node.js fs.watch(). When a change is detected
 * (Antigravity auto-updated), waits for the write to settle, then re-applies
 * the patch.
 *
 * Ported from antigravity-autorun/src/watcher.js, adapted for supersmooth's
 * engine API (applyPatch, collectStatus).
 */

const fs = require('fs');
const path = require('path');
const { applyPatch, collectStatus } = require('./engine');
const { WORKBENCH_HTML_PATH } = require('./support');

/** Debounce window (ms). Antigravity writes may take a moment to complete. */
const DEBOUNCE_MS = 5000;

/** Max retries when applyPatch returns unsafe-state (staggered file updates). */
const MAX_RETRIES = 3;

/** Delay between retries (ms). */
const RETRY_DELAY_MS = 2000;

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

    // Also watch workbench.html for DOM injection
    const htmlWatchPath = path.join(appRoot, WORKBENCH_HTML_PATH);
    if (fs.existsSync(htmlWatchPath)) {
        filesToWatch.push({ label: 'workbench.html', path: htmlWatchPath });
    }

    const watchers = [];
    // Install-level debounce: any file change cancels all in-flight timers
    let repatchTimer = null;
    let retryTimer = null;

    function cancelTimers() {
        if (repatchTimer) { clearTimeout(repatchTimer); repatchTimer = null; }
        if (retryTimer) { clearTimeout(retryTimer); retryTimer = null; }
    }

    function attemptRepatch(attempt) {
        const ts = new Date().toISOString().substring(11, 19);
        const result = applyPatch(options);

        if (result.ok) {
            log(`[${ts}] [watch] Re-patched successfully (${result.code})`);
            return;
        }

        // Retry on unsafe-state (staggered file updates, files still settling)
        if (result.code === 'unsafe-state' && attempt < MAX_RETRIES) {
            log(`[${ts}] [watch] State is ${result.code}, retry ${attempt + 1}/${MAX_RETRIES} in ${RETRY_DELAY_MS}ms`);
            retryTimer = setTimeout(() => attemptRepatch(attempt + 1), RETRY_DELAY_MS);
            return;
        }

        log(`[${ts}] [watch] FAILED (${result.code}: ${result.message})`);
    }

    function onFileEvent(file) {
        cancelTimers();
        repatchTimer = setTimeout(() => {
            if (!fs.existsSync(file.path)) return;
            const ts = new Date().toISOString().substring(11, 19);
            log(`[${ts}] [watch] ${file.label} changed, re-patching...`);
            attemptRepatch(0);
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
        cancelTimers();
        for (const w of watchers) w.close();
        log('[watch] Stopped');
    };

    process.on('SIGINT', () => { cleanup(); process.exit(0); });
    process.on('SIGTERM', () => { cleanup(); process.exit(0); });

    return { close: cleanup };
}

module.exports = { watchAndRepatch };
