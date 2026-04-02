// ============================================================
//  js/app.js — Shop Front Logic for Bed Linen & Beyond
//  Phase 2: Products now come from Firebase Firestore.
//           The old hardcoded PRODUCTS array is gone.
// ============================================================


// ─────────────────────────────────────────────
// 1. STATE
//    PRODUCTS — filled in real-time from Firestore.
//    cart     — the customer's inquiry list.
// ─────────────────────────────────────────────
let PRODUCTS = [];
let cart     = [];


// ─────────────────────────────────────────────
// 2. LOAD PRODUCTS FROM FIRESTORE
//    onSnapshot = real-time listener.
//    The page updates AUTOMATICALLY whenever
//    you add / edit / delete a product in the
//    admin panel — no page refresh needed.
// ─────────────────────────────────────────────
function loadProducts() {
  showLoadingState();

  db.collection("products")
    .orderBy("createdAt", "desc")   // Newest first
    .onSnapshot(
      snapshot => {
        // Map each Firestore document to a plain object
        PRODUCTS = snapshot.docs.map(doc => ({
          id: doc.id,   // Firestore auto-ID (string)
          ...doc.data()
        }));

        // Re-render respecting whatever filter is active
        filterProducts();
      },
      error => {
        console.error("Firestore error:", error);
        showErrorState();
      }
    );
}

// Shown while waiting for the first Firestore response
function showLoadingState() {
  document.getElementById("product-grid").innerHTML = `
    <div class="col-span-4 text-center py-20">
      <i class="fa-solid fa-spinner fa-spin text-3xl text-gray-300 mb-4 block"></i>
      <p class="text-sm text-gray-400 tracking-widest uppercase">Loading collection...</p>
    </div>
  `;
}

// Shown if Firestore cannot be reached
function showErrorState() {
  document.getElementById("product-grid").innerHTML = `
    <div class="col-span-4 text-center py-20">
      <i class="fa-solid fa-triangle-exclamation text-3xl text-gray-300 mb-4 block"></i>
      <p class="heading-font text-3xl text-gray-300 italic mb-4">Unable to load products.</p>
      <p class="text-sm text-gray-400">Please refresh the page or check your connection.</p>
    </div>
  `;
}


// ─────────────────────────────────────────────
// 3. RENDER PRODUCTS
//    Draws product cards into #product-grid.
//    Receives a filtered (or full) list.
// ─────────────────────────────────────────────
function renderProducts(productList) {
  const grid = document.getElementById("product-grid");

  if (productList.length === 0) {
    grid.innerHTML = `
      <div class="col-span-4 text-center py-20">
        <p class="heading-font text-3xl text-gray-300 italic">No products found.</p>
      </div>
    `;
    return;
  }

  grid.innerHTML = productList.map(product => `
    <div class="product-card group cursor-pointer relative">

      <!-- Product Image -->
      <div class="relative overflow-hidden bg-gray-100 aspect-[3/4] mb-4">
        <img
          src="${product.image}"
          alt="${product.name}"
          class="w-full h-full object-cover transition-transform duration-700 group-hover:scale-105"
          onerror="this.src='https://images.unsplash.com/photo-1522771739844-6a9f6d5f14af?auto=format&fit=crop&q=80&w=600'"
        />
        <!-- Appears on hover — note: ID is now a string from Firestore -->
        <button
          onclick="addToCart('${product.id}')"
          class="add-to-cart absolute bottom-0 left-0 right-0 bg-black text-white py-3 text-xs tracking-widest uppercase opacity-0 translate-y-2 transition-all duration-300"
        >
          Add to Inquiry
        </button>
      </div>

      <!-- Product Info -->
      <div>
        <h3 class="font-light text-sm tracking-wide mb-1">${product.name}</h3>
        <p class="text-[11px] text-gray-400 mb-2">${product.description || ""}</p>
        <p class="text-sm font-semibold">€${parseFloat(product.price).toFixed(2)}</p>
      </div>

    </div>
  `).join("");
}


// ─────────────────────────────────────────────
// 4. FILTER PRODUCTS
//    Called whenever the search input or price
//    slider changes. Filters PRODUCTS and re-renders.
// ─────────────────────────────────────────────
function filterProducts() {
  const searchText = document.getElementById("search-input").value.toLowerCase();
  const maxPrice   = parseFloat(document.getElementById("price-slider").value);

  const filtered = PRODUCTS.filter(product => {
    const matchesSearch = product.name.toLowerCase().includes(searchText);
    const matchesPrice  = product.price <= maxPrice;
    return matchesSearch && matchesPrice;
  });

  renderProducts(filtered);
}


// ─────────────────────────────────────────────
// 5. CART — OPEN / CLOSE SIDEBAR
// ─────────────────────────────────────────────
function toggleCart() {
  document.getElementById("cart-sidebar").classList.toggle("translate-x-full");
}


// ─────────────────────────────────────────────
// 6. CART — ADD ITEM
//    productId is now a string (Firestore doc ID).
// ─────────────────────────────────────────────
function addToCart(productId) {
  const product = PRODUCTS.find(p => p.id === productId);
  if (!product) return;

  const existingItem = cart.find(item => item.id === productId);

  if (existingItem) {
    existingItem.quantity += 1;
  } else {
    cart.push({ ...product, quantity: 1 });
  }

  renderCart();
  updateCartCount();

  // Slide open the cart so the user sees the item was added
  const sidebar = document.getElementById("cart-sidebar");
  if (sidebar.classList.contains("translate-x-full")) {
    toggleCart();
  }
}


// ─────────────────────────────────────────────
// 7. CART — REMOVE ITEM
// ─────────────────────────────────────────────
function removeFromCart(productId) {
  cart = cart.filter(item => item.id !== productId);
  renderCart();
  updateCartCount();
}


// ─────────────────────────────────────────────
// 8. CART — RENDER
// ─────────────────────────────────────────────
function renderCart() {
  const cartItemsContainer = document.getElementById("cart-items");
  const cartTotalEl        = document.getElementById("cart-total");

  if (cart.length === 0) {
    cartItemsContainer.innerHTML = `
      <p class="text-gray-300 text-sm italic text-center py-12">Your inquiry list is empty.</p>
    `;
    cartTotalEl.textContent = "€0.00";
    return;
  }

  cartItemsContainer.innerHTML = cart.map(item => `
    <div class="flex items-start space-x-4">

      <img src="${item.image}" alt="${item.name}"
        class="w-20 h-24 object-cover bg-gray-100 flex-shrink-0">

      <div class="flex-1">
        <h4 class="text-sm font-light tracking-wide">${item.name}</h4>
        <p class="text-xs text-gray-400 mt-1">Qty: ${item.quantity}</p>
        <p class="text-sm font-semibold mt-1">€${(item.price * item.quantity).toFixed(2)}</p>
      </div>

      <!-- Note: string ID wrapped in quotes -->
      <button
        onclick="removeFromCart('${item.id}')"
        class="text-gray-300 hover:text-black transition text-xs mt-1"
        title="Remove"
      >
        <i class="fa-solid fa-xmark"></i>
      </button>

    </div>
  `).join("");

  const total = cart.reduce((sum, item) => sum + item.price * item.quantity, 0);
  cartTotalEl.textContent = `€${total.toFixed(2)}`;
}


// ─────────────────────────────────────────────
// 9. CART — UPDATE BADGE COUNT
// ─────────────────────────────────────────────
function updateCartCount() {
  const totalItems = cart.reduce((sum, item) => sum + item.quantity, 0);
  document.getElementById("cart-count").textContent = totalItems;
}


// ─────────────────────────────────────────────
// 10. WHATSAPP INQUIRY
//     ⚠️  Replace 31612345678 with YOUR number.
//     Format: country code + number, no + or spaces.
//     Example: Netherlands 06-12345678 → 31612345678
// ─────────────────────────────────────────────
function sendWhatsAppInquiry() {
  if (cart.length === 0) {
    alert("Your inquiry list is empty! Please add some products first.");
    return;
  }

  let message = "Hello! I am interested in the following products from Bed Linen & Beyond:\n\n";

  cart.forEach(item => {
    message += `• ${item.name} (x${item.quantity}) — €${(item.price * item.quantity).toFixed(2)}\n`;
  });

  const total = cart.reduce((sum, item) => sum + item.price * item.quantity, 0);
  message += `\nEstimated Total: €${total.toFixed(2)}`;
  message += "\n\nCould you please provide more details and availability? Thank you!";

  const YOUR_PHONE_NUMBER = "31612345678"; // ⚠️ CHANGE THIS

  const encodedMessage = encodeURIComponent(message);
  window.open(`https://wa.me/${YOUR_PHONE_NUMBER}?text=${encodedMessage}`, "_blank");
}


// ─────────────────────────────────────────────
// 11. EVENT LISTENERS
// ─────────────────────────────────────────────
document.getElementById("search-input").addEventListener("input", filterProducts);

document.getElementById("price-slider").addEventListener("input", function () {
  document.getElementById("price-val").textContent = this.value;
  filterProducts();
});


// ─────────────────────────────────────────────
// 12. START — load products from Firebase
// ─────────────────────────────────────────────
loadProducts();