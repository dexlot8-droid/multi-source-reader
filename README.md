# Multi-Source Manhwa Reader

Chrome extension for browsing and reading manhwa from multiple sources with automatic fallback. Source scraper extension (like Mihon).

## Features

- Unified search across Asura Scans, MangaUnion, Mangago, Vortex Scans
- Source priority system (Asura primary, others fallback)
- Content script detects source sites and injects "Read in Dex Manhwa" button
- Full-screen reader with keyboard navigation
- Reading progress saved to chrome.storage
- Settings page to enable/disable sources
- Right-click context menu integration
- Dark mode reader

## Installation

1. Open Chrome and go to `chrome://extensions/`
2. Enable "Developer mode"
3. Click "Load unpacked" and select this folder
4. Pin the extension

## Sources

| Source | Type | CDN Hotlink |
|--------|------|-------------|
| Asura Scans | API | Yes |
| MangaUnion | HTML | Yes (needs Referer) |
| Mangago | HTML | Yes |
| Vortex Scans | API | Yes |

## Permissions

- `storage` — save progress and settings
- `activeTab` — content script injection
- `contextMenus` — right-click search
- `host_permissions` — access to all source APIs and CDNs
