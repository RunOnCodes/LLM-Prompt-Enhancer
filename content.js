// content.js - Fixed for Gemini duplicate buttons

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
    el.style.color = isError ? '#ef4444' : '#22c55e';
    el.style.opacity = '1';
    setTimeout(() => {
        el.style.opacity = '0';
    }, 4000);
}

function setReactInputValue(element, value) {
    if (element.tagName === 'TEXTAREA' || element.tagName === 'INPUT') {
        const nativeInputValueSetter = Object.getOwnPropertyDescriptor(window.HTMLTextAreaElement.prototype, "value").set;
        nativeInputValueSetter.call(element, value);
        element.dispatchEvent(new Event('input', { bubbles: true }));
    } else {
        // For contenteditable divs (like Perplexity, Gemini)
        element.focus();
        document.execCommand('selectAll', false, null);
        document.execCommand('insertText', false, value);
    }
}

function addEnhanceButton() {
    let inputs = [];

    // Platform-specific selectors to avoid multiple buttons
    if (window.location.hostname.includes('gemini.google.com')) {
        // Gemini: use the most specific selector for the real chat input
        inputs = document.querySelectorAll('div[contenteditable="true"][role="textbox"]');
        // Fallback: any visible contenteditable div (exclude hidden ones)
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
        button.textContent = '✨ Enhance Prompt';
        button.title = "Shortcut: Ctrl+Shift+E";

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

        input.parentNode.insertBefore(container, input.nextSibling);

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
            button.textContent = '✨ Enhancing...';
            button.disabled = true;

            try {
                chrome.runtime.sendMessage({ action: 'enhance', text: textToEnhance }, (response) => {
                    if (chrome.runtime.lastError) {
                        console.error(chrome.runtime.lastError.message);
                        button.textContent = '✨ Enhance Prompt';
                        button.disabled = false;
                        showToast(toast, "Extension updated. Please refresh the page.", true);
                        return;
                    }

                    button.textContent = '✨ Enhance Prompt';
                    button.disabled = false;

                    if (!response) {
                         showToast(toast, "Error connecting to extension. Please refresh the page.", true);
                         return;
                    }

                    if (response.error) {
                        showToast(toast, response.error, true);
                    } else {
                        let newFullText = response.text;

                        if (isSelection) {
                            newFullText = currentText.replace(selection, response.text);
                        }

                        setReactInputValue(input, newFullText);
                        revertBtn.style.display = 'inline-block';
                        showToast(toast, 'Enhanced successfully!', false);
                    }
                });
            } catch (e) {
                console.error("SendMessage failed:", e);
                button.textContent = '✨ Enhance Prompt';
                button.disabled = false;
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