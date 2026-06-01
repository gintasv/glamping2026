// Sync layer — wraps Firebase Firestore with a local-only fallback.
//
// If window.FIREBASE_CONFIG is a valid config object, we boot the Firebase SDK
// from the CDN and subscribe to a single Firestore document for the trip.
// If it isn't, every operation falls back to localStorage. Same API either way.
//
// State shape:
//   { tripCode, families: [{id, name}], claims: { [itemId]: [familyId, ...] } }

const TRIP_CODE = "devils-lake-2026-06";
const LS_KEY = `camp:${TRIP_CODE}`;
const DEFAULT_FAMILIES = [
  { id: "fam-1", name: "Family 1" },
  { id: "fam-2", name: "Family 2" },
  { id: "fam-3", name: "Family 3" },
  { id: "fam-4", name: "Family 4" },
  { id: "fam-5", name: "Family 5" },
  { id: "fam-6", name: "Family 6" },
  { id: "fam-7", name: "Family 7" },
];

// Keep any existing families (preserving renames) and append any default
// families not already present by id — so adding slots #6/#7 migrates old
// saved state additively instead of resetting names.
function normalizeFamilies(families) {
  const valid = (Array.isArray(families) ? families : []).filter(
    (f) => f && typeof f.id === "string" && typeof f.name === "string"
  );
  const byId = new Set(valid.map((f) => f.id));
  for (const def of DEFAULT_FAMILIES) {
    if (!byId.has(def.id)) valid.push({ ...def });
  }
  return valid.length ? valid : DEFAULT_FAMILIES.slice();
}

function freshState() {
  return {
    tripCode: TRIP_CODE,
    families: DEFAULT_FAMILIES.slice(),
    claims: {},
    updatedAt: Date.now(),
  };
}

function readLocal() {
  try {
    const raw = localStorage.getItem(LS_KEY);
    if (!raw) return freshState();
    const parsed = JSON.parse(raw);
    // Defensive — make sure required keys exist
    return {
      tripCode: TRIP_CODE,
      families: normalizeFamilies(parsed.families),
      claims: parsed.claims && typeof parsed.claims === "object" ? parsed.claims : {},
      updatedAt: parsed.updatedAt || Date.now(),
    };
  } catch (e) {
    console.warn("sync: failed to read local state, resetting", e);
    return freshState();
  }
}

function writeLocal(state) {
  try {
    localStorage.setItem(LS_KEY, JSON.stringify(state));
  } catch (e) {
    console.warn("sync: failed to write local state", e);
  }
}

// ──────────────────────────────────────────
// Sync manager — single source of truth
// ──────────────────────────────────────────
class SyncManager {
  constructor() {
    this.state = readLocal();
    this.listeners = new Set();
    this.mode = "local";
    this.firestoreDoc = null;
    this.applyingRemote = false;
  }

  // Subscribe to state changes. Returns unsubscribe fn.
  subscribe(cb) {
    this.listeners.add(cb);
    cb(this.state);
    return () => this.listeners.delete(cb);
  }

  _emit() {
    this.listeners.forEach((cb) => cb(this.state));
  }

  // ─── Public API ───
  getState() { return this.state; }

  getFamily(id) {
    return this.state.families.find((f) => f.id === id) || null;
  }

  setFamilyName(id, name) {
    const fam = this.getFamily(id);
    if (!fam) return;
    fam.name = name.trim() || fam.name;
    this._commit({ families: this.state.families });
  }

  setFamilies(families) {
    this.state.families = families;
    this._commit({ families });
  }

  toggleClaim(itemId, familyId) {
    const current = this.state.claims[itemId] || [];
    let next;
    if (current.includes(familyId)) {
      next = current.filter((id) => id !== familyId);
    } else {
      next = [...current, familyId];
    }
    if (next.length === 0) {
      delete this.state.claims[itemId];
      this._commit({ claims: this.state.claims });
    } else {
      this.state.claims[itemId] = next;
      this._commit({ claims: this.state.claims });
    }
    return this.state.claims[itemId] || [];
  }

  resetClaims() {
    this.state.claims = {};
    this._commit({ claims: {} });
  }

  // ─── Persistence ───
  _commit() {
    this.state.updatedAt = Date.now();
    writeLocal(this.state);
    this._emit();
    if (this.mode === "cloud" && this.firestoreDoc && !this.applyingRemote) {
      this._pushToCloud().catch((err) => console.warn("sync: push failed", err));
    }
  }

  async _pushToCloud() {
    const { setDoc } = await import(
      "https://www.gstatic.com/firebasejs/10.13.0/firebase-firestore.js"
    );
    await setDoc(this.firestoreDoc, {
      tripCode: this.state.tripCode,
      families: this.state.families,
      claims: this.state.claims,
      updatedAt: this.state.updatedAt,
    });
  }

  async _initFirebase(config) {
    try {
      const { initializeApp } = await import(
        "https://www.gstatic.com/firebasejs/10.13.0/firebase-app.js"
      );
      const {
        getFirestore, doc, onSnapshot, setDoc,
      } = await import(
        "https://www.gstatic.com/firebasejs/10.13.0/firebase-firestore.js"
      );

      const app = initializeApp(config);
      const db = getFirestore(app);
      const ref = doc(db, "trips", TRIP_CODE);
      this.firestoreDoc = ref;

      // Subscribe to live updates
      onSnapshot(ref, (snap) => {
        if (!snap.exists()) {
          // Seed the doc with local state on first run
          setDoc(ref, {
            tripCode: this.state.tripCode,
            families: this.state.families,
            claims: this.state.claims,
            updatedAt: Date.now(),
          });
          return;
        }
        const remote = snap.data();
        const remoteTs = remote.updatedAt || 0;
        const localTs = this.state.updatedAt || 0;
        // Last-write-wins on identical timestamps; we always trust newer remote.
        if (remoteTs >= localTs) {
          this.applyingRemote = true;
          this.state = {
            tripCode: TRIP_CODE,
            families: normalizeFamilies(remote.families || this.state.families),
            claims: remote.claims || {},
            updatedAt: remoteTs,
          };
          writeLocal(this.state);
          this._emit();
          this.applyingRemote = false;
        } else {
          // Local is newer — push it up
          this._pushToCloud().catch(() => {});
        }
      });

      this.mode = "cloud";
      this.listeners.forEach((cb) => cb(this.state));
      return true;
    } catch (err) {
      console.warn("sync: Firebase init failed, staying local-only", err);
      this.mode = "local";
      return false;
    }
  }
}

const sync = new SyncManager();

// Lazy-init Firebase only if config is present
if (window.FIREBASE_CONFIG && window.FIREBASE_CONFIG.apiKey) {
  sync._initFirebase(window.FIREBASE_CONFIG).then((ok) => {
    if (ok) {
      // Notify the UI to update the sync pill
      window.dispatchEvent(new CustomEvent("sync:mode", { detail: "cloud" }));
    }
  });
}

window.SYNC = sync;
export default sync;
