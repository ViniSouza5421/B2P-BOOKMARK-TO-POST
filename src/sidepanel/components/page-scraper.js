// Scraper utility to extract visible tweets from X.com
export const scrapeVisibleTweets = () => {
    try {
        const query = 'article[data-testid="tweet"]';
        const articles = document.querySelectorAll(query);
        const tweets = [];

        articles.forEach(article => {
            // Find unique ID (status URL)
            const timeEl = article.querySelector("time");
            const statusLink = timeEl ? timeEl.closest("a") : null;
            const statusUrl = statusLink ? statusLink.href : null;
            const id = statusUrl ? statusUrl.split("/status/")[1] : Math.random().toString(36).substr(2, 9); // Fallback

            // Find Text
            const textEl = article.querySelector('div[data-testid="tweetText"]');
            const text = textEl ? textEl.innerText.trim() : "";

            // Find User
            const userEl = article.querySelector('div[data-testid="User-Name"]');
            const userText = userEl ? userEl.innerText.split('\n') : ["Unknown"];
            const author = userText[0];
            const handle = userText[1] || "";

            // Find Media
            const mediaEls = article.querySelectorAll('img[alt="Image"]');
            const media = Array.from(mediaEls).map(img => img.src);

            if (text || media.length > 0) {
                tweets.push({
                    id,
                    text,
                    author,
                    handle,
                    createdAt: timeEl ? timeEl.getAttribute("datetime") : new Date().toISOString(),
                    media,
                    url: statusUrl
                });
            }
        });

        // Dedup by ID
        const unique = [];
        const seen = new Set();
        for (const t of tweets) {
            if (!seen.has(t.id)) {
                unique.push(t);
                seen.add(t.id);
            }
        }

        return unique;

    } catch (e) {
        console.error("Scraping error:", e);
        return [];
    }
};
