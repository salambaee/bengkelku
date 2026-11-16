// Titik masuk aplikasi: session, routing per peran, katalog, dan dashboard.

import './style.css';
import { queryProducts, validateProduct } from './products.js';
import {
  authenticate,
  clearSession,
  getSessionUserId,
  isLastActiveAdmin,
  setSession,
  validateUserInput,
} from './auth.js';
import {
  addCategory,
  addProduct,
  deleteCategory,
  deleteProduct,
  loadCategories,
  loadProducts,
  loadUsers,
  parseProductsPayload,
  resetSellerProducts,
  saveProducts,
  saveUsers,
  SCHEMA_VERSION,
  updateCategory,
  updateProduct,
} from './store.js';
import {
  clearProductErrors,
  clearUserErrors,
  fillCategoryOptions,
  fillCategorySelect,
  renderAdmin,
  renderCatalog,
  renderChrome,
  renderSeller,
  showCategoryError,
  showLoginError,
  showProductErrors,
  showToast,
  showUserErrors,
} from './ui.js';

const state = {
  products: [],
  categories: [],
  users: [],
  user: null,
  view: 'katalog',
  filters: { search: '', kategori: '', sort: 'terbaru' },
  editingProductId: null,
  editingCategoryId: null,
  editingUserId: null,
};

const els = {};

function cacheElements() {
  els.userArea = document.getElementById('userArea');
  els.dashboardBtn = document.getElementById('dashboardBtn');
  els.navButtons = Array.from(document.querySelectorAll('#mainNav [data-view]'));
  els.navToggle = document.getElementById('navToggle');
  els.navMenu = document.getElementById('navMenu');

  els.viewLogin = document.getElementById('view-login');
  els.viewKatalog = document.getElementById('view-katalog');
  els.catalogSection = document.getElementById('catalogSection');
  els.viewSeller = document.getElementById('view-seller');
  els.viewAdmin = document.getElementById('view-admin');

  els.loginForm = document.getElementById('loginForm');
  els.loginError = document.getElementById('loginError');

  els.searchInput = document.getElementById('searchInput');
  els.categoryFilter = document.getElementById('categoryFilter');
  els.sortOption = document.getElementById('sortOption');
  els.catalogGrid = document.getElementById('catalogGrid');
  els.resultCount = document.getElementById('resultCount');
  els.resetFilter = document.getElementById('resetFilter');

  els.statProduk = document.getElementById('statProduk');
  els.statStok = document.getElementById('statStok');
  els.statKategori = document.getElementById('statKategori');
  els.productTable = document.getElementById('productTable');
  els.productForm = document.getElementById('productForm');
  els.productTitle = document.getElementById('formTitle');
  els.productSubmit = document.getElementById('formSubmit');
  els.productCancel = document.getElementById('productCancel');
  els.productCategory = document.getElementById('formKategori');

  els.categoryForm = document.getElementById('categoryForm');
  els.categoryTitle = document.getElementById('catTitle');
  els.categorySubmit = document.getElementById('catSubmit');
  els.categoryCancel = document.getElementById('catCancel');
  els.categoryList = document.getElementById('categoryList');

  els.adminTotal = document.getElementById('adminSumTotal');
  els.adminAdmin = document.getElementById('adminSumAdmin');
  els.adminSeller = document.getElementById('adminSumSeller');
  els.adminPembeli = document.getElementById('adminSumPembeli');
  els.userTable = document.getElementById('userTable');
  els.userForm = document.getElementById('userForm');
  els.userTitle = document.getElementById('userTitle');
  els.userSubmit = document.getElementById('userSubmit');
  els.userCancel = document.getElementById('userCancel');

  els.btnExport = document.getElementById('btnExport');
  els.btnImport = document.getElementById('btnImport');
  els.importFile = document.getElementById('importFile');
  els.btnReset = document.getElementById('btnReset');
}

/* ----------------------------- Navbar ----------------------------- */

function setNavOpen(open) {
  if (!els.navToggle || !els.navMenu) return;
  els.navMenu.classList.toggle('is-open', open);
  els.navToggle.classList.toggle('is-active', open);
  els.navToggle.setAttribute('aria-expanded', String(open));
  els.navToggle.setAttribute('aria-label', open ? 'Tutup menu navigasi' : 'Buka menu navigasi');
}

function closeNav() {
  setNavOpen(false);
}

/* --------------------------- Hak akses ---------------------------- */

function canAccess(view) {
  const role = state.user ? state.user.role : 'guest';
  if (view === 'katalog') return true;
  if (view === 'login') return !state.user;
  if (view === 'seller') return role === 'seller';
  if (view === 'admin') return role === 'admin';
  return false;
}

function homeView() {
  if (!state.user) return 'katalog';
  if (state.user.role === 'admin') return 'admin';
  if (state.user.role === 'seller') return 'seller';
  return 'katalog';
}

function go(view) {
  if (view === 'login' && state.user) view = homeView();
  if (view === 'dashboard') view = state.user && state.user.role === 'admin' ? 'admin' : 'seller';

  if (!canAccess(view)) {
    showToast('Anda tidak memiliki akses ke halaman tersebut.', 'warn');
    view = state.user ? homeView() : 'katalog';
  }

  state.view = view;
  closeNav();

  els.viewLogin.hidden = view !== 'login';
  els.viewKatalog.hidden = view !== 'katalog';
  els.catalogSection.hidden = view !== 'katalog';
  els.viewSeller.hidden = view !== 'seller';
  els.viewAdmin.hidden = view !== 'admin';

  els.navButtons.forEach((btn) => {
    const target = btn.dataset.view;
    const aktif = target === 'katalog' ? view === 'katalog' : view === 'seller' || view === 'admin';
    btn.classList.toggle('is-active', aktif);
    if (aktif) btn.setAttribute('aria-current', 'page');
    else btn.removeAttribute('aria-current');
  });

  if (view === 'katalog') renderCatalogView();
  else if (view === 'seller') renderSellerView();
  else if (view === 'admin') renderAdminView();

  window.scrollTo({ top: 0, behavior: 'smooth' });
}

/* ----------------------------- Katalog ---------------------------- */

function hasFilters() {
  return (
    Boolean(state.filters.search.trim()) ||
    Boolean(state.filters.kategori) ||
    state.filters.sort !== 'terbaru'
  );
}

function renderCatalogView() {
  fillCategoryOptions(els.categoryFilter, state.categories, state.filters.kategori);
  const hasil = queryProducts(state.products, state.filters);

  renderCatalog(els.catalogGrid, els.resultCount, hasil, {
    users: state.users,
    hasFilters: hasFilters(),
  });

  if (els.resetFilter) els.resetFilter.hidden = !hasFilters();
}

function resetFilters() {
  state.filters = { search: '', kategori: '', sort: 'terbaru' };
  if (els.searchInput) els.searchInput.value = '';
  if (els.categoryFilter) els.categoryFilter.value = '';
  if (els.sortOption) els.sortOption.value = 'terbaru';
  renderCatalogView();
}

/* ----------------------------- Login ------------------------------ */

function handleLogin(event) {
  event.preventDefault();
  showLoginError('');

  const hasil = authenticate(
    state.users,
    els.loginForm.elements.email.value,
    els.loginForm.elements.password.value
  );

  if (hasil.error) {
    showLoginError(hasil.error);
    return;
  }

  setSession(hasil.user.id);
  state.user = hasil.user;
  els.loginForm.reset();
  renderChrome(els, state.user);
  showToast('Selamat datang, ' + hasil.user.nama.split(' ')[0] + '.');
  go(homeView());
}

function handleLogout() {
  clearSession();
  state.user = null;
  state.editingProductId = null;
  state.editingCategoryId = null;
  state.editingUserId = null;
  renderChrome(els, null);
  go('katalog');
  showToast('Anda telah keluar.');
}

/* ----------------------- Dashboard penjual ------------------------ */

function ownProducts() {
  if (!state.user) return [];
  return state.products.filter((p) => p.sellerId === state.user.id);
}

function renderSellerView() {
  renderSeller(
    {
      statProduk: els.statProduk,
      statStok: els.statStok,
      statKategori: els.statKategori,
      tbody: els.productTable,
      categoryList: els.categoryList,
    },
    ownProducts(),
    state.categories,
    state.products
  );
}

function fillProductCategories(selected = '') {
  fillCategorySelect(els.productCategory, state.categories, selected, 'Pilih kategori');
}

function setProductMode(product) {
  els.productForm.reset();
  clearProductErrors();
  els.editingProductId = product ? product.id : null;
  els.productForm.elements.id.value = product ? product.id : '';

  if (product) {
    fillProductCategories(product.kategori);
    els.productForm.elements.nama.value = product.nama ?? '';
    els.productForm.elements.harga.value = product.harga ?? '';
    els.productForm.elements.stok.value = product.stok ?? '';
    els.productForm.elements.deskripsi.value = product.deskripsi ?? '';
    els.productForm.elements.imageUrl.value = product.imageUrl ?? '';
    els.productForm.elements.unggulan.checked = Boolean(product.unggulan);
    els.productTitle.textContent = 'Edit Produk';
    els.productSubmit.textContent = 'Perbarui Produk';
    els.productCancel.hidden = false;
  } else {
    fillProductCategories('');
    els.productTitle.textContent = 'Tambah Produk';
    els.productSubmit.textContent = 'Simpan Produk';
    els.productCancel.hidden = true;
  }
}

function handleProductSubmit(event) {
  event.preventDefault();
  if (!state.user || state.user.role !== 'seller') return;

  const f = els.productForm.elements;
  const hasil = validateProduct(
    {
      nama: f.nama.value,
      kategori: f.kategori.value,
      harga: f.harga.value,
      stok: f.stok.value,
      deskripsi: f.deskripsi.value,
      imageUrl: f.imageUrl.value,
      unggulan: f.unggulan.checked,
    },
    state.categories.map((c) => c.nama)
  );

  if (!hasil.ok) {
    showProductErrors(hasil.errors);
    const pertama = Object.keys(hasil.errors)[0];
    els.productForm.elements[pertama]?.focus();
    showToast('Periksa kembali isian form.', 'error');
    return;
  }

  const id = els.editingProductId;
  if (id) {
    state.products = updateProduct(id, hasil.value);
    showToast('Produk "' + hasil.value.nama + '" diperbarui.');
  } else {
    state.products = addProduct({ ...hasil.value, sellerId: state.user.id });
    showToast('Produk "' + hasil.value.nama + '" ditambahkan ke katalog.');
  }

  setProductMode(null);
  renderSellerView();
  renderCatalogView();
}

function startEditProduct(id) {
  const produk = ownProducts().find((p) => String(p.id) === String(id));
  if (!produk) return;
  setProductMode(produk);
  els.productTitle.scrollIntoView({ behavior: 'smooth', block: 'center' });
  els.productForm.elements.nama.focus({ preventScroll: true });
}

function confirmDeleteProduct(id) {
  const produk = ownProducts().find((p) => String(p.id) === String(id));
  if (!produk) return;

  const setuju = window.confirm(
    'Hapus produk "' + produk.nama + '"? Produk akan hilang dari katalog publik.'
  );
  if (!setuju) return;

  state.products = deleteProduct(id);
  if (String(els.editingProductId) === String(id)) setProductMode(null);
  renderSellerView();
  renderCatalogView();
  showToast('Produk "' + produk.nama + '" dihapus.');
}

/* -------------------------- Kategori ------------------------------ */

function setCategoryMode(kategori) {
  els.categoryForm.reset();
  showCategoryError('');
  els.editingCategoryId = kategori ? kategori.id : null;
  els.categoryForm.elements.id.value = kategori ? kategori.id : '';

  if (kategori) {
    els.categoryForm.elements.nama.value = kategori.nama;
    els.categoryForm.elements.deskripsi.value = kategori.deskripsi ?? '';
    els.categoryTitle.textContent = 'Edit Kategori';
    els.categorySubmit.textContent = 'Perbarui Kategori';
    els.categoryCancel.hidden = false;
  } else {
    els.categoryTitle.textContent = 'Tambah Kategori';
    els.categorySubmit.textContent = 'Simpan Kategori';
    els.categoryCancel.hidden = true;
  }
}

function handleCategorySubmit(event) {
  event.preventDefault();
  if (!state.user || state.user.role !== 'seller') return;

  const f = els.categoryForm.elements;
  const nama = String(f.nama.value ?? '').trim();
  if (!nama) {
    showCategoryError('Nama kategori wajib diisi.');
    f.nama.focus();
    return;
  }

  try {
    if (els.editingCategoryId) {
      state.categories = updateCategory(els.editingCategoryId, {
        nama,
        deskripsi: f.deskripsi.value,
      });
      state.products = loadProducts().products;
      showToast('Kategori "' + nama + '" diperbarui.');
    } else {
      state.categories = addCategory({ nama, deskripsi: f.deskripsi.value });
      showToast('Kategori "' + nama + '" ditambahkan.');
    }
  } catch (error) {
    showCategoryError(error.message);
    showToast(error.message, 'error');
    return;
  }

  setCategoryMode(null);
  fillProductCategories(els.productForm.elements.kategori.value);
  renderSellerView();
  renderCatalogView();
}

function startEditCategory(id) {
  const kategori = state.categories.find((c) => String(c.id) === String(id));
  if (!kategori) return;
  setCategoryMode(kategori);
  els.categoryForm.scrollIntoView({ behavior: 'smooth', block: 'center' });
  els.categoryForm.elements.nama.focus({ preventScroll: true });
}

function confirmDeleteCategory(id) {
  const kategori = state.categories.find((c) => String(c.id) === String(id));
  if (!kategori) return;

  const setuju = window.confirm('Hapus kategori "' + kategori.nama + '"?');
  if (!setuju) return;

  try {
    state.categories = deleteCategory(id);
  } catch (error) {
    showToast(error.message, 'error');
    return;
  }

  if (els.editingCategoryId === id) setCategoryMode(null);
  fillProductCategories(els.productForm.elements.kategori.value);
  renderSellerView();
  renderCatalogView();
  showToast('Kategori "' + kategori.nama + '" dihapus.');
}

/* ------------------------ Dashboard admin ------------------------- */

function renderAdminView() {
  renderAdmin(
    {
      total: els.adminTotal,
      admin: els.adminAdmin,
      seller: els.adminSeller,
      pembeli: els.adminPembeli,
      tbody: els.userTable,
    },
    state.users
  );
}

function setUserMode(user) {
  els.userForm.reset();
  clearUserErrors();
  els.editingUserId = user ? user.id : null;
  els.userForm.elements.id.value = user ? user.id : '';

  if (user) {
    els.userForm.elements.nama.value = user.nama;
    els.userForm.elements.email.value = user.email;
    els.userForm.elements.role.value = user.role;
    els.userForm.elements.telepon.value = user.telepon ?? '';
    els.userForm.elements.toko.value = user.toko ?? '';
    els.userForm.elements.password.value = '';
    els.userTitle.textContent = 'Edit Pengguna';
    els.userSubmit.textContent = 'Perbarui Pengguna';
    els.userCancel.hidden = false;
  } else {
    els.userTitle.textContent = 'Tambah Pengguna';
    els.userSubmit.textContent = 'Simpan Pengguna';
    els.userCancel.hidden = true;
  }
}

function handleUserSubmit(event) {
  event.preventDefault();
  if (!state.user || state.user.role !== 'admin') return;

  const f = els.userForm.elements;
  const existing = els.editingUserId
    ? state.users.find((u) => u.id === els.editingUserId)
    : null;

  const hasil = validateUserInput(
    {
      nama: f.nama.value,
      email: f.email.value,
      password: f.password.value,
      role: f.role.value,
      telepon: f.telepon.value,
      toko: f.toko.value,
      aktif: existing ? existing.aktif : true,
    },
    { users: state.users, currentId: existing ? existing.id : null }
  );

  if (!hasil.ok) {
    showUserErrors(hasil.errors);
    const pertama = Object.keys(hasil.errors)[0];
    els.userForm.elements[pertama]?.focus();
    showToast('Periksa kembali isian form.', 'error');
    return;
  }

  if (existing) {
    if (isLastActiveAdmin(state.users, existing.id) && hasil.value.role !== 'admin') {
      showUserErrors({ role: 'Admin terakhir tidak dapat diturunkan perannya.' });
      showToast('Admin terakhir harus tetap ada.', 'error');
      return;
    }
    const lanjutan = { ...existing, ...hasil.value };
    if (!hasil.value.password) lanjutan.password = existing.password;
    state.users = state.users.map((u) => (u.id === existing.id ? lanjutan : u));
    saveUsers(state.users);
    const mengubahDiri = state.user.id === lanjutan.id;
    if (mengubahDiri) {
      state.user = lanjutan;
      renderChrome(els, state.user);
    }
    showToast('Pengguna "' + lanjutan.nama + '" diperbarui.');
    if (mengubahDiri && lanjutan.role !== 'admin') {
      setUserMode(null);
      renderAdminView();
      go('katalog');
      return;
    }
  } else {
    const baru = {
      ...hasil.value,
      id: 'u-' + Date.now(),
      aktif: true,
      dibuat: new Date().toISOString(),
    };
    state.users = [...state.users, baru];
    saveUsers(state.users);
    showToast('Pengguna "' + baru.nama + '" ditambahkan.');
  }

  setUserMode(null);
  renderAdminView();
}

function startEditUser(id) {
  const user = state.users.find((u) => String(u.id) === String(id));
  if (!user) return;
  setUserMode(user);
  els.userTitle.scrollIntoView({ behavior: 'smooth', block: 'center' });
  els.userForm.elements.nama.focus({ preventScroll: true });
}

function toggleUserActive(id) {
  if (!state.user || state.user.role !== 'admin') return;
  const user = state.users.find((u) => String(u.id) === String(id));
  if (!user) return;

  if (user.id === state.user.id) {
    showToast('Anda tidak dapat menonaktifkan akun sendiri.', 'error');
    return;
  }
  if (user.aktif && isLastActiveAdmin(state.users, user.id)) {
    showToast('Admin aktif terakhir tidak dapat dinonaktifkan.', 'error');
    return;
  }

  state.users = state.users.map((u) => (u.id === user.id ? { ...u, aktif: !u.aktif } : u));
  saveUsers(state.users);
  renderAdminView();
  showToast('Akun "' + user.nama + '" ' + (user.aktif ? 'dinonaktifkan.' : 'diaktifkan.'));
}

function confirmDeleteUser(id) {
  if (!state.user || state.user.role !== 'admin') return;
  const user = state.users.find((u) => String(u.id) === String(id));
  if (!user) return;

  if (user.id === state.user.id) {
    showToast('Anda tidak dapat menghapus akun sendiri.', 'error');
    return;
  }
  if (isLastActiveAdmin(state.users, user.id)) {
    showToast('Admin aktif terakhir tidak dapat dihapus.', 'error');
    return;
  }

  const jumlahProduk = state.products.filter((p) => p.sellerId === user.id).length;
  const pesan =
    'Hapus akun "' +
    user.nama +
    '"?' +
    (jumlahProduk > 0 ? ' ' + jumlahProduk + ' produk miliknya juga akan dihapus.' : '');

  if (!window.confirm(pesan)) return;

  state.users = state.users.filter((u) => u.id !== user.id);
  saveUsers(state.users);

  if (jumlahProduk > 0) {
    state.products = state.products.filter((p) => p.sellerId !== user.id);
    saveProducts(state.products);
    renderCatalogView();
  }

  if (els.editingUserId === user.id) setUserMode(null);
  renderAdminView();
  showToast('Akun "' + user.nama + '" dihapus.');
}

/* ---------------------- Ekspor / Impor / Reset -------------------- */

function handleExport() {
  if (!state.user || state.user.role !== 'seller') return;
  const produk = ownProducts();
  if (produk.length === 0) {
    showToast('Tidak ada produk untuk diekspor.', 'warn');
    return;
  }

  const payload = {
    schemaVersion: SCHEMA_VERSION,
    exportedAt: new Date().toISOString(),
    products: produk,
  };

  const blob = new Blob([JSON.stringify(payload, null, 2)], { type: 'application/json' });
  const url = URL.createObjectURL(blob);
  const tautan = document.createElement('a');
  tautan.href = url;
  tautan.download = 'pawonboga-produk-' + new Date().toISOString().slice(0, 10) + '.json';
  document.body.appendChild(tautan);
  tautan.click();
  tautan.remove();
  setTimeout(() => URL.revokeObjectURL(url), 0);
  showToast('Cadangan JSON diunduh.');
}

async function handleImportFile(event) {
  if (!state.user || state.user.role !== 'seller') return;
  const input = event.target;
  const file = input.files && input.files[0];
  input.value = '';
  if (!file) return;

  let teks;
  try {
    teks = await file.text();
  } catch (error) {
    console.error('Gagal membaca file:', error);
    showToast('File tidak dapat dibaca. Data lama tidak diubah.', 'error');
    return;
  }

  const hasil = parseProductsPayload(teks);
  if (!hasil.ok) {
    showToast(hasil.error + ' Data lama tidak diubah.', 'error');
    return;
  }

  const lain = state.products.filter((p) => p.sellerId !== state.user.id);
  const milikSaya = hasil.products.map((p) => ({ ...p, sellerId: state.user.id }));
  const next = [...lain, ...milikSaya];

  try {
    saveProducts(next);
  } catch (error) {
    console.error('Gagal menyimpan hasil impor:', error);
    showToast('Penyimpanan penuh atau gagal. Data lama tidak diubah.', 'error');
    return;
  }

  state.products = loadProducts().products;
  setProductMode(null);
  renderSellerView();
  renderCatalogView();
  showToast(hasil.products.length + ' produk berhasil diimpor.');
}

function handleReset() {
  if (!state.user || state.user.role !== 'seller') return;

  const setuju = window.confirm(
    'Kembalikan produk Anda ke data contoh? Produk milik Anda akan diganti.'
  );
  if (!setuju) return;

  state.products = resetSellerProducts(state.user.id);
  setProductMode(null);
  renderSellerView();
  renderCatalogView();
  showToast('Data contoh untuk toko Anda dipulihkan.');
}

/* ----------------------------- Events ----------------------------- */

function bindEvents() {
  els.navToggle?.addEventListener('click', () => {
    const terbuka = els.navMenu.classList.contains('is-open');
    setNavOpen(!terbuka);
  });

  document.addEventListener('keydown', (event) => {
    if (event.key !== 'Escape' || !els.navMenu?.classList.contains('is-open')) return;
    closeNav();
    els.navToggle.focus();
  });

  document.addEventListener('click', (event) => {
    if (!els.navMenu?.classList.contains('is-open')) return;
    if (!event.target.closest('.header-inner')) closeNav();
  });

  const desktopQuery = window.matchMedia('(min-width: 701px)');
  desktopQuery.addEventListener('change', (event) => {
    if (event.matches) closeNav();
  });

  els.navButtons.forEach((btn) => {
    btn.addEventListener('click', () => {
      if (btn.dataset.view === 'katalog') {
        go('katalog');
      } else if (!state.user) {
        go('login');
      } else {
        go(state.user.role === 'admin' ? 'admin' : 'seller');
      }
    });
  });

  els.loginForm.addEventListener('submit', handleLogin);

  els.searchInput.addEventListener('input', () => {
    state.filters.search = els.searchInput.value;
    renderCatalogView();
  });
  els.categoryFilter.addEventListener('change', () => {
    state.filters.kategori = els.categoryFilter.value;
    renderCatalogView();
  });
  els.sortOption.addEventListener('change', () => {
    state.filters.sort = els.sortOption.value;
    renderCatalogView();
  });
  els.resetFilter.addEventListener('click', resetFilters);

  els.productForm.addEventListener('submit', handleProductSubmit);
  els.productCancel.addEventListener('click', () => setProductMode(null));
  els.categoryForm.addEventListener('submit', handleCategorySubmit);
  els.categoryCancel.addEventListener('click', () => setCategoryMode(null));
  els.userForm.addEventListener('submit', handleUserSubmit);
  els.userCancel.addEventListener('click', () => setUserMode(null));

  els.btnExport.addEventListener('click', handleExport);
  els.btnImport.addEventListener('click', () => els.importFile.click());
  els.importFile.addEventListener('change', handleImportFile);
  els.btnReset.addEventListener('click', handleReset);

  document.addEventListener('click', (event) => {
    const tombol = event.target.closest('[data-action]');
    if (!tombol) return;
    const action = tombol.dataset.action;
    const id = tombol.dataset.id;

    if (action === 'login') go('login');
    else if (action === 'logout') handleLogout();
    else if (action === 'reset-filters') resetFilters();
    else if (action === 'edit-product') startEditProduct(id);
    else if (action === 'delete-product') confirmDeleteProduct(id);
    else if (action === 'edit-category') startEditCategory(id);
    else if (action === 'delete-category') confirmDeleteCategory(id);
    else if (action === 'edit-user') startEditUser(id);
    else if (action === 'toggle-user') toggleUserActive(id);
    else if (action === 'delete-user') confirmDeleteUser(id);
  });
}

/* ------------------------------ Boot ------------------------------ */

function boot() {
  cacheElements();
  bindEvents();

  const kategori = loadCategories();
  state.categories = kategori.categories;
  const produk = loadProducts();
  state.products = produk.products;
  const pengguna = loadUsers();
  state.users = pengguna.users;

  const sessionId = getSessionUserId();
  if (sessionId) {
    const user = state.users.find((u) => u.id === sessionId);
    if (user && user.aktif) state.user = user;
    else clearSession();
  }

  renderChrome(els, state.user);
  fillProductCategories('');
  fillCategoryOptions(els.categoryFilter, state.categories);

  const rusak = [];
  if (kategori.recovered) rusak.push('kategori');
  if (produk.recovered) rusak.push('produk');
  if (pengguna.recovered) rusak.push('pengguna');

  go('katalog');

  if (produk.storageError) {
    showToast('localStorage tidak dapat diakses. Perubahan tidak akan tersimpan.', 'error');
  } else if (rusak.length > 0) {
    showToast('Data ' + rusak.join(' & ') + ' rusak. Data contoh telah dipulihkan.', 'warn');
  }
}

if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', boot, { once: true });
} else {
  boot();
}
