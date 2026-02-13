// X-Bookmarker Pro - Background Service
// Minimal logic: Just open side panel on click

// Configure Side Panel behavior
chrome.sidePanel
    .setPanelBehavior({ openPanelOnActionClick: true })
    .catch((error) => console.error(error));


// Allow Side Panel to request headers
chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {
    if (request.action === "GET_AUTH") {
        chrome.storage.local.get(['x_auth', 'x_bookmark_url'], (result) => {
            sendResponse({
                auth: result.x_auth,
                bookmarkUrl: result.x_bookmark_url
            });
        });
        return true; // Keep channel open
    }
});

// Configure Side Panel behavior
chrome.sidePanel
    .setPanelBehavior({ openPanelOnActionClick: true })
    .catch((error) => console.error(error));
