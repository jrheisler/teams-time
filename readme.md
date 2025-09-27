This is a chrome extention to allow teams to quickly see time zones of other team members
# Teams Time

Teams Time is a Chrome extension that helps distributed teams quickly see the current time in each teammate's location.

## Getting started

### Load the unpacked extension

1. Clone or download this repository.
2. Open Google Chrome and visit `chrome://extensions`.
3. Enable **Developer mode** in the top-right corner of the Extensions page.
4. Click **Load unpacked** and choose the root folder of this project.
5. Confirm that "Teams Time" now appears in the list of installed extensions and pin it in the toolbar for quick access.

### Verify the MVP workflow

1. Open the popup and add a teammate to confirm **create**.
2. Edit an existing teammate's details in the popup or options page to confirm **update**.
3. Remove a teammate entry to confirm **delete**.
4. Reload the extension or open it in another Chrome profile logged into the same Google account to verify **sync** via Chrome Storage.
5. Leave the extension running for a few minutes and re-open the popup to confirm the times automatically refresh (**auto-update**).

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

## Chrome Web Store submission checklist

- Capture fresh screenshots or screen recordings of the popup and options pages at common resolutions (1280×800 or higher).
- Export icons in all required sizes (16×16, 32×32, 48×48, 128×128) and confirm they match the branding in `manifest.json`.
- Generate a production ZIP by running `zip -r teams-time.zip . -x "*.git*"` from the repository root, ensuring `node_modules` or other development-only artifacts are excluded.
- Verify that the unpacked extension installs without warnings before uploading the ZIP to the Chrome Web Store dashboard.

## Privacy

Teams Time stores teammate rosters and preferences locally in Chrome Sync storage. Data never leaves the user's browser except when syncing between the user's own Chrome sessions tied to the same Google account, and it is not transmitted to external servers.
