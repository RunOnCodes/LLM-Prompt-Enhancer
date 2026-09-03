const DEFAULT_PROVIDER = 'groq';
// All providers below speak the OpenAI chat-completions dialect and offer a
// free tier. To add another OpenAI-compatible provider, just append an entry.
const PROVIDERS = {
    groq: {
        label: 'Groq',
        endpoint: 'https://api.groq.com/openai/v1/chat/completions',
        keyUrl: 'https://console.groq.com/keys',
        defaultModel: 'qwen/qwen3.8-27b',
        models: new Set([
            'llama-3.1-8b-instant',
            'llama-3.3-70b-versatile',
            'meta-llama/llama-4-maverick-17b-128e-instruct',
            'meta-llama/llama-4-scout-17b-16e-instruct',
            'moonshotai/kimi-k2-instruct',
            'openai/gpt-oss-120b',
            'openai/gpt-oss-20b',
            'qwen/qwen3-32b',
            'qwen/qwen3.6-27b',
            'qwen/qwen3.8-27b'
        ])
    },
    openrouter: {
        label: 'OpenRouter',
        endpoint: 'https://openrouter.ai/api/v1/chat/completions',
        keyUrl: 'https://openrouter.ai/keys',
        extraHeaders: {
            'HTTP-Referer': 'https://github.com/prompt-enhancer',
            'X-Title': 'Prompt Enhancer'
        },
        defaultModel: 'openrouter/free',
        models: new Set([
            'openrouter/free',
            'dots-studio/dots-3-note-preview:free',
            'liquid/lfm-2.5-2.6b:free',
            'nvidia/nemotron-3.5-lightning:free',
            'thinkingmachines/inkling:free',
            'poolside/laguna-s-2.1:free',
            'cohere/north-mini-code:free',
            'z-ai/glm-5.2:free',
            'minimax/minimax-m3:free'
        ])
    },
    gemini: {
        label: 'Gemini',
        endpoint: 'https://generativelanguage.googleapis.com/v1beta/openai/chat/completions',
        keyUrl: 'https://aistudio.google.com/app/apikey',
        defaultModel: 'gemini-3.8-flash',
        models: new Set([
            'gemini-3.8-flash',
            'gemini-2.5-flash',
            'gemini-2.5-pro'
        ])
    },
    cerebras: {
        label: 'Cerebras',
        endpoint: 'https://api.cerebras.ai/v1/chat/completions',
        keyUrl: 'https://cloud.cerebras.ai',
        defaultModel: 'gpt-oss-120b',
        models: new Set([
            'gpt-oss-120b',
            'llama3.1-8b'
        ])
    },
    mistral: {
        label: 'Mistral',
        endpoint: 'https://api.mistral.ai/v1/chat/completions',
        keyUrl: 'https://console.mistral.ai/api-keys',
        defaultModel: 'mistral-small-latest',
        models: new Set([
            'mistral-small-latest',
            'mistral-large-latest',
            'codestral-latest',
            'open-mistral-nemo'
        ])
    }
};

const DEFAULT_MODE = 'concise';
const MODES = {
    standard: {
        label: 'Standard',
        temperature: 0.7,
        extra: 'Balance clarity, completeness, and conciseness.'
    },
    concise: {
        label: 'Concise',
        temperature: 0.5,
        maxTokens: 600,
        extra: 'Keep the enhanced prompt tight and minimal. Prefer short sentences and bullet points. Avoid redundancy and filler.'
    },
    detailed: {
        label: 'Detailed',
        temperature: 0.7,
        extra: 'Be thorough: add acceptance criteria, edge cases, and a definition of done. Prefer numbered steps and explicit output sections.'
    },
    coding: {
        label: 'Coding',
        temperature: 0.4,
        extra: 'Assume a coding task: request language/version, constraints, input/output examples, error handling, and tests. Ask for code with brief explanations.'
    },
    writing: {
        label: 'Writing',
        temperature: 0.8,
        extra: 'Assume a writing task: define audience, tone, voice, length, structure, and style rules. Request a draft plus a short revision checklist.'
    },
    reasoning: {
        label: 'Reasoning',
        temperature: 0.6,
        extra: 'For complex or analytical tasks, instruct the AI to reason step-by-step internally before answering, then present the final answer cleanly.'
    }
};

function resolveProvider(saved) {
    return PROVIDERS[saved] ? saved : DEFAULT_PROVIDER;
}

function cleanEnhancedText(text) {
    if (typeof text !== 'string') return '';
    let t = text.trim();
    // Strip wrapping markdown code fences (```...```)
    const fence = t.match(/^```(?:\w+)?\s*\n([\s\S]*?)\n?```$/);
    if (fence) t = fence[1].trim();
    // Strip wrapping single/double quotes
    if (t.length >= 2) {
        const first = t[0], last = t[t.length - 1];
        if ((first === '"' && last === '"') || (first === "'" && last === "'")) {
            t = t.slice(1, -1).trim();
        }
    }
    // Strip common meta-commentary preambles (first line only)
    t = t.replace(/^(here(?:'s| is) (?:your |the )?enhanced prompt:?\s*\n+)/i, '');
    t = t.replace(/^(enhanced (?:prompt|version):?\s*\n+)/i, '');
    return t.trim();
}

function buildSystemPrompt(mode, customInstructions) {
    const effective = MODES[mode] ? mode : DEFAULT_MODE;
    const custom = (customInstructions && customInstructions.trim())
        ? `\n\nAdditional user preferences (apply on top):\n${customInstructions.trim().slice(0, 1000)}`
        : '';

    // Concise mode skips the full engineering framework: sharpen the request
    // in place instead of expanding it into sections.
    if (effective === 'concise') {
        return `You rewrite rough user requests into short, sharp prompts for an AI assistant. This is a one-shot generation.

Hard limits (must obey):
- 10 to 15 sentences total. Stay inside this range.
- 2 to 3 short paragraphs. No headings, no bullet points, no numbered steps, no sections, no examples, no preamble.
- Do NOT add role assignments, context blocks, output-format specs, or explanations. Just clarify and expand the request itself.

Output Rules:
- Return ONLY the rewritten prompt, nothing else.
- Do NOT wrap the output in Markdown code blocks or quotes.
- Preserve the user's original language.
- The final output must be ready to paste directly into another AI chat with zero editing.${custom}`;
    }

    const modeExtra = MODES[effective].extra;
    let prompt = `You are a senior prompt engineer. Transform the user's rough request into a single, self-contained, production-grade prompt for an AI assistant. This is a one-shot generation – it must be perfect on the first try, with no follow-up or refinement.

Follow this engineering framework strictly:

1. Role: Assign a specific, expert persona to the AI that matches the domain.
2. Context: Clearly define the background, environment, and relevant assumptions.
3. Objective / Task: Break the request into clear, actionable, step-by-step instructions.
4. Constraints: Define tone, style, length limits, boundaries, and explicitly state what NOT to do.
5. Output Format: Specify exactly how the final answer should be structured (e.g., Markdown headings, bullet points, numbered steps, JSON, table).
6. Reasoning (Chain-of-Thought): For complex, multi-step, or analytical tasks, instruct the AI to think step-by-step before giving its final answer.
7. Examples (Few-shot): If the task is ambiguous or complex, include 1 concise example of input and output to clarify expectations.

Mode guidance: ${modeExtra}

Before finalizing, perform a silent self-review: Is it unambiguous? Is every instruction actionable? Is anything missing?

Output Rules:
- Return ONLY the final, polished prompt.
- Do NOT add explanations, labels, introductions, or meta-commentary (e.g., "Here is your prompt:", "Enhanced version:", etc.).
- Do NOT wrap the output in Markdown code blocks.
- Preserve the user's original language, unless specifying a different language yields significantly better results for the target AI.
- The final output must be ready to copy and paste directly into another AI chat with zero editing.`;
    if (customInstructions && customInstructions.trim()) {
        prompt += `\n\nAdditional user preferences (apply on top of the framework):\n${customInstructions.trim().slice(0, 1000)}`;
    }
    return prompt;
}

function getMaxTokens(mode) {
    const m = MODES[mode] || MODES[DEFAULT_MODE];
    return m.maxTokens || 1500;
}

async function fetchWithTimeout(url, options, ms = 60000) {
    const controller = new AbortController();
    const id = setTimeout(() => controller.abort(), ms);
    try {
        return await fetch(url, { ...options, signal: controller.signal });
    } finally {
        clearTimeout(id);
    }
}

function friendlyError(providerLabel, error) {
    const msg = String((error && error.message) || error || '');
    const lower = msg.toLowerCase();
    if (error && error.name === 'AbortError') {
        return 'Request timed out. Please try again.';
    }
    if (msg.includes('401') || lower.includes('invalid') || lower.includes('unauthorized') || lower.includes('incorrect api key')) {
        return `Invalid ${providerLabel} API key. Please check your key in settings.`;
    }
    if (msg.includes('402') || lower.includes('credit') || lower.includes('payment')) {
        return `${providerLabel} credits exhausted. Check billing or switch model/provider.`;
    }
    if (msg.includes('429') || lower.includes('rate limit')) {
        return `${providerLabel} rate limit reached. Try again shortly or choose another model.`;
    }
    if (lower.includes('does not exist') || msg.includes('404') || lower.includes('model_not_found') || lower.includes('no endpoints')) {
        return 'Model not available. Please choose another model in settings.';
    }
    if (lower.includes('failed to fetch') || lower.includes('networkerror') || lower.includes('load failed')) {
        return 'Network error. Check your connection and try again.';
    }
    return msg ? msg.slice(0, 300) : 'Enhancement failed. Please try again.';
}

chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {
    if (request.action === 'enhance') {
        chrome.storage.sync.get(
            ['provider', 'groqApiKey', 'groqModel', 'openrouterApiKey', 'openrouterModel', 'geminiApiKey', 'geminiModel', 'cerebrasApiKey', 'cerebrasModel', 'mistralApiKey', 'mistralModel', 'enhanceMode', 'customInstructions'],
            async (res) => {
                const provider = resolveProvider(res.provider);
                const cfg = PROVIDERS[provider];
                const apiKey = res[`${provider}ApiKey`];
                if (!apiKey || !String(apiKey).trim()) {
                    sendResponse({ error: `${cfg.label} API Key is not set. Get a free key at ${cfg.keyUrl} and set it in the extension popup.` });
                    return;
                }

                const savedModel = res[`${provider}Model`];
                const modelToUse = cfg.models.has(savedModel)
                    ? savedModel
                    : cfg.defaultModel;
                const mode = MODES[res.enhanceMode] ? res.enhanceMode : DEFAULT_MODE;
                const endpoint = cfg.endpoint;

                const text = String(request.text || '').slice(0, 12000);
                if (!text.trim()) {
                    sendResponse({ error: 'Input is empty.' });
                    return;
                }

                try {
                    const headers = {
                        'Content-Type': 'application/json',
                        'Authorization': `Bearer ${String(apiKey).trim()}`,
                        ...(cfg.extraHeaders || {})
                    };

                    const response = await fetchWithTimeout(endpoint, {
                        method: 'POST',
                        headers,
                        body: JSON.stringify({
                            model: modelToUse,
                            messages: [
                                {
                                    role: 'system',
                                    content: buildSystemPrompt(mode, res.customInstructions)
                                },
                                {
                                    role: 'user',
                                    content: `Rewrite the following user request into the final prompt using the engineering framework above. Preserve its original language.\n\n<user_request>\n${text}\n</user_request>`
                                }
                            ],
                            max_tokens: getMaxTokens(mode),
                            temperature: (MODES[mode] || MODES[DEFAULT_MODE]).temperature
                        })
                    }, 60000);

                    if (!response.ok) {
                        let detail = `API error ${response.status}`;
                        try {
                            const errData = await response.json();
                            detail = errData.error?.message || detail;
                        } catch (_) { /* keep default */ }
                        throw new Error(detail);
                    }

                    const data = await response.json();
                    const raw = data.choices && data.choices[0] && data.choices[0].message
                        ? data.choices[0].message.content
                        : '';
                    const enhancedText = cleanEnhancedText(raw);

                    if (!enhancedText) {
                        sendResponse({ error: 'The API returned an empty response. Please try again.' });
                        return;
                    }
                    sendResponse({ text: enhancedText, model: modelToUse });
                } catch (error) {
                    console.error(`${provider} API Error:`, error);
                    sendResponse({ error: friendlyError(cfg.label, error) });
                }
            }
        );
        return true;
    }
    return undefined;
});

chrome.commands.onCommand.addListener((command) => {
    if (command === 'enhance-prompt') {
        chrome.tabs.query({ active: true, currentWindow: true }, (tabs) => {
            if (tabs[0]) chrome.tabs.sendMessage(tabs[0].id, { action: 'shortcut-enhance' });
        });
    }
});
