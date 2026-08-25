document.addEventListener('DOMContentLoaded', () => {
    const $ = (s) => document.querySelector(s);
    const defaults = {
        openrouter: 'stealth/ox-alpha',
        groq: 'llama-3.3-70b-versatile'
    };
    const models = {
        openrouter: [
            ['stealth/ox-alpha', 'Ox Alpha (Default)'],
            ['openrouter/free', 'OpenRouter Free Models Router'],
            ['dots-studio/dots-3-note-preview:free', 'Dots3 Note Preview (Free)'],
            ['liquid/lfm-2.5-2.6b:free', 'Liquid LFM 2.5 2.6B (Free)'],
            ['nvidia/nemotron-3.5-lightning:free', 'NVIDIA Nemotron 3.5 Lightning (Free)'],
            ['thinkingmachines/inkling:free', 'Thinking Machines Inkling (Free)'],
            ['poolside/laguna-s-2.1:free', 'Poolside Laguna S 2.1 (Free)'],
            ['cohere/north-mini-code:free', 'Cohere North Mini Code (Free)'],
            ['z-ai/glm-5.2:free', 'GLM 5.2 (Free)'],
            ['minimax/minimax-m3:free', 'MiniMax M3 (Free)']
        ],
        groq: [
            ['llama-3.3-70b-versatile', 'Llama 3.3 70B (Versatile)'],
            ['llama-3.1-8b-instant', 'Llama 3.1 8B (Fast)'],
            ['meta-llama/llama-4-maverick-17b-128e-instruct', 'Llama 4 Maverick 17B'],
            ['meta-llama/llama-4-scout-17b-16e-instruct', 'Llama 4 Scout 17B'],
            ['moonshotai/kimi-k2-instruct', 'Kimi K2 (Reasoning)'],
            ['openai/gpt-oss-120b', 'GPT OSS 120B'],
            ['openai/gpt-oss-20b', 'GPT OSS 20B (Fast)'],
            ['qwen/qwen3-32b', 'Qwen 3 32B'],
            ['qwen/qwen3.6-27b', 'Qwen 3.6 27B'],
            ['qwen/qwen3.8-27b', 'Qwen 3.8 27B']
        ]
    };

    const input = $('#apiKey');
    const modelSelect = $('#modelSelect');
    const providerSelect = $('#providerSelect');
    const apiKeyLabel = $('#apiKeyLabel');
    const modelLabel = $('#modelLabel');
    const saveBtn = $('#save');
    const clearBtn = $('#clear');
    const toggleBtn = $('#toggleVis');
    const copyBtn = $('#copyKey');
    const toast = $('#toast');

    function renderProviderSettings(provider, savedModel) {
        const isGroq = provider === 'groq';
        apiKeyLabel.textContent = `${isGroq ? 'Groq' : 'OpenRouter'} API Key`;
        input.placeholder = isGroq ? 'gsk_...' : 'sk-or-v1-...';
        modelLabel.textContent = `${isGroq ? 'Groq' : 'OpenRouter'} Model`;
        modelSelect.replaceChildren(...models[provider].map(([value, label]) => {
            const option = document.createElement('option');
            option.value = value;
            option.textContent = label;
            return option;
        }));
        modelSelect.value = models[provider].some(([value]) => value === savedModel)
            ? savedModel
            : defaults[provider];
    }

    function loadProviderSettings(provider) {
        const keyName = provider === 'groq' ? 'groqApiKey' : 'openrouterApiKey';
        const modelName = provider === 'groq' ? 'groqModel' : 'openrouterModel';
        chrome.storage.sync.get([keyName, modelName], (res) => {
            input.value = res[keyName] || '';
            renderProviderSettings(provider, res[modelName]);
        });
    }

    chrome.storage.sync.get(['provider'], (res) => {
        providerSelect.value = res.provider === 'groq' ? 'groq' : 'openrouter';
        loadProviderSettings(providerSelect.value);
    });

    function validKey(v) {
        return /^sk-or-v1-[A-Za-z0-9]{16,}$/.test((v || '').trim());
    }

    function validGroqKey(v) {
        return /^gsk_[A-Za-z0-9-_]{16,}$/.test((v || '').trim());
    }

    providerSelect.addEventListener('change', () => loadProviderSettings(providerSelect.value));

    // Save
    document.getElementById('apiForm').addEventListener('submit', (e) => {
        e.preventDefault();
        const key = input.value.trim();

        const provider = providerSelect.value;
        const isValid = provider === 'groq' ? validGroqKey(key) : validKey(key);
        if (key && !isValid) {
            return toastMsg(`Enter a valid ${provider === 'groq' ? 'Groq' : 'OpenRouter'} key.`);
        }

        chrome.storage.sync.set({ 
            provider,
            [`${provider}ApiKey`]: key,
            [`${provider}Model`]: modelSelect.value
        }, () => {
            toastMsg('Settings saved successfully.');
        });
    });

    // Clear
    clearBtn.addEventListener('click', () => {
        input.value = '';
        const provider = providerSelect.value;
        chrome.storage.sync.remove([`${provider}ApiKey`], () => toastMsg('API Key cleared.'));
    });

    // Show/Hide
    toggleBtn.addEventListener('click', () => {
        input.type = input.type === 'password' ? 'text' : 'password';
    });

    // Copy
    copyBtn.addEventListener('click', async () => {
        try {
            await navigator.clipboard.writeText(input.value || '');
            toastMsg('Copied to clipboard.');
        } catch {
            toastMsg('Copy failed.');
        }
    });

    let t;
    function toastMsg(msg) {
        toast.textContent = msg;
        toast.classList.add('show');
        clearTimeout(t);
        t = setTimeout(() => toast.classList.remove('show'), 2000);
    }
});