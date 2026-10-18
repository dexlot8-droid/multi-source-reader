
(function() {
  'use strict';

  if (window.__multiSourceReaderInjected) return;
  window.__multiSourceReaderInjected = true;

  // Detect which source we're on
  function detectSource() {
    const host = location.hostname;
    if (host.includes('asurascans.com')) return 'asura';
    if (host.includes('mangaunion.com')) return 'mangaunion';
    if (host.includes('mangago.me')) return 'mangago';
    if (host.includes('vortexscans.org')) return 'vortex';
    return null;
  }

  // Extract slug from URL based on source
  function getSlug(source) {
    const path = location.pathname;
    switch (source) {
      case 'asura':
        const am = path.match(/\/comics\/([a-z0-9-]+)/i);
        return am ? am[1] : null;
      case 'mangaunion':
        const mm = path.match(/\/manga\/([^\/]+)/i);
        return mm ? mm[1] : null;
      case 'mangago':
        const mgm = path.match(/\/read-manga\/([^\/]+)/i);
        return mgm ? mgm[1] : null;
      case 'vortex':
        const vm = path.match(/\/series\/([^\/]+)/i);
        return vm ? vm[1] : null;
      default:
        return null;
    }
  }

  function injectButton() {
    if (document.getElementById('ms-reader-btn')) return;
    const source = detectSource();
    if (!source) return;
    const slug = getSlug(source);
    if (!slug) return;

    const btn = document.createElement('button');
    btn.id = 'ms-reader-btn';
    btn.innerHTML = '📖 Read in Dex Manhwa';
    btn.addEventListener('click', () => {
      chrome.runtime.sendMessage({
        action: 'openReader',
        slug: slug,
        chapter: '1',
        source: source
      });
    });
    document.body.appendChild(btn);
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', injectButton);
  } else {
    injectButton();
  }

  // Handle SPA navigation
  let lastUrl = location.href;
  new MutationObserver(() => {
    if (location.href !== lastUrl) {
      lastUrl = location.href;
      setTimeout(injectButton, 500);
    }
  }).observe(document.body, { childList: true, subtree: true });
})();
