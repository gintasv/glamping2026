// Template for `firebase-config.js`. The real `firebase-config.js` is committed
// to this repo and used by GitHub Pages. This example file just exists as a
// reference for what the shape should look like.
//
// IMPORTANT: this app expects you to set `window.FIREBASE_CONFIG = {...}`.
// Do NOT paste Firebase's default `import { initializeApp } ...` snippet here —
// that uses ES module imports which require a bundler. sync.js already loads
// the Firebase SDK from the CDN; you only need to provide the config values.
//
// How to set this up (5 minutes, free):
//   1. Go to https://console.firebase.google.com
//   2. Click "Add project" → give it any name → skip Analytics → Create
//   3. From the project Overview page, click the </> Web icon to "Add app"
//   4. Register the app with a nickname (no hosting needed) → it shows a config snippet
//   5. Copy ONLY the values (apiKey, authDomain, etc.) into the object below
//   6. In the left sidebar → Build → Firestore Database → Create database
//        → start in "test mode"
//        → pick the location closest to you
//   7. Save this file as `firebase-config.js` and reload the app — sync pill turns ☁️ Synced

window.FIREBASE_CONFIG = {
  apiKey: "YOUR_API_KEY",
  authDomain: "YOUR_PROJECT.firebaseapp.com",
  projectId: "YOUR_PROJECT_ID",
  storageBucket: "YOUR_PROJECT.appspot.com",
  messagingSenderId: "1234567890",
  appId: "1:1234567890:web:abcdef",
};
