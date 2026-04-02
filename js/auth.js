// ============================================================
//  js/auth.js — Login Page Logic
//  Used by: login.html
// ============================================================


// ─────────────────────────────────────────────
// 1. SKIP LOGIN IF ALREADY AUTHENTICATED
//    If the owner's browser still has a valid
//    session from a previous login, jump straight
//    to the dashboard without making them log in again.
// ─────────────────────────────────────────────
auth.onAuthStateChanged(user => {
  if (user) {
    // Already logged in → redirect to admin
    window.location.href = "admin.html";
  }
  // If not logged in → stay on login.html (do nothing)
});


// ─────────────────────────────────────────────
// 2. DOM REFERENCES
// ─────────────────────────────────────────────
const loginForm = document.getElementById("login-form");
const loginBtn  = document.getElementById("login-btn");
const btnText   = document.getElementById("btn-text");
const btnIcon   = document.getElementById("btn-icon");
const errorBox  = document.getElementById("error-box");
const errorText = document.getElementById("error-text");


// ─────────────────────────────────────────────
// 3. FORM SUBMISSION — SIGN IN
//    Sends email + password to Firebase Auth.
//    On success → onAuthStateChanged handles redirect.
//    On failure → friendly error shown on screen.
// ─────────────────────────────────────────────
loginForm.addEventListener("submit", async (e) => {
  e.preventDefault();

  const email    = document.getElementById("login-email").value.trim();
  const password = document.getElementById("login-password").value;

  // Basic client-side check
  if (!email || !password) {
    showError("Please enter your email and password.");
    return;
  }

  setLoading(true);
  hideError();

  try {
    // This is the actual Firebase login call
    await auth.signInWithEmailAndPassword(email, password);
    // If it works, onAuthStateChanged fires and redirects automatically

  } catch (error) {
    // Login failed — translate the Firebase error code
    showError(getFriendlyError(error.code));
    setLoading(false);
  }
});


// ─────────────────────────────────────────────
// 4. SHOW / HIDE PASSWORD TOGGLE
//    Called directly from the HTML button via onclick.
// ─────────────────────────────────────────────
function togglePasswordVisibility() {
  const input   = document.getElementById("login-password");
  const eyeIcon = document.getElementById("eye-icon");

  if (input.type === "password") {
    input.type        = "text";
    eyeIcon.className = "fa-solid fa-eye-slash text-sm";
  } else {
    input.type        = "password";
    eyeIcon.className = "fa-solid fa-eye text-sm";
  }
}


// ─────────────────────────────────────────────
// 5. LOADING STATE
//    Disables the button and shows a spinner
//    while Firebase is checking the credentials.
// ─────────────────────────────────────────────
function setLoading(isLoading) {
  loginBtn.disabled = isLoading;

  if (isLoading) {
    btnText.textContent = "Signing in...";
    btnIcon.className   = "fa-solid fa-spinner fa-spin";
  } else {
    btnText.textContent = "Enter Dashboard";
    btnIcon.className   = "fa-solid fa-right-to-bracket";
  }
}


// ─────────────────────────────────────────────
// 6. ERROR HELPERS
// ─────────────────────────────────────────────
function showError(message) {
  errorBox.classList.remove("hidden");
  errorText.textContent = message;
}

function hideError() {
  errorBox.classList.add("hidden");
}

// Translates Firebase's technical error codes into
// plain English messages the owner can understand.
function getFriendlyError(code) {
  const messages = {
    "auth/user-not-found":          "No account found with that email.",
    "auth/wrong-password":          "Incorrect password. Please try again.",
    "auth/invalid-email":           "Please enter a valid email address.",
    "auth/invalid-credential":      "Invalid email or password. Please check and retry.",
    "auth/too-many-requests":       "Too many failed attempts. Please wait a few minutes.",
    "auth/network-request-failed":  "Network error. Please check your connection."
  };
  return messages[code] || "Something went wrong. Please try again.";
}