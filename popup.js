document.addEventListener('DOMContentLoaded', () => {
    const $ = (s) => document.querySelector(s);

    const defaults = {
        openrouter: 'openrouter/free',
        groq: 'qwen/qwen3.8-27b',
        gemini: 'gemini-3.8-flash',
        cerebras: 'gpt-oss-120b',
        mistral: 'mistral-small-latest'
    };

    const providers = {
        groq: { label: 'Groq', placeholder: 'gsk_...', keyUrl: 'https://console.groq.com/keys' },
        openrouter: { label: 'OpenRouter', placeholder: 'sk-or-v1-...', keyUrl: 'https://openrouter.ai/keys' },
        gemini: { label: 'Gemini', placeholder: 'AIza...', keyUrl: 'https://aistudio.google.com/app/apikey' },
        cerebras: { label: 'Cerebras', placeholder: 'csk-...', keyUrl: 'https://cloud.cerebras.ai' },
        mistral: { label: 'Mistral', placeholder: 'paste key...', keyUrl: 'https://console.mistral.ai/api-keys' }
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
        ],
        gemini: [
            ['gemini-3.8-flash', 'Gemini 3.8 Flash', 'Default'],
            ['gemini-2.5-flash', 'Gemini 2.5 Flash', 'Free'],
            ['gemini-2.5-pro', 'Gemini 2.5 Pro', 'Free']
        ],
        cerebras: [
            ['gpt-oss-120b', 'GPT OSS 120B', 'Default'],
            ['llama3.1-8b', 'Llama 3.1 8B', 'Free']
        ],
        mistral: [
            ['mistral-small-latest', 'Mistral Small', 'Default'],
            ['mistral-large-latest', 'Mistral Large', ''],
            ['codestral-latest', 'Codestral', 'Code'],
            ['open-mistral-nemo', 'Mistral Nemo', 'Free']
        ]
    };

    const MODES = ['standard', 'concise', 'detailed', 'coding', 'writing', 'reasoning'];
    const DEFAULT_MODE = 'concise';

    const input = $('#apiKey');
    const modelToggle = $('#modelToggle');
    const modelValue = $('#modelValue');
    const modelMenu = $('#modelMenu');
    const modelDropdown = $('#modelDropdown');
    const providerSelect = $('#providerSelect');
    const keyLink = $('#keyLink');
    const apiKeyLabel = $('#apiKeyLabel');
    const modelLabel = $('#modelLabel');
    const toast = $('#toast');
    const modeSelect = $('#modeSelect');
    const customInstructions = $('#customInstructions');
    const enabledToggle = $('#enabledToggle');

    let provider = 'groq';
    let selectedModel = defaults.groq;
    let menuOpen = false;
    let t;

    function resolveProvider(saved) {
        return providers[saved] ? saved : 'groq';
    }

    function isValidKey(v, p) {
        const s = (v || '').trim();
        if (!s) return true; // allow empty (clear)
        if (p === 'groq') return /^gsk_[A-Za-z0-9]{8,}$/.test(s);
        if (p === 'openrouter') return /^sk-or-v1-[A-Za-z0-9-]{8,}$/.test(s);
        if (p === 'gemini') return /^AIza[A-Za-z0-9_-]{10,}$/.test(s);
        if (p === 'cerebras') return /^csk-\S{8,}$/.test(s);
        if (p === 'mistral') return /^[A-Za-z0-9]{16,}$/.test(s);
        return s.length >= 8;
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
        provider = providers[p] ? p : 'groq';
        const meta = providers[provider];
        apiKeyLabel.textContent = `${meta.label} API Key`;
        modelLabel.textContent = `${meta.label} Model`;
        input.placeholder = meta.placeholder;
        keyLink.href = meta.keyUrl;
        providerSelect.value = provider;
        selectedModel = models[provider].some(([v]) => v === savedModel) ? savedModel : defaults[provider];
        renderMenu();
    }

    function loadProviderSettings(p) {
        const keyName = `${p}ApiKey`;
        const modelName = `${p}Model`;
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

    chrome.storage.sync.get(
        ['provider', 'enhanceMode', 'customInstructions', 'enabled'],
        (res) => {
            loadProviderSettings(resolveProvider(res.provider));
            const mode = MODES.includes(res.enhanceMode) ? res.enhanceMode : DEFAULT_MODE;
            modeSelect.value = mode;
            customInstructions.value = res.customInstructions || '';
            enabledToggle.checked = res.enabled !== false;
        }
    );

    providerSelect.addEventListener('change', () => {
        openMenu(false);
        loadProviderSettings(providerSelect.value);
    });

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
        if (!isValidKey(key, provider)) {
            return toastMsg(`That doesn't look like a valid ${providers[provider].label} key.`);
        }
        const mode = MODES.includes(modeSelect.value) ? modeSelect.value : DEFAULT_MODE;
        chrome.storage.sync.set({
            provider,
            [`${provider}ApiKey`]: key,
            [`${provider}Model`]: selectedModel,
            enhanceMode: mode,
            customInstructions: customInstructions.value.trim().slice(0, 1000),
            enabled: enabledToggle.checked
        }, () => toastMsg('Settings saved successfully.'));
    });

    // Clear
    document.getElementById('clear').addEventListener('click', () => {
        input.value = '';
        chrome.storage.sync.remove([`${provider}ApiKey`], () => toastMsg('API Key cleared.'));
    });

    // Instant-apply toggle (no save click needed)
    enabledToggle.addEventListener('change', () => {
        chrome.storage.sync.set({ enabled: enabledToggle.checked }, () =>
            toastMsg(enabledToggle.checked ? 'Extension enabled.' : 'Extension paused.')
        );
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
