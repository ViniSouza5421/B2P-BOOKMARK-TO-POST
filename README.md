# B2P (Bookmark To Post) 🚀

**Turn your endless X (Twitter) bookmarks into a goldmine of content ideas.**

B2P is a powerful Chrome Extension that analyzes your saved bookmarks using advanced AI (Google Gemini, OpenAI, DeepSeek, or Groq) to identify patterns, generate unique content angles, and draft high-engagement posts tailored to your style.

---

## ✨ Key Features

*   **🔍 Smart Auto-Sync**: Automatically detects and scrapes visible bookmarks from your X.com bookmarks page.
*   **🤖 Multi-LLM Support**: Choose your preferred AI brain:
    *   **Google Gemini** (Free tier available, multimodal power)
    *   **OpenAI** (GPT-4o, GPT-4o-mini, o1-mini)
    *   **DeepSeek** (V3 & R1 for deep reasoning)
    *   **Groq** (Llama 3, Mixtral for lightning-fast speeds)
*   **🎨 Style Customization**: Define exactly how you want your output:
    *   *Polemic & Short*
    *   *Educational Lists*
    *   *Personal Stories*
    *   *Practical How-Tos*
    *   *Custom Persona* (e.g., "Sarcastic Tech Bro")
*   **🌍 Multilingual**: Generate content in English, Portuguese, Spanish, French, German, Italian, or Japanese.
*   **🔒 Privacy First**: Your API keys are stored locally in your browser. No data is sent to intermediate servers.

---

## 🛠️ Installation Guide

### Prerequisites
*   Google Chrome (or any Chromium-based browser like Brave, Edge).
*   An API Key from your chosen provider (Gemini, OpenAI, etc.).

### Steps
1.  **Download/Clone the Repository**:
    ```bash
    git clone https://github.com/ViniSouza5421/B2P-BOOKMARK-TO-POST.git
    cd B2P
    ```
2.  **Install Dependencies & Build**:
    ```bash
    npm install
    npm run build
    ```
3.  **Load into Chrome**:
    *   Open `chrome://extensions/`
    *   Enable **Developer mode** (top right toggle).
    *   Click **"Load unpacked"**.
    *   Select the `dist` folder generated in the previous step.

---

## 🚀 How to Use

1.  **Open X.com Bookmarks**: Navigate to your [Bookmarks Page](https://x.com/i/bookmarks).
2.  **Open B2P**: Click the extension icon (and pin it for easy access) or open the Side Panel.
3.  **Sync**: Click the **"Sync"** button. Scroll down your bookmarks page to load more items and click sync again to capture them.
4.  **Configure AI**:
    *   Go to **Settings** (gear icon).
    *   Select your **Provider** and **Model**.
    *   Paste your **API Key**.
    *   Choose your **Output Styles**.
5.  **Analyze**: Click **"Analyze"** on the dashboard.
6.  **Create**: View the generated patterns, hooks, and content ideas in the **Insights** tab.

---

## ⚠️ Disclaimer & Responsibility

*   **API Usage**: This tool requires your own API keys. You are responsible for any usage costs incurred from the respective AI providers.
*   **Platform Compliance**: This extension scrapes data from your locally visible browser page. Use it responsibly and in accordance with X's Terms of Service. Avoid aggressive scraping or automation that could flag your account.
*   **Data Privacy**: All analysis happens client-side (extention to AI API). The developers of B2P do not have access to your keys, bookmarks, or generated data.

---

**Happy Posting!** ✍️
