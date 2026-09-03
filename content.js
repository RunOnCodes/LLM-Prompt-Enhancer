// content.js - Prompt Enhancer: button injection, selection-aware enhance, RTL fix
(() => {
'use strict';

const RTL_REGEX = /[؀-ۿ]/;
const LATIN_REGEX = /[A-Za-z]/;
const seenInputs = new WeakSet();
const historyMap = new WeakMap(); // input -> string[] (undo stack)
const toastTimers = new WeakMap();

let settings = { enabled: true };
try {
    chrome.storage.sync.get(['enabled'], (res) => {
        if (res && typeof res.enabled === 'boolean') settings.enabled = res.enabled;
        if (!settings.enabled) removeAllButtons();
    });
    chrome.storage.onChanged.addListener((changes, area) => {
        if (area !== 'sync') return;
        if (changes.enabled) {
            settings.enabled = changes.enabled.newValue !== false;
            if (settings.enabled) addEnhanceButton();
            else removeAllButtons();
        }
    });
} catch (_) { /* storage unavailable */ }

// Bundle Vazirmatn locally (CSP-safe): styles.css @import is blocked on many sites.
try {
    const fontUrl = chrome.runtime.getURL('Vazirmatn.ttf');
    const style = document.createElement('style');
    style.textContent = `@font-face{font-family:'Vazirmatn';src:url('${fontUrl}') format('truetype');font-display:swap;}`;
    (document.head || document.documentElement).appendChild(style);
} catch (_) { /* ignore */ }

function isEditable(el) {
    if (!el || el.nodeType !== 1) return false;
    if (el.tagName === 'TEXTAREA') return true;
    if (el.tagName === 'INPUT') {
        const t = (el.type || 'text').toLowerCase();
        return ['text', 'search', 'url', ''].includes(t) && !el.readOnly && !el.disabled;
    }
    return el.isContentEditable;
}

function getInputText(input) {
    if (input.tagName === 'TEXTAREA' || input.tagName === 'INPUT') return input.value || '';
    return input.innerText !== undefined ? input.innerText : (input.textContent || '');
}

// Selection-aware: only use selection if it lives inside `input`.
function getTextToEnhance(input) {
    const full = getInputText(input);
    // Native inputs: use selectionStart/End
    if (input.tagName === 'TEXTAREA' || input.tagName === 'INPUT') {
        try {
            const s = input.selectionStart, e = input.selectionEnd;
            if (typeof s === 'number' && typeof e === 'number' && e > s) {
                const sel = full.slice(s, e);
                if (sel.trim()) return { text: sel, isSelection: true, start: s, end: e };
            }
        } catch (_) { /* fall through */ }
        return { text: full, isSelection: false };
    }
    // contenteditable: check DOM selection containment
    try {
        const sel = window.getSelection();
        if (sel && sel.rangeCount > 0 && !sel.isCollapsed) {
            const range = sel.getRangeAt(0);
            if (input.contains(range.commonAncestorContainer) || input.contains(sel.anchorNode)) {
                const selText = sel.toString();
                if (selText && selText.trim() && full.includes(selText)) {
                    return { text: selText, isSelection: true, range: range.cloneRange() };
                }
            }
        }
    } catch (_) { /* fall through */ }
    return { text: full, isSelection: false };
}

function applyTextDirection(el) {
    // RTL fix is always on: Persian/Arabic text renders right-to-left.
    if (!el || el.nodeType !== 1) return;
    const tag = el.tagName;
    if (tag === 'SCRIPT' || tag === 'STYLE' || tag === 'NOSCRIPT' || tag === 'TEXTAREA' || tag === 'INPUT') return;
    if (el.closest('nav, header, button, [role="button"], [role="navigation"], [role="menu"]')) return;
    // Only touch leaf-ish text nodes to avoid flipping whole layouts
    if (el.children.length > 3) return;
    let text = '';
    try { text = (el.textContent || '').trim(); } catch (_) { return; }
    if (!text || text.length > 2000) return;
    if (RTL_REGEX.test(text)) {
        if (el.getAttribute('dir') !== 'rtl') el.setAttribute('dir', 'rtl');
        el.classList.add('pe-rtl');
    } else if (LATIN_REGEX.test(text) && el.classList.contains('pe-rtl')) {
        el.removeAttribute('dir');
        el.classList.remove('pe-rtl');
    }
}

function showToast(el, msg, isError) {
    if (!el) return;
    el.textContent = msg;
    el.classList.toggle('is-error', !!isError);
    el.classList.toggle('is-ok', !isError);
    el.style.opacity = '1';
    const prev = toastTimers.get(el);
    if (prev) clearTimeout(prev);
    toastTimers.set(el, setTimeout(() => { el.style.opacity = '0'; }, 4000));
}

function setButtonLoading(btn, loading) {
    btn.classList.toggle('is-loading', loading);
    btn.disabled = loading;
    const label = btn.querySelector('.enhance-button__label');
    if (label) label.textContent = loading ? 'Enhancing…' : '✨ Enhance';
}

function setNativeValue(element, value) {
    if (element.tagName === 'TEXTAREA' || element.tagName === 'INPUT') {
        const proto = element.tagName === 'TEXTAREA'
            ? window.HTMLTextAreaElement.prototype
            : window.HTMLInputElement.prototype;
        try {
            const setter = Object.getOwnPropertyDescriptor(proto, 'value').set;
            setter.call(element, value);
        } catch (_) {
            element.value = value;
        }
        element.dispatchEvent(new Event('input', { bubbles: true }));
        element.dispatchEvent(new Event('change', { bubbles: true }));
    } else {
        element.focus({ preventScroll: true });
        let replaced = false;
        try {
            const sel = window.getSelection();
            const range = document.createRange();
            range.selectNodeContents(element);
            sel.removeAllRanges();
            sel.addRange(range);
            replaced = document.execCommand('insertText', false, value);
        } catch (_) { replaced = false; }
        if (!replaced) {
            // Fallback for ProseMirror / Lexical / Draft editors
            element.textContent = '';
            element.textContent = value;
            // Place caret at end
            try {
                const range = document.createRange();
                range.selectNodeContents(element);
                range.collapse(false);
                const sel = window.getSelection();
                sel.removeAllRanges();
                sel.addRange(range);
            } catch (_) { /* ignore */ }
        }
        element.dispatchEvent(new InputEvent('input', { bubbles: true, inputType: 'insertText', data: value }));
        element.dispatchEvent(new Event('change', { bubbles: true }));
    }
}

function replaceSelectionInInput(input, info, replacement) {
    const full = getInputText(input);
    if (!info.isSelection) return replacement;
    if (input.tagName === 'TEXTAREA' || input.tagName === 'INPUT') {
        const s = info.start, e = info.end;
        try {
            const before = full.slice(0, s);
            const after = full.slice(e);
            const next = before + replacement + after;
            setNativeValue(input, next);
            // Restore caret after inserted text
            const pos = before.length + replacement.length;
            input.focus({ preventScroll: true });
            input.setSelectionRange(pos, pos);
            return null; // already applied
        } catch (_) { /* fall through to full replace */ }
    }
    // contenteditable selection: replace via saved range
    try {
        if (info.range) {
            const sel = window.getSelection();
            sel.removeAllRanges();
            sel.addRange(info.range);
            if (document.execCommand('insertText', false, replacement)) {
                input.dispatchEvent(new InputEvent('input', { bubbles: true, inputType: 'insertText', data: replacement }));
                return null;
            }
        }
    } catch (_) { /* fall through */ }
    return full.replace(info.text, replacement);
}

function pushHistory(input, text) {
    let stack = historyMap.get(input);
    if (!stack) { stack = []; historyMap.set(input, stack); }
    stack.push(text);
    if (stack.length > 10) stack.shift();
}

function findInputs() {
    const host = window.location.hostname;
    let list = [];
    if (host.includes('gemini.google.com') || host.includes('aistudio.google.com')) {
        list = [...document.querySelectorAll('div[contenteditable="true"][role="textbox"], div[contenteditable="true"]:not([hidden])')];
    } else if (host.includes('chatgpt') || host.includes('openai.com') || host.includes('claude.ai')) {
        list = [...document.querySelectorAll('div[contenteditable="true"], textarea')];
    } else {
        list = [...document.querySelectorAll('textarea, div[contenteditable="true"], input[type="text"], input[type="search"]:not([aria-hidden="true"])')];
    }
    // Filter out hidden, disabled, tiny search boxes in nav
    return list.filter((el) => {
        if (!el || seenInputs.has(el)) return false;
        if (el.dataset && el.dataset.enhanceButtonAdded) return false;
        if (!el.isConnected) return false;
        const rect = el.getBoundingClientRect();
        if (rect.width < 60 || rect.height < 20) return false;
        const style = getComputedStyle(el);
        if (style.display === 'none' || style.visibility === 'hidden') return false;
        if (el.closest('[aria-hidden="true"]')) return false;
        return isEditable(el);
    });
}

function cleanupOrphans() {
    document.querySelectorAll('.enhancer-btn-container').forEach((c) => {
        const target = c._enhancerTarget;
        if (target && !target.isConnected) c.remove();
    });
}

function removeAllButtons() {
    document.querySelectorAll('.enhancer-btn-container').forEach((c) => c.remove());
    document.querySelectorAll('[data-enhance-button-added]').forEach((el) => {
        try { delete el.dataset.enhanceButtonAdded; } catch (_) { el.removeAttribute('data-enhance-button-added'); }
    });
    seenInputsClear();
}

// WeakSet has no clear(); re-create via expando trick
let seenInputsVersion = 0;
function seenInputsClear() { seenInputsVersion++; }
function isSeen(el) { return el._enhancerSeen === seenInputsVersion || seenInputs.has(el); }
function markSeen(el) { el._enhancerSeen = seenInputsVersion; seenInputs.add(el); }

function placeContainer(input, container, button, revertBtn, toast) {
    const parent = input.parentNode;
    if (!parent || parent === document.body) {
        input.parentNode.insertBefore(container, input.nextSibling);
        return;
    }
    const computedPos = getComputedStyle(parent).position;
    if (computedPos === 'static') parent.style.position = 'relative';
    container.style.position = 'absolute';
    container.style.bottom = '8px';
    container.style.right = '8px';
    container.style.display = 'flex';
    container.style.gap = '6px';
    container.style.alignItems = 'center';
    container.style.zIndex = '100000';
    container.style.pointerEvents = 'none';
    container.style.background = 'transparent';
    button.style.pointerEvents = 'auto';
    revertBtn.style.pointerEvents = 'auto';
    const copyBtn = container.querySelector('.copy-button');
    if (copyBtn) copyBtn.style.pointerEvents = 'auto';
    toast.style.pointerEvents = 'none';
    parent.appendChild(container);
    container._enhancerTarget = input;
}

function addEnhanceButton() {
    if (!settings.enabled) return;
    cleanupOrphans();
    const inputs = findInputs();
    inputs.forEach((input) => {
        if (isSeen(input)) return;
        markSeen(input);
        if (input.dataset.enhanceButtonAdded) return;
        // Avoid double-injecting next to the same input
        try {
            const sib = input.parentNode && input.parentNode.querySelector(':scope > .enhancer-btn-container');
            if (sib) { input.dataset.enhanceButtonAdded = 'true'; return; }
        } catch (_) { /* :scope unsupported, skip check */ }
        input.dataset.enhanceButtonAdded = 'true';

        const container = document.createElement('div');
        container.className = 'enhancer-btn-container';

        const button = document.createElement('button');
        button.type = 'button';
        button.className = 'enhance-button';
        button.title = 'Enhance prompt (Ctrl+Shift+E)';
        button.innerHTML =
            '<span class="enhance-button__icon" aria-hidden="true">✨</span>' +
            '<span class="enhance-button__label">Enhance</span>' +
            '<span class="enhance-button__spinner" aria-hidden="true"></span>';

        const revertBtn = document.createElement('button');
        revertBtn.type = 'button';
        revertBtn.className = 'enhance-button revert-button';
        revertBtn.textContent = '↩ Revert';
        revertBtn.title = 'Restore previous text';
        revertBtn.style.display = 'none';

        const copyBtn = document.createElement('button');
        copyBtn.type = 'button';
        copyBtn.className = 'enhance-button copy-button';
        copyBtn.textContent = '⧉ Copy';
        copyBtn.title = 'Copy current input text';
        copyBtn.style.display = 'none';

        const toast = document.createElement('span');
        toast.className = 'enhancer-inline-toast';
        toast.setAttribute('aria-live', 'polite');

        container.appendChild(button);
        container.appendChild(revertBtn);
        container.appendChild(copyBtn);
        container.appendChild(toast);

        if (window.location.hostname.includes('perplexity.ai')) {
            const p = input.parentElement;
            if (p) {
                p.style.overflow = 'visible';
                if (p.parentElement) p.parentElement.style.overflow = 'visible';
            }
        }

        placeContainer(input, container, button, revertBtn, toast);

        const triggerEnhance = async () => {
            const info = getTextToEnhance(input);
            if (!info.text.trim()) {
                showToast(toast, 'Input is empty', true);
                return;
            }
            pushHistory(input, getInputText(input));
            setButtonLoading(button, true);
            try {
                chrome.runtime.sendMessage({ action: 'enhance', text: info.text }, (response) => {
                    if (chrome.runtime.lastError) {
                        setButtonLoading(button, false);
                        showToast(toast, 'Extension updated. Please refresh the page.', true);
                        return;
                    }
                    setButtonLoading(button, false);
                    if (!response) {
                        showToast(toast, 'No response. Please refresh the page.', true);
                        return;
                    }
                    if (response.error) {
                        showToast(toast, response.error, true);
                    } else if (typeof response.text === 'string' && response.text.trim()) {
                        const applied = replaceSelectionInInput(input, info, response.text.trim());
                        if (applied !== null) setNativeValue(input, applied);
                        revertBtn.style.display = 'inline-block';
                        copyBtn.style.display = 'inline-block';
                        showToast(toast, 'Enhanced ✓', false);
                    } else {
                        showToast(toast, 'Empty response. Try again.', true);
                    }
                });
            } catch (e) {
                setButtonLoading(button, false);
                showToast(toast, 'Extension error. Refresh the page.', true);
            }
        };

        button.addEventListener('click', (e) => { e.preventDefault(); e.stopPropagation(); triggerEnhance(); });

        revertBtn.addEventListener('click', (e) => {
            e.preventDefault(); e.stopPropagation();
            const stack = historyMap.get(input);
            if (stack && stack.length) {
                setNativeValue(input, stack.pop());
                showToast(toast, 'Reverted', false);
                if (!stack.length) revertBtn.style.display = 'none';
            }
        });

        copyBtn.addEventListener('click', async (e) => {
            e.preventDefault(); e.stopPropagation();
            try {
                await navigator.clipboard.writeText(getInputText(input));
                showToast(toast, 'Copied ✓', false);
            } catch (_) {
                showToast(toast, 'Copy failed', true);
            }
        });

        input.enhancerTrigger = triggerEnhance;
    });
}

let mutationTimeout = null;
const observer = new MutationObserver((mutationsList) => {
    if (mutationTimeout) return; // coalesce bursts
    mutationTimeout = setTimeout(() => {
        mutationTimeout = null;
        try {
            for (const mutation of mutationsList) {
                for (const node of mutation.addedNodes) {
                    if (node.nodeType !== 1) continue;
                    applyTextDirection(node);
                    // Limit deep scan for perf
                    if (node.querySelectorAll) {
                        const kids = node.querySelectorAll('p, span, li, td, h1, h2, h3');
                        const limit = Math.min(kids.length, 60);
                        for (let i = 0; i < limit; i++) applyTextDirection(kids[i]);
                    }
                }
            }
        } catch (_) { /* ignore */ }
        addEnhanceButton();
    }, 400);
});

setTimeout(() => {
    try {
        addEnhanceButton();
        document.querySelectorAll('p, span, li, td, h1, h2, h3').forEach(applyTextDirection);
        if (document.body) observer.observe(document.body, { childList: true, subtree: true });
    } catch (_) { /* ignore */ }
}, 800);

try {
    chrome.runtime.onMessage.addListener((req) => {
        if (req.action === 'shortcut-enhance') {
            const activeEl = document.activeElement;
            if (activeEl && activeEl.enhancerTrigger) {
                activeEl.enhancerTrigger();
            } else {
                // Fallback: enhance first visible input on the page
                const fallback = document.querySelector('textarea, div[contenteditable="true"]');
                if (fallback && fallback.enhancerTrigger) fallback.enhancerTrigger();
            }
        }
    });
} catch (_) { /* ignore */ }

})();
