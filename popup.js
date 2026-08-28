document.addEventListener('DOMContentLoaded', () => {
    const $ = (s) => document.querySelector(s);

    const defaults = {
        openrouter: 'openrouter/free',
        groq: 'qwen/qwen3.8-27b'
    };

    const providers = {
        openrouter: { label: 'OpenRouter', placeholder: 'sk-or-v1-...' },
        groq: { label: 'Groq', placeholder: 'gsk_...' }
    };

    const models = {
        openrouter: [
            ['openrouter/free', 'OpenRouter Free Router', 'Default'],
            ['dots-studio/dots-3-note-preview:free', 'Dots3 Note Preview', 'Free'],
            ['liquid/lfm-2.5-2.6b:free', 'Liquid LFM 2.5 2.6B', 'Free'],
            ['nvidia/nemotron-3.5-lightning:free', 'Nemotron 3.5 Lightning', 'Free'],
            ['thinkingmachines/inkling:free', 'Thinking Machines Inkling', 'Free'],
            ['poolside/laguna-s-2.1:free', 'Poolside Laguna S 2.1', 'Free'],
            ['cohere/north-mini-code:free', 'Cohere North Mini Code', 'Free'],
            ['z-ai/glm-5.2:free', 'GLM 5.2', 'Free'],
            ['minimax/minimax-m3:free', 'MiniMax M3', 'Free']
        ],
        groq: [
            ['llama-3.3-70b-versatile', 'Llama 3.3 70B', 'Versatile'],
            ['llama-3.1-8b-instant', 'Llama 3.1 8B', 'Fast'],
            ['meta-llama/llama-4-maverick-17b-128e-instruct', 'Llama 4 Maverick 17B', ''],
            ['meta-llama/llama-4-scout-17b-16e-instruct', 'Llama 4 Scout 17B', ''],
            ['moonshotai/kimi-k2-instruct', 'Kimi K2', 'Reasoning'],
            ['openai/gpt-oss-120b', 'GPT OSS 120B', ''],
            ['openai/gpt-oss-20b', 'GPT OSS 20B', 'Fast'],
            ['qwen/qwen3-32b', 'Qwen 3 32B', ''],
            ['qwen/qwen3.6-27b', 'Qwen 3.6 27B', ''],
            ['qwen/qwen3.8-27b', 'Qwen 3.8 27B', 'Default']
        ]
    };

    const input = $('#apiKey');
    const modelToggle = $('#modelToggle');
    const modelValue = $('#modelValue');
    const modelMenu = $('#modelMenu');
    const modelDropdown = $('#modelDropdown');
    const providerToggle = $('#providerToggle');
    const segments = [...providerToggle.querySelectorAll('.segment')];
    const apiKeyLabel = $('#apiKeyLabel');
    const modelLabel = $('#modelLabel');
    const toast = $('#toast');

    let provider = 'groq';
    let selectedModel = defaults.groq;
    let menuOpen = false;
    let t;

    function isValidKey(v, p) {
        return p === 'groq'
            ? /^gsk_[A-Za-z0-9-_]{16,}$/.test((v || '').trim())
            : /^sk-or-v1-[A-Za-z0-9]{16,}$/.test((v || '').trim());
    }

    function renderMenu() {
        modelMenu.replaceChildren(...models[provider].map(([value, label, badge]) => {
            const li = document.createElement('li');
            li.className = 'dropdown__option' + (value === selectedModel ? ' selected' : '');
            li.setAttribute('role', 'option');
            li.setAttribute('aria-selected', String(value === selectedModel));
            li.dataset.value = value;

            const name = document.createElement('span');
            name.className = 'dropdown__name';
            name.textContent = label;
            li.appendChild(name);

            if (badge) {
                const b = document.createElement('span');
                b.className = 'badge';
                b.textContent = badge;
                li.appendChild(b);
            }
            return li;
        }));
        const current = models[provider].find(([v]) => v === selectedModel);
        modelValue.textContent = current ? current[1] : selectedModel;
    }

    function renderProvider(p, savedModel) {
        provider = p;
        const meta = providers[p];
        apiKeyLabel.textContent = `${meta.label} API Key`;
        modelLabel.textContent = `${meta.label} Model`;
        input.placeholder = meta.placeholder;
        providerToggle.dataset.active = p;
        segments.forEach((s) => {
            const active = s.dataset.provider === p;
            s.classList.toggle('is-active', active);
            s.setAttribute('aria-checked', String(active));
        });
        selectedModel = models[p].some(([v]) => v === savedModel) ? savedModel : defaults[p];
        renderMenu();
    }

    function loadProviderSettings(p) {
        const keyName = p === 'groq' ? 'groqApiKey' : 'openrouterApiKey';
        const modelName = p === 'groq' ? 'groqModel' : 'openrouterModel';
        chrome.storage.sync.get([keyName, modelName], (res) => {
            input.value = res[keyName] || '';
            renderProvider(p, res[modelName]);
        });
    }

    function openMenu(open) {
        menuOpen = open;
        modelMenu.hidden = !open;
        modelDropdown.classList.toggle('open', open);
        modelToggle.setAttribute('aria-expanded', String(open));
    }

    chrome.storage.sync.get(['provider'], (res) =>
        loadProviderSettings(res.provider === 'groq' ? 'groq' : 'openrouter')
    );

    segments.forEach((s) => s.addEventListener('click', () => {
        openMenu(false);
        loadProviderSettings(s.dataset.provider);
    }));

    modelToggle.addEventListener('click', (e) => {
        e.stopPropagation();
        openMenu(!menuOpen);
    });

    modelMenu.addEventListener('click', (e) => {
        const option = e.target.closest('.dropdown__option');
        if (!option) return;
        selectedModel = option.dataset.value;
        renderMenu();
        openMenu(false);
    });

    document.addEventListener('click', (e) => {
        if (menuOpen && !modelDropdown.contains(e.target)) openMenu(false);
    });

    document.addEventListener('keydown', (e) => {
        if (e.key === 'Escape' && menuOpen) openMenu(false);
    });

    // Save
    document.getElementById('apiForm').addEventListener('submit', (e) => {
        e.preventDefault();
        const key = input.value.trim();
        if (key && !isValidKey(key, provider)) {
            return toastMsg(`Enter a valid ${providers[provider].label} key.`);
        }
        chrome.storage.sync.set({
            provider,
            [`${provider}ApiKey`]: key,
            [`${provider}Model`]: selectedModel
        }, () => toastMsg('Settings saved successfully.'));
    });

    // Clear
    document.getElementById('clear').addEventListener('click', () => {
        input.value = '';
        chrome.storage.sync.remove([`${provider}ApiKey`], () => toastMsg('API Key cleared.'));
    });

    // Show/Hide
    document.getElementById('toggleVis').addEventListener('click', () => {
        input.type = input.type === 'password' ? 'text' : 'password';
    });

    // Copy
    document.getElementById('copyKey').addEventListener('click', async () => {
        try {
            await navigator.clipboard.writeText(input.value || '');
            toastMsg('Copied to clipboard.');
        } catch {
            toastMsg('Copy failed.');
        }
    });

    function toastMsg(msg) {
        toast.textContent = msg;
        toast.classList.add('show');
        clearTimeout(t);
        t = setTimeout(() => toast.classList.remove('show'), 2000);
    }
});
