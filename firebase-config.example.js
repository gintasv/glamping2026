// Copy this file to `firebase-config.js` and paste your Firebase project's
// web app config here. Without it, the app runs in "Local only" mode.
//
// How to get this config (5 minutes, free):
//   1. Go to https://console.firebase.google.com
//   2. Click "Add project" → give it any name (e.g. "devils-lake-2026") → skip Analytics → Create
//   3. From the project Overview page, click the </> Web icon to "Add app"
//   4. Register the app with a nickname (no hosting needed) → it shows a config snippet
//   5. Copy the values from that snippet into the object below
//   6. In the left sidebar → Build → Firestore Database → Create database
//        → start in "test mode" (lets the app read/write for 30 days; renew or set rules later)
//        → pick the location closest to you
//   7. Save this file as `firebase-config.js` and reload the app — sync pill should turn yellow ☁️ Synced

window.FIREBASE_CONFIG = {
  apiKey: "YOUR_API_KEY",
  authDomain: "YOUR_PROJECT.firebaseapp.com",
  projectId: "YOUR_PROJECT_ID",
  storageBucket: "YOUR_PROJECT.appspot.com",
  messagingSenderId: "1234567890",
  appId: "1:1234567890:web:abcdef",
};
