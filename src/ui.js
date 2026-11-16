// Lapisan tampilan: escape, render katalog/dashboard, dan notifikasi.

import { formatRp, WHATSAPP_NUMBER } from './products.js';
import { ROLE_LABEL } from './auth.js';
import { buildWhatsAppUrl } from './store.js';

export function esc(value) {
  return String(value ?? '')
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#39;');
}

export function safeImageUrl(url) {
  const teks = String(url ?? '').trim();
  if (!teks) return '';
  try {
    const parsed = new URL(teks, window.location.href);
    return parsed.protocol === 'http:' || parsed.protocol === 'https:' ? parsed.href : '';
  } catch {
    return '';
  }
}

function stockBadge(stok) {
  const jumlah = Number(stok);
  if (!Number.isFinite(jumlah) || jumlah <= 0) {
    return '<span class="stock stock-empty">Habis</span>';
  }
  return '<span class="stock stock-aktif">Stok ' + esc(jumlah) + '</span>';
}

function inisial(nama) {
  const kata = String(nama ?? '')
    .trim()
    .split(/\s+/)
    .filter(Boolean);
  if (kata.length === 0) return '?';
  if (kata.length === 1) return kata[0].slice(0, 2).toUpperCase();
  return (kata[0][0] + kata[1][0]).toUpperCase();
}

/* ------------------------------ Chrome ------------------------------ */

export function renderChrome(els, user) {
  if (!els.userArea) return;

  if (user) {
    els.dashboardBtn.hidden = !(user.role === 'admin' || user.role === 'seller');
    els.userArea.innerHTML =
      '<div class="user-chip">' +
        '<span class="avatar" aria-hidden="true">' + esc(inisial(user.nama)) + '</span>' +
        '<div class="user-info">' +
          '<strong>' + esc(user.nama) + '</strong>' +
          '<span class="role-badge role-' + esc(user.role) + '">' +
            esc(ROLE_LABEL[user.role] || user.role) +
          '</span>' +
        '</div>' +
        '<button type="button" class="btn btn-ghost btn-small" data-action="logout">Keluar</button>' +
      '</div>';
  } else {
    els.dashboardBtn.hidden = true;
    els.userArea.innerHTML =
      '<button type="button" class="btn btn-primary btn-small" data-action="login">Masuk</button>';
  }
}

/* ------------------------------ Katalog ----------------------------- */

function productCard(product, ctx) {
  const img = safeImageUrl(product.imageUrl);
  const unggulan = Boolean(product.unggulan);
  const stok = Number(product.stok);
  const habis = !Number.isFinite(stok) || stok <= 0;

  const seller = (ctx.users || []).find((u) => u.id === product.sellerId);
  const namaToko = (seller && seller.toko) || (seller && seller.nama) || 'BengkelKu';
  const nomor = (seller && seller.telepon) || WHATSAPP_NUMBER;
  const waUrl = habis ? '' : buildWhatsAppUrl(nomor, product);

  const waButton = waUrl
    ? '<a class="btn btn-wa" href="' + esc(waUrl) + '" target="_blank" rel="noopener noreferrer">Pesan via WhatsApp</a>'
    : '<button type="button" class="btn btn-wa" disabled title="' +
      (habis ? 'Stok habis' : 'Nomor WhatsApp belum valid') +
      '">Pesan via WhatsApp</button>';

  return (
    '<article class="product-card">' +
      '<div class="product-media' + (unggulan ? ' is-featured' : '') + '">' +
        (unggulan ? '<span class="badge-featured">⭐ Unggulan</span>' : '') +
        (img
          ? '<img class="product-img" src="' + esc(img) + '" alt="' + esc(product.nama) + '" loading="lazy">'
          : '<span class="product-emoji" aria-hidden="true">🔧</span>') +
      '</div>' +
      '<div class="product-body">' +
        '<span class="badge-cat">' + esc(product.kategori) + '</span>' +
        '<h3 class="product-name">' + esc(product.nama) + '</h3>' +
        '<p class="product-desc">' + esc(product.deskripsi || 'Tidak ada deskripsi') + '</p>' +
        '<p class="product-seller">Dijual oleh ' + esc(namaToko) + '</p>' +
        '<div class="product-meta">' +
          '<span class="price">' + esc(formatRp(product.harga)) + '</span>' +
          stockBadge(product.stok) +
        '</div>' +
        waButton +
      '</div>' +
    '</article>'
  );
}

export function renderCatalog(grid, countEl, products, ctx = {}) {
  if (!grid) return;
  const daftar = Array.isArray(products) ? products : [];

  if (countEl) {
    countEl.textContent =
      daftar.length === 0 ? 'Tidak ada produk' : 'Menampilkan ' + daftar.length + ' produk';
  }

  if (daftar.length === 0) {
    grid.innerHTML = ctx.hasFilters
      ? '<div class="empty-state"><strong>Tidak ada produk yang cocok</strong>' +
        '<p>Coba kata kunci atau kategori lain, atau reset filter.</p>' +
        '<button type="button" class="btn btn-ghost" data-action="reset-filters">Reset filter</button></div>'
      : '<div class="empty-state"><strong>Belum ada produk</strong>' +
        '<p>Katalog masih kosong. Silakan kembali lagi nanti.</p></div>';
    return;
  }

  grid.innerHTML = daftar.map((p) => productCard(p, ctx)).join('');
}

export function fillCategorySelect(select, categories, selected = '', placeholder = 'Pilih kategori') {
  if (!select) return;
  const nilai = selected || '';
  select.innerHTML =
    '<option value="">' + esc(placeholder) + '</option>' +
    categories
      .map((k) => '<option value="' + esc(k.nama) + '">' + esc(k.nama) + '</option>')
      .join('');
  select.value = categories.some((k) => k.nama === nilai) ? nilai : '';
}

export function fillCategoryOptions(select, categories, selected = '') {
  if (!select) return;
  const nilai = selected || '';
  select.innerHTML =
    '<option value="">Semua kategori</option>' +
    categories
      .map((k) => '<option value="' + esc(k.nama) + '">' + esc(k.nama) + '</option>')
      .join('');
  select.value = categories.some((k) => k.nama === nilai) ? nilai : '';
}

/* --------------------------- Dashboard seller ----------------------- */

function productRow(product) {
  return (
    '<tr>' +
      '<td><span class="row-name">' + esc(product.nama) + '</span>' +
        (product.unggulan ? ' <span class="badge-featured badge-inline">Unggulan</span>' : '') + '</td>' +
      '<td><span class="badge-cat">' + esc(product.kategori) + '</span></td>' +
      '<td class="cell-price">' + esc(formatRp(product.harga)) + '</td>' +
      '<td>' + stockBadge(product.stok) + '</td>' +
      '<td class="cell-actions">' +
        '<button type="button" class="btn btn-small btn-ghost" data-action="edit-product" data-id="' + esc(product.id) + '">Edit</button>' +
        '<button type="button" class="btn btn-small btn-danger" data-action="delete-product" data-id="' + esc(product.id) + '">Hapus</button>' +
      '</td>' +
    '</tr>'
  );
}

function categoryRow(kategori, jumlahProduk) {
  return (
    '<li class="cat-row">' +
      '<div><strong>' + esc(kategori.nama) + '</strong>' +
        '<span class="cat-meta">' + esc(jumlahProduk) + ' produk</span>' +
        (kategori.deskripsi ? '<p class="cat-desc">' + esc(kategori.deskripsi) + '</p>' : '') +
      '</div>' +
      '<div class="cell-actions">' +
        '<button type="button" class="btn btn-small btn-ghost" data-action="edit-category" data-id="' + esc(kategori.id) + '">Edit</button>' +
        '<button type="button" class="btn btn-small btn-danger" data-action="delete-category" data-id="' + esc(kategori.id) + '">Hapus</button>' +
      '</div>' +
    '</li>'
  );
}

export function renderSeller(els, ownProducts, categories, allProducts) {
  const daftar = Array.isArray(ownProducts) ? ownProducts : [];

  const totalStok = daftar.reduce((total, p) => {
    const stok = Number(p.stok);
    return total + (Number.isFinite(stok) && stok > 0 ? stok : 0);
  }, 0);

  if (els.statProduk) els.statProduk.textContent = String(daftar.length);
  if (els.statStok) els.statStok.textContent = String(totalStok);
  if (els.statKategori) els.statKategori.textContent = String(categories.length);

  if (els.tbody) {
    els.tbody.innerHTML =
      daftar.length === 0
        ? '<tr><td colspan="5" class="table-empty">Belum ada produk. Tambahkan lewat form di samping.</td></tr>'
        : daftar.map(productRow).join('');
  }

  if (els.categoryList) {
    els.categoryList.innerHTML =
      categories.length === 0
        ? '<li class="table-empty">Belum ada kategori.</li>'
        : categories
            .map((k) => categoryRow(k, (allProducts || []).filter((p) => p.kategori === k.nama).length))
            .join('');
  }
}

/* ---------------------------- Dashboard admin ----------------------- */

function userRow(user) {
  return (
    '<tr>' +
      '<td><span class="row-name">' + esc(user.nama) + '</span>' +
        '<span class="row-sub">' + esc(user.email) + '</span></td>' +
      '<td><span class="role-badge role-' + esc(user.role) + '">' +
        esc(ROLE_LABEL[user.role] || user.role) + '</span></td>' +
      '<td><span class="status ' + (user.aktif ? 'status-aktif' : 'status-nonaktif') + '">' +
        (user.aktif ? 'Aktif' : 'Nonaktif') + '</span></td>' +
      '<td class="cell-actions">' +
        '<button type="button" class="btn btn-small btn-ghost" data-action="edit-user" data-id="' + esc(user.id) + '">Edit</button>' +
        '<button type="button" class="btn btn-small btn-ghost" data-action="toggle-user" data-id="' + esc(user.id) + '">' +
          (user.aktif ? 'Nonaktifkan' : 'Aktifkan') + '</button>' +
        '<button type="button" class="btn btn-small btn-danger" data-action="delete-user" data-id="' + esc(user.id) + '">Hapus</button>' +
      '</td>' +
    '</tr>'
  );
}

export function renderAdmin(els, users) {
  const daftar = Array.isArray(users) ? users : [];
  const hitung = (role) => daftar.filter((u) => u.role === role).length;

  if (els.total) els.total.textContent = String(daftar.length);
  if (els.admin) els.admin.textContent = String(hitung('admin'));
  if (els.seller) els.seller.textContent = String(hitung('seller'));
  if (els.pembeli) els.pembeli.textContent = String(hitung('pembeli'));

  if (els.tbody) {
    els.tbody.innerHTML =
      daftar.length === 0
        ? '<tr><td colspan="4" class="table-empty">Belum ada pengguna.</td></tr>'
        : daftar.map(userRow).join('');
  }
}

/* ------------------------------- Error ------------------------------ */

const PRODUCT_FIELDS = {
  nama: ['err-nama', 'formNama'],
  kategori: ['err-kategori', 'formKategori'],
  harga: ['err-harga', 'formHarga'],
  stok: ['err-stok', 'formStok'],
};

const USER_FIELDS = {
  nama: ['err-userNama', 'userNama'],
  email: ['err-userEmail', 'userEmail'],
  password: ['err-userPassword', 'userPassword'],
  role: ['err-userRole', 'userRole'],
  telepon: ['err-userTelepon', 'userTelepon'],
};

function tampilkanError(errors, mapping) {
  Object.entries(mapping).forEach(([field, [errId, inputId]]) => {
    const el = document.getElementById(errId);
    const input = document.getElementById(inputId);
    const pesan = errors[field];
    if (el) {
      el.textContent = pesan || '';
      el.hidden = !pesan;
    }
    if (input) {
      if (pesan) input.setAttribute('aria-invalid', 'true');
      else input.removeAttribute('aria-invalid');
    }
  });
}

function bersihkanError(mapping) {
  Object.values(mapping).forEach(([errId, inputId]) => {
    const el = document.getElementById(errId);
    if (el) {
      el.textContent = '';
      el.hidden = true;
    }
    document.getElementById(inputId)?.removeAttribute('aria-invalid');
  });
}

export function showProductErrors(errors) {
  tampilkanError(errors, PRODUCT_FIELDS);
}
export function clearProductErrors() {
  bersihkanError(PRODUCT_FIELDS);
}
export function showUserErrors(errors) {
  tampilkanError(errors, USER_FIELDS);
}
export function clearUserErrors() {
  bersihkanError(USER_FIELDS);
}

export function showCategoryError(pesan) {
  const el = document.getElementById('err-catNama');
  if (!el) return;
  el.textContent = pesan || '';
  el.hidden = !pesan;
  if (pesan) document.getElementById('catNama')?.setAttribute('aria-invalid', 'true');
  else document.getElementById('catNama')?.removeAttribute('aria-invalid');
}

export function showLoginError(pesan) {
  const el = document.getElementById('loginError');
  if (!el) return;
  el.textContent = pesan || '';
  el.hidden = !pesan;
}

/* ------------------------------- Toast ------------------------------ */

let toastTimer = null;

export function showToast(message, type = 'ok') {
  const toast = document.getElementById('toast');
  if (!toast) return;
  const jenis = type === 'error' ? 'error' : type === 'warn' ? 'warn' : 'ok';
  toast.textContent = message;
  toast.className = 'toast toast-' + jenis;
  toast.hidden = false;
  clearTimeout(toastTimer);
  toastTimer = setTimeout(() => {
    toast.hidden = true;
  }, 2800);
}
