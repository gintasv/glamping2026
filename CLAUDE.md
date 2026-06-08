# CLAUDE.md

Guidance for working in this repository.

## What this is

A single-page, mobile-first info site for a 5–7 family group camping trip to **Devil's Lake State Park, Group Camp G3, June 18–22, 2026**. No build step, no framework, no npm — just static files opened in a browser (or dropped on Netlify / GitHub Pages). The only "backend" is an optional Firebase Firestore document used to sync the shared packing list across phones.

See `README.md` for the end-user / deployment story. This file is for working *on* the code.

## Running & testing

- **Run:** open `index.html` directly, or serve the folder: `python -m http.server 8000`. A server is required for ES module imports (`app.js`, `sync.js` are `type="module"`) to work in some browsers, and for the Firebase dynamic imports.
- **No build, no bundler, no tests, no linter.** Changes are live on reload.
- **External runtime deps (all via CDN, no API keys):** Leaflet 1.9.4 (map), Open-Meteo (live 10-day forecast), OpenStreetMap tiles, Google Fonts (Inter), Firebase SDK 10.13.0 (loaded by dynamic `import()` only when configured).

## Architecture

Scripts load in this order (see bottom of `index.html`); load order matters because data files attach to `window` before the modules run:

| File | Role |
|---|---|
| `data.js` | All trip content (park, campsite, trails, water, attractions, gas/grocery/butcher/drinks, hospitals, photos, map points). Attaches everything to `window.TRIP_DATA`. Plain script, not a module. |
| `checklist.js` | Packing-list structure → `window.CHECKLIST`. Groups → subgroups → items, each item with flags. Plain script. |
| `firebase-config.js` | Optional. Sets `window.FIREBASE_CONFIG`. Git-ignored / user-created from `firebase-config.example.js`. Loaded with `onerror="void 0"` so a missing file is harmless. `index.html` defaults `window.FIREBASE_CONFIG = null` first. |
| `sync.js` | ES module. Default-exports a `SyncManager` singleton (`sync`). Firestore wrapper with localStorage fallback — same API either way. |
| `app.js` | ES module. Imports `sync`, reads `window.TRIP_DATA` / `window.CHECKLIST`, renders all screens, wires nav + checklist interactions. Entry point (`boot()`). |

**The data/view split is the key pattern:** content lives in `data.js` / `checklist.js` as plain objects; `app.js` is pure rendering via template strings injected with `innerHTML`. To change trip info (a phone number, a new attraction, a gas station), edit the data files — not `app.js`.

### UI (`app.js`)
- `$` / `$$` are `querySelector` / `querySelectorAll` helpers.
- Four tabs (Park / Do / Places / Pack) are `<section class="screen">` toggled via the `hidden` attribute by `switchTab()`. Bottom nav drives it.
- Inline SVG icons in the `ICONS` map; data references them by string key (e.g. `icon: "tree"`).
- The Leaflet map is lazy-initialized (`renderMap`) once its container is visible, and `invalidateSize()` is called on tab switch — Leaflet misrenders if built while hidden.
- Forecast (`renderForecast`) fetches Open-Meteo live; on failure it falls back to the static June-normals summary in `SAFETY.weather`.
- Two distinct map-link helpers: `gmapsDir()` = turn-by-turn navigation; `gmapsPlace()` = drop a pin / open the place. Don't conflate them.
- UI-only state (current family, active filter, collapsed groups) persists separately in `localStorage` under `camp:ui` — kept distinct from sync state.

### Sync (`sync.js`)
- State shape: `{ tripCode, families: [{id, name}], claims: { [itemId]: [familyId, ...] }, updatedAt }`.
- A claim is a `familyId` in an item's array — multiple families can claim the same item.
- **Item IDs are derived, not stored:** `app.js` builds each id as `slugify(group).slugify(subgroup).slugify(itemName)`. Renaming a group/subgroup/item in `checklist.js` changes its id and orphans existing claims. `slugify` is duplicated in both `app.js` and `checklist.js` — keep them identical.
- Local-only by default (`localStorage` key `camp:devils-lake-2026-06`). If `window.FIREBASE_CONFIG.apiKey` is present, `_initFirebase` subscribes to Firestore doc `trips/devils-lake-2026-06` via `onSnapshot`.
- Conflict resolution: the remote Firestore doc is the shared source of truth. A device only pushes its local state up when it has **genuine unsynced user edits** (`hasLocalEdits`, set in `_commit`, cleared once the cloud echo is adopted) that are newer than the cloud; otherwise it adopts remote. This guards against a freshly-loaded device (default names, no claims, but a current `Date.now()` timestamp) looking "newer" and clobbering everyone's data on connect. `applyingRemote` guards against echoing a remote update back to the cloud.
- Known limitation: it's still whole-document last-write-wins. If two devices claim *different* items within the same sync window, the later write wins the whole `claims` map and can drop the other's claim. Acceptable for this small-group, low-contention use; revisit with field-level merges if it becomes a problem.
- `_emit()` notifies subscribers; `app.js` re-renders the whole Pack section on every state change. The header sync pill reacts to a `sync:mode` `CustomEvent`.
- The family roster is **code-defined and authoritative** in `DEFAULT_FAMILIES` (there's no in-app rename). `normalizeFamilies` ignores any families stored locally or received from the cloud and always returns that roster, so every device shows the same names, names survive a Firestore reset, and stale slots are dropped without a migration. Only `claims` actually sync. To add/rename/remove a family, edit `DEFAULT_FAMILIES`.

## Conventions

- Vanilla ES2020+. No TypeScript, no JSX, no dependencies to install.
- Rendering is template-string `innerHTML`. Content here is trusted (authored in `data.js`), so it's not HTML-escaped — keep it that way only because the data is static and author-controlled; don't pipe user input through these templates without escaping.
- Mobile-first. `tel:` links and map links assume a phone; they degrade to the desktop default handler.
- `styles.css` is hand-written, mobile-first, outdoor palette (theme color `#3a5a44`). No CSS framework.
- Prefer editing data files over markup/logic. Match the existing comment density — the data files are heavily commented with sourcing notes (e.g. "live gas prices via GasBuddy — never hardcode prices into a static page").

## Gotchas

- **Don't hardcode volatile data** (gas prices, live weather) — the codebase deliberately links out (GasBuddy, Open-Meteo, NWS) instead.
- Changing trip dates/location means editing `TRIP` and `CAMPSITE` in `data.js` *and* the `TRIP_CODE` constant in `sync.js` (it's the Firestore doc id and localStorage key — changing it starts a fresh shared list).
- The map routes to the **G3 group-camp coordinate** (`TRIP.coords`), not the park office address — this is intentional (office is ~3 mi away).
- `firebase-config.js` **is committed on purpose** (see the `.gitignore` comment): Firebase web SDK config values are public by design — they ship to every visitor's browser regardless. Security is enforced by Firestore rules server-side, not by hiding the file. Don't "fix" this by gitignoring it. Note: Firestore test-mode rules expire after 30 days (see README).
