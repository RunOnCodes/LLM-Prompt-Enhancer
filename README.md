# ✨ Prompt Enhancer & RTL Fix

[![License: MIT](https://img.shields.io/badge/License-MIT-22c55e)](LICENSE)
[![Chrome](https://img.shields.io/badge/Chrome-Manifest%20V3-6366f1)](https://developer.chrome.com/docs/extensions/develop/concepts/manifest-v3)
[![Providers](https://img.shields.io/badge/Providers-OpenRouter%20%7C%20Groq-34d399)](#supported-models)

A **Chrome extension** that turns rough ideas into well-structured, effective prompts for LLMs — with a bonus automatic **RTL/LTR text-direction fix** for Persian and Arabic text on AI chat platforms.

## Overview

**Prompt Enhancer** adds an *"Enhance Prompt"* button next to text inputs on your favorite AI chat platforms. When clicked, the selected provider (OpenRouter or Groq) refines the text into a strong, self-contained prompt and inserts it back into the input — ready to send. It also detects Persian/Arabic text on the page and fixes its direction and alignment automatically.

## Features

- ✨ **Prompt Enhancement** — restructures rough input into clear, actionable prompts while preserving intent, language, and tone
- 🔀 **Provider Choice** — switch between **OpenRouter** and **Groq** with a segmented toggle
- 🧠 **Model Picker** — custom dropdown with badges (Default / Free / Fast / Versatile / Reasoning) for each provider
- 💾 **Secure Storage** — API keys and preferences saved per provider via `chrome.storage.sync`
- 🌐 **RTL/LTR Auto-Fix** — Persian/Arabic text is detected and rendered right-to-left with the Vazirmatn font
- ⌨️ **Keyboard Shortcut** — `Ctrl+Shift+E` (or `Cmd+Shift+E` on macOS) enhances the focused input
- 💬 **Inline Feedback** — gradient button with a spinner while processing, plus glass-style success/error toasts
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
- Click **Save Settings** — the key and model are stored per provider.

<p align="center">
  <img width="333" alt="Configuring the popup" src="https://github.com/user-attachments/assets/5a915145-79cc-41d5-b76a-33a05e74ea66" />
</p>

### 2. Enhance a prompt

1. Navigate to a supported site (ChatGPT, Claude, Gemini, DeepSeek, Perplexity, Copilot, Grok, and many more) and an **Enhance Prompt** button appears near the input:

   <p align="center">
     <img width="904" alt="Enhance button next to a textarea" src="https://github.com/user-attachments/assets/007cf8cf-d869-4449-9d63-4a632afacabb" />
   </p>

2. Write your rough prompt — or just select part of the text you want improved.
3. Click **Enhance Prompt** (or press `Ctrl+Shift+E` while the input is focused). The button shows a spinner while processing:

   <p align="center">
     <img width="908" alt="Enhancing state" src="https://github.com/user-attachments/assets/38fa6893-ce8d-4c6d-b401-4759b7ae4564" />
   </p>

4. The input is replaced with the enhanced prompt, and a success toast appears. You can also **Revert** to the original text at any time:

   <p align="center">
     <img width="603" alt="Enhanced result" src="https://github.com/user-attachments/assets/ad6d1bc2-3026-442f-a309-a1dea2a1ea0b" />
   </p>

## Keyboard Shortcut

| Action | Windows / Linux | macOS |
| --- | --- | --- |
| Enhance current prompt | `Ctrl+Shift+E` | `Cmd+Shift+E` |

## Important Notes

- **Provider API key required** — create an OpenRouter key at [openrouter.ai/keys](https://openrouter.ai/keys) or a Groq key at [console.groq.com/keys](https://console.groq.com/keys).
- **API usage** — model availability, free-tier limits, and pricing can change; check the provider's model page before use.
- **Error handling** — missing keys, invalid keys, rate limits, and unavailable models are reported via an inline toast with guidance.
- **Selection-aware** — if text is selected inside the input, only the selection is enhanced.

## Contributing

Contributions are welcome! Feel free to fork this repository, make your changes, and submit a pull request.

## License

Released under the [MIT License](LICENSE).

