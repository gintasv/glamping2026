// Devil's Lake Camping Planner — UI logic
// Renders all 5 screens, handles tab navigation, family selection, and checklist interactions.

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

// ──────────────────────────────────────────
// Render: Park tab
// ──────────────────────────────────────────
function renderPark() {
  $("#park-about").textContent = PARK.about;

  $("#park-address").textContent = TRIP.parkAddress;
  $("#open-gmaps").href = gmapsDir(TRIP.parkAddress);
  $("#open-amaps").href = applyMapsLink(TRIP.parkAddress);

  // Amenities
  $("#amenities-list").innerHTML = CAMPSITE.amenities.map((a) => `
    <li>
      <div class="amenity-icon">${renderIcon(a.icon)}</div>
      <div>
        <div class="amenity-title">${a.title}</div>
        <div class="amenity-detail">${a.detail}</div>
      </div>
    </li>
  `).join("");

  // Cell
  $("#cell-summary").textContent = CAMPSITE.cell.summary;
  $("#carrier-list").innerHTML = CAMPSITE.cell.carriers.map((c) => `
    <li>
      <span class="carrier-name">${c.name}</span>
      <span class="carrier-strength" data-s="${c.strength}">${c.strength}</span>
      <span class="carrier-note">${c.note}</span>
    </li>
  `).join("");

  // Bullets
  $("#park-bullets").innerHTML = PARK.bullets.map((b) => `<li>${b}</li>`).join("");
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
  // Trails
  $("#trail-grid").innerHTML = TRAILS.map((t) => `
    <article class="trail-card">
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
  `).join("");

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
      <div class="ico">${a.icon}</div>
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
        <div style="margin-top:8px">
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
  const phoneBtn = biz.phone
    ? `<a class="btn btn-secondary" href="${telLink(biz.phone)}">Call</a>` : "";
  const dirBtn = biz.address && !biz.info
    ? `<a class="btn btn-primary" href="${gmapsDir(biz.address)}" target="_blank" rel="noopener">Directions</a>` : "";
  return `
    <article class="biz-card ${cls.join(" ")}">
      <h3>${biz.name}${biz.kidFriendly ? '<span class="tag-kid">Kid-friendly</span>' : ""}</h3>
      <p class="biz-blurb">${biz.blurb}</p>
      <div class="biz-meta">
        ${biz.address ? `<div><strong>Address</strong> ${biz.address}</div>` : ""}
        ${biz.phone ? `<div><strong>Phone</strong> ${biz.phone}</div>` : ""}
        ${biz.hours ? `<div><strong>Hours</strong> ${biz.hours}</div>` : ""}
      </div>
      ${(phoneBtn || dirBtn) ? `<div class="biz-actions">${dirBtn}${phoneBtn}</div>` : ""}
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

  $("#park-contacts").innerHTML = SAFETY.parkContacts.map((c) => `
    <div class="contact-row">
      <span class="contact-row__name">${c.name}</span>
      <a class="contact-row__phone" href="${telLink(c.phone)}">${c.phone}</a>
    </div>
  `).join("");

  $("#kid-safety").innerHTML = SAFETY.kidSafety.map((k) => `<li>${k}</li>`).join("");

  $("#weather-card").innerHTML = `
    <h2>June at Devil's Lake</h2>
    <p>${SAFETY.weather.summary}</p>
    <div class="weather-stats">
      <div class="stat"><div class="stat-value">79°F</div><div class="stat-label">Avg high</div></div>
      <div class="stat"><div class="stat-value">56°F</div><div class="stat-label">Avg low</div></div>
      <div class="stat"><div class="stat-value">5.58"</div><div class="stat-label">Rain</div></div>
    </div>
    <a class="btn btn-primary" href="${SAFETY.weather.nwsUrl}" target="_blank" rel="noopener">Live NWS forecast</a>
  `;
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
  renderChecklist(state);
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
    if (!confirm("Reset everyone's claims? This affects all 5 families.")) return;
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
