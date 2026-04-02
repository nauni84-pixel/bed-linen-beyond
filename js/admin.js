// ============================================================
//  js/admin.js — Admin Dashboard Logic
//  Phase 3: Firebase Auth guard + Firestore + Storage
// ============================================================


// ─────────────────────────────────────────────
// 1. AUTH GUARD — RUNS FIRST, BEFORE ANYTHING
//    Firebase checks if the owner is logged in.
//
//    ✅ Logged in  → remove the loading overlay
//                    and show the dashboard.
//    ❌ Not logged in → redirect to login page.
//
//    The white overlay in admin.html hides the
//    page content until this check completes,
//    so strangers never see a flash of the UI.
// ─────────────────────────────────────────────
auth.onAuthStateChanged(user => {
  if (!user) {
    // No active session → go to login
    window.location.href = "login.html";
    return;
  }

  // ✅ Authenticated — reveal the dashboard
  document.getElementById("auth-loading").remove();
  document.getElementById("admin-email").textContent = user.email;
  loadAdminProducts(); // Start listening for products
});


// ─────────────────────────────────────────────
// 2. LOGOUT
//    Signs the owner out and returns them
//    to the login page.
// ─────────────────────────────────────────────
function logout() {
  auth.signOut()
    .then(() => { window.location.href = "login.html"; })
    .catch(err => console.error("Logout error:", err));
}


// ─────────────────────────────────────────────
// 3. LOAD PRODUCTS (REAL-TIME)
//    onSnapshot keeps the list in sync.
//    When you edit or delete here, the storefront
//    updates automatically — no refresh needed.
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
        showError("Failed to load products. Check the console for details.");
      }
    );
}


// ─────────────────────────────────────────────
// 4. RENDER PRODUCT ROWS IN ADMIN LIST
//    Each row has editable name/price/description
//    plus Save and Delete buttons.
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
                p-6 bg-gray-50 rounded-xl border border-gray-100
                hover:border-black transition"
         id="row-${p.id}">

      <!-- Thumbnail -->
      <img
        src="${p.image}"
        alt="${p.name}"
        class="w-20 h-20 object-cover rounded-lg shadow-sm flex-shrink-0"
        onerror="this.src='https://images.unsplash.com/photo-1522771739844-6a9f6d5f14af?auto=format&fit=crop&q=80&w=200'"
      >

      <!-- Editable Fields -->
      <div class="flex-1 space-y-3 min-w-0">

        <!-- Name -->
        <div class="flex items-center space-x-3">
          <span class="text-[9px] uppercase tracking-widest text-gray-400 w-16 flex-shrink-0">Name</span>
          <input
            type="text"
            id="name-${p.id}"
            value="${escapeHtml(p.name)}"
            class="flex-1 bg-transparent border-b border-gray-200 py-1
                   focus:outline-none focus:border-black transition text-sm font-light min-w-0"
          >
        </div>

        <!-- Price -->
        <div class="flex items-center space-x-3">
          <span class="text-[9px] uppercase tracking-widest text-gray-400 w-16 flex-shrink-0">Price €</span>
          <input
            type="number"
            id="price-${p.id}"
            value="${p.price}"
            step="0.01"
            min="0"
            class="flex-1 bg-transparent border-b border-gray-200 py-1
                   focus:outline-none focus:border-black transition text-sm font-semibold min-w-0"
          >
        </div>

        <!-- Description -->
        <div class="flex items-center space-x-3">
          <span class="text-[9px] uppercase tracking-widest text-gray-400 w-16 flex-shrink-0">Info</span>
          <input
            type="text"
            id="desc-${p.id}"
            value="${escapeHtml(p.description || '')}"
            maxlength="80"
            class="flex-1 bg-transparent border-b border-gray-200 py-1
                   focus:outline-none focus:border-black transition text-xs text-gray-500 min-w-0"
          >
        </div>

      </div>

      <!-- Action Buttons -->
      <div class="flex items-center space-x-3 flex-shrink-0 self-center">

        <!-- Save changes -->
        <button
          onclick="saveProduct('${p.id}')"
          class="text-[10px] uppercase tracking-widest border border-black px-4 py-2
                 hover:bg-black hover:text-white transition"
        >
          Save
        </button>

        <!-- Delete product -->
        <button
          onclick="deleteProduct('${p.id}', '${escapeHtml(p.name)}', '${p.imageRef || ''}')"
          class="text-gray-300 hover:text-red-500 transition px-2"
          title="Delete product"
        >
          <i class="fa-solid fa-trash-can"></i>
        </button>

      </div>
    </div>
  `).join("");
}


// ─────────────────────────────────────────────
// 5. SAVE / UPDATE A PRODUCT
//    Writes the edited name, price, description
//    back to Firestore. Image is NOT changed here
//    (to change an image, delete and re-add the product).
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
// 6. DELETE A PRODUCT
//    Removes the Firestore document AND
//    the uploaded image from Firebase Storage.
// ─────────────────────────────────────────────
async function deleteProduct(productId, productName, imageRef) {
  if (!confirm(`Remove "${productName}" from your boutique?\n\nThis cannot be undone.`)) return;

  try {
    // Remove Firestore document first
    await db.collection("products").doc(productId).delete();

    // Remove image from Storage (only if it was uploaded — not an external URL)
    if (imageRef) {
      try {
        await storage.ref(imageRef).delete();
      } catch (storageErr) {
        // Not fatal — image may have already been removed
        console.warn("Storage image not deleted:", storageErr.message);
      }
    }

    showSuccess(`"${productName}" has been removed from the boutique.`);

  } catch (error) {
    console.error("Delete error:", error);
    showError("Failed to delete the product. Please try again.");
  }
}


// ─────────────────────────────────────────────
// 7. IMAGE PREVIEW
//    When the owner picks a file, show a preview
//    immediately — before the actual upload starts.
// ─────────────────────────────────────────────
document.getElementById("prod-image").addEventListener("change", function () {
  const file = this.files[0];
  if (!file) return;

  const preview    = document.getElementById("image-preview");
  const previewImg = document.getElementById("preview-img");

  const reader = new FileReader();
  reader.onload = (e) => {
    previewImg.src = e.target.result;
    preview.classList.remove("hidden");
  };
  reader.readAsDataURL(file);
});


// ─────────────────────────────────────────────
// 8. ADD NEW PRODUCT — FORM SUBMISSION
//    Flow:
//    Step 1 → Validate inputs
//    Step 2 → Upload image to Firebase Storage
//    Step 3 → Get the public image URL
//    Step 4 → Save product data to Firestore
//    Step 5 → Reset form
// ─────────────────────────────────────────────
document.getElementById("add-product-form").addEventListener("submit", async (e) => {
  e.preventDefault();

  const name  = document.getElementById("prod-name").value.trim();
  const price = parseFloat(document.getElementById("prod-price").value);
  const desc  = document.getElementById("prod-desc").value.trim();
  const file  = document.getElementById("prod-image").files[0];

  // ── Client-side validation ──
  if (!name) {
    showError("Please enter a product name.");
    return;
  }
  if (isNaN(price) || price < 0) {
    showError("Please enter a valid price.");
    return;
  }
  if (!file) {
    showError("Please select a product image.");
    return;
  }
  if (file.size > 5 * 1024 * 1024) {
    showError("Image is too large. Please choose an image under 5 MB.");
    return;
  }

  setFormLoading(true);
  updateProgress("Preparing upload...", 10);

  try {
    // ── STEP 1: Upload image to Firebase Storage ──────────
    //    Path: products/timestamp_filename.jpg
    //    This path is saved so we can delete the image later.
    const imagePath = `products/${Date.now()}_${file.name}`;
    const imageRef  = storage.ref(imagePath);
    const uploadTask = imageRef.put(file);

    // Track upload progress (shows the progress bar moving)
    uploadTask.on("state_changed", snapshot => {
      const pct = (snapshot.bytesTransferred / snapshot.totalBytes) * 75;
      updateProgress("Uploading image...", 15 + pct);
    });

    // Wait for upload to finish
    await uploadTask;
    updateProgress("Getting image URL...", 92);

    // ── STEP 2: Get the public download URL ───────────────
    const imageURL = await imageRef.getDownloadURL();

    // ── STEP 3: Save product to Firestore ─────────────────
    updateProgress("Saving product...", 97);
    await db.collection("products").add({
      name,
      price,
      description: desc,
      image:       imageURL,    // URL customers see
      imageRef:    imagePath,   // Storage path (for deletion later)
      createdAt:   firebase.firestore.FieldValue.serverTimestamp()
    });

    // ── Done! ─────────────────────────────────────────────
    updateProgress("Done!", 100);
    showSuccess(`"${name}" is now live in your boutique! ✨`);

    // Reset the form and hide the preview
    e.target.reset();
    document.getElementById("image-preview").classList.add("hidden");
    setTimeout(() => updateProgress("", 0), 1500);

  } catch (error) {
    console.error("Upload/save error:", error);
    showError("Something went wrong. Please try again.");
    updateProgress("", 0);
  } finally {
    setFormLoading(false);
  }
});


// ─────────────────────────────────────────────
// 9. FORM LOADING STATE
//    Disables the submit button and shows
//    "Uploading..." while Firebase is working.
// ─────────────────────────────────────────────
function setFormLoading(isLoading) {
  const btn  = document.getElementById("submit-btn");
  btn.disabled = isLoading;
  btn.innerHTML = isLoading
    ? `<i class="fa-solid fa-spinner fa-spin"></i><span>Uploading...</span>`
    : `<i class="fa-solid fa-cloud-arrow-up"></i><span>Upload Product</span>`;
}


// ─────────────────────────────────────────────
// 10. PROGRESS BAR
//     Shows / hides the progress bar and label.
// ─────────────────────────────────────────────
function updateProgress(message, percent) {
  const container = document.getElementById("progress-container");
  const bar       = document.getElementById("progress-bar");
  const label     = document.getElementById("progress-label");

  if (percent > 0) {
    container.classList.remove("hidden");
    bar.style.width     = `${percent}%`;
    label.textContent   = message;
  } else {
    container.classList.add("hidden");
    bar.style.width = "0%";
  }
}


// ─────────────────────────────────────────────
// 11. TOAST NOTIFICATIONS
//     showSuccess() → black toast with green tick
//     showError()   → red toast with warning icon
// ─────────────────────────────────────────────
function showSuccess(message) { showToast(message, "success"); }
function showError(message)   { showToast(message, "error");   }

function showToast(message, type) {
  const toast    = document.getElementById("toast");
  const toastMsg = document.getElementById("toast-message");
  const toastIcon= document.getElementById("toast-icon");

  toastMsg.textContent = message;

  if (type === "success") {
    toast.className = `fixed bottom-6 right-6 z-50 bg-black text-white px-6 py-4 shadow-xl
                       flex items-center space-x-3 transition-transform duration-500 max-w-sm`;
    toastIcon.className = "fa-solid fa-check text-green-400 flex-shrink-0";
  } else {
    toast.className = `fixed bottom-6 right-6 z-50 bg-red-600 text-white px-6 py-4 shadow-xl
                       flex items-center space-x-3 transition-transform duration-500 max-w-sm`;
    toastIcon.className = "fa-solid fa-circle-exclamation flex-shrink-0";
  }

  // Slide in
  toast.style.transform = "translateX(0)";

  // Slide out after 4 seconds
  setTimeout(() => {
    toast.style.transform = "translateX(150%)";
  }, 4000);
}


// ─────────────────────────────────────────────
// 12. HELPER — ESCAPE HTML
//     Prevents XSS if a product name contains
//     characters like < > " &
// ─────────────────────────────────────────────
function escapeHtml(str) {
  if (!str) return "";
  return String(str)
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;");
}