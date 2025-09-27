This is a chrome extention to allow teams to quickly see time zones of other team members
# Teams Time

Teams Time is a Chrome extension that helps distributed teams quickly see the current time in each teammate's location.

## Getting started

1. Clone or download this repository.
2. Open Google Chrome and visit `chrome://extensions`.
3. Enable **Developer mode** in the top-right corner of the Extensions page.
4. Click **Load unpacked** and choose the root folder of this project.
5. The extension will appear in your toolbar. Pin it for quick access to the popup.

## Features

- Popup shows the configured teammates and their time zones.
- Quick-add form in the popup for adding teammates on the fly.
- Options page for managing the full roster and default preferences.
- Time zone data backed by a curated list in `timezones.json`.

## Development notes

- Extension metadata lives in `manifest.json` (Manifest V3).
- Assets such as popup and options UI live alongside their CSS/JS counterparts under the repository root.
- Icons are placeholder PNGs sized for Chrome (16px, 48px, 128px).
- Persistent data is stored using the Chrome `storage` API with an in-memory/localStorage fallback for non-extension environments.