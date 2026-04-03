// ============================================================
//  js/app.js — Customer Storefront
// ============================================================

const YOUR_PHONE_NUMBER = "31612345678";

let PRODUCTS = [];
let cart     = [];
let cartOpen = false;


// ─────────────────────────────────────────────
// 1. LOAD PRODUCTS
// ─────────────────────────────────────────────

db.collection("products").orderBy("createdAt", "desc").onSnapshot(snapshot => {
  PRODUCTS = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
  applyFilters();
});


// ─────────────────────────────────────────────
// 2. SEARCH & FILTER
// ─────────────────────────────────────────────

document.getElementById("search-input").addEventListener("input", applyFilters);
document.getElementById("price-slider").addEventListener("input", function () {
  document.getElementById("price-label").textContent = "€" + this.value;
  applyFilters();
});

function applyFilters() {
  const query    = document.getElementById("search-input").value.toLowerCase().trim();
  const maxPrice = parseFloat(document.getElementById("price-slider").value);

  const filtered = PRODUCTS.filter(p =>
    p.name.toLowerCase().includes(query) && p.price <= maxPrice
  );

  renderProducts(filtered);
}


// ─────────────────────────────────────────────
// 3. RENDER PRODUCTS
// ─────────────────────────────────────────────

function renderProducts(products) {
  const grid      = document.getElementById("product-grid");
  const noResults = document.getElementById("no-results");

  if (products.length === 0) {
    grid.innerHTML = "";
    noResults.classList.remove("hidden");
    return;
  }

  noResults.classList.add("hidden");

  grid.innerHTML = products.map(p => `
    <div class="product-card bg-white rounded-2xl overflow-hidden border border-gray-100 shadow-sm">
      <div class="overflow-hidden relative">
        <img src="${p.image}"
             alt="${escapeHtml(p.name)}"
             class="w-full h-60 object-cover hover:scale-105 transition-transform duration-500"
             onerror="this.src='https://images.unsplash.com/photo-1631049307264-da0ec9d70304?w=400&h=300&fit=crop'" />
      </div>
      <div class="p-5">
        <h3 class="heading-font text-lg font-semibold text-gray-900 mb-1 leading-tight">${escapeHtml(p.name)}</h3>
        <p class="text-gray-500 text-xs mb-4 font-light line-clamp-2 leading-relaxed">${escapeHtml(p.description || "")}</p>
        <div class="flex items-center justify-between pt-2 border-t border-gray-50">
          <span class="heading-font text-xl text-gray-900 font-medium">€${p.price.toFixed(2)}</span>
          <button onclick="addToCart('${p.id}')"
                  class="bg-gray-900 text-white px-4 py-2.5 text-[10px] uppercase tracking-widest rounded-lg
                         hover:bg-black transition flex items-center gap-1.5 shadow-sm">
            <i class="fa-solid fa-plus text-[8px]"></i> Add
          </button>
        </div>
      </div>
    </div>
  `).join("");
}


// ─────────────────────────────────────────────
// 4. CART
// ─────────────────────────────────────────────

function addToCart(productId) {
  const product = PRODUCTS.find(p => p.id === productId);
  if (!product) return;

  const existing = cart.find(item => item.id === productId);
  if (existing) {
    existing.qty += 1;
  } else {
    cart.push({ ...product, qty: 1 });
  }

  updateCartUI();

  const sidebar = document.getElementById("cart-sidebar");
  if (sidebar.classList.contains("translate-x-full")) {
    toggleCart();
  }

  showToast(`"${product.name}" added to inquiry list`, "success");
}

function removeFromCart(productId) {
  cart = cart.filter(item => item.id !== productId);
  updateCartUI();
}

function changeQty(productId, delta) {
  const itemIndex = cart.findIndex(i => i.id === productId);
  if (itemIndex === -1) return;

  cart[itemIndex].qty += delta;

  if (cart[itemIndex].qty <= 0) {
    cart.splice(itemIndex, 1);
  }

  updateCartUI();
}

window.changeQty = changeQty;
window.addToCart = addToCart;
window.removeFromCart = removeFromCart;

function updateCartUI() {
  const countBadge  = document.getElementById("cart-count");
  const itemsEl     = document.getElementById("cart-items");
  const emptyEl     = document.getElementById("cart-empty");
  const footerEl    = document.getElementById("cart-footer");
  const totalEl     = document.getElementById("cart-total");
  const itemCountEl = document.getElementById("cart-item-count");

  const totalItems = cart.reduce((s, i) => s + i.qty, 0);
  const totalPrice = cart.reduce((s, i) => s + (i.price * i.qty), 0);

  if (totalItems > 0) {
    countBadge.textContent = totalItems;
    countBadge.classList.remove("hidden");
  } else {
    countBadge.classList.add("hidden");
  }

  itemCountEl.textContent = `${totalItems} item${totalItems === 1 ? "" : "s"}`;

  if (cart.length === 0) {
    emptyEl.classList.remove("hidden");
    footerEl.classList.add("hidden");
    itemsEl.innerHTML = "";
    itemsEl.appendChild(emptyEl);
    return;
  }

  emptyEl.classList.add("hidden");
  footerEl.classList.remove("hidden");
  totalEl.textContent = "€" + totalPrice.toFixed(2);

  itemsEl.innerHTML = cart.map(item => `
    <div class="flex gap-4 p-3 bg-gray-50 rounded-xl border border-gray-100">
      <img src="${item.image}" alt="${escapeHtml(item.name)}"
           class="w-16 h-16 object-cover rounded-lg bg-white border border-gray-200 shadow-sm"
           onerror="this.src='https://via.placeholder.com/80'" />
      <div class="flex-1 min-w-0">
        <h4 class="text-sm text-gray-800 truncate font-medium">${escapeHtml(item.name)}</h4>
        <p class="text-gray-600 text-xs mt-0.5 font-medium">€${item.price.toFixed(2)}</p>
        <div class="flex items-center gap-2 mt-1.5">
          <button onclick="changeQty('${item.id}', -1)"
                  class="w-6 h-6 rounded-full bg-gray-200 hover:bg-gray-300 text-gray-600 flex items-center justify-center text-[10px] transition">
            <i class="fa-solid fa-minus"></i>
          </button>
          <span class="text-xs text-gray-700 w-4 text-center font-semibold">${item.qty}</span>
          <button onclick="changeQty('${item.id}', 1)"
                  class="w-6 h-6 rounded-full bg-gray-200 hover:bg-gray-300 text-gray-600 flex items-center justify-center text-[10px] transition">
            <i class="fa-solid fa-plus"></i>
          </button>
        </div>
      </div>
      <button onclick="removeFromCart('${item.id}')"
              class="text-gray-300 hover:text-red-400 transition self-start p-1">
        <i class="fa-solid fa-trash-can text-xs"></i>
      </button>
    </div>
  `).join("");
}


// ─────────────────────────────────────────────
// 5. CART TOGGLE
// ─────────────────────────────────────────────

function toggleCart() {
  const sidebar = document.getElementById("cart-sidebar");
  const overlay = document.getElementById("cart-overlay");
  cartOpen = !cartOpen;

  if (cartOpen) {
    sidebar.classList.remove("translate-x-full");
    overlay.classList.remove("hidden");
    document.body.style.overflow = "hidden";
  } else {
    sidebar.classList.add("translate-x-full");
    overlay.classList.add("hidden");
    document.body.style.overflow = "";
  }
}


// ─────────────────────────────────────────────
// 6. WHATSAPP
// ─────────────────────────────────────────────

function sendWhatsApp() {
  if (cart.length === 0) return;

  const total = cart.reduce((s, i) => s + (i.price * i.qty), 0);

  let message = "Hello! I'm interested in the following products:\n\n";
  cart.forEach((item, i) => {
    message += `${i + 1}. ${item.name} — €${item.price.toFixed(2)} × ${item.qty}\n`;
  });
  message += `\nEstimated Total: €${total.toFixed(2)}\n\nCould you please provide more information?`;

  window.open(`https://wa.me/${YOUR_PHONE_NUMBER}?text=${encodeURIComponent(message)}`, "_blank");
}


// ─────────────────────────────────────────────
// 7. TOAST & UTILS
// ─────────────────────────────────────────────

function showToast(message, type) {
  const toast = document.getElementById("toast");
  const icon  = document.getElementById("toast-icon");

  document.getElementById("toast-message").textContent = message;
  icon.className = type === "error"
    ? "fa-solid fa-circle-exclamation text-red-400 flex-shrink-0"
    : "fa-solid fa-check text-green-400 flex-shrink-0";

  toast.style.transform = "translateX(0)";
  setTimeout(() => { toast.style.transform = "translateX(150%)"; }, 3500);
}

function escapeHtml(str) {
  return String(str || "")
    .replace(/&/g, "&amp;").replace(//g, "&lt;")
    .replace(/>/g, "&gt;").replace(/"/g, "&quot;").replace(/'/g, "&#39;");
}