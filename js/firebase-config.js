// ============================================================
//  js/firebase-config.js
//  Shared Firebase setup — loaded by ALL pages.
// ============================================================

const firebaseConfig = {
  apiKey: "AIzaSyAWWKtuX6FydfU3XCxvH_9h-S6zdVWWcwU",
  authDomain: "bed-linen-beyond.firebaseapp.com",
  projectId: "bed-linen-beyond",
  storageBucket: "bed-linen-beyond.firebasestorage.app",
  messagingSenderId: "887986449996",
  appId: "1:887986449996:web:35ffe66d0a75711a8f0ee9",
  measurementId: "G-CB72L1N6V1"
};

// ── Initialize Firebase ─────────────────────────────────────
if (!firebase.apps.length) {
  firebase.initializeApp(firebaseConfig);
}

// ── Global Service References ───────────────────────────────
// We wrap these in checks so the page doesn't crash if
// a specific library (like Auth) isn't loaded on that page.

const db = typeof firebase.firestore === "function" ? firebase.firestore() : null;
const auth = typeof firebase.auth === "function" ? firebase.auth() : null;
