// Data contoh, konstanta toko, dan fungsi murni seputar produk.

export const WHATSAPP_NUMBER = '6281234567890';

export function seedCategories() {
  return [
    { id: 'cat-mesin', nama: 'Mesin', deskripsi: 'Sparepart area mesin dan pengapian' },
    { id: 'cat-listrik', nama: 'Kelistrikan', deskripsi: 'Aki, lampu, dan komponen listrik' },
    { id: 'cat-roda', nama: 'Roda', deskripsi: 'Ban, rem, dan komponen roda' },
    { id: 'cat-aksesoris', nama: 'Aksesoris', deskripsi: 'Pelengkap dan aksesoris kendaraan' },
  ];
}

/** 8 produk contoh dengan pemilik (sellerId) untuk dashboard penjual. */
export function seedProducts() {
  return [
    { id: '1', nama: 'Busi NGK Platinum', kategori: 'Mesin', harga: 35000, stok: 50, deskripsi: 'Busi tahan lama, pembakaran lebih optimal untuk motor bebek dan matic.', imageUrl: '', unggulan: true, sellerId: 'u-seller-1' },
    { id: '2', nama: 'Kampas Rem Depan', kategori: 'Roda', harga: 45000, stok: 30, deskripsi: 'Kampas rem cakram pakem dan tidak merusak piringan.', imageUrl: '', unggulan: false, sellerId: 'u-seller-1' },
    { id: '3', nama: 'Oli Mesin 1L Sintetik', kategori: 'Mesin', harga: 65000, stok: 100, deskripsi: 'Pelumas sintetik, menjaga suhu mesin tetap dingin saat perjalanan jauh.', imageUrl: '', unggulan: true, sellerId: 'u-seller-1' },
    { id: '4', nama: 'Ban Luar Tubeless', kategori: 'Roda', harga: 195000, stok: 0, deskripsi: 'Ban profil standar untuk kenyamanan berkendara harian.', imageUrl: '', unggulan: false, sellerId: 'u-seller-2' },
    { id: '5', nama: 'Aki Kering 12V', kategori: 'Kelistrikan', harga: 220000, stok: 15, deskripsi: 'Bebas perawatan, starter langsung nyala. Cocok untuk matic injeksi.', imageUrl: '', unggulan: true, sellerId: 'u-seller-2' },
    { id: '6', nama: 'Bohlam LED Depan', kategori: 'Kelistrikan', harga: 45000, stok: 40, deskripsi: 'Cahaya putih terang, daya rendah, awet.', imageUrl: '', unggulan: false, sellerId: 'u-seller-1' },
    { id: '7', nama: 'Rantai Motor Set', kategori: 'Mesin', harga: 135000, stok: 25, deskripsi: 'Gir depan belakang dan rantai. Material baja kuat tarikan berat.', imageUrl: '', unggulan: false, sellerId: 'u-seller-2' },
    { id: '8', nama: 'Spion Standar', kategori: 'Aksesoris', harga: 35000, stok: 60, deskripsi: 'Spion cembung jernih, model standar pabrik.', imageUrl: '', unggulan: false, sellerId: 'u-seller-1' },
  ];
}

/** Format angka Rupiah tanpa desimal, mis. 195000 -> "Rp 195.000". */
export function formatRp(nilai) {
  const angka = Number(nilai);
  const aman = Number.isFinite(angka) ? Math.round(angka) : 0;
  return 'Rp ' + aman.toLocaleString('id-ID');
}

/**
 * Memfilter dan mengurutkan produk untuk katalog.
 * @param {Array<object>} products
 * @param {{ search?: string, kategori?: string, sort?: string }} opsi
 */
export function queryProducts(products, opsi = {}) {
  const cari = String(opsi.search ?? '').trim().toLowerCase();
  const kategori = String(opsi.kategori ?? '');
  const sort = String(opsi.sort ?? 'terbaru');

  let hasil = (Array.isArray(products) ? products : []).filter((p) => {
    if (!cari) return true;
    const teks = String(p.nama ?? '') + ' ' + String(p.deskripsi ?? '');
    return teks.toLowerCase().includes(cari);
  });

  if (kategori) hasil = hasil.filter((p) => p.kategori === kategori);

  const salin = hasil.slice();
  if (sort === 'hargaAsc') salin.sort((a, b) => Number(a.harga) - Number(b.harga));
  else if (sort === 'hargaDesc') salin.sort((a, b) => Number(b.harga) - Number(a.harga));
  else if (sort === 'namaAsc') salin.sort((a, b) => String(a.nama).localeCompare(String(b.nama), 'id'));
  else salin.sort((a, b) => Number(b.id || 0) - Number(a.id || 0));

  return salin;
}

/**
 * Memvalidasi satu record produk dari localStorage / file impor.
 * Kategori harus ada di daftar kategori aktif.
 *
 * @param {unknown} record
 * @param {string[]} kategoriList
 * @returns {object|null}
 */
export function normalizeProduct(record, kategoriList = []) {
  if (!record || typeof record !== 'object' || Array.isArray(record)) return null;

  const id = record.id;
  if (!(typeof id === 'string' || typeof id === 'number') || String(id).trim() === '') return null;

  const nama = typeof record.nama === 'string' ? record.nama.trim() : '';
  if (!nama) return null;

  if (typeof record.kategori !== 'string' || !kategoriList.includes(record.kategori)) return null;
  if (typeof record.harga !== 'number' || !Number.isFinite(record.harga) || record.harga < 0) return null;
  if (typeof record.stok !== 'number' || !Number.isInteger(record.stok) || record.stok < 0) return null;

  return {
    id: String(id),
    nama,
    kategori: record.kategori,
    harga: record.harga,
    stok: record.stok,
    deskripsi: typeof record.deskripsi === 'string' ? record.deskripsi : '',
    imageUrl: typeof record.imageUrl === 'string' ? record.imageUrl : '',
    unggulan: record.unggulan === true,
    sellerId: typeof record.sellerId === 'string' ? record.sellerId : '',
  };
}

/** Validasi input form produk. Kategori harus salah satu dari daftar aktif. */
export function validateProduct(input, kategoriList = []) {
  const errors = {};
  const sumber = input ?? {};

  const nama = String(sumber.nama ?? '').trim();
  if (!nama) errors.nama = 'Nama produk wajib diisi.';
  else if (nama.length > 80) errors.nama = 'Nama produk maksimal 80 karakter.';

  const kategori = String(sumber.kategori ?? '').trim();
  if (!kategori) errors.kategori = 'Kategori wajib dipilih.';
  else if (!kategoriList.includes(kategori)) errors.kategori = 'Kategori tidak dikenal.';

  const hargaMentah = String(sumber.harga ?? '').trim();
  const harga = Number(hargaMentah);
  if (hargaMentah === '') errors.harga = 'Harga wajib diisi.';
  else if (!Number.isFinite(harga)) errors.harga = 'Harga harus berupa angka.';
  else if (harga < 0) errors.harga = 'Harga tidak boleh negatif.';

  const stokMentah = String(sumber.stok ?? '').trim();
  const stok = Number(stokMentah);
  if (stokMentah === '') errors.stok = 'Stok wajib diisi.';
  else if (!Number.isFinite(stok)) errors.stok = 'Stok harus berupa angka.';
  else if (!Number.isInteger(stok)) errors.stok = 'Stok harus bilangan bulat.';
  else if (stok < 0) errors.stok = 'Stok tidak boleh negatif.';

  return {
    ok: Object.keys(errors).length === 0,
    errors,
    value: {
      nama,
      kategori,
      harga: Number.isFinite(harga) ? harga : 0,
      stok: Number.isFinite(stok) ? stok : 0,
      deskripsi: String(sumber.deskripsi ?? '').trim(),
      imageUrl: String(sumber.imageUrl ?? '').trim(),
      unggulan: Boolean(sumber.unggulan),
    },
  };
}
