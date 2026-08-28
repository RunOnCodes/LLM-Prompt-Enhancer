// content.js - Enhanced with floating button placement

function applyTextDirection(el) {
    if (el.nodeType !== 1) return; 
    if (el.closest("nav") || el.tagName === 'SCRIPT' || el.tagName === 'STYLE') return;

    const text = el.textContent.trim();
    if (!text) return;

    if (/[؀-ۿ]/.test(text)) {
        el.setAttribute("dir", "rtl");
        el.style.textAlign = "right";
        el.style.fontFamily = 'Vazirmatn, sans-serif';
    } else if (/[A-Za-z]/.test(text)) {
        el.setAttribute("dir", "ltr");
        if(el.style.textAlign === "right") {
            el.style.textAlign = "left";
        }
    }
}

function showToast(el, msg, isError) {
    el.textContent = msg;
    el.classList.toggle('is-error', !!isError);
    el.classList.toggle('is-ok', !isError);
    el.style.opacity = '1';
    setTimeout(() => {
        el.style.opacity = '0';
    }, 4000);
}

function setButtonLoading(btn, loading) {
    btn.classList.toggle('is-loading', loading);
    btn.disabled = loading;
    const label = btn.querySelector('.enhance-button__label');
    if (label) label.textContent = loading ? 'Enhancing…' : 'Enhance Prompt';
}

function setReactInputValue(element, value) {
    if (element.tagName === 'TEXTAREA' || element.tagName === 'INPUT') {
        const prototype = element.tagName === 'TEXTAREA'
            ? window.HTMLTextAreaElement.prototype
            : window.HTMLInputElement.prototype;
        const nativeInputValueSetter = Object.getOwnPropertyDescriptor(prototype, "value").set;
        nativeInputValueSetter.call(element, value);
        element.dispatchEvent(new Event('input', { bubbles: true }));
    } else {
        element.focus();
        const selection = window.getSelection();
        const range = document.createRange();
        range.selectNodeContents(element);
        selection.removeAllRanges();
        selection.addRange(range);
        if (!document.execCommand('insertText', false, value)) {
            element.textContent = value;
        }
        element.dispatchEvent(new InputEvent('input', { bubbles: true, inputType: 'insertText', data: value }));
    }
}

function addEnhanceButton() {
    let inputs = [];

    // Platform-specific selectors to avoid multiple buttons
    if (window.location.hostname.includes('gemini.google.com')) {
        inputs = document.querySelectorAll('div[contenteditable="true"][role="textbox"]');
        if (inputs.length === 0) {
            inputs = document.querySelectorAll('div[contenteditable="true"]:not([hidden])');
        }
    } else if (window.location.hostname.includes('chatgpt') || window.location.hostname.includes('openai.com')) {
        inputs = document.querySelectorAll('div[contenteditable="true"]');
    } else {
        inputs = document.querySelectorAll('textarea, div[contenteditable="true"]');
    }

    inputs.forEach(input => {
        // Skip if this input already has a button
        if (input.dataset.enhanceButtonAdded) return;

        // Extra safety: check if a container already exists next to this input
        const existingContainer = input.parentNode?.querySelector('.enhancer-btn-container');
        if (existingContainer) return;

        input.dataset.enhanceButtonAdded = 'true';

        const container = document.createElement('div');
        container.className = 'enhancer-btn-container';

        const button = document.createElement('button');
        button.className = 'enhance-button';
        button.title = "Shortcut: Ctrl+Shift+E";
        button.innerHTML =
            '<span class="enhance-button__icon" aria-hidden="true">✨</span>' +
            '<span class="enhance-button__label">Enhance Prompt</span>' +
            '<span class="enhance-button__spinner" aria-hidden="true"></span>';

        const revertBtn = document.createElement('button');
        revertBtn.className = 'enhance-button revert-button';
        revertBtn.textContent = '↩ Revert';
        revertBtn.style.display = 'none';

        const toast = document.createElement('span');
        toast.className = 'enhancer-inline-toast';

        container.appendChild(button);
        container.appendChild(revertBtn);
        container.appendChild(toast);

        // Special handling for Perplexity to avoid overflow clipping
        if (window.location.hostname.includes('perplexity.ai')) {
            const parent = input.parentElement;
            if (parent) {
                parent.style.overflow = 'visible'; 
                if (parent.parentElement) parent.parentElement.style.overflow = 'visible';
            }
        }

        // ----- NEW: Floating button placement -----
        const parent = input.parentNode;
        if (!parent) return;

        // Check if the parent is a suitable anchor; fallback to old insertion if not
        const isProblematicParent = (parent === document.body) || 
                                    (parent.closest('body') === document.body && parent.children.length === 1);

        if (isProblematicParent) {
            // Fallback: insert after the input (original behaviour)
            input.parentNode.insertBefore(container, input.nextSibling);
            // Reset any absolute positioning
            container.style.position = 'static';
            container.style.bottom = 'auto';
            container.style.right = 'auto';
        } else {
            // Floating approach: make parent a positioning anchor
            const computedPos = getComputedStyle(parent).position;
            if (computedPos === 'static') {
                parent.style.position = 'relative';
            }

            // Style the container as a floating toolbar
            container.style.position = 'absolute';
            container.style.bottom = '8px';
            container.style.right = '8px';
            container.style.display = 'flex';
            container.style.gap = '6px';
            container.style.alignItems = 'center';
            container.style.zIndex = '100000';
            container.style.pointerEvents = 'none';   // allow clicks to pass through to the input
            container.style.background = 'transparent';

            // Buttons need to receive pointer events
            button.style.pointerEvents = 'auto';
            revertBtn.style.pointerEvents = 'auto';
            toast.style.pointerEvents = 'none';

            // Append the container as a child of the input's parent
            parent.appendChild(container);
        }

        // ---- End of placement ----

        let originalText = '';

        const triggerEnhance = async () => {
            const currentText = input.tagName === 'TEXTAREA' ? input.value : input.textContent;
            let textToEnhance = currentText;
            let isSelection = false;

            const selection = window.getSelection().toString();
            if (selection && currentText.includes(selection)) {
                textToEnhance = selection;
                isSelection = true;
            }

            if (!textToEnhance.trim()) {
                showToast(toast, 'Input is empty', true);
                return;
            }

            originalText = currentText;
            setButtonLoading(button, true);

            try {
                chrome.runtime.sendMessage({ action: 'enhance', text: textToEnhance }, (response) => {
                    if (chrome.runtime.lastError) {
                        console.error(chrome.runtime.lastError.message);
                        setButtonLoading(button, false);
                        showToast(toast, "Extension updated. Please refresh the page.", true);
                        return;
                    }

                    setButtonLoading(button, false);

                    if (!response) {
                         showToast(toast, "Error connecting to extension. Please refresh the page.", true);
                         return;
                    }

                    if (response.error) {
                        showToast(toast, response.error, true);
                    } else if (typeof response.text === 'string' && response.text.trim()) {
                        let newFullText = response.text;

                        if (isSelection) {
                            newFullText = currentText.replace(selection, response.text);
                        }

                        setReactInputValue(input, newFullText);
                        revertBtn.style.display = 'inline-block';
                        showToast(toast, 'Enhanced successfully!', false);
                    } else {
                        showToast(toast, 'The API returned an empty response. Please try again.', true);
                    }
                });
            } catch (e) {
                console.error("SendMessage failed:", e);
                setButtonLoading(button, false);
                showToast(toast, "Extension context error. Please refresh the page.", true);
            }
        };

        button.onclick = triggerEnhance;

        revertBtn.onclick = () => {
            setReactInputValue(input, originalText);
            revertBtn.style.display = 'none';
            showToast(toast, 'Reverted to original', false);
        };

        input.enhancerTrigger = triggerEnhance;
    });
}

let mutationTimeout;
const observer = new MutationObserver((mutationsList) => {
    clearTimeout(mutationTimeout);
    mutationTimeout = setTimeout(() => {
        mutationsList.forEach((mutation) => {
            mutation.addedNodes.forEach((node) => {
                if (node.nodeType === 1) { 
                    applyTextDirection(node);
                    node.querySelectorAll("*").forEach(applyTextDirection);
                }
            });
        });
        addEnhanceButton();
    }, 300);
});

setTimeout(() => {
    addEnhanceButton();
    document.querySelectorAll("p, span, div, h1, h2, h3").forEach(applyTextDirection);
    observer.observe(document.body, { childList: true, subtree: true });
}, 1000);

// Listen for keyboard shortcut
try {
    chrome.runtime.onMessage.addListener((req) => {
        if (req.action === 'shortcut-enhance') {
            const activeEl = document.activeElement;
            if (activeEl && activeEl.dataset.enhanceButtonAdded && activeEl.enhancerTrigger) {
                activeEl.enhancerTrigger();
            }
        }
    });
} catch(e) {}