import { AIService, DEFAULT_SYSTEM_PROMPT } from './components/ai-service.js';
import { UIRenderer } from './components/ui-renderer.js';

const ui = new UIRenderer();

const PROVIDER_MODELS = {
    'gemini': [
        { id: 'gemini-2.0-flash', name: 'Gemini 2.0 Flash (Latest)' },
        { id: 'gemini-2.0-flash-lite-preview-02-05', name: 'Gemini 2.0 Flash-Lite (Fastest)' },
        { id: 'gemini-1.5-pro', name: 'Gemini 1.5 Pro (Powerful)' },
        { id: 'gemini-1.5-flash', name: 'Gemini 1.5 Flash (Reliable)' }
    ],
    'openai': [
        { id: 'gpt-4o', name: 'GPT-4o (Best)' },
        { id: 'gpt-4o-mini', name: 'GPT-4o Mini (Fast)' },
        { id: 'o1-mini', name: 'o1-mini (Reasoning)' },
        { id: 'o3-mini', name: 'o3-mini (High Reasoning)' }
    ],
    'deepseek': [
        { id: 'deepseek-chat', name: 'DeepSeek V3 (Chat)' },
        { id: 'deepseek-reasoner', name: 'DeepSeek R1 (Reasoning)' }
    ],
    'groq': [
        { id: 'llama-3.3-70b-versatile', name: 'Llama 3.3 70B (Versatile)' },
        { id: 'llama-3.1-8b-instant', name: 'Llama 3.1 8B (Instant)' },
        { id: 'mixtral-8x7b-32768', name: 'Mixtral 8x7B' },
        { id: 'gemma2-9b-it', name: 'Gemma 2 9B' },
        { id: 'deepseek-r1-distill-llama-70b', name: 'DeepSeek R1 Distill 70B' }
    ]
};

// State
let state = {
    tweets: [],
    insights: [],
    analysisHistory: [], // Stores past batches
    settings: {
        provider: 'gemini',
        model: 'gemini-2.0-flash', // Default model updated
        apiKey: '',
        language: 'Portuguese (Brazil)', // Default to PT-BR as requested implied by user language
        outputStyles: ['polemic', 'educational'], // Default standard styles
        customStyleText: '',
        customPrompt: '' // Will use default if empty
    }
};

// Initialization
document.addEventListener('DOMContentLoaded', async () => {
    await loadState();
    setupEventListeners();

    // Check if we have language saved, if not default
    if (!state.settings.language) state.settings.language = 'Portuguese (Brazil)';

    // Migration: Move old single report to history
    if (state.globalReport && (!state.analysisHistory || state.analysisHistory.length === 0)) {
        if (!state.analysisHistory) state.analysisHistory = [];
        state.analysisHistory.push({
            id: Date.now(),
            timestamp: new Date().toISOString(),
            tweetCount: state.tweets.length, // approximation
            data: state.globalReport
        });
        state.globalReport = null; // Clear deprecated
        await saveState();
    }

    if (state.tweets.length > 0) {
        ui.renderTweets(state.tweets, handleDelete);
    }

    updateInsightsView();

    // Default Tab
    switchTab('bookmarks');
});

function setupEventListeners() {
    // Navigation
    document.getElementById('settings-btn').addEventListener('click', toggleSettings);
    document.getElementById('back-to-dash-btn').addEventListener('click', toggleSettings);
    document.getElementById('back-to-history-btn').addEventListener('click', showHistoryView);

    // Tabs
    document.getElementById('tab-bookmarks').addEventListener('click', () => switchTab('bookmarks'));
    document.getElementById('tab-insights').addEventListener('click', () => switchTab('insights'));

    // Clear Insights
    document.getElementById('clear-insights-btn').addEventListener('click', handleClearInsights);

    // Actions
    document.getElementById('sync-btn').addEventListener('click', handleSync);
    document.getElementById('analyze-btn').addEventListener('click', handleAnalysisBatch);
    document.getElementById('save-settings-btn').addEventListener('click', saveSettings);
    document.getElementById('clear-data-btn').addEventListener('click', handleClearData);
    document.getElementById('reset-prompt-btn').addEventListener('click', handleResetPrompt);

    // Inputs
    const providerSelect = document.getElementById('provider-select');
    const modelSelect = document.getElementById('model-select');
    const apiKeyInput = document.getElementById('api-key-input');
    const langSelect = document.getElementById('language-select');
    const customPromptInput = document.getElementById('custom-prompt-input');

    // Initialize Values
    providerSelect.value = state.settings.provider;

    // Populate Models based on current provider
    populateModelSelect(state.settings.provider, state.settings.model);

    apiKeyInput.value = state.settings.apiKey;
    if (langSelect) langSelect.value = state.settings.language || 'Portuguese (Brazil)';
    if (customPromptInput) customPromptInput.value = state.settings.customPrompt || DEFAULT_SYSTEM_PROMPT;

    // Initialize Styles
    const savedStyles = state.settings.outputStyles || [];
    ['polemic', 'educational', 'reflection', 'practical'].forEach(style => {
        const cb = document.getElementById(`style-${style}`);
        if (cb) cb.checked = savedStyles.includes(style);
    });

    // Custom Style Logic
    const customCheck = document.getElementById('style-custom-check');
    const customText = document.getElementById('style-custom-text');
    if (customCheck && customText) {
        customCheck.checked = savedStyles.includes('custom');
        customText.value = state.settings.customStyleText || '';
        customText.disabled = !customCheck.checked;

        customCheck.addEventListener('change', (e) => {
            customText.disabled = !e.target.checked;
            if (e.target.checked) customText.focus();
        });
    }

    // Update state on input change (temp)
    providerSelect.addEventListener('change', (e) => {
        state.settings.provider = e.target.value;
        populateModelSelect(e.target.value); // Reset model to first in list
    });

    modelSelect.addEventListener('change', (e) => {
        state.settings.model = e.target.value;
    });

    apiKeyInput.addEventListener('input', (e) => state.settings.apiKey = e.target.value);
    if (langSelect) langSelect.addEventListener('change', (e) => state.settings.language = e.target.value);
    // Note: customized prompt is saved on "Save Settings" click to avoid heavy state writes? 
    // Or we can bind it too. Let's bind it for consistency but save persists it.
    if (customPromptInput) customPromptInput.addEventListener('input', (e) => state.settings.customPrompt = e.target.value);
}

function populateModelSelect(provider, selectedModelId = null) {
    const modelSelect = document.getElementById('model-select');
    const models = PROVIDER_MODELS[provider] || [];

    modelSelect.innerHTML = '';

    if (models.length === 0) {
        const option = document.createElement('option');
        option.text = "Default Model";
        option.value = "default";
        modelSelect.appendChild(option);
        return;
    }

    let found = false;
    models.forEach(m => {
        const option = document.createElement('option');
        option.value = m.id;
        option.textContent = m.name;
        if (m.id === selectedModelId) found = true;
        modelSelect.appendChild(option);
    });

    // Select the saved model if it exists in the new list, otherwise select the first one
    if (found) {
        modelSelect.value = selectedModelId;
    } else {
        modelSelect.value = models[0].id;
        state.settings.model = models[0].id; // Update state default
    }
}

function switchTab(tabName) {
    const tabBookmarks = document.getElementById('tab-bookmarks');
    const tabInsights = document.getElementById('tab-insights');
    const viewBookmarks = document.getElementById('view-bookmarks');
    const viewInsights = document.getElementById('view-insights');

    if (tabName === 'bookmarks') {
        tabBookmarks.className = "pb-2 text-xs font-medium text-zinc-100 border-b-2 border-indigo-500 transition focus:outline-none";
        tabInsights.className = "pb-2 text-xs font-medium text-zinc-500 hover:text-zinc-300 transition focus:outline-none";
        viewBookmarks.classList.remove('hidden');
        viewInsights.classList.add('hidden');
    } else {
        tabInsights.className = "pb-2 text-xs font-medium text-zinc-100 border-b-2 border-indigo-500 transition focus:outline-none";
        tabBookmarks.className = "pb-2 text-xs font-medium text-zinc-500 hover:text-zinc-300 transition focus:outline-none";
        viewInsights.classList.remove('hidden');
        viewBookmarks.classList.add('hidden');

        // Ensure proper view state in Insights
        if (!viewInsights.classList.contains('hidden')) {
            if (document.getElementById('insights-detail-view').classList.contains('hidden')) {
                showHistoryView();
            }
        }
    }
}

async function handleClearInsights() {
    if (confirm('Clear ENTIRE analysis history? (Saved bookmarks remain safe)')) {
        state.analysisHistory = [];
        await saveState();
        updateInsightsView(); // This handles empty state visibility
        ui.showStatus('Analysis history cleared.', 'info');
    }
}

// Handlers

async function handleSync() {
    ui.showStatus('Reading visible bookmarks...', 'loading');

    // Get Active Tab
    const [tab] = await chrome.tabs.query({ active: true, currentWindow: true });
    if (!tab || (!tab.url.includes("x.com") && !tab.url.includes("twitter.com"))) {
        ui.showStatus("Please open X.com Bookmarks page first.", "error");
        return;
    }

    try {
        // Define scraper function INLINE to avoid import issues in executeScript context
        function scraper() {
            try {
                console.log("%c[XBookmarker] Starting Scrape...", "color: #00ff00; font-weight: bold; font-size: 12px;");

                // Try multiple selectors
                const selectors = [
                    'article[data-testid="tweet"]',
                    'div[data-testid="tweet"]',
                    '[data-testid="cellInnerDiv"] article'
                ];

                let articles = [];
                let usedSelector = "";

                for (const sel of selectors) {
                    const found = document.querySelectorAll(sel);
                    if (found.length > 0) {
                        articles = found;
                        usedSelector = sel;
                        console.log(`[XBookmarker] Found ${found.length} items using selector: "${sel}"`);
                        break;
                    }
                }

                // --- DEBUG LOGGING ---
                const debugInfo = {
                    foundArticles: articles.length,
                    usedSelector: usedSelector,
                    url: window.location.href
                };
                // ---------------------

                if (articles.length === 0) {
                    console.warn("[XBookmarker] No tweets found on visible page. Try scrolling?");
                    return { tweets: [], debugInfo, errors: ["No elements found"] };
                }

                const tweets = [];
                const errors = [];

                articles.forEach((article, index) => {
                    try {
                        const timeEl = article.querySelector("time");
                        const statusLink = timeEl ? timeEl.closest("a") : null;
                        const statusUrl = statusLink ? statusLink.href : null;
                        // Robust ID extraction
                        let id = null;
                        if (statusUrl) {
                            const parts = statusUrl.split("/status/");
                            id = parts[1] ? parts[1].split("/")[0] : null;
                        }
                        if (!id) {
                            // Fallback ID
                            id = "gen_" + Math.random().toString(36).substr(2, 9);
                        }

                        const textEl = article.querySelector('div[data-testid="tweetText"]');
                        const text = textEl ? textEl.innerText.trim() : "";

                        const userEl = article.querySelector('div[data-testid="User-Name"]');
                        const userText = userEl ? userEl.innerText.split('\n') : ["Unknown"];
                        const author = userText[0];
                        const handle = userText[1] || "";

                        const mediaEls = article.querySelectorAll('img[alt="Image"]');
                        const media = Array.from(mediaEls).map(img => img.src);

                        // Only save if it looks like a real tweet (has text or media)
                        if (text || media.length > 0) {
                            tweets.push({
                                id,
                                text,
                                author,
                                handle,
                                createdAt: timeEl ? timeEl.getAttribute("datetime") : new Date().toISOString(),
                                media,
                                url: statusUrl || window.location.href
                            });
                        }
                    } catch (innerErr) {
                        errors.push({ index, msg: innerErr.message });
                    }
                });

                console.log(`[XBookmarker] Successfully scraped ${tweets.length} tweets.`);

                return { tweets, debugInfo, errors };

            } catch (e) {
                console.error("[XBookmarker] Critical Scraper Error:", e);
                return { tweets: [], debugInfo: { error: e.message } };
            }
        }

        const scrapingResult = await chrome.scripting.executeScript({
            target: { tabId: tab.id },
            func: scraper
        });

        const result = scrapingResult[0].result || {};
        const scrapedTweets = result.tweets || [];

        // Log Debug Info to Side Panel Console
        log(`Scraper Run: Found ${scrapedTweets.length} valid tweets using ${result.debugInfo?.usedSelector || 'none'}.`);
        if (result.errors?.length > 0) {
            log(`Scraper Warnings:`, result.errors);
        }

        if (scrapedTweets.length === 0) {
            ui.showStatus(`Found 0 tweets. Check console (F12) for '[XBookmarker]'.`, "info");
            return;
        }

        // Merge with existing state
        const currentIds = new Set(state.tweets.map(t => t.id));
        const newTweets = scrapedTweets.filter(t => !currentIds.has(t.id));

        // Deduplicate new tweets amongst themselves
        const uniqueNewTweets = [];
        const seenNew = new Set();
        for (const t of newTweets) {
            if (!seenNew.has(t.id)) {
                uniqueNewTweets.push(t);
                seenNew.add(t.id);
            }
        }

        if (uniqueNewTweets.length === 0) {
            ui.showStatus(`Scanned ${scrapedTweets.length} visible items. All are duplicates. Scroll down!`, 'info');
            return;
        }

        state.tweets = [...state.tweets, ...uniqueNewTweets];
        await saveState();

        ui.renderTweets(state.tweets, handleDelete);
        ui.showStatus(`Captured ${uniqueNewTweets.length} new bookmarks!`, 'success');

        // Auto-scroll log
        log(`Synced ${uniqueNewTweets.length} new items.`);

    } catch (err) {
        console.error(err);
        ui.showStatus(`Scrape Failed: ${err.message}`, 'error');
    }
}

async function handleAnalysis() {
    if (!state.settings.apiKey) {
        ui.showStatus('Analysis skipped: No API Key provided.', 'info');
        // Open settings automatically
        toggleSettings();
        return;
    }

    if (state.tweets.length === 0) {
        ui.showStatus('No bookmarks to analyze yet.', 'info');
        return;
    }

    const btn = document.getElementById('analyze-btn');
    const originalText = btn.innerHTML;

    try {
        // Set Loading State
        btn.disabled = true;
        btn.innerHTML = `<svg class="animate-spin -ml-1 mr-2 h-4 w-4 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24"><circle class="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" stroke-width="4"></circle><path class="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path></svg> Analyzing...`;

        ui.showStatus('Consulting AI Advisor...', 'loading');

        const ai = new AIService(state.settings.provider, state.settings.apiKey);

        // Use Global Analysis instead of per-tweet
        const report = await ai.analyzeGlobal(
            state.tweets,
            state.settings.language,
            state.settings.customPrompt,
            state.settings.model,
            { styles: state.settings.outputStyles, customStyle: state.settings.customStyleText }
        );

        state.globalReport = report; // New state property (now JSON object)
        await saveState();

        ui.renderGlobalInsights(report);

        // Show Clear Btn & Hide Empty
        document.getElementById('clear-insights-btn').classList.remove('hidden');
        document.getElementById('insights-empty-state').classList.add('hidden');

        ui.showStatus('Strategic Analysis Complete.', 'success');

        // Auto-switch to Insights Tab
        switchTab('insights');

    } catch (err) {
        console.error(err);
        ui.showStatus(`AI Error: ${err.message}`, 'error');
    } finally {
        // Reset Button
        btn.disabled = false;
        btn.innerHTML = originalText;
    }
}

async function handleDelete(tweetId) {
    if (confirm('Remove this bookmark from your library? (This does not delete it from X.com)')) {
        try {
            // Local deletion only
            state.tweets = state.tweets.filter(t => t.id !== tweetId);
            await saveState();
            ui.renderTweets(state.tweets, handleDelete);
            // Re-render global insights if needed, or maybe clear them if the dataset changed significantly? 
            // For now, keep them.
        } catch (err) {
            console.error(err);
            ui.showStatus('Failed to remove bookmark.', 'error');
        }
    }
}

function toggleSettings() {
    const dash = document.getElementById('dashboard-view');
    const settings = document.getElementById('settings-view');

    if (dash.classList.contains('hidden')) {
        dash.classList.remove('hidden');
        settings.classList.add('hidden');
    } else {
        dash.classList.add('hidden');
        settings.classList.remove('hidden');
    }
}

async function saveSettings() {
    const provider = document.getElementById('provider-select').value;
    const model = document.getElementById('model-select').value;
    const key = document.getElementById('api-key-input').value;
    const lang = document.getElementById('language-select').value;
    const prompt = document.getElementById('custom-prompt-input').value;

    // Collect Styles
    const selectedStyles = [];
    ['polemic', 'educational', 'reflection', 'practical'].forEach(style => {
        const cb = document.getElementById(`style-${style}`);
        if (cb && cb.checked) selectedStyles.push(style);
    });

    const customCheck = document.getElementById('style-custom-check');
    const customText = document.getElementById('style-custom-text');
    let customStyleVal = '';

    if (customCheck && customCheck.checked) {
        selectedStyles.push('custom');
        customStyleVal = customText.value.trim();
    }

    if (selectedStyles.length === 0) {
        ui.showStatus('Please select at least one Output Style.', 'error');
        return;
    }

    if (!key) {
        ui.showStatus('Please enter an API Key', 'error');
        return;
    }

    state.settings.provider = provider;
    state.settings.model = model;
    state.settings.apiKey = key;
    state.settings.language = lang;
    state.settings.outputStyles = selectedStyles;
    state.settings.customStyleText = customStyleVal;
    state.settings.customPrompt = prompt;
    await saveState();

    ui.showStatus('Settings saved.', 'success');
    toggleSettings();
}

function handleResetPrompt() {
    const input = document.getElementById('custom-prompt-input');
    if (input) {
        input.value = DEFAULT_SYSTEM_PROMPT;
        state.settings.customPrompt = DEFAULT_SYSTEM_PROMPT;
        ui.showStatus('Prompt reset to default.', 'info');
    }
}

async function handleClearData() {
    if (confirm('Are you sure you want to clear ALL saved bookmarks and reset the extension?')) {
        state.tweets = [];
        state.insights = [];
        await chrome.storage.local.remove(['app_state']);
        await saveState(); // Save empty state to structure it properly

        ui.renderTweets([], handleDelete);
        if (ui.renderInsights) ui.renderInsights([]);

        ui.showStatus('All data cleared.', 'info');
        toggleSettings();
    }
}

// Storage Headers
async function loadState() {
    const data = await chrome.storage.local.get(['app_state']);
    if (data.app_state) {
        state = { ...state, ...data.app_state };
    }
}

async function saveState() {
    await chrome.storage.local.set({ app_state: state });
}

// Debug Logger
function log(msg, data = null) {
    if (typeof msg !== 'string') {
        try {
            msg = JSON.stringify(msg);
        } catch (e) {
            msg = String(msg);
        }
    }

    const logDiv = document.getElementById('debug-log');
    if (logDiv) {
        const line = document.createElement('div');
        line.className = "border-b border-gray-800 py-1 break-all";
        line.textContent = `[${new Date().toLocaleTimeString()}] ${msg}`;
        if (data) {
            const pre = document.createElement('pre');
            pre.className = "whitespace-pre-wrap text-[10px] text-gray-500";
            try {
                pre.textContent = JSON.stringify(data, null, 2);
            } catch (e) {
                pre.textContent = String(data);
            }
            line.appendChild(pre);
        }
        logDiv.appendChild(line);
        // Scroll to bottom
        const section = document.getElementById('debug-section');
        if (section) section.scrollTop = section.scrollHeight;
    }
}

// Hook up Debug Toggle
const debugBtn = document.getElementById('toggle-debug-btn');
if (debugBtn) {
    debugBtn.addEventListener('click', () => {
        const debugSection = document.getElementById('debug-section');
        if (debugSection) debugSection.classList.toggle('hidden');
    });
}

// Override console.log/warn/error to capture logs safely
const originalLog = console.log;
const originalWarn = console.warn;
const originalError = console.error;

console.log = (...args) => {
    originalLog.apply(console, args);
    // Avoid re-logging if msg starts with [XBookmarker] to treat it specially? No, log everything.
    // Basic string conversion for log panel
    try {
        const msg = args[0];
        const data = args.length > 1 ? args[1] : null;
        log("LOG: " + String(msg), data);
    } catch (e) {
        // immense safety
    }
};

console.warn = (...args) => {
    originalWarn.apply(console, args);
    try {
        const msg = args[0];
        const data = args.length > 1 ? args[1] : null;
        log("WARN: " + String(msg), data);
    } catch (e) { }
};

console.error = (...args) => {
    originalError.apply(console, args);
    try {
        const msg = args[0];
        const data = args.length > 1 ? args[1] : null;
        log("ERROR: " + String(msg), data);
    } catch (e) { }
};

// --- View Helpers ---

function updateInsightsView() {
    // Renders the History List by default
    if (state.analysisHistory.length > 0) {
        ui.renderAnalysisHistory(state.analysisHistory, showDetailView);
        document.getElementById('clear-insights-btn').classList.remove('hidden');
        document.getElementById('insights-empty-state').classList.add('hidden');
    } else {
        document.getElementById('insights-history-list').innerHTML = '';
        document.getElementById('clear-insights-btn').classList.add('hidden');
        document.getElementById('insights-empty-state').classList.remove('hidden');
    }
    // Default to history list if detailed view is hidden
    if (document.getElementById('insights-detail-view').classList.contains('hidden')) {
        showHistoryView();
    }
}

function showHistoryView() {
    document.getElementById('insights-history-list').classList.remove('hidden');
    document.getElementById('insights-detail-view').classList.add('hidden');
    document.getElementById('back-to-history-btn').classList.add('hidden');
    if (state.analysisHistory.length > 0) {
        document.getElementById('clear-insights-btn').classList.remove('hidden');
    }
}

function showDetailView(report) {
    ui.renderGlobalInsights(report.data);
    document.getElementById('insights-history-list').classList.add('hidden');
    document.getElementById('insights-detail-view').classList.remove('hidden');
    document.getElementById('back-to-history-btn').classList.remove('hidden');
    document.getElementById('clear-insights-btn').classList.add('hidden');
}

async function handleAnalysisBatch() {
    if (!state.settings.apiKey) {
        ui.showStatus('Analysis skipped: No API Key provided.', 'info');
        toggleSettings();
        return;
    }

    // 1. FILTER: Find unanalyzed tweets
    const unanalyzedTweets = state.tweets.filter(t => !t.analyzed);

    if (unanalyzedTweets.length === 0) {
        ui.showStatus('All saved bookmarks have already been analyzed!', 'info');
        return;
    }

    const btn = document.getElementById('analyze-btn');
    const originalText = btn.innerHTML;

    try {
        // Set Loading State
        btn.disabled = true;
        btn.innerHTML = `<svg class="animate-spin -ml-1 mr-2 h-4 w-4 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24"><circle class="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" stroke-width="4"></circle><path class="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path></svg> Analyzing Batch (${unanalyzedTweets.length})...`;

        ui.showStatus(`Analyzing batch of ${unanalyzedTweets.length} new bookmarks...`, 'loading');

        const ai = new AIService(state.settings.provider, state.settings.apiKey);

        // 2. ANALYZE: Send only new batch
        const reportData = await ai.analyzeGlobal(
            unanalyzedTweets,
            state.settings.language,
            state.settings.customPrompt,
            state.settings.model,
            { styles: state.settings.outputStyles, customStyle: state.settings.customStyleText }
        );

        // 3. RECORD: Create History Item
        const newRecord = {
            id: Date.now(),
            timestamp: new Date().toISOString(),
            tweetCount: unanalyzedTweets.length,
            data: reportData,
            tweetIds: unanalyzedTweets.map(t => t.id)
        };

        // 4. UPDATE STATE: Add to History & Mark Analyzed
        state.analysisHistory.unshift(newRecord);

        const analyzedIds = new Set(unanalyzedTweets.map(t => t.id));
        state.tweets = state.tweets.map(t => {
            if (analyzedIds.has(t.id)) return { ...t, analyzed: true };
            return t;
        });

        await saveState();

        // 5. UPDATE UI
        updateInsightsView();
        showDetailView(newRecord);

        ui.showStatus('Strategic Analysis Complete.', 'success');

        // Auto-switch to Insights Tab
        switchTab('insights');

    } catch (err) {
        console.error(err);
        ui.showStatus(`AI Error: ${err.message}`, 'error');
    } finally {
        // Reset Button
        btn.disabled = false;
        btn.innerHTML = originalText;
    }
}
