const DEFAULT_PROVIDER = 'groq';
const DEFAULT_MODELS = {
    openrouter: 'openrouter/free',
    groq: 'qwen/qwen3.8-27b'
};
const SUPPORTED_MODELS = {
    openrouter: new Set([
    'openrouter/free',
    'dots-studio/dots-3-note-preview:free',
    'liquid/lfm-2.5-2.6b:free',
    'nvidia/nemotron-3.5-lightning:free',
    'thinkingmachines/inkling:free',
    'poolside/laguna-s-2.1:free',
    'cohere/north-mini-code:free',
    'z-ai/glm-5.2:free',
    'minimax/minimax-m3:free'
    ]),
    groq: new Set([
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
};

chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {
    if (request.action === 'enhance') {
        chrome.storage.sync.get(['provider', 'openrouterApiKey', 'openrouterModel', 'groqApiKey', 'groqModel'], async (res) => {
            const provider = res.provider === 'groq' ? 'groq' : DEFAULT_PROVIDER;
            const apiKey = provider === 'groq' ? res.groqApiKey : res.openrouterApiKey;
            if (!apiKey) {
                sendResponse({ error: `${provider === 'groq' ? 'Groq' : 'OpenRouter'} API Key is not set. Please set it in the extension popup.` });
                return;
            }

            const savedModel = provider === 'groq' ? res.groqModel : res.openrouterModel;
            const modelToUse = SUPPORTED_MODELS[provider].has(savedModel)
                ? savedModel
                : DEFAULT_MODELS[provider];
            const endpoint = provider === 'groq'
                ? 'https://api.groq.com/openai/v1/chat/completions'
                : 'https://openrouter.ai/api/v1/chat/completions';

            try {
                const headers = {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${apiKey}`
                };
                if (provider === 'openrouter') {
                    headers['HTTP-Referer'] = 'https://github.com/prompt-enhancer';
                    headers['X-Title'] = 'Prompt Enhancer';
                }

                const response = await fetch(endpoint, {
                    method: 'POST',
                    headers,
                    body: JSON.stringify({
                        model: modelToUse,
                        messages: [
                            {
                                role: 'system',
                                content: `You are a senior prompt engineer. Transform the user's rough request into a single, self-contained, production-grade prompt for an AI assistant. This is a one-shot generation – it must be perfect on the first try, with no follow-up or refinement.

Follow this engineering framework strictly:

1. Role: Assign a specific, expert persona to the AI that matches the domain.
2. Context: Clearly define the background, environment, and relevant assumptions.
3. Objective / Task: Break the request into clear, actionable, step-by-step instructions.
4. Constraints: Define tone, style, length limits, boundaries, and explicitly state what NOT to do.
5. Output Format: Specify exactly how the final answer should be structured (e.g., Markdown headings, bullet points, numbered steps, JSON, table).
6. Reasoning (Chain-of-Thought): For complex, multi-step, or analytical tasks, instruct the AI to think step-by-step before giving its final answer.
7. Examples (Few-shot): If the task is ambiguous or complex, include 1 concise example of input and output to clarify expectations.

Before finalizing, perform a silent self-review: Is it unambiguous? Is every instruction actionable? Is anything missing?

Output Rules:
- Return ONLY the final, polished prompt.
- Do NOT add explanations, labels, introductions, or meta-commentary (e.g., "Here is your prompt:", "Enhanced version:", etc.).
- Do NOT wrap the output in Markdown code blocks.
- Preserve the user's original language, unless specifying a different language yields significantly better results for the target AI.
- The final output must be ready to copy and paste directly into another AI chat with zero editing.`
                            },
                            {
                                role: 'user',
                                content: `Rewrite the following user request into the final prompt using the engineering framework above. Preserve its original language.

<user_request>
${request.text}
</user_request>`
                            }
                        ],
                        max_tokens: 1500, 
                        temperature: 0.7
                    })
                });

                if (!response.ok) {
                    const errData = await response.json();
                    throw new Error(errData.error?.message || `API error ${response.status}`);
                }

                const data = await response.json();
                let enhancedText = data.choices[0].message.content.trim();

                if (enhancedText.startsWith('"') && enhancedText.endsWith('"')) {
                    enhancedText = enhancedText.slice(1, -1);
                }

                sendResponse({ text: enhancedText });
            } catch (error) { 
                console.error(`${provider} API Error:`, error);
                let errorMsg = error.message;
                if (errorMsg.includes("401") || errorMsg.toLowerCase().includes("invalid") || errorMsg.toLowerCase().includes("unauthorized")) {
                    errorMsg = `Invalid ${provider === 'groq' ? 'Groq' : 'OpenRouter'} API key. Please check your key in settings.`;
                } else if (errorMsg.includes("429") || errorMsg.toLowerCase().includes("rate limit")) {
                    errorMsg = `${provider === 'groq' ? 'Groq' : 'OpenRouter'} rate limit reached. Try again shortly or choose another model.`;
                } else if (errorMsg.includes("does not exist") || errorMsg.includes("404")) {
                    errorMsg = "Model not found. Please choose another model in settings.";
                }
                sendResponse({ error: errorMsg }); 
            }
        });
        return true; 
    }
});

chrome.commands.onCommand.addListener((command) => {
    if (command === 'enhance-prompt') {
        chrome.tabs.query({active: true, currentWindow: true}, (tabs) => { 
            if (tabs[0]) chrome.tabs.sendMessage(tabs[0].id, {action: 'shortcut-enhance'}); 
        });
    }
});