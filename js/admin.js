// ============================================================
//  js/admin.js — Admin Dashboard
//  Single product add + Bulk multi-image upload
// ============================================================

const GITHUB_PAGES_URL  = "https://nauni84-pixel.github.io/bed-linen-beyond";
const GITHUB_USERNAME   = "nauni84-pixel";
const GITHUB_REPO       = "bed-linen-beyond";
const GITHUB_UPLOAD_URL = `https://github.com/${GITHUB_USERNAME}/${GITHUB_REPO}/upload/main/images`;


// ─────────────────────────────────────────────
// 1. AUTH GUARD
// ─────────────────────────────────────────────

auth.onAuthStateChanged(user => {
  if (!user) {
    window.location.href = "login.html";
    return;
  }
  document.getElementById("auth-loading").remove();
  document.getElementById("admin-email").textContent = user.email;
  loadAdminProducts();
  initBulkUpload();
});

function logout() {
  auth.signOut().then(() => { window.location.href = "login.html"; });
}


// ─────────────────────────────────────────────
// 2. SINGLE PRODUCT — IMAGE PICKER
// ─────────────────────────────────────────────

document.getElementById("prod-image-file").addEventListener("change", function () {
  const file = this.files[0];
  if (!file) return;

  const reader = new FileReader();
  reader.onload = (e) => {
    document.getElementById("preview-img").src = e.target.result;
    document.getElementById("image-preview").classList.remove("hidden");
  };
  reader.readAsDataURL(file);

  const cleanName = file.name.toLowerCase().replace(/\s+/g, "-");
  document.getElementById("prod-filename").value = cleanName;
  updateURLPreview();

  document.getElementById("step2-section").classList.remove("hidden");
  document.getElementById("github-upload-link").href = GITHUB_UPLOAD_URL;
});

function updateURLPreview() {
  const filename = document.getElementById("prod-filename").value.trim();
  document.getElementById("url-preview").textContent =
    filename ? `${GITHUB_PAGES_URL}/images/${filename}` : "";
}

document.getElementById("prod-filename")?.addEventListener("input", updateURLPreview);


// ─────────────────────────────────────────────
// 3. SINGLE PRODUCT — FORM SUBMIT
// ─────────────────────────────────────────────

document.getElementById("add-product-form").addEventListener("submit", async (e) => {
  e.preventDefault();

  const btn     = document.getElementById("submit-btn");
  const btnText = document.getElementById("submit-btn-text");

  const name     = document.getElementById("prod-name").value.trim();
  const price    = parseFloat(document.getElementById("prod-price").value);
  const desc     = document.getElementById("prod-desc").value.trim();
  const filename = document.getElementById("prod-filename").value.trim();

  if (!name || isNaN(price) || !filename) {
    showToast("Please fill in name, price and filename.", "error");
    return;
  }

  btn.disabled        = true;
  btnText.textContent = "Saving...";

  try {
    await db.collection("products").add({
      name,
      price,
      description: desc,
      image: `${GITHUB_PAGES_URL}/images/${filename}`,
      createdAt: firebase.firestore.FieldValue.serverTimestamp()
    });

    showToast(`"${name}" added! ✅`, "success");

    document.getElementById("add-product-form").reset();
    document.getElementById("image-preview").classList.add("hidden");
    document.getElementById("step2-section").classList.add("hidden");
    document.getElementById("url-preview").textContent = "";

  } catch (err) {
    console.error("Add product error:", err);
    showToast("Failed to save. Check console.", "error");
  }

  btn.disabled        = false;
  btnText.textContent = "Add Product to Boutique";
});


// ─────────────────────────────────────────────
// 4. LOAD & RENDER INVENTORY
// ─────────────────────────────────────────────

function loadAdminProducts() {
  db.collection("products").orderBy("createdAt", "desc").onSnapshot(snapshot => {
    const products = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
    renderAdminProducts(products);
  });
}

function renderAdminProducts(products) {
  const list = document.getElementById("admin-product-list");

  if (products.length === 0) {
    list.innerHTML = `<p class="text-center text-gray-400 py-12 font-light">No products yet.</p>`;
    return;
  }

  list.innerHTML = products.map(p => `
    <div class="p-4 bg-gray-50 rounded-xl border border-gray-100 hover:border-gray-300 hover:shadow-sm transition" id="row-${p.id}">
      <div class="flex items-start space-x-4">
        <!-- Thumbnail -->
        <img src="${p.image}" class="w-16 h-16 object-cover rounded-lg bg-gray-200 border border-gray-200 shadow-sm shrink-0"
             onerror="this.src='https://via.placeholder.com/100'">

        <!-- Editable Content -->
        <div class="flex-1 min-w-0 grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <label class="text-[9px] uppercase tracking-widest text-gray-400 block mb-0.5">Product Name</label>
            <input type="text" id="edit-name-${p.id}" value="${escapeHtml(p.name)}"
                   class="w-full bg-transparent border-b border-transparent focus:border-gray-900 focus:outline-none text-sm font-semibold text-gray-800 transition py-0.5">
          </div>
          <div>
            <label class="text-[9px] uppercase tracking-widest text-gray-400 block mb-0.5">Price (€)</label>
            <input type="number" id="edit-price-${p.id}" value="${p.price}" step="0.01"
                   class="w-full bg-transparent border-b border-transparent focus:border-gray-900 focus:outline-none text-sm font-medium text-gray-700 transition py-0.5">
          </div>
          <div class="md:col-span-2">
            <label class="text-[9px] uppercase tracking-widest text-gray-400 block mb-0.5">Short Description</label>
            <input type="text" id="edit-desc-${p.id}" value="${escapeHtml(p.description || '')}" maxlength="80"
                   class="w-full bg-transparent border-b border-transparent focus:border-gray-900 focus:outline-none text-xs text-gray-500 transition py-0.5">
          </div>
        </div>

        <!-- Actions -->
        <div class="flex flex-col space-y-2 shrink-0">
          <button onclick="saveProductEdit('${p.id}')"
                  class="text-[10px] uppercase tracking-widest bg-gray-900 text-white px-3 py-1.5 rounded-lg hover:bg-black transition shadow-sm">
            Save
          </button>
          <button onclick="deleteProduct('${p.id}', '${escapeHtml(p.name)}')"
                  class="text-[10px] uppercase tracking-widest text-red-500 border border-red-100 bg-white px-3 py-1.5 rounded-lg hover:bg-red-50 transition">
            Delete
          </button>
        </div>
      </div>
    </div>
  `).join("");
}

async function saveProductEdit(id) {
  const name = document.getElementById(`edit-name-${id}`).value.trim();
  const price = parseFloat(document.getElementById(`edit-price-${id}`).value);
  const desc = document.getElementById(`edit-desc-${id}`).value.trim();

  if (!name || isNaN(price)) {
    showToast("Please enter a valid name and price.", "error");
    return;
  }

  try {
    await db.collection("products").doc(id).update({
      name,
      price,
      description: desc,
      updatedAt: firebase.firestore.FieldValue.serverTimestamp()
    });
    showToast("Product updated successfully! ✅", "success");
  } catch (err) {
    console.error("Update error:", err);
    showToast("Failed to update product.", "error");
  }
}

async function deleteProduct(id, name) {
  if (confirm(`Delete "${name}"?`)) {
    await db.collection("products").doc(id).delete();
    showToast("Deleted.", "success");
  }
}


// ─────────────────────────────────────────────
// 5. TOAST & UTILS
// ─────────────────────────────────────────────

function showToast(message, type) {
  const toast = document.getElementById("toast");
  const icon  = document.getElementById("toast-icon");

  document.getElementById("toast-message").textContent = message;
  icon.className = type === "error"
    ? "fa-solid fa-circle-exclamation text-red-400 flex-shrink-0"
    : "fa-solid fa-check text-green-400 flex-shrink-0";

  toast.style.transform = "translateX(0)";
  setTimeout(() => { toast.style.transform = "translateX(150%)"; }, 4000);
}

function escapeHtml(str) {
  return String(str || "")
    .replace(/&/g, "&amp;").replace(/</g, "&lt;")
    .replace(/>/g, "&gt;").replace(/"/g, "&quot;").replace(/'/g, "&#39;");
}


// ═══════════════════════════════════════════════════════════════
//
//   BULK UPLOAD — MULTI-IMAGE WITH EDITABLE FIELDS
//
// ═══════════════════════════════════════════════════════════════

let bulkEntries   = [];
let bulkIdCounter = 0;


// ── GitHub PAT ───────────────────────────────

function saveGithubPat() {
  const pat = document.getElementById("githubPatInput").value.trim();

  if (!pat) {
    showToast("Please enter a GitHub token.", "error");
    return;
  }
  if (!pat.startsWith("ghp_") && !pat.startsWith("github_pat_")) {
    if (!confirm('This token doesn\'t start with "ghp_" or "github_pat_". Save anyway?')) return;
  }

  localStorage.setItem("blb_github_pat", pat);
  showToast("GitHub token saved ✅", "success");
  updatePatStatus();
}

function loadGithubPat() {
  return localStorage.getItem("blb_github_pat") || "";
}

function updatePatStatus() {
  const statusEl = document.getElementById("patStatus");
  const inputEl  = document.getElementById("githubPatInput");
  if (!statusEl) return;

  const pat = loadGithubPat();
  if (pat) {
    statusEl.innerHTML =
      `<span class="text-green-600 flex items-center gap-1 font-medium">
         <i class="fa-solid fa-circle-check"></i> Token saved — ready for bulk upload
       </span>`;
    inputEl.value = pat;
  } else {
    statusEl.innerHTML =
      `<span class="text-red-500 flex items-center gap-1 font-medium">
         <i class="fa-solid fa-circle-exclamation"></i> No token saved — required for image upload
       </span>`;
  }
}


// ── Filename → Product Name ──────────────────

function filenameToProductName(filename) {
  return filename
    .replace(/\.[^.]+$/, "")
    .replace(/[-_]+/g, " ")
    .replace(/\b\w/g, c => c.toUpperCase())
    .trim();
}


// ── Handle image selection ───────────────────

function handleBulkImagesSelect(event) {
  const files = Array.from(event.target.files);
  if (files.length === 0) return;

  files.forEach(file => {
    const cleanFilename = file.name.toLowerCase().replace(/\s+/g, "-");
    const objectUrl     = URL.createObjectURL(file);

    bulkEntries.push({
      id:          ++bulkIdCounter,
      file:        file,
      objectUrl:   objectUrl,
      filename:    cleanFilename,
      name:        filenameToProductName(file.name),
      price:       "",
      description: ""
    });
  });

  showToast(`${files.length} image${files.length === 1 ? "" : "s"} added ✅`, "success");
  renderBulkCards();
  event.target.value = "";
}

function addMoreImages() {
  document.getElementById("bulkAddMoreInput").click();
}


// ── Render editable cards ────────────────────

function renderBulkCards() {
  const cardsArea     = document.getElementById("bulkCardsArea");
  const container     = document.getElementById("bulkCardsContainer");
  const countEl       = document.getElementById("bulkImageCount");
  const uploadBtnText = document.getElementById("bulkUploadBtnText");

  if (bulkEntries.length === 0) {
    cardsArea.classList.add("hidden");
    countEl.textContent = "";
    return;
  }

  cardsArea.classList.remove("hidden");
  countEl.textContent = `${bulkEntries.length} image${bulkEntries.length === 1 ? "" : "s"} ready to configure`;
  uploadBtnText.textContent = `Upload ${bulkEntries.length} Product${bulkEntries.length === 1 ? "" : "s"} to Boutique`;

  container.innerHTML = bulkEntries.map((entry, index) => `
    <div class="bg-white border border-gray-100 rounded-xl p-5 relative hover:border-gray-300 transition" id="bulk-card-${entry.id}">

      <button type="button" onclick="removeBulkCard(${entry.id})"
              class="absolute top-3 right-3 w-7 h-7 rounded-full bg-gray-50 border border-gray-200 text-gray-400 hover:text-red-500 hover:border-red-300 transition flex items-center justify-center text-xs"
              title="Remove">
        <i class="fa-solid fa-xmark"></i>
      </button>

      <span class="absolute top-3.5 left-5 text-[10px] text-gray-300 font-mono">#${index + 1}</span>

      <div class="flex gap-5 mt-3">
        <!-- Thumbnail -->
        <div class="shrink-0">
          <img src="${entry.objectUrl}" alt="Preview"
               class="w-24 h-24 object-cover rounded-lg border border-gray-100 bg-gray-50">
          <p class="text-[9px] text-gray-400 mt-1 font-mono text-center truncate w-24" title="${entry.filename}">
            ${entry.filename}
          </p>
        </div>

        <!-- Editable fields -->
        <div class="flex-1 space-y-3 min-w-0">
          <div>
            <label class="text-[10px] uppercase tracking-widest text-gray-400 block mb-1">Product Name *</label>
            <input type="text" value="${escapeHtml(entry.name)}"
                   onchange="updateBulkEntry(${entry.id}, 'name', this.value)"
                   placeholder="e.g. Luxury Duvet Cover"
                   class="w-full border-b border-gray-200 py-1.5 focus:outline-none focus:border-black transition text-sm font-medium bg-transparent">
          </div>

          <div class="flex gap-4">
            <div class="w-28 shrink-0">
              <label class="text-[10px] uppercase tracking-widest text-gray-400 block mb-1">Price (€) *</label>
              <input type="number" step="0.01" min="0" value="${entry.price}"
                     onchange="updateBulkEntry(${entry.id}, 'price', this.value)"
                     placeholder="0.00"
                     class="w-full border-b border-gray-200 py-1.5 focus:outline-none focus:border-black transition text-sm bg-transparent">
            </div>

            <div class="flex-1 min-w-0">
              <label class="text-[10px] uppercase tracking-widest text-gray-400 block mb-1">Description</label>
              <input type="text" value="${escapeHtml(entry.description)}" maxlength="80"
                     onchange="updateBulkEntry(${entry.id}, 'description', this.value)"
                     placeholder="Optional short description"
                     class="w-full border-b border-gray-200 py-1.5 focus:outline-none focus:border-black transition text-sm bg-transparent font-light">
            </div>
          </div>
        </div>
      </div>
    </div>
  `).join("");
}


// ── Update / Remove ──────────────────────────

function updateBulkEntry(id, field, value) {
  const entry = bulkEntries.find(e => e.id === id);
  if (entry) entry[field] = value;
}

function removeBulkCard(id) {
  const entry = bulkEntries.find(e => e.id === id);
  if (entry) URL.revokeObjectURL(entry.objectUrl);

  bulkEntries = bulkEntries.filter(e => e.id !== id);
  renderBulkCards();
  showToast("Product removed from batch.", "success");
}

function clearAllBulkCards() {
  if (bulkEntries.length === 0) return;
  if (!confirm(`Remove all ${bulkEntries.length} products from the batch?`)) return;

  bulkEntries.forEach(e => URL.revokeObjectURL(e.objectUrl));
  bulkEntries   = [];
  bulkIdCounter = 0;
  renderBulkCards();
  showToast("All cleared.", "success");
}


// ── GitHub API ───────────────────────────────

function fileToBase64(file) {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload  = () => resolve(reader.result.split(",")[1]);
    reader.onerror = () => reject(new Error("Failed to read file: " + file.name));
    reader.readAsDataURL(file);
  });
}

async function uploadImageToGitHub(file, filename, pat) {
  const apiUrl =
    `https://api.github.com/repos/${GITHUB_USERNAME}/${GITHUB_REPO}/contents/images/${filename}`;

  try {
    const checkResp = await fetch(apiUrl, {
      headers: {
        "Authorization": `token ${pat}`,
        "Accept": "application/vnd.github.v3+json"
      }
    });
    if (checkResp.ok) {
      return { url: `${GITHUB_PAGES_URL}/images/${filename}`, skipped: true, error: null };
    }
  } catch (e) { /* continue */ }

  const base64 = await fileToBase64(file);

  const resp = await fetch(apiUrl, {
    method: "PUT",
    headers: {
      "Authorization": `token ${pat}`,
      "Accept": "application/vnd.github.v3+json",
      "Content-Type": "application/json"
    },
    body: JSON.stringify({
      message: `Add product image: ${filename}`,
      content: base64,
      branch: "main"
    })
  });

  if (!resp.ok) {
    const errData = await resp.json().catch(() => ({}));
    if (resp.status === 422) {
      return { url: `${GITHUB_PAGES_URL}/images/${filename}`, skipped: true, error: null };
    }
    return { url: null, skipped: false, error: errData.message || `HTTP ${resp.status}` };
  }

  return { url: `${GITHUB_PAGES_URL}/images/${filename}`, skipped: false, error: null };
}


// ── Progress ─────────────────────────────────

function updateBulkProgress(current, total, message) {
  const percent = total > 0 ? Math.round((current / total) * 100) : 0;
  const bar     = document.getElementById("bulkProgressBar");
  const text    = document.getElementById("bulkProgressText");
  bar.style.width  = percent + "%";
  bar.textContent  = percent >= 15 ? percent + "%" : "";
  text.textContent = message + ` (${current} of ${total})`;
}


// ── Main bulk upload ─────────────────────────

async function handleBulkUpload() {
  if (bulkEntries.length === 0) {
    showToast("No products to upload. Select images first.", "error");
    return;
  }

  const invalid = [];
  bulkEntries.forEach((entry, i) => {
    const trimName = entry.name.trim();
    const numPrice = parseFloat(entry.price);
    if (!trimName) invalid.push(`#${i + 1}: missing product name`);
    if (isNaN(numPrice) || numPrice < 0) invalid.push(`#${i + 1} "${trimName || "unnamed"}": missing or invalid price`);
  });

  if (invalid.length > 0) {
    alert("Please fix these before uploading:\n\n" + invalid.join("\n"));
    return;
  }

  const pat = loadGithubPat();
  if (!pat) {
    showToast("GitHub token required. Set it above first.", "error");
    return;
  }

  const count = bulkEntries.length;
  if (!confirm(`Upload ${count} product${count === 1 ? "" : "s"} to your boutique?\n\nEach image will be uploaded to GitHub, then the product will be created in Firebase.`)) return;

  const btn          = document.getElementById("bulkUploadBtn");
  const progressArea = document.getElementById("bulkProgressArea");
  const resultsArea  = document.getElementById("bulkResultsArea");

  btn.disabled  = true;
  btn.innerHTML = '<i class="fa-solid fa-spinner fa-spin"></i> Uploading — please wait...';
  progressArea.classList.remove("hidden");
  resultsArea.classList.add("hidden");

  const totalSteps = count * 2;
  let currentStep  = 0;
  const successes  = [];
  const errors     = [];
  const skipped    = [];

  try {
    for (const entry of bulkEntries) {
      const productName = entry.name.trim();
      const price       = parseFloat(entry.price);
      const description = entry.description.trim();
      const filename    = entry.filename;

      // Step A: image
      currentStep++;
      updateBulkProgress(currentStep, totalSteps, `Uploading image: ${filename}`);

      let imageUrl = "";

      try {
        const result = await uploadImageToGitHub(entry.file, filename, pat);

        if (result.error) {
          errors.push(`⚠️ Image "${filename}": ${result.error}`);
          currentStep++;
          updateBulkProgress(currentStep, totalSteps, `Skipped: ${productName}`);
          continue;
        }

        imageUrl = result.url;
        if (result.skipped) skipped.push(filename);

      } catch (err) {
        errors.push(`❌ Image "${filename}": ${err.message}`);
        currentStep++;
        updateBulkProgress(currentStep, totalSteps, `Skipped: ${productName}`);
        continue;
      }

      // Step B: Firestore
      currentStep++;
      updateBulkProgress(currentStep, totalSteps, `Adding product: ${productName}`);

      try {
        await db.collection("products").add({
          name:        productName,
          price:       price,
          description: description,
          image:       imageUrl,
          createdAt:   firebase.firestore.FieldValue.serverTimestamp()
        });

        successes.push(productName);
      } catch (err) {
        errors.push(`❌ Product "${productName}": ${err.message}`);
      }

      if (count > 3) {
        await new Promise(r => setTimeout(r, 400));
      }
    }

    updateBulkProgress(totalSteps, totalSteps, "Complete!");
    showBulkResults(successes, errors, skipped);

    if (errors.length === 0) {
      showToast(`All ${successes.length} products uploaded! 🎉`, "success");
      bulkEntries.forEach(e => URL.revokeObjectURL(e.objectUrl));
      bulkEntries   = [];
      bulkIdCounter = 0;
      renderBulkCards();
    } else {
      showToast(`${successes.length} succeeded, ${errors.length} error${errors.length === 1 ? "" : "s"}`, "error");
    }

  } catch (err) {
    showToast("Bulk upload failed: " + err.message, "error");
    console.error("Bulk upload error:", err);
  }

  btn.disabled  = false;
  btn.innerHTML = '<i class="fa-solid fa-cloud-arrow-up text-base"></i> <span id="bulkUploadBtnText">Upload All Products to Boutique</span>';
}


// ── Results ──────────────────────────────────

function showBulkResults(successes, errors, skipped) {
  const resultsArea = document.getElementById("bulkResultsArea");
  const summaryEl   = document.getElementById("bulkResultsSummary");
  const detailsEl   = document.getElementById("bulkResultsDetails");

  resultsArea.classList.remove("hidden");

  if (errors.length === 0) {
    summaryEl.className = "p-5 rounded-xl text-center text-sm bg-green-50 text-green-700 border border-green-200 font-medium";
    summaryEl.innerHTML = `<i class="fa-solid fa-circle-check mr-2"></i> All ${successes.length} product${successes.length === 1 ? "" : "s"} uploaded successfully!`;
  } else if (successes.length > 0) {
    summaryEl.className = "p-5 rounded-xl text-center text-sm bg-yellow-50 text-yellow-700 border border-yellow-200 font-medium";
    summaryEl.innerHTML = `<i class="fa-solid fa-triangle-exclamation mr-2"></i> ${successes.length} succeeded · ${errors.length} failed`;
  } else {
    summaryEl.className = "p-5 rounded-xl text-center text-sm bg-red-50 text-red-700 border border-red-200 font-medium";
    summaryEl.innerHTML = `<i class="fa-solid fa-circle-xmark mr-2"></i> Upload failed — ${errors.length} error${errors.length === 1 ? "" : "s"}`;
  }

  let html = "";

  if (successes.length > 0) {
    html += `<div class="text-green-600 font-medium mb-1"><i class="fa-solid fa-check mr-1"></i> Added:</div>`;
    html += successes.map(n => `<div class="text-green-600 pl-4">• ${escapeHtml(n)}</div>`).join("");
  }
  if (skipped.length > 0) {
    html += `<div class="text-blue-600 font-medium mt-2 mb-1"><i class="fa-solid fa-forward mr-1"></i> Already on GitHub:</div>`;
    html += skipped.map(f => `<div class="text-blue-500 pl-4">• ${f}</div>`).join("");
  }
  if (errors.length > 0) {
    html += `<div class="text-red-600 font-medium mt-2 mb-1"><i class="fa-solid fa-xmark mr-1"></i> Errors:</div>`;
    html += errors.map(e => `<div class="text-red-500 pl-4">${e}</div>`).join("");
  }

  detailsEl.innerHTML = html;
}


// ── Reset ────────────────────────────────────

function resetBulkUpload() {
  bulkEntries.forEach(e => URL.revokeObjectURL(e.objectUrl));
  bulkEntries   = [];
  bulkIdCounter = 0;

  renderBulkCards();

  document.getElementById("bulkProgressArea").classList.add("hidden");
  document.getElementById("bulkResultsArea").classList.add("hidden");
  document.getElementById("bulkProgressBar").style.width = "0%";
  document.getElementById("bulkProgressText").textContent  = "";

  showToast("Bulk upload form cleared ✅", "success");
}


// ── Initialise ───────────────────────────────

function initBulkUpload() {
  const imagesInput  = document.getElementById("bulkImagesInput");
  const addMoreInput = document.getElementById("bulkAddMoreInput");

  if (imagesInput)  imagesInput.addEventListener("change", handleBulkImagesSelect);
  if (addMoreInput) addMoreInput.addEventListener("change", handleBulkImagesSelect);

  updatePatStatus();
}
