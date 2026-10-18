
(function() {
  'use strict';

  const SOURCES = {
    asura: {
      name: 'Asura Scans',
      api: 'https://api.asurascans.com',
      searchUrl: (q) => 'https://api.asurascans.com/api/search?q=' + encodeURIComponent(q),
      seriesUrl: (slug) => 'https://api.asurascans.com/api/series/' + slug,
      chaptersUrl: (slug) => 'https://api.asurascans.com/api/series/' + slug + '/chapters',
      chapterUrl: (slug, num) => 'https://api.asurascans.com/api/series/' + slug + '/chapters/' + num,
      enabled: true,
      priority: 1
    },
    mangaunion: {
      name: 'MangaUnion',
      api: 'https://mangaunion.com',
      searchUrl: (q) => 'https://mangaunion.com/?s=' + encodeURIComponent(q),
      seriesUrl: (slug) => 'https://mangaunion.com/manga/' + slug,
      chaptersUrl: (slug) => 'https://mangaunion.com/manga/' + slug,
      chapterUrl: (slug, num) => 'https://mangaunion.com/manga/' + slug + '/read/' + num,
      enabled: true,
      priority: 2
    },
    mangago: {
      name: 'Mangago',
      api: 'https://mangago.me',
      searchUrl: (q) => 'https://mangago.me/search/' + encodeURIComponent(q),
      seriesUrl: (slug) => 'https://mangago.me/read-manga/' + slug,
      chaptersUrl: (slug) => 'https://mangago.me/read-manga/' + slug,
      chapterUrl: (slug, num) => 'https://mangago.me/read-manga/' + slug + '/' + num,
      enabled: true,
      priority: 3
    },
    vortex: {
      name: 'Vortex Scans',
      api: 'https://api.vortexscans.org',
      searchUrl: (q) => 'https://api.vortexscans.org/api/posts?search=' + encodeURIComponent(q),
      seriesUrl: (slug) => 'https://api.vortexscans.org/api/posts/' + slug,
      chaptersUrl: (slug) => 'https://api.vortexscans.org/api/chapters?postId=' + slug,
      chapterUrl: (slug, num) => 'https://api.vortexscans.org/api/chapter?chapterId=' + num,
      enabled: true,
      priority: 4
    }
  };

  // Load settings
  chrome.storage.local.get(['sourceSettings', 'readingHistory'], (result) => {
    const settings = result.sourceSettings || {};
    const history = result.readingHistory || {};

    // Apply saved settings
    Object.keys(settings).forEach(key => {
      if (SOURCES[key]) {
        SOURCES[key].enabled = settings[key].enabled !== false;
        SOURCES[key].priority = settings[key].priority || SOURCES[key].priority;
      }
    });

    updateSourceFilter();
  });

  function updateSourceFilter() {
    const container = document.getElementById('sourceFilter');
    if (!container) return;
    container.querySelectorAll('input[type="checkbox"]').forEach(cb => {
      const src = cb.dataset.source;
      if (SOURCES[src]) cb.checked = SOURCES[src].enabled;
    });
  }

  // Tab switching
  document.querySelectorAll('.tab-btn').forEach(btn => {
    btn.addEventListener('click', () => {
      document.querySelectorAll('.tab-btn').forEach(b => b.classList.remove('active'));
      document.querySelectorAll('.tab-content').forEach(c => c.classList.remove('active'));
      btn.classList.add('active');
      document.getElementById(btn.dataset.tab).classList.add('active');

      if (btn.dataset.tab === 'popular') loadPopular();
      if (btn.dataset.tab === 'history') loadHistory();
    });
  });

  // Source filter changes
  document.getElementById('sourceFilter').addEventListener('change', (e) => {
    const src = e.target.dataset.source;
    if (SOURCES[src]) {
      SOURCES[src].enabled = e.target.checked;
      saveSettings();
    }
  });

  // Load popular from Asura (primary)
  function loadPopular() {
    const list = document.getElementById('seriesList');
    list.innerHTML = '<p class="loading">Loading...</p>';

    fetch('https://api.asurascans.com/api/series?limit=20')
      .then(r => r.json())
      .then(data => {
        const items = data.data || [];
        if (items.length === 0) {
          list.innerHTML = '<p class="empty">No series found</p>';
          return;
        }
        list.innerHTML = items.map(s => `
          <div class="series-item" data-slug="${s.slug}" data-source="asura">
            <img src="${s.cover || ''}" alt="${s.title}" onerror="this.src='icons/icon48.png'">
            <div class="info">
              <h4>${s.title}</h4>
              <p>${s.chapter_count || '?'} chapters</p>
            </div>
          </div>
        `).join('');

        list.querySelectorAll('.series-item').forEach(el => {
          el.addEventListener('click', () => showSeriesDetail(el.dataset.slug, el.dataset.source));
        });
      })
      .catch(err => {
        list.innerHTML = '<p class="empty">Error: ' + err.message + '</p>';
      });
  }

  function loadHistory() {
    const list = document.getElementById('historyList');
    chrome.storage.local.get('readingHistory', (result) => {
      const history = result.readingHistory || {};
      const entries = Object.entries(history).sort((a, b) => b[1].lastRead - a[1].lastRead);

      if (entries.length === 0) {
        list.innerHTML = '<p class="empty">No reading history yet</p>';
        return;
      }

      list.innerHTML = entries.map(([key, data]) => `
        <div class="series-item history-item" data-slug="${data.slug || key}" data-source="${data.source || 'asura'}">
          <div class="info">
            <h4>${data.title || key}</h4>
            <p class="progress">Chapter ${data.chapter} - ${new Date(data.lastRead).toLocaleDateString()}</p>
          </div>
        </div>
      `).join('');

      list.querySelectorAll('.series-item').forEach(el => {
        el.addEventListener('click', () => showSeriesDetail(el.dataset.slug, el.dataset.source));
      });
    });
  }

  function showSeriesDetail(slug, source) {
    document.querySelectorAll('.tab-content').forEach(c => c.classList.remove('active'));
    document.getElementById('seriesDetail').classList.remove('hidden');

    const badges = document.getElementById('sourceBadges');
    badges.innerHTML = Object.entries(SOURCES)
      .filter(([k, s]) => s.enabled)
      .map(([k, s]) => '<span class="source-badge' + (k === source ? ' active' : '') + '">' + s.name + '</span>')
      .join('');

    fetch(SOURCES[source].seriesUrl(slug))
      .then(r => r.json())
      .then(data => {
        const s = data.data || {};
        document.getElementById('seriesCover').src = s.cover || '';
        document.getElementById('seriesTitle').textContent = s.title || slug;
        document.getElementById('seriesDesc').textContent = (s.description || '').substring(0, 300);

        const chList = document.getElementById('chapterList');
        chList.innerHTML = '<p class="loading">Loading chapters...</p>';

        return fetch(SOURCES[source].chaptersUrl(slug))
          .then(r => r.json())
          .then(chData => {
            const chapters = chData.data || chData.chapters || [];
            chList.innerHTML = chapters.map(ch => {
              const num = ch.number || ch.chapter || ch.id;
              return '<div class="chapter-item" data-ch="' + num + '" data-source="' + source + '">' +
                '<span class="ch-title">' + (ch.title || 'Chapter ' + num) + '</span>' +
                '<span class="ch-num">' + num + '</span></div>';
            }).reverse().join('');

            chList.querySelectorAll('.chapter-item').forEach(el => {
              el.addEventListener('click', () => {
                const chNum = el.dataset.ch;
                const src = el.dataset.source;
                chrome.storage.local.get('readingHistory', (result) => {
                  const history = result.readingHistory || {};
                  history[slug] = { title: s.title, chapter: chNum, lastRead: Date.now(), source: src };
                  chrome.storage.local.set({ readingHistory: history });
                });
                chrome.tabs.create({ url: chrome.runtime.getURL('reader/index.html') + '?slug=' + slug + '&ch=' + chNum + '&source=' + src });
              });
            });
          });
      })
      .catch(err => {
        document.getElementById('chapterList').innerHTML = '<p class="empty">Error: ' + err.message + '</p>';
      });
  }

  // Back button
  document.getElementById('backBtn').addEventListener('click', () => {
    document.getElementById('seriesDetail').classList.add('hidden');
    document.querySelector('.tab-btn[data-tab="popular"]').click();
  });

  // Search
  document.getElementById('searchBtn').addEventListener('click', doSearch);
  document.getElementById('searchInput').addEventListener('keydown', (e) => {
    if (e.key === 'Enter') doSearch();
  });

  function doSearch() {
    const query = document.getElementById('searchInput').value.trim();
    if (!query) return;

    document.querySelectorAll('.tab-btn').forEach(b => b.classList.remove('active'));
    document.querySelectorAll('.tab-content').forEach(c => c.classList.remove('active'));
    document.querySelector('.tab-btn[data-tab="search"]').classList.add('active');
    document.getElementById('search').classList.add('active');

    const results = document.getElementById('searchResults');
    results.innerHTML = '<p class="loading">Searching all sources...</p>';

    // Search Asura first
    fetch('https://api.asurascans.com/api/search?q=' + encodeURIComponent(query))
      .then(r => r.json())
      .then(data => {
        const items = data.data || [];
        if (items.length === 0) {
          results.innerHTML = '<p class="empty">No results found</p>';
          return;
        }
        results.innerHTML = items.map(s => `
          <div class="series-item" data-slug="${s.slug}" data-source="asura">
            <img src="${s.cover || ''}" alt="${s.title}" onerror="this.src='icons/icon48.png'">
            <div class="info">
              <h4>${s.title}</h4>
              <p>${s.chapter_count || '?'} chapters</p>
            </div>
          </div>
        `).join('');

        results.querySelectorAll('.series-item').forEach(el => {
          el.addEventListener('click', () => showSeriesDetail(el.dataset.slug, el.dataset.source));
        });
      })
      .catch(err => {
        results.innerHTML = '<p class="empty">Error: ' + err.message + '</p>';
      });
  }

  // Settings
  document.getElementById('saveSettings').addEventListener('click', saveSettings);
  document.getElementById('autoFallback').addEventListener('change', saveSettings);
  document.getElementById('saveProgress').addEventListener('change', saveSettings);
  document.getElementById('darkMode').addEventListener('change', saveSettings);

  function saveSettings() {
    const settings = {};
    Object.keys(SOURCES).forEach(key => {
      settings[key] = { enabled: SOURCES[key].enabled, priority: SOURCES[key].priority };
    });
    chrome.storage.local.set({
      sourceSettings: settings,
      readerSettings: {
        autoFallback: document.getElementById('autoFallback').checked,
        saveProgress: document.getElementById('saveProgress').checked,
        darkMode: document.getElementById('darkMode').checked
      }
    });
  }

  // Load initial data
  loadPopular();
})();
