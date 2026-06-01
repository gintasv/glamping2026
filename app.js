// Devil's Lake Camping Planner — UI logic
// Renders all screens, handles tab navigation, family selection, and checklist interactions.

import sync from "./sync.js";

const $ = (sel, root = document) => root.querySelector(sel);
const $$ = (sel, root = document) => Array.from(root.querySelectorAll(sel));
const { TRIP, PARK, CAMPSITE, TRAILS, WATER, ACTIVITIES_AT_PARK, NEARBY, EAT_SHOP, SAFETY, PHOTOS, MAP_POINTS } =
  window.TRIP_DATA;

// ──────────────────────────────────────────
// Inline SVG icons (Lucide-inspired, 16×16, currentColor stroke)
// ──────────────────────────────────────────
const SVG_ATTRS = `width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.7" stroke-linecap="round" stroke-linejoin="round"`;
const ICONS = {
  tree:
    `<svg ${SVG_ATTRS}><path d="M12 3l-4 6h2l-3 5h2l-3 4h12l-3-4h2l-3-5h2z"/><line x1="12" y1="18" x2="12" y2="22"/></svg>`,
  restroom:
    `<svg ${SVG_ATTRS}><circle cx="12" cy="5" r="2"/><path d="M9 22v-7H7l2.5-6h5l2.5 6h-2v7"/></svg>`,
  shower:
    `<svg ${SVG_ATTRS}><path d="M6 5h11"/><path d="M17 5v6"/><line x1="9" y1="14" x2="8" y2="17"/><line x1="13" y1="14" x2="12" y2="17"/><line x1="17" y1="14" x2="16" y2="17"/><line x1="11" y1="19" x2="10" y2="22"/><line x1="15" y1="19" x2="14" y2="22"/></svg>`,
  drop:
    `<svg ${SVG_ATTRS}><path d="M12 3c-4 5-6 9-6 12a6 6 0 0012 0c0-3-2-7-6-12z"/></svg>`,
  walk:
    `<svg ${SVG_ATTRS}><circle cx="13" cy="4" r="2"/><path d="M11 9l3-2 2 4-2 3 3 5"/><path d="M9 13l-3 2 1 5"/></svg>`,
  flame:
    `<svg ${SVG_ATTRS}><path d="M12 2c1 3 5 5 5 10a5 5 0 01-10 0c0-2 1-4 3-5a4 4 0 002-5z"/></svg>`,
  car:
    `<svg ${SVG_ATTRS}><path d="M5 17l-1-5 2-5h12l2 5-1 5"/><path d="M5 17v2h3v-2"/><path d="M16 17v2h3v-2"/><circle cx="8" cy="14" r="1.2"/><circle cx="16" cy="14" r="1.2"/></svg>`,
  wave:
    `<svg ${SVG_ATTRS}><path d="M3 13c2 0 2-2 4-2s2 2 4 2 2-2 4-2 2 2 4 2"/><path d="M3 18c2 0 2-2 4-2s2 2 4 2 2-2 4-2 2 2 4 2"/></svg>`,
  boat:
    `<svg ${SVG_ATTRS}><path d="M12 3v12"/><path d="M12 5l6 8h-6z"/><path d="M5 16h14l-2 4H7z"/></svg>`,
  leaf:
    `<svg ${SVG_ATTRS}><path d="M5 19c0-8 6-14 14-14 0 8-6 14-14 14z"/><path d="M5 19c3-4 6-6 10-8"/></svg>`,
  mountain:
    `<svg ${SVG_ATTRS}><path d="M3 20l5-9 4 6 3-5 6 8z"/></svg>`,
  flag:
    `<svg ${SVG_ATTRS}><path d="M5 21V4"/><path d="M5 4h11l-2 4 2 4H5"/></svg>`,
  fish:
    `<svg ${SVG_ATTRS}><path d="M3 12c4-6 11-6 15 0-4 6-11 6-15 0z"/><path d="M18 12l3-3v6z"/><circle cx="8" cy="10.5" r="0.6"/></svg>`,
  ball:
    `<svg ${SVG_ATTRS}><circle cx="12" cy="12" r="9"/><path d="M12 3a14 14 0 010 18M3 12h18M5.6 6.5c3.5 2.2 9.3 2.2 12.8 0M5.6 17.5c3.5-2.2 9.3-2.2 12.8 0"/></svg>`,
};
function renderIcon(name) {
  return ICONS[name] || name;
}

// ──────────────────────────────────────────
// UI state (separate from sync state)
// ──────────────────────────────────────────
const LS_UI_KEY = "camp:ui";
const uiState = {
  currentFamilyId: "fam-1",
  filter: "all",
  collapsedGroups: {},
  ...((() => {
    try { return JSON.parse(localStorage.getItem(LS_UI_KEY) || "{}"); }
    catch { return {}; }
  })()),
};
function saveUI() {
  localStorage.setItem(LS_UI_KEY, JSON.stringify(uiState));
}

// ──────────────────────────────────────────
// Utility: toast
// ──────────────────────────────────────────
let toastTimer = null;
function toast(msg, ms = 2200) {
  const el = $("#toast");
  el.textContent = msg;
  el.hidden = false;
  clearTimeout(toastTimer);
  toastTimer = setTimeout(() => { el.hidden = true; }, ms);
}

// ──────────────────────────────────────────
// Utility: phone & directions links
// ──────────────────────────────────────────
function telLink(phone) {
  if (!phone) return null;
  return "tel:" + phone.replace(/[^\d+]/g, "");
}
function gmapsDir(addressOrCoords) {
  if (typeof addressOrCoords === "string") {
    return "https://www.google.com/maps/dir/?api=1&destination=" + encodeURIComponent(addressOrCoords);
  }
  const { lat, lon } = addressOrCoords;
  return `https://www.google.com/maps/dir/?api=1&destination=${lat},${lon}`;
}
function applyMapsLink(addressOrCoords) {
  if (typeof addressOrCoords === "string") {
    return "https://maps.apple.com/?daddr=" + encodeURIComponent(addressOrCoords);
  }
  return `https://maps.apple.com/?daddr=${addressOrCoords.lat},${addressOrCoords.lon}`;
}
// A Google Maps *location* link (drops a pin / opens the place), as opposed to
// gmapsDir which starts turn-by-turn navigation.
function gmapsPlace(query) {
  return "https://www.google.com/maps/search/?api=1&query=" + encodeURIComponent(query);
}

// ──────────────────────────────────────────
// Render: Park tab
// ──────────────────────────────────────────
function renderPark() {
  // About the park — lead, headline stats, feature grid, official link
  $("#park-desc").textContent = PARK.about;
  $("#park-stats").innerHTML = PARK.stats.map((s) => `
    <div class="park-stat">
      <div class="park-stat__value">${s.value}</div>
      <div class="park-stat__label">${s.label}</div>
    </div>
  `).join("");
  $("#park-features").innerHTML = PARK.features.map((f) => `
    <li>
      <span class="feature-icon">${renderIcon(f.icon)}</span>
      <div>
        <div class="feature-title">${f.title}</div>
        <div class="feature-detail">${f.detail}</div>
      </div>
    </li>
  `).join("");
  $("#park-link").href = TRIP.parkWebsite;

  // Cell coverage
  $("#cell-summary").textContent = CAMPSITE.cell.summary;
  $("#carrier-list").innerHTML = CAMPSITE.cell.carriers.map((c) => `
    <li>
      <span class="carrier-name">${c.name}</span>
      <span class="carrier-strength" data-s="${c.strength}">${c.strength}</span>
      <span class="carrier-note">${c.note}</span>
    </li>
  `).join("");

  // Your campsite — reservation + campground link
  const nights = Math.round((new Date(TRIP.endDate) - new Date(TRIP.startDate)) / 86400000);
  $("#campsite-name").textContent = CAMPSITE.name;
  $("#res-dates").textContent = `${TRIP.dates} · ${nights} night${nights === 1 ? "" : "s"}`;
  $("#res-checkin").textContent = TRIP.checkIn;
  $("#res-checkout").textContent = TRIP.checkOut;
  $("#reserve-link").href = TRIP.reservationUrl;

  // Getting there — route the map buttons to the actual G3 coordinate, since
  // the park office address is ~3 mi from the group camp.
  $("#park-address").textContent = `${CAMPSITE.name} · Devil's Lake State Park`;
  $("#open-gmaps").href = gmapsDir(TRIP.coords);
  $("#open-amaps").href = applyMapsLink(TRIP.coords);

  // Site G3 amenities
  $("#amenities-list").innerHTML = CAMPSITE.amenities.map((a) => `
    <li>
      <div class="amenity-icon">${renderIcon(a.icon)}</div>
      <div>
        <div class="amenity-title">${a.title}</div>
        <div class="amenity-detail">${a.detail}</div>
      </div>
    </li>
  `).join("");
}

// ──────────────────────────────────────────
// Render: 10-day forecast (Open-Meteo, no API key, CORS-enabled)
// ──────────────────────────────────────────
function weatherIcon(code) {
  const wrap = (inner) =>
    `<svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.6" stroke-linecap="round" stroke-linejoin="round">${inner}</svg>`;
  const SUN = '<circle cx="12" cy="12" r="5"/><line x1="12" y1="1" x2="12" y2="3"/><line x1="12" y1="21" x2="12" y2="23"/><line x1="4.22" y1="4.22" x2="5.64" y2="5.64"/><line x1="18.36" y1="18.36" x2="19.78" y2="19.78"/><line x1="1" y1="12" x2="3" y2="12"/><line x1="21" y1="12" x2="23" y2="12"/><line x1="4.22" y1="19.78" x2="5.64" y2="18.36"/><line x1="18.36" y1="5.64" x2="19.78" y2="7.07"/>';
  const CLOUD = '<path d="M18 10h-1.26A8 8 0 109 20h9a5 5 0 000-10z"/>';
  const RAIN = '<line x1="16" y1="13" x2="16" y2="21"/><line x1="8" y1="13" x2="8" y2="21"/><line x1="12" y1="15" x2="12" y2="23"/><path d="M20 16.58A5 5 0 0018 7h-1.26A8 8 0 104 15.25"/>';
  const SNOW = '<path d="M20 17.58A5 5 0 0018 8h-1.26A8 8 0 104 16.25"/><line x1="8" y1="16" x2="8.01" y2="16"/><line x1="8" y1="20" x2="8.01" y2="20"/><line x1="12" y1="18" x2="12.01" y2="18"/><line x1="12" y1="22" x2="12.01" y2="22"/><line x1="16" y1="16" x2="16.01" y2="16"/><line x1="16" y1="20" x2="16.01" y2="20"/>';
  const STORM = '<path d="M19 16.9A5 5 0 0018 7h-1.26a8 8 0 10-11.62 9"/><polyline points="13 11 9 17 15 17 11 23"/>';
  if (code <= 1) return { svg: wrap(SUN), label: "Clear" };
  if (code <= 3) return { svg: wrap(CLOUD), label: "Cloudy" };
  if (code === 45 || code === 48) return { svg: wrap(CLOUD), label: "Fog" };
  if ((code >= 71 && code <= 77) || code === 85 || code === 86) return { svg: wrap(SNOW), label: "Snow" };
  if (code >= 95) return { svg: wrap(STORM), label: "Storm" };
  return { svg: wrap(RAIN), label: "Rain" };
}

async function renderForecast() {
  const row = $("#forecast-row");
  const note = $("#forecast-note");
  const { lat, lon } = TRIP.coords;
  const url =
    `https://api.open-meteo.com/v1/forecast?latitude=${lat}&longitude=${lon}` +
    `&daily=weather_code,temperature_2m_max,temperature_2m_min` +
    `&temperature_unit=fahrenheit&timezone=America%2FChicago&forecast_days=10`;
  try {
    const res = await fetch(url);
    if (!res.ok) throw new Error(`forecast ${res.status}`);
    const d = (await res.json()).daily;
    row.innerHTML = d.time.map((iso, i) => {
      const date = new Date(`${iso}T12:00:00`);
      const dow = i === 0 ? "Today" : date.toLocaleDateString("en-US", { weekday: "short" });
      const md = date.toLocaleDateString("en-US", { month: "short", day: "numeric" });
      const { svg, label } = weatherIcon(d.weather_code[i]);
      return `
        <div class="forecast-day${i === 0 ? " forecast-day--today" : ""}">
          <span class="forecast-day__dow">${dow}</span>
          <span class="forecast-day__date">${md}</span>
          <span class="forecast-day__icon" role="img" aria-label="${label}">${svg}</span>
          <span class="forecast-day__temp"><span class="forecast-day__hi">${Math.round(d.temperature_2m_max[i])}°</span> <span class="forecast-day__lo">${Math.round(d.temperature_2m_min[i])}°</span></span>
        </div>`;
    }).join("");
    note.innerHTML = `Live forecast for the campsite · <a href="${SAFETY.weather.nwsUrl}" target="_blank" rel="noopener">Full forecast &amp; details →</a>`;
  } catch (err) {
    // Offline or API unreachable — fall back to June normals + NWS link.
    row.innerHTML = `<p class="forecast-fallback">${SAFETY.weather.summary}</p>`;
    note.innerHTML = `Live forecast unavailable. <a href="${SAFETY.weather.nwsUrl}" target="_blank" rel="noopener">Open NWS forecast →</a>`;
  }
}

// ──────────────────────────────────────────
// Render: Leaflet map
// ──────────────────────────────────────────
let mapInstance = null;
function renderMap() {
  if (mapInstance || typeof L === "undefined") return;
  const center = [TRIP.coords.lat, TRIP.coords.lon];
  mapInstance = L.map("park-map", {
    center,
    zoom: 16,
    scrollWheelZoom: false,
  });
  L.tileLayer("https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png", {
    attribution: '© <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>',
    maxZoom: 18,
  }).addTo(mapInstance);

  MAP_POINTS.forEach((pt) => {
    const m = L.marker([pt.lat, pt.lon]).addTo(mapInstance);
    const dirUrl = gmapsDir({ lat: pt.lat, lon: pt.lon });
    m.bindPopup(`
      <strong>${pt.label}</strong><br>
      <a href="${dirUrl}" target="_blank" rel="noopener">Directions →</a>
    `);
    if (pt.primary) m.openPopup();
  });
}

// ──────────────────────────────────────────
// Render: Do tab
// ──────────────────────────────────────────
function pillForDifficulty(d) {
  if (/easy/i.test(d)) return `<span class="pill pill--easy">${d}</span>`;
  return `<span class="pill pill--moderate">${d}</span>`;
}

function renderDo() {
  // Trails — image on top, content below. Photos are real Devil's Lake imagery
  // from Wikimedia Commons.
  $("#trail-grid").innerHTML = TRAILS.map((t) => `
    <article class="trail-card">
      ${t.photo ? `<div class="trail-card__img" style="background-image:url('${t.photo}')" role="img" aria-label="${t.name}"></div>` : ""}
      <div class="trail-card__body">
        <h3>${t.name}</h3>
        <div class="trail-card__meta">
          <span class="pill pill--length">${t.length}</span>
          ${pillForDifficulty(t.difficulty)}
          <span class="pill pill--age">${t.kidAges}</span>
        </div>
        <p class="trail-card__desc">${t.description}</p>
      </div>
    </article>
  `).join("") + `<p class="trail-card__credit">Trail photos via <a href="https://commons.wikimedia.org/wiki/Category:Devil%27s_Lake_State_Park_(Wisconsin)" target="_blank" rel="noopener">Wikimedia Commons</a></p>`;

  // Water
  $("#water-card").innerHTML = `
    <h3>Kayak · SUP · Paddleboat rentals</h3>
    <p>${WATER.locations}</p>
    <p><strong>Hours:</strong> ${WATER.hours}</p>
    <p class="water-note">${WATER.returnNote}</p>
    <ul class="water-pricing">
      ${WATER.pricing.map((p) => `<li><span>${p.item}</span><span class="price">${p.price}</span></li>`).join("")}
    </ul>
    <p><strong>Deposit:</strong> ${WATER.deposit}</p>
    <a class="btn btn-primary" href="${telLink(WATER.concessionPhone)}">Call ${WATER.concessionPhone}</a>
  `;

  // Activities at the park
  $("#activity-grid").innerHTML = ACTIVITIES_AT_PARK.map((a) => `
    <article class="activity-card">
      <div class="ico">${renderIcon(a.icon)}</div>
      <div>
        <h3>${a.title}</h3>
        <p>${a.description}</p>
      </div>
    </article>
  `).join("");

  // Nearby attractions
  $("#nearby-grid").innerHTML = NEARBY.map((n) => `
    <article class="nearby-card">
      <div class="nearby-card__body">
        <h3>${n.title}</h3>
        <div class="trail-card__meta">
          <span class="pill pill--distance">${n.distance}</span>
        </div>
        <p class="nearby-card__desc">${n.description}</p>
        <div class="kid-appeal">${n.kidAppeal}</div>
        <div class="nearby-actions">
          <a class="btn btn-primary" href="${gmapsDir(n.address)}" target="_blank" rel="noopener">Directions</a>
        </div>
      </div>
    </article>
  `).join("");
}

// ──────────────────────────────────────────
// Render: Eat tab
// ──────────────────────────────────────────
function bizCardHtml(biz) {
  const cls = [];
  if (biz.highlight) cls.push("highlight");
  if (biz.info) cls.push("info");
  // Google Maps location (pin), not directions. Use name + address for an
  // accurate pin when an address is available.
  const mapBtn = biz.address && !biz.info
    ? `<a class="btn btn-primary" href="${gmapsPlace(`${biz.name}, ${biz.address}`)}" target="_blank" rel="noopener">Google Maps</a>` : "";
  const siteBtn = biz.website
    ? `<a class="btn btn-secondary" href="${biz.website}" target="_blank" rel="noopener">Website</a>` : "";
  // Live gas prices via GasBuddy — never hardcode prices into a static page.
  const priceBtn = biz.priceUrl
    ? `<a class="btn btn-secondary" href="${biz.priceUrl}" target="_blank" rel="noopener">Gas prices ↗</a>` : "";
  // Phone number stays tap-to-call from the meta row, but the big Call button is gone.
  const phoneMeta = biz.phone
    ? `<div><strong>Phone</strong> <a class="meta-tel" href="${telLink(biz.phone)}">${biz.phone}</a></div>`
    : "";
  const actions = [mapBtn, siteBtn, priceBtn].filter(Boolean).join("");
  const distPill = biz.distance ? `<span class="biz-dist">${biz.distance}</span>` : "";
  const metaRows = [
    biz.address ? `<div><strong>Address</strong> ${biz.address}</div>` : "",
    phoneMeta,
    biz.hours ? `<div><strong>Hours</strong> ${biz.hours}</div>` : "",
  ].filter(Boolean).join("");
  return `
    <article class="biz-card ${cls.join(" ")}">
      <div class="biz-card__head">
        <h3>${biz.name}${biz.kidFriendly ? '<span class="tag-kid">Kid-friendly</span>' : ""}</h3>
        ${distPill}
      </div>
      <p class="biz-blurb">${biz.blurb}</p>
      ${metaRows ? `<div class="biz-meta">${metaRows}</div>` : ""}
      ${actions ? `<div class="biz-actions">${actions}</div>` : ""}
    </article>
  `;
}
function renderEat() {
  $("#biz-grocery").innerHTML = EAT_SHOP.grocery.map(bizCardHtml).join("");
  $("#biz-gas").innerHTML = EAT_SHOP.gas.map(bizCardHtml).join("");
  $("#biz-butcher").innerHTML = EAT_SHOP.butcher.map(bizCardHtml).join("");
  $("#biz-drinks").innerHTML = EAT_SHOP.drinks.map(bizCardHtml).join("");
}

// ──────────────────────────────────────────
// Render: Safety tab
// ──────────────────────────────────────────
function renderSafety() {
  $("#hospital-list").innerHTML = SAFETY.hospitals.map((h) => `
    <article class="hospital-card ${h.primary ? "primary" : ""}">
      <div class="role">${h.role}</div>
      <h3>${h.name}</h3>
      <div class="meta">${h.distance} · ${h.address}</div>
      <div class="actions">
        <a class="btn btn-primary" href="${telLink(h.phone)}">Call ${h.phone}</a>
        <a class="btn btn-secondary" href="${gmapsDir(h.address)}" target="_blank" rel="noopener">Directions</a>
      </div>
    </article>
  `).join("");
}

// ──────────────────────────────────────────
// Render: Pack tab
// ──────────────────────────────────────────
function familyOptions(state) {
  return state.families.map((f) =>
    `<option value="${f.id}" ${f.id === uiState.currentFamilyId ? "selected" : ""}>${f.name}</option>`
  ).join("");
}

function flagsHtml(item) {
  const flags = [];
  if (item.shared) flags.push('<span class="flag flag--shared">Group share</span>');
  if (item.perFamily) flags.push('<span class="flag flag--perfamily">Per family</span>');
  if (item.essential) flags.push('<span class="flag flag--essential">Essential</span>');
  return flags.length ? `<div class="item-flags">${flags.join("")}</div>` : "";
}

function claimPillHtml(itemId, state) {
  const claims = state.claims[itemId] || [];
  if (claims.length === 0) return "";
  const me = uiState.currentFamilyId;
  if (claims.length === 1) {
    const fam = state.families.find((f) => f.id === claims[0]);
    if (!fam) return "";
    const isMe = claims[0] === me;
    return `<span class="claim-pill ${isMe ? "claim-pill--mine" : "claim-pill--other"}">${fam.name} ✓</span>`;
  }
  // Multiple claims
  const names = claims
    .map((id) => state.families.find((f) => f.id === id)?.name)
    .filter(Boolean);
  return `<span class="claim-pill claim-pill--shared-multi">${names.length} families ✓</span>`;
}

function itemRowHtml(item, state) {
  const claims = state.claims[item.id] || [];
  const claimedByMe = claims.includes(uiState.currentFamilyId);
  const claimedByOther = !claimedByMe && claims.length > 0;
  let cls = "item-row";
  if (claimedByMe) cls += " claimed-by-me";
  else if (claimedByOther) cls += " claimed-by-other";

  return `
    <div class="${cls}" data-item-id="${item.id}" role="button" tabindex="0">
      <div class="check"></div>
      <div class="item-body">
        <div class="item-name">${item.name}</div>
        ${flagsHtml(item)}
        ${item.note ? `<div class="item-note">${item.note}</div>` : ""}
      </div>
      ${claimPillHtml(item.id, state)}
    </div>
  `;
}

function filterItem(item, state) {
  const claims = state.claims[item.id] || [];
  switch (uiState.filter) {
    case "unclaimed":
      // Hide perFamily items from "unclaimed" — they're meant per-family, not group-claimed
      return !item.perFamily && claims.length === 0;
    case "mine":
      return claims.includes(uiState.currentFamilyId);
    case "shared":
      return !!item.shared;
    case "essential":
      return !!item.essential;
    case "all":
    default:
      return true;
  }
}

function renderChecklist(state) {
  const root = $("#checklist");
  const html = window.CHECKLIST.map((group) => {
    const visibleSubgroups = group.subgroups
      .map((sg) => {
        const visibleItems = sg.items
          .map((rawItem) => {
            const id = `${slugify(group.group)}.${slugify(sg.name)}.${slugify(rawItem.name)}`;
            const item = { ...rawItem, id, group: group.group, subgroup: sg.name };
            return item;
          })
          .filter((item) => filterItem(item, state));
        return { name: sg.name, items: visibleItems };
      })
      .filter((sg) => sg.items.length > 0);

    if (visibleSubgroups.length === 0) return "";

    const totalItems = group.subgroups.reduce((sum, sg) => sum + sg.items.length, 0);
    const collapsed = uiState.collapsedGroups[group.group] ? "collapsed" : "";

    return `
      <section class="group ${collapsed}" data-group="${group.group}">
        <button class="group-header" data-group-toggle="${group.group}">
          <span>${group.group}</span>
          <span>
            <span class="group-count">${totalItems}</span>
            <span class="group-caret">▾</span>
          </span>
        </button>
        <div class="group-body">
          ${group.note ? `<div class="group-note">${group.note}</div>` : ""}
          ${visibleSubgroups.map((sg) => `
            <div class="subgroup-title">${sg.name}</div>
            ${sg.items.map((item) => itemRowHtml(item, state)).join("")}
          `).join("")}
        </div>
      </section>
    `;
  }).join("");

  root.innerHTML = html || `<div class="card"><p>No items match this filter.</p></div>`;
}

function slugify(s) {
  return s.toLowerCase().replace(/&/g, "and").replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, "");
}

function renderPack(state) {
  $("#family-select").innerHTML = familyOptions(state);
  $("#trip-code").textContent = state.tripCode;
  renderProgress(state);
  renderChecklist(state);
}

function renderProgress(state) {
  const ids = window.CHECKLIST.flatMap((g) =>
    g.subgroups.flatMap((sg) =>
      sg.items.map((it) => `${slugify(g.group)}.${slugify(sg.name)}.${slugify(it.name)}`)));
  const total = ids.length;
  const claimed = ids.filter((id) => (state.claims[id] || []).length > 0).length;
  const pct = total ? Math.round((claimed / total) * 100) : 0;
  $("#pack-progress").innerHTML = `
    <div class="pack-progress__bar"><span style="width:${pct}%"></span></div>
    <div class="pack-progress__label">${claimed} of ${total} items claimed</div>
  `;
}

// ──────────────────────────────────────────
// Wire up checklist interactions
// ──────────────────────────────────────────
function wirePack() {
  // Family select
  $("#family-select").addEventListener("change", (e) => {
    uiState.currentFamilyId = e.target.value;
    saveUI();
    renderChecklist(sync.getState());
  });

  // Rename modal
  const closeRenameModal = () => { $("#rename-modal").hidden = true; };
  const saveRenameModal = () => {
    const inputs = $$("#rename-inputs input");
    const updated = inputs.map((inp, i) => ({
      id: sync.getState().families[i].id,
      name: inp.value.trim() || sync.getState().families[i].name,
    }));
    sync.setFamilies(updated);
    closeRenameModal();
    toast("✓ Names saved", 2800);
  };
  $("#rename-families").addEventListener("click", openRenameModal);
  $("#rename-cancel").addEventListener("click", closeRenameModal);
  $("#rename-save").addEventListener("click", saveRenameModal);

  // Enter inside any input also saves (common keyboard expectation)
  $("#rename-inputs").addEventListener("keydown", (e) => {
    if (e.key === "Enter") {
      e.preventDefault();
      saveRenameModal();
    }
  });
  // Backdrop click closes the modal (only when clicking the dim overlay, not the white body)
  $("#rename-modal").addEventListener("click", (e) => {
    if (e.target.id === "rename-modal") closeRenameModal();
  });
  // Escape key closes it too
  document.addEventListener("keydown", (e) => {
    if (e.key === "Escape" && !$("#rename-modal").hidden) closeRenameModal();
  });

  // Trip-code copy
  $("#copy-trip-code").addEventListener("click", async () => {
    try {
      await navigator.clipboard.writeText(sync.getState().tripCode);
      toast("Trip code copied");
    } catch {
      toast("Copy failed — code: " + sync.getState().tripCode);
    }
  });

  // Filter chips
  $("#filter-chips").addEventListener("click", (e) => {
    const btn = e.target.closest("[data-filter]");
    if (!btn) return;
    uiState.filter = btn.dataset.filter;
    saveUI();
    $$("#filter-chips .chip").forEach((c) => c.classList.toggle("chip--active", c === btn));
    renderChecklist(sync.getState());
  });

  // Reset claims
  $("#reset-claims").addEventListener("click", () => {
    if (!confirm("Reset everyone's claims? This affects all families.")) return;
    sync.resetClaims();
    toast("All claims cleared");
  });

  // Item toggle + group toggle (event delegation)
  $("#checklist").addEventListener("click", (e) => {
    const groupToggle = e.target.closest("[data-group-toggle]");
    if (groupToggle) {
      const name = groupToggle.dataset.groupToggle;
      uiState.collapsedGroups[name] = !uiState.collapsedGroups[name];
      saveUI();
      const section = $(`.group[data-group="${name}"]`);
      section.classList.toggle("collapsed");
      return;
    }
    const row = e.target.closest(".item-row");
    if (!row) return;
    handleClaim(row);
  });
  // Keyboard support
  $("#checklist").addEventListener("keydown", (e) => {
    if (e.key !== "Enter" && e.key !== " ") return;
    const row = e.target.closest(".item-row");
    if (!row) return;
    e.preventDefault();
    handleClaim(row);
  });
}

function handleClaim(row) {
  const itemId = row.dataset.itemId;
  const before = sync.getState().claims[itemId] || [];
  const after = sync.toggleClaim(itemId, uiState.currentFamilyId);
  const fam = sync.getFamily(uiState.currentFamilyId);
  const wasClaimedByMe = before.includes(uiState.currentFamilyId);
  if (wasClaimedByMe) {
    toast(`Unclaimed for ${fam?.name || "you"}`);
  } else {
    toast(`Claimed by ${fam?.name || "you"}`);
    // If others had already claimed, warn
    const others = (after || []).filter((id) => id !== uiState.currentFamilyId);
    if (others.length > 0) {
      const otherNames = others
        .map((id) => sync.getFamily(id)?.name)
        .filter(Boolean)
        .join(", ");
      setTimeout(() => toast(`Also claimed by ${otherNames} — chat to coordinate`, 3200), 1000);
    }
  }
}

function openRenameModal() {
  const state = sync.getState();
  $("#rename-inputs").innerHTML = state.families
    .map((f, i) => `<input class="modal-input" type="text" value="${f.name}" placeholder="Family ${i + 1}" maxlength="20">`)
    .join("");
  $("#rename-modal").hidden = false;
}

// ──────────────────────────────────────────
// Tab navigation
// ──────────────────────────────────────────
function switchTab(name) {
  $$(".screen").forEach((s) => { s.hidden = s.dataset.screen !== name; });
  $$(".nav-btn").forEach((b) => b.classList.toggle("nav-btn--active", b.dataset.nav === name));
  if (name === "park") {
    // Lazy-init map after the section is visible (Leaflet needs the container in the DOM with size)
    setTimeout(renderMap, 50);
    if (mapInstance) setTimeout(() => mapInstance.invalidateSize(), 100);
  }
  // Scroll to top of new section
  window.scrollTo({ top: 0, behavior: "instant" in window ? "instant" : "auto" });
}

function wireNav() {
  $$(".nav-btn").forEach((btn) => {
    btn.addEventListener("click", () => switchTab(btn.dataset.nav));
  });
}

// ──────────────────────────────────────────
// Sync mode indicator
// ──────────────────────────────────────────
function updateSyncPill(mode) {
  const pill = $("#sync-pill");
  if (mode === "cloud") {
    pill.dataset.mode = "cloud";
    pill.textContent = "● Live sync";
  } else {
    pill.dataset.mode = "local";
    pill.textContent = "Offline";
  }
}

window.addEventListener("sync:mode", (e) => updateSyncPill(e.detail));

// ──────────────────────────────────────────
// Boot
// ──────────────────────────────────────────
function boot() {
  renderPark();
  renderForecast();
  renderDo();
  renderEat();
  renderSafety();
  wireNav();
  wirePack();

  // Subscribe to sync — re-render pack section on every change
  sync.subscribe((state) => {
    renderPack(state);
  });

  // Render map immediately too (Park is the default tab)
  setTimeout(renderMap, 100);
}

if (document.readyState === "loading") {
  document.addEventListener("DOMContentLoaded", boot);
} else {
  boot();
}
