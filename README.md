# Devil's Lake Family Camping Planner

A mobile-first info site for the 5-family group trip to **Devil's Lake State Park, Group Camp G3, June 18–22, 2026**. No app to install — just open the URL on a phone.

## What's in it

- **Park** — Site G3 amenities, cell coverage by carrier, map with directions, photos, June weather norms.
- **Do** — Kid-friendly trails (ages 3–8), kayak/SUP rentals with prices, beaches, Nature Center, and nearby attractions (Circus World, Mid-Continent Railway, Crane Foundation, Wisconsin Dells, Henry Vilas Zoo).
- **Places** (Points of interest) — gas (with live GasBuddy prices), groceries, butcher, taprooms, and hospitals — each with distance from camp. Gas at the top, hospitals (SSM St. Clare + Sauk Prairie) at the bottom.
- **Pack** — Shared checklist. Tap an item to claim it for your family — everyone sees the update. Filters: Unclaimed / Mine / Shared items / Essentials.

## Run it

Just open `index.html` in any modern browser. It works offline (except map tiles + photos need a connection).

### Share with the families

Easiest: drop the folder into [Netlify Drop](https://app.netlify.com/drop) — it gives you a public URL in 30 seconds. Send that URL to the group chat. Done.

Alternatives:
- GitHub Pages: push to a repo, enable Pages, share the URL.
- Local network: run `python -m http.server 8000` in this folder and have everyone visit `http://<your-laptop-ip>:8000`.

## Optional: turn on shared sync (Firebase Firestore)

By default the checklist is **local-only** — each phone has its own. To make claims sync live across all 5 families' phones, hook up Firebase. It's free and takes ~5 minutes:

1. Go to <https://console.firebase.google.com>.
2. **Add project** → name it anything (e.g. `devils-lake-2026`) → skip Analytics → Create.
3. On the Project Overview page, click the **`</>`** icon to register a Web app. Give it a nickname; don't enable Hosting. Firebase shows a config snippet.
4. In the left sidebar: **Build → Firestore Database → Create database → Start in test mode → Pick a location**.
5. In this folder, copy `firebase-config.example.js` to `firebase-config.js` and paste your config values in.
6. Reload the app on any phone — the pill in the top-right turns yellow ☁️ Synced. Done.

Once the file exists, every phone that loads the URL automatically joins the shared trip. No accounts, no codes to type — they just open the page.

> Test-mode rules expire after 30 days. Before then, replace the Firestore rules with something like:
> ```
> match /trips/{tripId} {
>   allow read, write: if true;
> }
> ```
> for the duration of the trip, then tighten or delete after.

## Files

| File | Purpose |
|---|---|
| `index.html` | App shell, 5 tabs, bottom nav |
| `styles.css` | Mobile-first styles, outdoor palette |
| `data.js` | All park / trail / attraction / safety data |
| `checklist.js` | Your packing-list structure with per-item flags |
| `app.js` | Rendering, tab nav, checklist interactions |
| `sync.js` | Firestore sync wrapper with local fallback |
| `firebase-config.example.js` | Template — copy to `firebase-config.js` and fill in |

## Notes

- Phone numbers and map links work on mobile (tap-to-call, tap-to-navigate). On desktop they open the system's default handler.
- All photos are from Unsplash via direct CDN URLs — no API key, properly licensed.
- The map uses Leaflet + OpenStreetMap — no API key, no rate limit.
- Cell coverage at G3 is genuinely spotty (heavily wooded). Tell families to expect dead zones at the campsite; signal returns on the beaches and bluffs.
