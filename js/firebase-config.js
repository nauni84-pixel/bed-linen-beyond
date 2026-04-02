// ============================================================
//  js/firebase-config.js
//  Shared Firebase setup — loaded by ALL pages.
//
//  ⚠️  IMPORTANT: Replace every "YOUR_..." value below.
//
//  How to get your config (takes 5 minutes):
//  1. Go to https://console.firebase.google.com
//  2. Click your project → ⚙️ Project Settings (gear icon)
//  3. Scroll to "Your apps" → click </> (Web icon)
//  4. Register your app → copy the firebaseConfig object
//  5. Paste each value below, replacing the placeholders
// ============================================================

// For Firebase JS SDK v7.20.0 and later, measurementId is optional
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
//    Safe to call once — all pages share this file.
firebase.initializeApp(firebaseConfig);

// ── Global Service References ───────────────────────────────
//    These three variables are available in app.js,
//    admin.js, and auth.js — because they load AFTER
//    this file in every HTML page.
const db      = firebase.firestore();   // ← Product database
const auth    = firebase.auth();        // ← Login system