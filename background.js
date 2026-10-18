
// Multi-Source Manhwa Reader - Service Worker
// Handles context menu, cross-tab messaging, and source fallback coordination

chrome.runtime.onInstalled.addListener(() => {
  // Create context menu
  chrome.contextMenus.create({
    id: 'searchDexManhwa',
    title: 'Search Dex Manhwa for "%s"',
    contexts: ['selection']
  });
});

chrome.contextMenus.onClicked.addListener((info, tab) => {
  if (info.menuItemId === 'searchDexManhwa') {
    const query = encodeURIComponent(info.selectionText || '');
    chrome.tabs.create({
      url: 'https://dexmanhwa.dpdns.org/?q=' + query
    });
  }
});

// Handle messages from content scripts and popups
chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {
  if (request.action === 'fetchSeries') {
    fetch(request.url)
      .then(r => r.json())
      .then(data => sendResponse({ success: true, data }))
      .catch(err => sendResponse({ success: false, error: err.message }));
    return true; // Keep channel open for async
  }

  if (request.action === 'getSources') {
    chrome.storage.local.get('sourceSettings', (result) => {
      sendResponse({ sources: result.sourceSettings || {} });
    });
    return true;
  }

  if (request.action === 'openReader') {
    const url = chrome.runtime.getURL('reader/index.html') +
      '?slug=' + encodeURIComponent(request.slug) +
      '&ch=' + encodeURIComponent(request.chapter) +
      '&source=' + encodeURIComponent(request.source);
    chrome.tabs.create({ url });
  }
});
