// Autentikasi ringan berbasis localStorage untuk demo 3 peran.
// Catatan: password disimpan apa adanya karena ini aplikasi demo tanpa backend.

export const ROLES = ['admin', 'seller', 'pembeli'];

export const ROLE_LABEL = {
  admin: 'Admin',
  seller: 'Penjual',
  pembeli: 'Pembeli',
};

export const SESSION_KEY = 'pawonboga:session:v1';

export function seedUsers() {
  return [
    {
      id: 'u-admin-1',
      nama: 'Rina Admin',
      email: 'admin@bengkelku.id',
      password: 'admin123',
      role: 'admin',
      telepon: '6281234567890',
      toko: '',
      aktif: true,
      dibuat: '2026-01-05T09:00:00.000Z',
    },
    {
      id: 'u-seller-1',
      nama: 'Budi Santoso',
      email: 'budi@bengkelku.id',
      password: 'seller123',
      role: 'seller',
      telepon: '6281234567890',
      toko: 'Budi Motor',
      aktif: true,
      dibuat: '2026-01-06T09:00:00.000Z',
    },
    {
      id: 'u-seller-2',
      nama: 'Sari Wulandari',
      email: 'sari@bengkelku.id',
      password: 'seller123',
      role: 'seller',
      telepon: '6281298765432',
      toko: 'Sari Sparepart',
      aktif: true,
      dibuat: '2026-01-07T09:00:00.000Z',
    },
    {
      id: 'u-buyer-1',
      nama: 'Dedi Kurniawan',
      email: 'dedi@pembeli.id',
      password: 'pembeli123',
      role: 'pembeli',
      telepon: '6281200000001',
      toko: '',
      aktif: true,
      dibuat: '2026-01-08T09:00:00.000Z',
    },
    {
      id: 'u-buyer-2',
      nama: 'Nur Aisyah',
      email: 'nur@pembeli.id',
      password: 'pembeli123',
      role: 'pembeli',
      telepon: '6281200000002',
      toko: '',
      aktif: true,
      dibuat: '2026-01-09T09:00:00.000Z',
    },
  ];
}

/** Membaca id pengguna dari sesi, atau null. */
export function getSessionUserId() {
  try {
    return localStorage.getItem(SESSION_KEY);
  } catch {
    return null;
  }
}

export function setSession(userId) {
  localStorage.setItem(SESSION_KEY, String(userId));
}

export function clearSession() {
  localStorage.removeItem(SESSION_KEY);
}

/**
 * Memeriksa kredensial. Mengembalikan { user } atau { error }.
 */
export function authenticate(users, email, password) {
  const emailBersih = String(email ?? '').trim().toLowerCase();
  const sandi = String(password ?? '');
  const user = (users || []).find((u) => String(u.email).toLowerCase() === emailBersih);

  if (!user || user.password !== sandi) {
    return { error: 'Email atau password salah.' };
  }
  if (!user.aktif) {
    return { error: 'Akun ini sedang dinonaktifkan. Hubungi admin.' };
  }
  return { user };
}

/** True bila user adalah satu-satunya admin aktif. */
export function isLastActiveAdmin(users, userId) {
  const adminAktif = (users || []).filter((u) => u.role === 'admin' && u.aktif);
  return adminAktif.length <= 1 && adminAktif.some((u) => u.id === userId);
}

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

/**
 * Validasi input form pengguna (dipakai admin).
 * @param {object} input
 * @param {{ users?: object[], currentId?: string|null }} opsi
 * @returns {{ ok: boolean, errors: Record<string,string>, value: object }}
 */
export function validateUserInput(input, opsi = {}) {
  const users = opsi.users || [];
  const currentId = opsi.currentId || null;
  const sumber = input ?? {};
  const errors = {};

  const nama = String(sumber.nama ?? '').trim();
  if (!nama) errors.nama = 'Nama wajib diisi.';
  else if (nama.length > 60) errors.nama = 'Nama maksimal 60 karakter.';

  const email = String(sumber.email ?? '').trim().toLowerCase();
  if (!email) errors.email = 'Email wajib diisi.';
  else if (!EMAIL_RE.test(email)) errors.email = 'Format email tidak valid.';
  else if (users.some((u) => String(u.email).toLowerCase() === email && u.id !== currentId)) {
    errors.email = 'Email sudah dipakai akun lain.';
  }

  const role = String(sumber.role ?? '');
  if (!ROLES.includes(role)) errors.role = 'Peran tidak valid.';

  const password = String(sumber.password ?? '');
  if (currentId) {
    if (password && password.length < 6) errors.password = 'Password minimal 6 karakter.';
  } else if (!password) {
    errors.password = 'Password wajib diisi.';
  } else if (password.length < 6) {
    errors.password = 'Password minimal 6 karakter.';
  }

  const telepon = String(sumber.telepon ?? '').trim();
  if (telepon && !/^[0-9+\s()-]{8,20}$/.test(telepon)) {
    errors.telepon = 'Nomor telepon tidak valid.';
  }

  return {
    ok: Object.keys(errors).length === 0,
    errors,
    value: {
      nama,
      email,
      role,
      telepon,
      toko: role === 'seller' ? String(sumber.toko ?? '').trim() : '',
      password,
      aktif: sumber.aktif !== false,
    },
  };
}
