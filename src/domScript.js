'use strict';

/**
 * Generates the renderer-side DOM script that gets injected into workbench.html.
 * This script runs in the browser context and handles:
 * 1. Corrupt banner auto-dismissal
 * 2. DOM-based auto-click for approval buttons
 * 3. Smart auto-scroll for the chat panel
 */
function buildDomScript() {
    return `(function() {
    // Guard: prevent double execution
    if (window.__supersmoothLoaded) return;
    window.__supersmoothLoaded = true;

    // ===================================================================
    // 1. CORRUPT BANNER DISMISSAL
    // Watches for "corrupt installation" notifications and closes them.
    // ===================================================================
    (function suppressCorruptBanner() {
        function dismiss() {
            var toasts = document.querySelectorAll(
                '.notifications-toasts .notification-toast, .notification-list-item'
            );
            toasts.forEach(function(t) {
                var text = t.textContent || '';
                if (text.indexOf('corrupt') !== -1 || text.indexOf('reinstall') !== -1) {
                    var btn = t.querySelector(
                        '.codicon-notifications-clear, .codicon-close, ' +
                        '.action-label[aria-label*="Close"], ' +
                        '.action-label[aria-label*="clear"], ' +
                        '.clear-notification-action'
                    );
                    if (btn) {
                        btn.click();
                        console.log('[Supersmooth] Dismissed corrupt notification');
                    } else {
                        t.style.display = 'none';
                        console.log('[Supersmooth] Hidden corrupt notification');
                    }
                }
            });
        }
        // Check immediately and periodically for 30 seconds
        dismiss();
        var count = 0;
        var timer = setInterval(function() {
            dismiss();
            if (++count > 30) clearInterval(timer);
        }, 1000);
        // Also watch DOM mutations
        try {
            var observer = new MutationObserver(function() { dismiss(); });
            observer.observe(document.body || document.documentElement, {
                childList: true, subtree: true
            });
            setTimeout(function() { observer.disconnect(); }, 30000);
        } catch (e) {}
    })();

    // ===================================================================
    // 2. DOM AUTO-CLICK FOR APPROVAL BUTTONS
    // Polls the DOM for matching buttons in approval dialogs.
    // Safety: only clicks if a sibling button has reject-type text.
    // ===================================================================
    var CLICK_PATTERNS = [
        'Allow', 'Always Allow', 'Run', 'Keep Waiting',
        'Accept', 'Retry', 'Continue', 'Allow Once'
    ];
    var REJECT_WORDS = [
        'Reject', 'Deny', 'Cancel', 'Dismiss', "Don't Allow", 'Decline'
    ];
    var EDITOR_SKIP = [
        'Accept Changes', 'Accept All', 'Accept Incoming',
        'Accept Current', 'Accept Both', 'Accept Combination'
    ];
    var clicked = new WeakSet();

    function isApprovalButton(btn) {
        var parent = btn.parentElement;
        for (var level = 0; level < 3 && parent; level++) {
            var siblings = parent.querySelectorAll(
                'button, a.action-label, [role="button"], .monaco-button'
            );
            for (var i = 0; i < siblings.length; i++) {
                var sib = siblings[i];
                if (sib === btn) continue;
                var sibText = (sib.innerText || '').trim();
                for (var j = 0; j < REJECT_WORDS.length; j++) {
                    if (sibText === REJECT_WORDS[j] || sibText.indexOf(REJECT_WORDS[j]) === 0) {
                        return true;
                    }
                }
            }
            parent = parent.parentElement;
        }
        return false;
    }

    function isInsideEditor(el) {
        if (!el.closest) return false;
        return !!(
            el.closest('.monaco-diff-editor') ||
            el.closest('.merge-editor-view') ||
            el.closest('.view-zones') ||
            el.closest('.view-lines') ||
            el.closest('[id*="workbench.parts.editor"]')
        );
    }

    setInterval(function() {
        var clickables = document.querySelectorAll(
            'button, a.action-label, [role="button"], .monaco-button'
        );
        for (var i = 0; i < clickables.length; i++) {
            var b = clickables[i];
            if (b.offsetParent === null) continue;
            if (clicked.has(b)) continue;

            var text = (b.innerText || b.textContent || '').trim();
            if (!text || text.length > 40) continue;

            // Skip editor diff/merge buttons
            var skipEditor = false;
            for (var se = 0; se < EDITOR_SKIP.length; se++) {
                if (text.indexOf(EDITOR_SKIP[se]) === 0) { skipEditor = true; break; }
            }
            if (skipEditor) continue;
            if (isInsideEditor(b)) continue;

            // Check if text matches a pattern
            var matched = false;
            for (var p = 0; p < CLICK_PATTERNS.length; p++) {
                if (text === CLICK_PATTERNS[p] || text.indexOf(CLICK_PATTERNS[p]) === 0) {
                    matched = true;
                    break;
                }
            }
            if (!matched) continue;

            // Safety: only click if it's in an approval dialog
            if (isApprovalButton(b)) {
                console.log('[Supersmooth] Auto-click: ' + text);
                clicked.add(b);
                b.click();
                break;
            }
        }
    }, 1000);

    // ===================================================================
    // 3. SMART AUTO-SCROLL
    // Sticks to bottom during agent generation.
    // Pauses when user scrolls up. Resumes at bottom.
    // ===================================================================
    var wasAtBottom = new WeakMap();
    var justScrolled = new WeakSet();
    var BOTTOM_THRESHOLD = 150;

    setInterval(function() {
        var scrollables = [];
        var all = document.querySelectorAll('*');
        for (var i = 0; i < all.length; i++) {
            var el = all[i];
            if (el.scrollHeight <= el.clientHeight) continue;
            var style = window.getComputedStyle(el);
            if (style.overflowY !== 'auto' && style.overflowY !== 'scroll') continue;
            if (el.tagName === 'TEXTAREA') continue;
            if (!el.closest || !el.closest('.antigravity-agent-side-panel')) continue;
            scrollables.push(el);
        }

        scrollables.forEach(function(el) {
            var gap = el.scrollHeight - el.scrollTop - el.clientHeight;
            var was = wasAtBottom.get(el);
            if (was === undefined) {
                was = gap <= BOTTOM_THRESHOLD;
                wasAtBottom.set(el, was);
            }
            if (was && gap > 5) {
                justScrolled.add(el);
                el.scrollTop = el.scrollHeight;
            }
        });
    }, 500);

    // Track manual scrolls to pause auto-scroll
    window.addEventListener('scroll', function(e) {
        var el = e.target;
        if (!el || el.nodeType !== 1) return;
        if (!el.closest || !el.closest('.antigravity-agent-side-panel')) return;
        if (justScrolled.has(el)) {
            justScrolled.delete(el);
            return;
        }
        var gap = el.scrollHeight - el.scrollTop - el.clientHeight;
        wasAtBottom.set(el, gap <= BOTTOM_THRESHOLD);
    }, true);

    console.log('[Supersmooth] DOM enhancements loaded');
})();`;
}

const DOM_TAG_START = '<!-- SUPERSMOOTH-START -->';
const DOM_TAG_END = '<!-- SUPERSMOOTH-END -->';

module.exports = { buildDomScript, DOM_TAG_START, DOM_TAG_END };
