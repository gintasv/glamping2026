// Sync layer — wraps Firebase Firestore with a local-only fallback.
//
// If window.FIREBASE_CONFIG is a valid config object, we boot the Firebase SDK
// from the CDN and subscribe to a single Firestore document for the trip.
// If it isn't, every operation falls back to localStorage. Same API either way.
//
// State shape:
//   { tripCode, families: [{id, name}], claims: { [itemId]: [familyId, ...] },
//     customFood: [{ id, name, addedBy, addedAt }] }

const TRIP_CODE = "devils-lake-2026-06";
const LS_KEY = `camp:${TRIP_CODE}`;
// The family roster is now defined in code (there's no in-app rename), so this
// list is the single source of truth. Names here survive a Firestore reset and
// override whatever families happen to be stored locally or in the cloud doc.
const DEFAULT_FAMILIES = [
  { id: "fam-1", name: "Vasiliauskas" },
  { id: "fam-2", name: "Butkus" },
  { id: "fam-3", name: "Kopec" },
  { id: "fam-4", name: "Zabielskas" },
  { id: "fam-5", name: "Janusauskas/Jones" },
  { id: "fam-6", name: "Tolstovas" },
];

// Families are code-defined and authoritative: always return the roster above,
// ignoring any families persisted locally or received from the cloud. This
// keeps every device on the same names and drops stale slots (e.g. an old
// "Family 7") without needing a migration. Claims still sync normally.
function normalizeFamilies(_families) {
  return DEFAULT_FAMILIES.map((f) => ({ ...f }));
}

function freshState() {
  return {
    tripCode: TRIP_CODE,
    families: DEFAULT_FAMILIES.slice(),
    claims: {},
    customFood: [],
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
      customFood: Array.isArray(parsed.customFood) ? parsed.customFood : [],
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
    // True once the user has made an edit (claim/rename/reset) that isn't yet
    // confirmed in the cloud. A freshly-loaded device has default data and a
    // current Date.now() timestamp; without this flag it would look "newer"
    // than the real shared doc and clobber everyone's data on connect.
    this.hasLocalEdits = false;
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

  // ─── Custom food items (user-added, synced like claims) ───
  addCustomFood(name, familyId) {
    const id = `custom.${Date.now()}-${Math.floor(Math.random() * 1e6)}`;
    this.state.customFood = [
      ...this.state.customFood,
      { id, name, addedBy: familyId, addedAt: Date.now() },
    ];
    // Auto-claim for the family that added it ("we're bringing this").
    this.state.claims[id] = [familyId];
    this._commit();
    return id;
  }

  removeCustomFood(id) {
    this.state.customFood = this.state.customFood.filter((c) => c.id !== id);
    delete this.state.claims[id];
    this._commit();
  }

  // ─── Persistence ───
  _commit() {
    this.state.updatedAt = Date.now();
    // Funnel for all user mutations (renames, claims, reset) — mark the state
    // as having unsynced local edits so the snapshot handler will push it up
    // instead of being overwritten by remote.
    this.hasLocalEdits = true;
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
      customFood: this.state.customFood,
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
            customFood: this.state.customFood,
            updatedAt: Date.now(),
          });
          return;
        }
        const remote = snap.data();
        const remoteTs = remote.updatedAt || 0;
        const localTs = this.state.updatedAt || 0;
        // Push local up ONLY when we have genuine unsynced user edits that are
        // newer than the cloud. Otherwise the remote doc is the shared source
        // of truth — adopt it. This stops a freshly-loaded device (default
        // names, no claims, but a current Date.now() timestamp) from looking
        // "newer" and overwriting everyone's renames and claims on connect.
        if (this.hasLocalEdits && localTs > remoteTs) {
          this._pushToCloud().catch(() => {});
        } else {
          this.applyingRemote = true;
          this.state = {
            tripCode: TRIP_CODE,
            families: normalizeFamilies(remote.families || this.state.families),
            claims: remote.claims || {},
            customFood: Array.isArray(remote.customFood) ? remote.customFood : [],
            updatedAt: remoteTs,
          };
          writeLocal(this.state);
          this._emit();
          this.applyingRemote = false;
          // Local now matches the cloud — our edits (if any) are confirmed.
          this.hasLocalEdits = false;
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
