# ✨ Prompt Enhancer & RTL Fix

[![License: MIT](https://img.shields.io/badge/License-MIT-22c55e)](LICENSE)
[![Chrome](https://img.shields.io/badge/Chrome-Manifest%20V3-6366f1)](https://developer.chrome.com/docs/extensions/develop/concepts/manifest-v3)
[![Providers](https://img.shields.io/badge/Providers-OpenRouter%20%7C%20Groq-34d399)](#supported-models)

A **Chrome extension** that turns rough ideas into well-structured, effective prompts for LLMs — with a bonus automatic **RTL/LTR text-direction fix** for Persian and Arabic text on AI chat platforms.

## Overview

**Prompt Enhancer** adds an *Enhance* button next to text inputs on your favorite AI chat platforms. When clicked, the selected provider (OpenRouter or Groq) refines the text into a strong, self-contained prompt and inserts it back into the input — ready to send. It also detects Persian/Arabic text on the page and fixes its direction and alignment automatically.

## Features

- ✨ **Prompt Enhancement** — restructures rough input into clear, actionable prompts while preserving intent, language, and tone
- 🎛️ **Enhance styles** — 6 modes with tuned prompts and temperatures: Concise *(default)*, Standard, Detailed, Coding, Writing, Reasoning
- 📝 **Custom instructions** — optional preferences (up to 1000 chars) applied on top, e.g. "Always ask for a table"
- 🔀 **Provider Choice** — switch between **OpenRouter** and **Groq** with a segmented toggle
- 🧠 **Model Picker** — custom dropdown with badges (Default / Free / Fast / Versatile / Reasoning) for each provider
- 💾 **Secure Storage** — API keys and preferences saved per provider via `chrome.storage.sync`
- 🌐 **RTL/LTR Auto-Fix** — Persian/Arabic text is always detected and rendered right-to-left with the bundled Vazirmatn font (CSP-safe, no network fetch)
- ⏸️ **Enable / pause switch** — header toggle in the popup instantly shows or removes all in-page buttons
- ↩️ **Multi-level Revert + Copy** — up to 10-step undo history per input, plus a one-click Copy button
- 🎯 **Selection-aware** — uses `selectionStart/End` for textareas and containment-checked ranges for rich editors, so only the selected text inside the input is enhanced
- ⌨️ **Keyboard Shortcut** — `Ctrl+Shift+E` (or `Cmd+Shift+E` on macOS) enhances the focused input, with fallback to the first visible input
- 💬 **Inline Feedback** — gradient button with a spinner while processing, plus glass-style success/error toasts
- 🛡️ **Robust editors support** — works with React textareas and ProseMirror / Lexical / Draft-style rich editors; 60s request timeout with friendly errors (invalid key, credits, rate limit, unknown model, network)
- 🧹 **Clean output** — strips code fences, wrapping quotes, and "Here's your prompt" preambles
- 🎨 **Modern UI** — dark-first popup with gradient accents and full light-mode support

## Screenshots

**Popup — provider, model, and API key settings:**

<p align="center">
  <img width="333" alt="Popup settings screen" src="https://github.com/user-attachments/assets/5a915145-79cc-41d5-b76a-33a05e74ea66" />
</p>

**Enhance Prompt button next to the input:**

<p align="center">
  <img width="904" alt="Enhance button next to a textarea" src="https://github.com/user-attachments/assets/007cf8cf-d869-4449-9d63-4a632afacabb" />
</p>

## Supported Models

### Groq (default provider)

| Model | Model ID |
| --- | --- |
| **Qwen 3.8 27B** *(default)* | `qwen/qwen3.8-27b` |
| Llama 3.3 70B (Versatile) | `llama-3.3-70b-versatile` |
| Llama 3.1 8B (Fast) | `llama-3.1-8b-instant` |
| Llama 4 Maverick 17B | `meta-llama/llama-4-maverick-17b-128e-instruct` |
| Llama 4 Scout 17B | `meta-llama/llama-4-scout-17b-16e-instruct` |
| Kimi K2 (Reasoning) | `moonshotai/kimi-k2-instruct` |
| GPT OSS 120B | `openai/gpt-oss-120b` |
| GPT OSS 20B (Fast) | `openai/gpt-oss-20b` |
| Qwen 3 32B | `qwen/qwen3-32b` |
| Qwen 3.6 27B | `qwen/qwen3.6-27b` |

### OpenRouter

| Model | Model ID |
| --- | --- |
| **OpenRouter Free Router** *(default)* | `openrouter/free` |
| Dots3 Note Preview | `dots-studio/dots-3-note-preview:free` |
| Liquid LFM 2.5 2.6B | `liquid/lfm-2.5-2.6b:free` |
| NVIDIA Nemotron 3.5 Lightning | `nvidia/nemotron-3.5-lightning:free` |
| Thinking Machines Inkling | `thinkingmachines/inkling:free` |
| Poolside Laguna S 2.1 | `poolside/laguna-s-2.1:free` |
| Cohere North Mini Code | `cohere/north-mini-code:free` |
| GLM 5.2 | `z-ai/glm-5.2:free` |
| MiniMax M3 | `minimax/minimax-m3:free` |

> 💡 Saved models that are later removed by a provider automatically fall back to the default — no stale-model errors.

## Supported Sites

ChatGPT (`chatgpt.com`, `chat.openai.com`), Claude, Gemini, AI Studio, NotebookLM, DeepSeek, Qwen, Groq Console, Perplexity, Copilot, Mistral, Hugging Face Chat, Grok (`grok.com`, `x.com/i/grok`), Cohere, Z.ai, Poe, Character.ai, Duck.ai, DuckDuckGo AI Chat, You.com, Phind, Pi, Meta AI, OpenRouter Chat.

## Installation

1. **Download the repository** — download it as a ZIP file and extract it to your local machine (or clone it with `git clone`).
2. **Open the Extensions page** — navigate to `chrome://extensions/` in Chrome.
3. **Enable Developer mode** — toggle the *"Developer mode"* switch in the top-right corner.
4. **Load unpacked** — click the *"Load unpacked"* button in the top-left corner.
5. **Select the extension directory** — browse to the extracted folder and select it.
6. **Done** — *Prompt Enhancer & RTL Fix* now appears on the Extensions page. Pin it to the toolbar for quick access.

## Usage

### 1. Configure the provider

- Click the **Prompt Enhancer** icon in the Chrome toolbar to open the popup.
- Pick a provider (**OpenRouter** or **Groq**) using the segmented toggle.
- Enter the matching API key and choose a model from the dropdown.
- Pick an **Enhance style** (Concise by default; also Standard / Detailed / Coding / Writing / Reasoning).
- Optionally add **Custom instructions**, e.g. "Always ask for a table. Prefer British English."
- Pause/resume the extension with the header switch as needed.
- Click **Save Settings** — the key, model, style, and instructions are stored (keys/models per provider).

<p align="center">
  <img width="333" alt="Configuring the popup" src="https://github.com/user-attachments/assets/5a915145-79cc-41d5-b76a-33a05e74ea66" />
</p>

### 2. Enhance a prompt

1. Navigate to a supported site (ChatGPT, Claude, Gemini, DeepSeek, Perplexity, Copilot, Grok, and many more) and an **Enhance** button appears near the input:

   <p align="center">
     <img width="904" alt="Enhance button next to a textarea" src="https://github.com/user-attachments/assets/007cf8cf-d869-4449-9d63-4a632afacabb" />
   </p>

2. Write your rough prompt — or just select part of the text inside the input to improve only that part.
3. Click **Enhance** (or press `Ctrl+Shift+E` while the input is focused). The button shows a spinner while processing (60s timeout):

   <p align="center">
     <img width="908" alt="Enhancing state" src="https://github.com/user-attachments/assets/38fa6893-ce8d-4c6d-b401-4759b7ae4564" />
   </p>

4. The input is replaced with the enhanced prompt, and a success toast appears. Use **⧉ Copy** to copy the result or **↩ Revert** to step back through previous versions (up to 10 steps):

   <p align="center">
     <img width="603" alt="Enhanced result" src="https://github.com/user-attachments/assets/ad6d1bc2-3026-442f-a309-a1dea2a1ea0b" />
   </p>

## Enhance Styles

| Style | Best for |
| --- | --- |
| **Standard** | Balanced, general-purpose enhancement |
| **Concise** *(default)* | 10–15 sentences in 2–3 short paragraphs — clarifies and expands without full framework sections |
| **Detailed** | Acceptance criteria, edge cases, definition of done |
| **Coding** | Language/version, constraints, I/O examples, error handling, tests |
| **Writing** | Audience, tone, voice, length, structure, revision checklist |
| **Reasoning** | Step-by-step reasoning before the final answer |

## Keyboard Shortcut

| Action | Windows / Linux | macOS |
| --- | --- | --- |
| Enhance current prompt | `Ctrl+Shift+E` | `Cmd+Shift+E` |

## Important Notes

- **Provider API key required** — create an OpenRouter key at [openrouter.ai/keys](https://openrouter.ai/keys) or a Groq key at [console.groq.com/keys](https://console.groq.com/keys).
- **API usage** — model availability, free-tier limits, and pricing can change; check the provider's model page before use.
- **Error handling** — missing/invalid keys, exhausted credits, rate limits, unknown models, timeouts, and network errors are reported via an inline toast with guidance.
- **Selection-aware** — if text is selected inside the input, only the selection is enhanced; otherwise the whole input is used. Input is capped at ~12,000 chars per request.
- **RTL fix** — only leaf text nodes containing Persian/Arabic are touched (nav/buttons/inputs skipped); uses the locally bundled Vazirmatn font so it works under strict site CSPs.

## Contributing

Contributions are welcome! Feel free to fork this repository, make your changes, and submit a pull request.

## License

Released under the [MIT License](LICENSE).
