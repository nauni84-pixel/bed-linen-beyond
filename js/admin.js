// ============================================================
//  js/admin.js — Admin Dashboard (GitHub Images version)
//  Images are hosted in the GitHub repo /images/ folder.
//  Firebase Storage is NOT used.
// ============================================================


// ─────────────────────────────────────────────
// ⚠️  CONFIGURATION — CHANGE THIS LINE
//     Replace with your actual GitHub Pages URL.
//     Find it in: repo → Settings → Pages
//
//     Format:  https://YOUR-USERNAME.github.io/YOUR-REPO-NAME
//     Example: https://nand.github.io/bed-linen-beyond
// ─────────────────────────────────────────────
const GITHUB_PAGES_URL = "https://YOUR-USERNAME.github.io/YOUR-REPO-NAME";

// ⚠️  CHANGE THIS TOO
//     Your GitHub username and repo name — used to build
//     the upload link that opens GitHub directly.
const GITHUB_USERNAME  = "YOUR-USERNAME";
const GITHUB_REPO      = "YOUR-REPO-NAME";

// The upload page URL (opens GitHub's image upload page)
const GITHUB_UPLOAD_URL = `https://github.com/${GITHUB_USERNAME}/${GITHUB_REPO}/upload/main/images`;


// ─────────────────────────────────────────────
// 1. AUTH GUARD
//    Runs immediately — checks if owner is logged in.
//    White overlay on admin.html hides content until confirmed.
// ─────────────────────────────────────────────
auth.onAuthStateChanged(user => {
  if (!user) {
    window.location.href = "login.html";
    return;
  }
  // ✅ Logged in — reveal the page
  document.getElementById("auth-loading").remove();
  document.getElementById("admin-email").textContent = user.email;
  loadAdminProducts();
});


// ─────────────────────────────────────────────
// 2. LOGOUT
// ─────────────────────────────────────────────
function logout() {
  auth.signOut()
    .then(() => { window.location.href = "login.html"; })
    .catch(err => console.error("Logout error:", err));
}


// ─────────────────────────────────────────────
// 3. IMAGE PREVIEW + STEP 2 REVEAL
//    When the owner picks a file:
//    → Show a local preview (so they can see the image)
//    → Auto-fill the filename field
//    → Show the Step 2 section (GitHub upload instructions)
//    → Update the constructed URL preview
// ─────────────────────────────────────────────
document.getElementById("prod-image-file").addEventListener("change", function () {
  const file = this.files[0];
  if (!file) return;

  // Show preview using local file (FileReader — no upload needed)
  const reader = new FileReader();
  reader.onload = (e) => {
    document.getElementById("preview-img").src = e.target.result;
    document.getElementById("image-preview").classList.remove("hidden");
  };
  reader.readAsDataURL(file);

  // Auto-fill filename — cleaned up (spaces → hyphens, lowercase)
  const cleanName = file.name.toLowerCase().replace(/\s+/g, "-");
  document.getElementById("prod-filename").value = cleanName;

  // Show Step 2 section
  document.getElementById("step2-section").classList.remove("hidden");

  // Set GitHub upload link
  document.getElementById("github-upload-link").href = GITHUB_UPLOAD_URL;

  // Update URL preview
  updateURLPreview();
});

// Update the URL preview whenever the filename changes
document.getElementById("prod-filename").addEventListener("input", updateURLPreview);

function updateURLPreview() {
  const filename = document.getElementById("prod-filename").value.trim();
  const previewEl = document.getElementById("url-preview");

  if (filename) {
    previewEl.textContent = `${GITHUB_PAGES_URL}/images/${filename}`;
  } else {
    previewEl.textContent = "Enter a filename above";
  }
}


// ─────────────────────────────────────────────
// 4. LOAD PRODUCTS — REAL-TIME FROM FIRESTORE
// ─────────────────────────────────────────────
function loadAdminProducts() {
  db.collection("products")
    .orderBy("createdAt", "desc")
    .onSnapshot(
      snapshot => {
        const products = snapshot.docs.map(doc => ({
          id: doc.id,
          ...doc.data()
        }));
        renderAdminProducts(products);
      },
      error => {
        console.error("Firestore error:", error);
        showError("Failed to load products. Check console for details.");
      }
    );
}


// ─────────────────────────────────────────────
// 5. RENDER PRODUCT ROWS
// ─────────────────────────────────────────────
function renderAdminProducts(products) {
  const list = document.getElementById("admin-product-list");

  if (products.length === 0) {
    list.innerHTML = `
      <div class="text-center py-16">
        <i class="fa-solid fa-box-open text-3xl text-gray-200 mb-4 block"></i>
        <p class="heading-font text-2xl text-gray-300 italic mb-2">No products yet.</p>
        <p class="text-sm text-gray-400">Add your first product using the form on the left.</p>
      </div>
    `;
    return;
  }

  list.innerHTML = products.map(p => `
    <div class="flex flex-col md:flex-row items-start md:items-center
                space-y-4 md:space-y-0 md:space-x-6
                p-6 bg-gray-50 rounded-xl border border-gray-100 hover:border-black transition"
         id="row-${p.id}">

      <!-- Thumbnail -->
      <img src="${p.image}" alt="${escapeHtml(p.name)}"
        class="w-20 h-20 object-cover rounded-lg shadow-sm flex-shrink-0 bg-gray-100"
        onerror="this.src='https://images.unsplash.com/photo-1522771739844-6a9f6d5f14af?auto=format&fit=crop&q=80&w=200'">

      <!-- Editable Fields -->
      <div class="flex-1 space-y-3 min-w-0">

        <!-- Name -->
        <div class="flex items-center space-x-3">
          <span class="text-[9px] uppercase tracking-widest text-gray-400 w-16 flex-shrink-0">Name</span>
          <input type="text" id="name-${p.id}" value="${escapeHtml(p.name)}"
            class="flex-1 bg-transparent border-b border-gray-200 py-1
                   focus:outline-none focus:border-black transition text-sm font-light min-w-0">
        </div>

        <!-- Price -->
        <div class="flex items-center space-x-3">
          <span class="text-[9px] uppercase tracking-widest text-gray-400 w-16 flex-shrink-0">Price €</span>
          <input type="number" id="price-${p.id}" value="${p.price}" step="0.01" min="0"
            class="flex-1 bg-transparent border-b border-gray-200 py-1
                   focus:outline-none focus:border-black transition text-sm font-semibold min-w-0">
        </div>

        <!-- Description -->
        <div class="flex items-center space-x-3">
          <span class="text-[9px] uppercase tracking-widest text-gray-400 w-16 flex-shrink-0">Info</span>
          <input type="text" id="desc-${p.id}" value="${escapeHtml(p.description || '')}" maxlength="80"
            class="flex-1 bg-transparent border-b border-gray-200 py-1
                   focus:outline-none focus:border-black transition text-xs text-gray-500 min-w-0">
        </div>

        <!-- Current image URL (read-only info) -->
        <div class="flex items-start space-x-3">
          <span class="text-[9px] uppercase tracking-widest text-gray-400 w-16 flex-shrink-0 mt-1">Image</span>
          <p class="text-[10px] text-gray-300 font-mono break-all flex-1">${p.image}</p>
        </div>

      </div>

      <!-- Action Buttons -->
      <div class="flex items-center space-x-3 flex-shrink-0 self-center">
        <button onclick="saveProduct('${p.id}')"
          class="text-[10px] uppercase tracking-widest border border-black px-4 py-2
                 hover:bg-black hover:text-white transition">
          Save
        </button>
        <button onclick="deleteProduct('${p.id}', '${escapeHtml(p.name)}')"
          class="text-gray-300 hover:text-red-500 transition px-2" title="Delete">
          <i class="fa-solid fa-trash-can"></i>
        </button>
      </div>

    </div>
  `).join("");
}


// ─────────────────────────────────────────────
// 6. SAVE / UPDATE PRODUCT (name, price, description)
//    Image URL is not changed here — to change an
//    image, delete the product and re-add it.
// ─────────────────────────────────────────────
async function saveProduct(productId) {
  const name  = document.getElementById(`name-${productId}`).value.trim();
  const price = parseFloat(document.getElementById(`price-${productId}`).value);
  const desc  = document.getElementById(`desc-${productId}`).value.trim();

  if (!name || isNaN(price) || price < 0) {
    showError("Please enter a valid product name and price.");
    return;
  }

  try {
    await db.collection("products").doc(productId).update({
      name,
      price,
      description: desc,
      updatedAt: firebase.firestore.FieldValue.serverTimestamp()
    });
    showSuccess(`"${name}" updated successfully.`);
  } catch (error) {
    console.error("Update error:", error);
    showError("Failed to save changes. Please try again.");
  }
}


// ─────────────────────────────────────────────
// 7. DELETE PRODUCT
//    Only removes from Firestore.
//    The image file stays in GitHub (that's fine —
//    GitHub storage is unlimited for public repos).
// ─────────────────────────────────────────────
async function deleteProduct(productId, productName) {
  if (!confirm(`Remove "${productName}" from your boutique?\n\nThis cannot be undone.`)) return;

  try {
    await db.collection("products").doc(productId).delete();
    showSuccess(`"${productName}" has been removed.`);
  } catch (error) {
    console.error("Delete error:", error);
    showError("Failed to delete. Please try again.");
  }
}


// ─────────────────────────────────────────────
// 8. ADD NEW PRODUCT — FORM SUBMISSION
//    No file upload needed here. The image already
//    lives in GitHub. We just save the URL to Firestore.
// ─────────────────────────────────────────────
document.getElementById("add-product-form").addEventListener("submit", async (e) => {
  e.preventDefault();

  const name     = document.getElementById("prod-name").value.trim();
  const price    = parseFloat(document.getElementById("prod-price").value);
  const desc     = document.getElementById("prod-desc").value.trim();
  const filename = document.getElementById("prod-filename").value.trim();

  // ── Validation ──
  if (!name) {
    showError("Please enter a product name.");
    return;
  }
  if (isNaN(price) || price < 0) {
    showError("Please enter a valid price.");
    return;
  }
  if (!filename) {
    showError("Please enter the image filename.");
    return;
  }

  // ── Construct the GitHub Pages image URL ──
  const imageURL = `${GITHUB_PAGES_URL}/images/${filename}`;

  setFormLoading(true);

  try {
    await db.collection("products").add({
      name,
      price,
      description: desc,
      image:       imageURL,
      createdAt:   firebase.firestore.FieldValue.serverTimestamp()
    });

    showSuccess(`"${name}" is now live in your boutique! ✨`);

    // Reset form
    e.target.reset();
    document.getElementById("image-preview").classList.add("hidden");
    document.getElementById("step2-section").classList.add("hidden");
    document.getElementById("url-preview").textContent = "";

  } catch (error) {
    console.error("Save error:", error);
    showError("Failed to save product. Please try again.");
  } finally {
    setFormLoading(false);
  }
});


// ─────────────────────────────────────────────
// 9. FORM LOADING STATE
// ─────────────────────────────────────────────
function setFormLoading(isLoading) {
  const btn = document.getElementById("submit-btn");
  btn.disabled = isLoading;
  btn.innerHTML = isLoading
    ? `<i class="fa-solid fa-spinner fa-spin"></i><span>Saving...</span>`
    : `<i class="fa-solid fa-plus"></i><span>Add Product to Boutique</span>`;
}


// ─────────────────────────────────────────────
// 10. TOAST NOTIFICATIONS
// ─────────────────────────────────────────────
function showSuccess(message) { showToast(message, "success"); }
function showError(message)   { showToast(message, "error");   }

function showToast(message, type) {
  const toast     = document.getElementById("toast");
  const toastMsg  = document.getElementById("toast-message");
  const toastIcon = document.getElementById("toast-icon");

  toastMsg.textContent = message;

  if (type === "success") {
    toast.className = `fixed bottom-6 right-6 z-50 bg-black text-white px-6 py-4 shadow-xl
                       flex items-center space-x-3 max-w-sm transition-transform duration-500`;
    toastIcon.className = "fa-solid fa-check text-green-400 flex-shrink-0";
  } else {
    toast.className = `fixed bottom-6 right-6 z-50 bg-red-600 text-white px-6 py-4 shadow-xl
                       flex items-center space-x-3 max-w-sm transition-transform duration-500`;
    toastIcon.className = "fa-solid fa-circle-exclamation flex-shrink-0";
  }

  toast.style.transform = "translateX(0)";
  setTimeout(() => { toast.style.transform = "translateX(150%)"; }, 4000);
}


// ─────────────────────────────────────────────
// 11. HELPER — ESCAPE HTML
// ─────────────────────────────────────────────
function escapeHtml(str) {
  if (!str) return "";
  return String(str)
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;");
}
