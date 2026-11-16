// Lapisan persistensi: satu-satunya modul yang membaca/menulis localStorage.

import { formatRp, normalizeProduct, seedCategories, seedProducts } from './products.js';
import { ROLES, seedUsers } from './auth.js';

export const STORAGE_KEY = 'pawonboga:products:v1';
export const CATEGORY_KEY = 'pawonboga:categories:v1';
export const USER_KEY = 'pawonboga:users:v1';
export const SCHEMA_VERSION = 1;

function baca(key) {
  try {
    return localStorage.getItem(key);
  } catch (error) {
    console.warn('localStorage tidak dapat dibaca:', error);
    return null;
  }
}

function tulis(key, value) {
  localStorage.setItem(key, JSON.stringify(value));
}

/* ----------------------------- Kategori ----------------------------- */

function normalizeCategory(record) {
  if (!record || typeof record !== 'object' || Array.isArray(record)) return null;
  const id = record.id;
  const nama = typeof record.nama === 'string' ? record.nama.trim() : '';
  if (!(typeof id === 'string' || typeof id === 'number') || String(id).trim() === '') return null;
  if (!nama) return null;
  return {
    id: String(id),
    nama,
    deskripsi: typeof record.deskripsi === 'string' ? record.deskripsi : '',
  };
}

/** Memuat kategori; data rusak diganti data contoh. */
export function loadCategories() {
  const raw = baca(CATEGORY_KEY);
  if (raw === null) {
    const seeded = seedCategories();
    tulis(CATEGORY_KEY, seeded);
    return { categories: seeded, recovered: false };
  }
  try {
    const parsed = JSON.parse(raw);
    if (!Array.isArray(parsed)) throw new Error('bukan array');
    const categories = [];
    const namaTerpakai = new Set();
    for (const item of parsed) {
      const kategori = normalizeCategory(item);
      if (!kategori || namaTerpakai.has(kategori.nama.toLowerCase())) throw new Error('tidak valid');
      namaTerpakai.add(kategori.nama.toLowerCase());
      categories.push(kategori);
    }
    return { categories, recovered: false };
  } catch (error) {
    console.warn('Data kategori rusak, memakai data contoh:', error);
    const seeded = seedCategories();
    tulis(CATEGORY_KEY, seeded);
    return { categories: seeded, recovered: true };
  }
}

export function saveCategories(categories) {
  tulis(CATEGORY_KEY, categories);
}

export function categoryNames() {
  return loadCategories().categories.map((c) => c.nama);
}

function pastikanNamaKategoriBaru(categories, nama, kecualiId = null) {
  const bentrok = categories.some(
    (c) => c.nama.toLowerCase() === nama.toLowerCase() && c.id !== kecualiId
  );
  if (bentrok) throw new Error('Nama kategori sudah ada.');
  if (!nama) throw new Error('Nama kategori wajib diisi.');
  if (nama.length > 40) throw new Error('Nama kategori maksimal 40 karakter.');
}

export function addCategory({ nama, deskripsi = '' }) {
  const { categories } = loadCategories();
  const bersih = String(nama ?? '').trim();
  pastikanNamaKategoriBaru(categories, bersih);
  const kategori = { id: 'cat-' + Date.now(), nama: bersih, deskripsi: String(deskripsi).trim() };
  const next = [...categories, kategori];
  saveCategories(next);
  return next;
}

/** Mengganti nama kategori sekaligus memperbarui produk yang memakainya. */
export function updateCategory(id, { nama, deskripsi = '' }) {
  const { categories } = loadCategories();
  const lama = categories.find((c) => c.id === id);
  if (!lama) throw new Error('Kategori tidak ditemukan.');

  const bersih = String(nama ?? '').trim();
  pastikanNamaKategoriBaru(categories, bersih, id);

  if (bersih !== lama.nama) {
    const { products } = loadProducts();
    saveProducts(products.map((p) => (p.kategori === lama.nama ? { ...p, kategori: bersih } : p)));
  }

  const next = categories.map((c) =>
    c.id === id ? { ...c, nama: bersih, deskripsi: String(deskripsi).trim() } : c
  );
  saveCategories(next);
  return next;
}

export function deleteCategory(id) {
  const { categories } = loadCategories();
  const kategori = categories.find((c) => c.id === id);
  if (!kategori) throw new Error('Kategori tidak ditemukan.');

  const { products } = loadProducts();
  if (products.some((p) => p.kategori === kategori.nama)) {
    throw new Error('Kategori masih dipakai produk. Pindahkan produknya terlebih dahulu.');
  }

  const next = categories.filter((c) => c.id !== id);
  saveCategories(next);
  return next;
}

/* ------------------------------ Produk ------------------------------ */

export function saveProducts(products) {
  tulis(STORAGE_KEY, products);
}

/**
 * Memuat produk dan memvalidasi setiap field terhadap kategori aktif.
 * Data rusak dikembalikan ke 8 produk contoh dan ditandai `recovered`.
 */
export function loadProducts() {
  const names = categoryNames();
  const raw = baca(STORAGE_KEY);

  if (raw === null) {
    const seeded = seedProducts();
    try {
      saveProducts(seeded);
    } catch (error) {
      console.warn('Gagal menyimpan data contoh:', error);
      return { products: seeded, recovered: false, storageError: true };
    }
    return { products: seeded, recovered: false, storageError: false };
  }

  const pulihkan = () => {
    const seeded = seedProducts();
    try {
      saveProducts(seeded);
    } catch (error) {
      console.warn('Gagal menyimpan data contoh:', error);
    }
    return { products: seeded, recovered: true, storageError: false };
  };

  let parsed;
  try {
    parsed = JSON.parse(raw);
  } catch (error) {
    console.warn('Data produk bukan JSON valid, memakai data contoh:', error);
    return pulihkan();
  }

  if (!Array.isArray(parsed)) return pulihkan();

  const products = [];
  for (let i = 0; i < parsed.length; i += 1) {
    const produk = normalizeProduct(parsed[i], names);
    if (!produk) {
      console.warn('Produk ke-' + (i + 1) + ' tidak valid, memakai data contoh.');
      return pulihkan();
    }
    products.push(produk);
  }

  return { products, recovered: false, storageError: false };
}

function nextId(products, prefix = '') {
  const dipakai = new Set(products.map((p) => String(p.id)));
  let id = prefix + String(Date.now());
  let tambahan = 0;
  while (dipakai.has(id)) {
    tambahan += 1;
    id = prefix + String(Date.now() + tambahan);
  }
  return id;
}

export function addProduct(data) {
  const { products } = loadProducts();
  const produk = { ...data, id: nextId(products), sellerId: data.sellerId || '' };
  products.push(produk);
  saveProducts(products);
  return products;
}

export function updateProduct(id, data) {
  const { products } = loadProducts();
  const index = products.findIndex((p) => String(p.id) === String(id));
  if (index === -1) return products;
  products[index] = { ...products[index], ...data, id: products[index].id };
  saveProducts(products);
  return products;
}

export function deleteProduct(id) {
  const { products } = loadProducts();
  const next = products.filter((p) => String(p.id) !== String(id));
  saveProducts(next);
  return next;
}

/** Mengembalikan produk milik satu penjual ke data contoh miliknya. */
export function resetSellerProducts(sellerId) {
  const { products } = loadProducts();
  const lain = products.filter((p) => p.sellerId !== sellerId);
  const seed = seedProducts().filter((p) => p.sellerId === sellerId);
  const next = [...lain, ...seed];
  saveProducts(next);
  return next;
}

/* ------------------------------ Pengguna ----------------------------- */

function normalizeUser(record) {
  if (!record || typeof record !== 'object' || Array.isArray(record)) return null;
  const id = record.id;
  const nama = typeof record.nama === 'string' ? record.nama.trim() : '';
  const email = typeof record.email === 'string' ? record.email.trim().toLowerCase() : '';
  if (!(typeof id === 'string' || typeof id === 'number') || !String(id).trim()) return null;
  if (!nama || !email) return null;
  if (!ROLES.includes(record.role)) return null;
  if (typeof record.password !== 'string' || !record.password) return null;
  return {
    id: String(id),
    nama,
    email,
    password: record.password,
    role: record.role,
    telepon: typeof record.telepon === 'string' ? record.telepon : '',
    toko: typeof record.toko === 'string' ? record.toko : '',
    aktif: record.aktif !== false,
    dibuat: typeof record.dibuat === 'string' ? record.dibuat : new Date().toISOString(),
  };
}

/** Memuat pengguna; data rusak diganti akun demo. */
export function loadUsers() {
  const raw = baca(USER_KEY);
  if (raw === null) {
    const seeded = seedUsers();
    tulis(USER_KEY, seeded);
    return { users: seeded, recovered: false };
  }
  try {
    const parsed = JSON.parse(raw);
    if (!Array.isArray(parsed)) throw new Error('bukan array');
    const users = [];
    for (const item of parsed) {
      const user = normalizeUser(item);
      if (!user) throw new Error('tidak valid');
      users.push(user);
    }
    return { users, recovered: false };
  } catch (error) {
    console.warn('Data pengguna rusak, memakai akun demo:', error);
    const seeded = seedUsers();
    tulis(USER_KEY, seeded);
    return { users: seeded, recovered: true };
  }
}

export function saveUsers(users) {
  tulis(USER_KEY, users);
}

/* ------------------------------- Impor ------------------------------- */

/**
 * Mem-parse dan memvalidasi file impor JSON tanpa menyentuh localStorage.
 * Satu produk tidak valid membatalkan seluruh impor.
 */
export function parseProductsPayload(teks) {
  let data;
  try {
    data = JSON.parse(String(teks));
  } catch {
    return { ok: false, error: 'File bukan JSON yang valid.' };
  }

  if (
    data &&
    typeof data === 'object' &&
    !Array.isArray(data) &&
    'schemaVersion' in data &&
    data.schemaVersion !== SCHEMA_VERSION
  ) {
    return {
      ok: false,
      error: 'Versi skema file tidak didukung (' + String(data.schemaVersion) + ').',
    };
  }

  const daftar = Array.isArray(data)
    ? data
    : data && Array.isArray(data.products)
      ? data.products
      : null;

  if (!daftar) {
    return {
      ok: false,
      error: 'Struktur file tidak dikenali. Gunakan file hasil ekspor aplikasi ini.',
    };
  }
  if (daftar.length === 0) return { ok: false, error: 'File tidak berisi produk.' };

  const names = categoryNames();
  const products = [];
  for (let i = 0; i < daftar.length; i += 1) {
    const produk = normalizeProduct(daftar[i], names);
    if (!produk) {
      return {
        ok: false,
        error:
          'Produk #' +
          (i + 1) +
          ' tidak valid (nama, kategori, harga, atau stok). Impor dibatalkan.',
      };
    }
    products.push(produk);
  }

  return { ok: true, products };
}

/* ----------------------------- WhatsApp ------------------------------ */

export function buildWhatsAppUrl(nomor, produk) {
  const bersih = String(nomor ?? '')
    .replace(/\s+/g, '')
    .replace(/[()-]/g, '')
    .replace(/^\+/, '');

  if (!/^[1-9]\d{7,14}$/.test(bersih)) return '';

  const nama = String(produk?.nama ?? '').trim();
  if (!nama) return '';

  const harga = Number(produk?.harga);
  const hargaTeks = Number.isFinite(harga) ? ' (' + formatRp(harga) + ')' : '';
  const pesan =
    'Halo, saya ingin memesan ' + nama + hargaTeks + '. Apakah stok masih tersedia?';

  return 'https://wa.me/' + bersih + '?text=' + encodeURIComponent(pesan);
}
