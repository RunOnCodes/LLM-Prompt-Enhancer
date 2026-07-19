chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {
    if (request.action === 'enhance') {
        chrome.storage.sync.get(['groqApiKey', 'groqModel'], async (res) => {
            if (!res.groqApiKey) {
                sendResponse({ error: 'Groq API Key is not set. Please set it in the extension popup.' });
                return;
            }

            const modelToUse = res.groqModel || 'llama-3.1-70b-versatile';

            try {
                const response = await fetch('https://api.groq.com/openai/v1/chat/completions', {
                    method: 'POST',
                    headers: { 
                        'Content-Type': 'application/json', 
                        'Authorization': `Bearer ${res.groqApiKey}` 
                    },
                    body: JSON.stringify({
                        model: modelToUse,
                        messages: [
                            {
                                role: 'system',
                                content: 'You are an expert at turning short, informal user requests into clear, detailed, and effective prompts for a chat-based Large Language Model (LLM). Your g[...]'
                            },
                            {
                                role: 'user',
                                content: `Please rephrase the following short user text into a detailed and effective prompt for a Large Language Model.
\t\t\t\t\tThe goal is to make the prompt as clear and actionable as possible so that a user can paste it directly into a chat LLM and get a helpful answer to their question or problem.
\t\t\t\t\tThe rephrased prompt should be in the same language as the original text and should be significantly more detailed and user-ready than the original.

                    **Original User Text:**
                    "${request.text}"

                    **Example of Rephrasing (for input: 'fix my blurry photo'):**

                    "I have a photo that is blurry. What are some common reasons why photos become blurry?  And what are the best ways to try and fix a blurry photo? Please provide step-by-step in[...]

                    Now, rephrase the following Original User Text into a detailed and user-ready prompt that can be directly used in a chat LLM.  Remember to ONLY return the rephrased prompt, rea[...]
                    `
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
                console.error("Groq API Error:", error);
                let errorMsg = error.message;
                if (errorMsg.includes("rate_limit_exceeded") || errorMsg.includes("Rate limit reached")) {
                    errorMsg = "Rate Limit Exceeded. Try again in a minute or switch to a faster model in settings.";
                } else if (errorMsg.includes("does not exist") || errorMsg.includes("404")) {
                    errorMsg = "Model not found. Please open settings and save a new AI model.";
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
