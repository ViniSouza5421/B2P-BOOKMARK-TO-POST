export class UIRenderer {
    constructor() {
        this.listContainer = document.getElementById('bookmarks-list');
        this.statusContainer = document.getElementById('status-container');
    }

    clearList() {
        this.listContainer.innerHTML = '';
    }

    showStatus(message, type = 'info') {
        this.statusContainer.textContent = message;

        let styles = 'bg-zinc-900 border-zinc-800 text-zinc-400'; // default
        if (type === 'error') styles = 'bg-red-950/30 border-red-900/50 text-red-400';
        if (type === 'success') styles = 'bg-emerald-950/30 border-emerald-900/50 text-emerald-400';
        if (type === 'loading') styles = 'bg-zinc-900 border-zinc-800 text-zinc-400 animate-pulse';

        this.statusContainer.className = `rounded-md px-3 py-2 text-xs font-medium border ${styles} mb-4 flex items-center gap-2`;
        this.statusContainer.classList.remove('hidden');

        if (type !== 'loading') {
            setTimeout(() => {
                this.statusContainer.classList.add('hidden');
            }, 4000);
        }
    }

    renderTweets(tweets, onDelete) {
        if (!tweets || tweets.length === 0) {
            this.listContainer.innerHTML = `
                <div class="flex flex-col items-center justify-center py-12 text-zinc-600 space-y-2">
                    <svg class="w-8 h-8 opacity-20" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="1.5" d="M5 5a2 2 0 012-2h10a2 2 0 012 2v16l-7-3.5L5 21V5z"></path></svg>
                    <span class="text-xs">No bookmarks visible</span>
                </div>`;
            return;
        }

        this.listContainer.innerHTML = '';

        tweets.forEach(tweet => {
            const card = document.createElement('div');
            // Minimalist Card
            card.className = 'group relative pl-4 pr-3 py-3 hover:bg-zinc-900/50 rounded-md transition-colors border-l-2 border-transparent hover:border-zinc-700';

            const mediaHtml = tweet.media.length > 0
                ? `<div class="mt-2 grid grid-cols-${Math.min(tweet.media.length, 2)} gap-1.5 rounded-md overflow-hidden border border-zinc-800/50">
                    ${tweet.media.map(url => `<img src="${url}" class="object-cover w-full h-24 bg-zinc-900 transition hover:opacity-90" loading="lazy">`).join('')}
                   </div>`
                : '';

            card.innerHTML = `
                <div class="flex justify-between items-start mb-1">
                    <div class="flex items-center gap-2 min-w-0">
                        <span class="text-xs font-semibold text-zinc-200 truncate cursor-pointer hover:text-white transition">${tweet.author}</span>
                        <span class="text-[10px] text-zinc-500 truncate">@${tweet.handle}</span>
                    </div>
                </div>
                
                <p class="text-xs text-zinc-400 leading-relaxed whitespace-pre-wrap line-clamp-4 group-hover:text-zinc-300 transition-colors">${this.linkify(tweet.text)}</p>
                ${mediaHtml}

                <button class="delete-btn absolute top-2 right-2 opacity-0 group-hover:opacity-100 p-1 text-zinc-600 hover:text-red-400 hover:bg-zinc-800 rounded transition" title="Delete">
                    <svg class="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="1.5" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16"></path></svg>
                </button>
            `;

            card.querySelector('.delete-btn').addEventListener('click', (e) => {
                e.stopPropagation();
                onDelete(tweet.id);
            });
            this.listContainer.appendChild(card);
        });
    }

    renderAnalysisHistory(history, onSelect) {
        const listContainer = document.getElementById('insights-history-list');
        listContainer.innerHTML = '';

        if (!history || history.length === 0) return;

        history.forEach((report, index) => {
            const card = document.createElement('div');
            // Clean Row Item
            card.className = "flex items-center justify-between p-3 rounded-md border border-zinc-800/50 bg-zinc-900/30 hover:bg-zinc-900 hover:border-zinc-700 cursor-pointer transition group";

            const date = new Date(report.timestamp).toLocaleDateString(undefined, { month: 'short', day: 'numeric' });
            const firstPattern = report.data?.patterns?.[0] || "Analysis Report";
            const count = report.tweetCount || 0;

            card.innerHTML = `
                <div class="flex flex-col min-w-0 pr-4">
                    <div class="flex items-center gap-2 mb-0.5">
                        <span class="text-[10px] font-medium text-indigo-400 bg-indigo-500/10 px-1.5 py-0.5 rounded-sm">BATCH #${history.length - index}</span>
                        <span class="text-[10px] text-zinc-600">${date}</span>
                    </div>
                    <span class="text-xs text-zinc-300 font-medium truncate group-hover:text-white transition">${firstPattern}</span>
                </div>
                <div class="flex items-center gap-3 text-[10px] text-zinc-500 shrink-0">
                    <span class="flex items-center gap-1"><svg class="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="1.5" d="M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 11V9a2 2 0 012-2m0 0V5a2 2 0 012-2h6a2 2 0 012 2v2M7 7h10"></path></svg> ${count}</span>
                    <svg class="w-3.5 h-3.5 text-zinc-700 group-hover:text-zinc-400 transition" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="1.5" d="M9 5l7 7-7 7"></path></svg>
                </div>
            `;

            card.addEventListener('click', () => onSelect(report));
            listContainer.appendChild(card);
        });
    }

    renderGlobalInsights(data) {
        const content = document.getElementById('global-insights-content');

        if (!data || (!data.patterns && !data.ideas)) {
            content.innerHTML = '<p class="text-red-400 text-xs text-center py-4">Structure invalid.</p>';
            return;
        }

        content.innerHTML = '';

        // 1. Patterns Section
        if (data.patterns && data.patterns.length > 0) {
            const patternHTML = `
                <div class="mb-6">
                    <h4 class="text-[10px] font-semibold text-zinc-500 uppercase tracking-widest mb-3 flex items-center gap-2">
                        <svg class="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="1.5" d="M13 10V3L4 14h7v7l9-11h-7z"></path></svg>
                        Patterns Detected
                    </h4>
                    <ul class="space-y-2 pl-1">
                        ${data.patterns.map(p => `
                            <li class="text-xs text-zinc-300 flex items-start leading-relaxed">
                                <span class="w-1 h-1 rounded-full bg-indigo-500 mt-1.5 mr-3 shrink-0"></span> ${p}
                            </li>
                        `).join('')}
                    </ul>
                </div>
            `;
            content.insertAdjacentHTML('beforeend', patternHTML);
        }

        // 2. Ideas Grid
        if (data.ideas && data.ideas.length > 0) {
            const ideasContainer = document.createElement('div');
            ideasContainer.className = "space-y-3";

            ideasContainer.innerHTML = `<h4 class="text-[10px] font-semibold text-zinc-500 uppercase tracking-widest mb-3 flex items-center gap-2 mt-6 border-t border-zinc-800/50 pt-4">
                <svg class="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="1.5" d="M9.663 17h4.673M12 3v1m6.364 1.636l-.707.707M21 12h-1M4 12H3m3.343-5.657l-.707-.707m2.828 9.9a5 5 0 117.072 0l-.548.547A3.374 0 0014 18.469V19a2 2 0 11-4 0v-.531c0-.895-.356-1.754-.988-2.386l-.548-.547z"></path></svg>
                Actionable Ideas
            </h4>`;

            data.ideas.forEach((idea, idx) => {
                const card = document.createElement('div');
                card.className = "bg-zinc-900/40 rounded border border-zinc-800 p-3 hover:border-zinc-700 transition group";
                card.innerHTML = `
                    <div class="flex justify-between items-start mb-1.5">
                        <h5 class="text-xs font-semibold text-zinc-200 capitalize">${idea.title}</h5>
                        <!-- <span class="text-[9px] text-zinc-600 font-mono">0${idx + 1}</span> -->
                    </div>
                    <p class="text-[11px] text-zinc-400 mb-2 leading-relaxed opacity-90">${idea.concept}</p>
                    
                    <div class="relative pl-3 border-l-2 border-indigo-500/30 group-hover:border-indigo-500 transition-colors">
                        <p class="text-[11px] text-indigo-200 font-medium italic break-words pr-8">"${idea.hook}"</p>
                        <button class="copy-hook-btn absolute top-0 right-0 opacity-0 group-hover:opacity-100 text-zinc-500 hover:text-white transition" data-hook="${idea.hook.replace(/"/g, '&quot;')}">
                            <svg class="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="1.5" d="M8 16H6a2 2 0 01-2-2V6a2 2 0 012-2h8a2 2 0 012 2v2m-6 12h8a2 2 0 002-2v-8a2 2 0 00-2-2h-8a2 2 0 00-2 2v8a2 2 0 002 2z"></path></svg>
                        </button>
                    </div>
                `;

                // Copy Functionality
                const copyBtn = card.querySelector('.copy-hook-btn');
                if (copyBtn) {
                    copyBtn.addEventListener('click', (e) => {
                        e.stopPropagation();
                        navigator.clipboard.writeText(idea.hook);
                        const icon = copyBtn.innerHTML;
                        copyBtn.innerHTML = '<svg class="w-3.5 h-3.5 text-green-500" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M5 13l4 4L19 7"></path></svg>';
                        setTimeout(() => {
                            copyBtn.innerHTML = icon;
                        }, 1500);
                    });
                }

                ideasContainer.appendChild(card);
            });

            content.appendChild(ideasContainer);
        }
    }

    linkify(text) {
        return text.replace(/(https?:\/\/[^\s]+)/g, '<a href="$1" target="_blank" class="text-indigo-400 hover:underline decoration-indigo-400/50 underline-offset-2">$1</a>');
    }
}
