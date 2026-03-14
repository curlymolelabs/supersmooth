'use strict';

const assert = require('node:assert/strict');
const { __internal } = require('../src/extension');

(function run() {
    const enabled = __internal.DESIRED_MODE_ENABLED;
    const disabled = __internal.DESIRED_MODE_DISABLED;
    const deferred = __internal.DESIRED_MODE_DEFERRED;

    assert.equal(__internal.describeDesiredMode(enabled), 'enabled');
    assert.equal(__internal.describeDesiredMode(disabled), 'disabled');
    assert.equal(__internal.describeDesiredMode(deferred), 'deferred');
    assert.equal(__internal.describeDesiredMode(''), 'not active yet');

    assert.equal(
        __internal.determineStartupAction('', { ok: true, overallState: 'unpatched' }),
        'prompt-enable'
    );
    assert.equal(
        __internal.determineStartupAction(deferred, { ok: true, overallState: 'unpatched' }),
        'noop'
    );
    assert.equal(
        __internal.determineStartupAction('', { ok: true, overallState: 'patched' }),
        'adopt-enabled'
    );
    assert.equal(
        __internal.determineStartupAction(enabled, { ok: true, overallState: 'unpatched' }),
        'apply'
    );
    assert.equal(
        __internal.determineStartupAction(enabled, { ok: true, overallState: 'patched' }),
        'noop'
    );
    assert.equal(
        __internal.determineStartupAction(enabled, { ok: true, overallState: 'legacy' }),
        'warn-legacy'
    );
    assert.equal(
        __internal.determineStartupAction(enabled, { ok: true, overallState: 'unsupported' }),
        'show-unsupported'
    );
    assert.equal(
        __internal.determineStartupAction(enabled, { ok: true, overallState: 'mixed' }),
        'show-status'
    );
    assert.equal(
        __internal.determineStartupAction(disabled, { ok: true, overallState: 'unpatched' }),
        'noop'
    );
    assert.equal(
        __internal.determineStartupAction(enabled, { ok: false, overallState: 'unpatched' }),
        'noop'
    );

    const setupSummary = __internal.getStatusSummary(
        { ok: true, overallState: 'unpatched', installInfo: { ideVersion: '1.20.5' } },
        ''
    );
    assert.equal(setupSummary.kind, 'setup');
    assert.match(setupSummary.message, /ready on Antigravity/i);

    const inactiveSummary = __internal.getStatusSummary(
        { ok: true, overallState: 'unpatched', installInfo: { ideVersion: '1.20.5' } },
        disabled
    );
    assert.equal(inactiveSummary.kind, 'inactive');
    assert.match(inactiveSummary.message, /disabled/i);

    const repairSummary = __internal.getStatusSummary(
        { ok: true, overallState: 'unpatched', installInfo: { ideVersion: '1.20.5' } },
        enabled
    );
    assert.equal(repairSummary.kind, 'repair');
    assert.match(repairSummary.message, /Restore Supersmooth|re-apply/i);

    const activeSummary = __internal.getStatusSummary(
        { ok: true, overallState: 'patched', installInfo: { ideVersion: '1.20.5' } },
        enabled
    );
    assert.equal(activeSummary.kind, 'active');
    assert.match(activeSummary.message, /active on Antigravity/i);

    const attentionSummary = __internal.getStatusSummary(
        { ok: true, overallState: 'mixed', installInfo: { ideVersion: '1.20.5' } },
        enabled
    );
    assert.equal(attentionSummary.kind, 'attention');
    assert.match(attentionSummary.message, /needs attention/i);

    const unsupportedSummary = __internal.getStatusSummary(
        { ok: true, overallState: 'unsupported', installInfo: { ideVersion: '1.20.5' } },
        enabled
    );
    assert.equal(unsupportedSummary.kind, 'unsupported');

    const errorSummary = __internal.getStatusSummary(
        { ok: false, message: 'Antigravity installation not found.' },
        ''
    );
    assert.equal(errorSummary.kind, 'error');
    assert.match(errorSummary.message, /could not inspect/i);

    // Status bar: 'setup' shows the bar, 'inactive' hides it
    const mockStatusBarItem = {
        text: '', tooltip: '', command: '', _visible: false,
        show() { this._visible = true; },
        hide() { this._visible = false; }
    };
    __internal.updateStatusBar(mockStatusBarItem, { ok: true, overallState: 'unpatched', installInfo: { ideVersion: '1.20.5' } }, '');
    assert.equal(mockStatusBarItem._visible, true, 'setup state should show status bar');
    assert.match(mockStatusBarItem.text, /Enable/);
    __internal.updateStatusBar(mockStatusBarItem, { ok: true, overallState: 'unpatched', installInfo: { ideVersion: '1.20.5' } }, deferred);
    assert.equal(mockStatusBarItem._visible, true, 'deferred state should still show status bar');
    assert.match(mockStatusBarItem.text, /Enable/);
    __internal.updateStatusBar(mockStatusBarItem, { ok: true, overallState: 'unpatched', installInfo: { ideVersion: '1.20.5' } }, disabled);
    assert.equal(mockStatusBarItem._visible, false, 'disabled/inactive state should hide status bar');

    console.log('All Supersmooth extension tests passed.');
})();
