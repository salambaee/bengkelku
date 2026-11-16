# TASKS.md — Rencana Kerja BengkelKu

Dokumen ini memecah `SPEC.md` menjadi 9 milestone yang bisa dikerjakan berurutan. **Belum ada kode yang ditulis**; dokumen ini hanya rencana, kriteria penerimaan, daftar file, dan perintah uji.

## 0. Ruang Lingkup & Keputusan Awal

### 0.1 Yang dikerjakan
Mengikuti `SPEC.md`: katalog publik + satu dashboard pengelola, Vite + Vanilla JavaScript, data di `localStorage`, tanpa backend, tanpa login (sesuai §7 Out-of-Scope).

### 0.2 Catatan tentang prototipe yang ada
`index.html` saat ini adalah prototipe single-file yang sudah memuat katalog, CRUD, seed 8 produk, dan WhatsApp — **plus** tambahan login 3 peran (admin/penjual/pembeli) yang tidak ada di `SPEC.md`.

Keputusan untuk milestone di bawah:
- Kode prototipe **dipindahkan** (port), bukan ditulis ulang dari nol, pada M2–M6.
- Fitur 3 peran + autentikasi **tidak termasuk** 9 milestone ini. Fitur tersebut dicatat sebagai backlog **E1** di §11 agar tidak hilang dan bisa diputuskan terpisah.
- Jika Anda ingin 3 peran masuk lingkup, M5 dan M6 perlu direvisi lebih dulu (lihat §11).

### 0.3 Struktur file target

```
index.html                 # shell HTML, hanya <div id="app"> + <script type="module">
package.json
vite.config.js
src/
  main.js                  # bootstrap: load data, render, pasang event
  styles.css
  data/seed.js             # 8 produk contoh
  lib/storage.js           # baca/tulis localStorage + migrasi skema
  lib/products.js          # query murni: search, filter, sort, ringkasan
  lib/whatsapp.js          # bangun URL wa.me + pesan
  lib/sanitize.js          # escape HTML + validasi URL gambar
  lib/validate.js          # validasi produk & payload JSON
  views/catalog.js
  views/dashboard.js
  components/productCard.js
  components/toast.js
tests/
  setup.js
  seed.test.js
  storage.test.js
  products.test.js
  whatsapp.test.js
  validate.test.js
  catalog.dom.test.js
  dashboard.dom.test.js
  security.test.js
```

### 0.4 Definition of Done (berlaku untuk semua milestone)
- [ ] `npm run build` sukses tanpa warning baru.
- [ ] Tidak ada error/warning di console browser saat memuat halaman.
- [ ] Semua acceptance criteria milestone terpenuhi dan dibuktikan (perintah uji atau checklist manual).
- [ ] Perubahan hanya menyentuh file yang tercantum di milestone.
- [ ] Satu commit per milestone dengan pesan `M<n>: <ringkasan>`.

### 0.5 Peta Acceptance Criteria SPEC → Milestone

| AC | Bunyi | Milestone |
|---|---|---|
| AC1 | 8 produk contoh dimuat saat localStorage kosong | M2 |
| AC2 | Pencarian langsung memfilter daftar | M3 |
| AC3 | Tombol WA membuka tab baru `wa.me` dengan nama produk | M4 |
| AC4 | Produk baru dari dashboard langsung muncul di katalog | M5 |
| AC5 | Harga/stok negatif ditolak | M5 |
| AC6 | Data bertahan setelah refresh | M6 |

---

## M1 — Scaffold Vite

**Tujuan:** proyek Vite + Vanilla JS berjalan, terstruktur, dan build produksi bersih.

**Deliverable**
- Proyek Vite vanilla di root repo (bukan subfolder), `index.html` minimal dengan `<div id="app">`.
- `src/main.js` hanya memasang placeholder ("BengkelKu").
- `src/styles.css` memuat variabel warna/tipografi dasar (boleh diambil dari prototipe).
- `.gitignore` berisi `node_modules`, `dist`.
- `README.md` singkat: cara jalan, cara build, struktur folder.

**Acceptance criteria**
- [ ] `npm run dev` menyajikan halaman di `http://localhost:5173` tanpa error console.
- [ ] `npm run build` menghasilkan `dist/` tanpa warning.
- [ ] `dist/index.html` mereferensikan bundle ber-hash (bukan source mentah).
- [ ] Tidak ada dependency runtime selain Vite.

**File disentuh:** `package.json`, `vite.config.js`, `index.html`, `src/main.js`, `src/styles.css`, `.gitignore`, `README.md`

**Perintah uji**
```bash
npm install
npm run dev            # buka http://localhost:5173, cek console kosong
npm run build
npx vite preview --port 4173   # cek hasil build
node --check src/main.js
```

---

## M2 — Landing & 8 Produk (AC1)

**Tujuan:** halaman katalog publik menampilkan grid produk dari data seed saat storage kosong.

**Deliverable**
- `src/data/seed.js`: 8 produk lengkap sesuai Data Model §4 (id, nama, kategori, harga, stok, deskripsi, imageUrl, unggulan).
- `src/lib/storage.js`: `loadProducts()` — ambil dari `localStorage`, jika kosong/tidak valid tanam seed lalu simpan; `saveProducts()`.
- `src/lib/sanitize.js`: `escapeHtml()` dan `safeImageUrl()` (hanya `http`/`https`, fallback placeholder).
- `src/views/catalog.js` + `src/components/productCard.js`: grid nama, harga (format Rupiah), stok, gambar, badge unggulan.
- Ringkasan katalog: jumlah produk ditemukan.
- Empty state saat data kosong; gambar rusak jatuh ke placeholder.

**Acceptance criteria**
- [ ] AC1: dengan localStorage bersih, 8 produk tampil dan tersimpan sebagai `bengkelku.products.v1`.
- [ ] Refresh tidak menggandakan seed (tetap 8).
- [ ] Data seed sesuai model: `harga`/`stok` bertipe number, `unggulan` boolean.
- [ ] Harga tampil format `Rp 1.234.000`; stok 0 tampil sebagai "Habis".
- [ ] Tidak ada `innerHTML` berisi data mentah tanpa escape.

**File disentuh:** `src/data/seed.js`, `src/lib/storage.js`, `src/lib/sanitize.js`, `src/views/catalog.js`, `src/components/productCard.js`, `src/main.js`, `src/styles.css`

**Perintah uji**
```bash
npm run dev     # manual: hapus localStorage, reload, hitung 8 kartu; reload lagi, tetap 8
npm run build
node --check src/data/seed.js src/lib/storage.js src/lib/sanitize.js src/views/catalog.js
```
> Test otomatis untuk seed/storage ditambahkan di M7; sampai saat itu verifikasi manual dengan checklist di atas.

---

## M3 — Pencarian, Filter, Sorting (AC2)

**Tujuan:** pengguna dapat mempersempit dan mengurutkan katalog secara instan.

**Deliverable**
- `src/lib/products.js` berisi fungsi murni: `searchProducts(list, query)`, `filterByCategory(list, kategori)`, `sortProducts(list, mode)`, `summarize(list)`.
- Kontrol UI: input pencarian (nama + deskripsi, case-insensitive), dropdown kategori yang dibangun dari data, dropdown urutan: termurah, termahal, nama A–Z, terbaru.
- Kombinasi filter berjalan bersamaan + tombol "Reset filter".
- Hasil kosong menampilkan empty state dengan saran reset.

**Acceptance criteria**
- [ ] AC2: mengetik "busi" menyisakan hanya produk yang namanya mengandung "busi".
- [ ] Pencarian tidak membedakan huruf besar/kecil dan mengabaikan spasi di tepi.
- [ ] Filter kategori + pencarian + sorting dapat aktif bersamaan.
- [ ] Sorting harga/nama benar secara numerik dan alfabetis (bukan string compare untuk harga).
- [ ] Opsi kategori selalu sinkron dengan data produk (kategori tanpa produk tidak muncul, atau muncul dengan 0 hasil — pilih satu dan dokumentasikan).
- [ ] Reset mengembalikan seluruh produk dan urutan default.

**File disentuh:** `src/lib/products.js`, `src/views/catalog.js`, `src/main.js`, `src/styles.css`

**Perintah uji**
```bash
npm run dev    # manual: cek 4 skenario (search saja, filter saja, sort saja, kombinasi)
npm run build
node --check src/lib/products.js src/views/catalog.js
```

---

## M4 — Integrasi WhatsApp (AC3)

**Tujuan:** setiap produk punya tombol pesan yang membuka WhatsApp dengan pesan terisi otomatis.

**Deliverable**
- `src/lib/whatsapp.js`: `normalizePhone()` (08xx / +62 / 62 → `62…`), `buildWhatsAppUrl(product, storePhone)`, konfigurasi nomor toko di satu konstanta (`STORE_PHONE`, default nomor dummy).
- Tombol "Pesan via WA" di kartu produk; nonaktif dengan label "Stok habis" saat `stok === 0`.
- Pesan memuat nama produk, harga terformat, dan jumlah 1.
- Link memakai `target="_blank"` + `rel="noopener noreferrer"`.

**Acceptance criteria**
- [ ] AC3: klik membuka tab baru `https://wa.me/<nomor>?text=<pesan>` dan teks berisi nama produk.
- [ ] Nomor `0812…`, `+62812…`, `62812…` menghasilkan URL yang sama.
- [ ] Nama produk dengan karakter khusus (`&`, `#`, `%`, emoji) ter-encode benar dan tidak memotong pesan.
- [ ] Nomor tidak valid (kosong/huruf) ditangani: tombol tidak dirender atau memakai nomor fallback, tanpa error.
- [ ] Produk stok 0 tidak menghasilkan link pesan.

**File disentuh:** `src/lib/whatsapp.js`, `src/components/productCard.js`, `src/views/catalog.js`, `src/styles.css`, `README.md` (cara mengganti nomor toko)

**Perintah uji**
```bash
npm run dev    # klik tombol, periksa URL & isi pesan di tab WhatsApp
npm run build
node --check src/lib/whatsapp.js
node -e "console.log(new URL('https://wa.me/6281234567890?text=uji').searchParams.get('text'))"
```

---

## M5 — Dashboard CRUD (AC4, AC5)

**Tujuan:** pengelola dapat menambah, membaca, mengubah, dan menghapus produk, serta melihat ringkasan inventaris.

**Deliverable**
- `src/views/dashboard.js`: tabel produk (nama, kategori, harga, stok, unggulan, aksi) + form tambah/edit.
- `src/lib/validate.js`: `validateProduct(input)` → `{ ok, errors }` untuk nama wajib, kategori wajib, harga/stok bilangan bulat ≥ 0, URL gambar valid.
- Alur: submit form → validasi → simpan → render ulang tabel **dan** katalog; edit mengisi form; hapus memakai konfirmasi.
- Ringkasan: total produk, total stok, jumlah kategori, nilai inventaris (Σ harga × stok).
- State form ter-reset setelah simpan/batal; pesan error per field.

**Acceptance criteria**
- [ ] AC4: produk baru dari dashboard langsung terlihat di katalog tanpa reload.
- [ ] AC5: harga atau stok negatif ditolak dengan pesan jelas dan data tidak berubah.
- [ ] Harga/stok non-angka (`abc`, kosong, `1e3`, `1,5`) ditolak.
- [ ] Nama produk kosong ditolak; nama boleh sama (id tetap unik via `Date.now()`/`crypto.randomUUID()`).
- [ ] Edit menyimpan perubahan dan tidak menduplikasi baris.
- [ ] Hapus meminta konfirmasi; membatalkan konfirmasi tidak mengubah data.
- [ ] Ringkasan (produk/stok/kategori/nilai) akurat setelah setiap operasi.
- [ ] Setelah CRUD, `localStorage` sudah berisi data terbaru.

**File disentuh:** `src/views/dashboard.js`, `src/lib/validate.js`, `src/lib/storage.js`, `src/lib/products.js`, `src/main.js`, `src/styles.css`

**Perintah uji**
```bash
npm run dev    # manual: tambah → cek katalog; edit; hapus; isi -1 pada harga & stok
npm run build
node --check src/views/dashboard.js src/lib/validate.js
```

---

## M6 — localStorage & Import/Export JSON (AC6)

**Tujuan:** data persisten, bisa dicadangkan, dan dipulihkan dengan aman.

**Deliverable**
- `src/lib/storage.js`: versi skema (`schemaVersion`), `loadProducts`, `saveProducts`, `migrate()`, penanganan JSON rusak (fallback ke seed + peringatan, bukan crash), dan penanganan `QuotaExceededError`.
- Panel "Data" di dashboard: tombol **Ekspor JSON** (unduh `bengkelku-backup-YYYYMMDD.json`) dan **Impor JSON** (`<input type="file" accept="application/json">`).
- Format ekspor: `{ schemaVersion, exportedAt, products: [...] }`.
- Impor: parse → validasi struktur & tiap produk → tampilkan ringkasan ("12 produk valid, 1 ditolak") → konfirmasi mode **Ganti** (default) sebelum menimpa.
- Aturan: impor tidak boleh menimpa data sebelum pengguna mengonfirmasi.

**Acceptance criteria**
- [ ] AC6: tambah produk, refresh (F5) → produk masih ada.
- [ ] Buka di tab baru/origin sama → data sama.
- [ ] Ekspor menghasilkan file JSON valid yang bisa dibuka ulang.
- [ ] Impor file hasil ekspor sendiri mengembalikan data identik (round-trip).
- [ ] File JSON rusak/format salah ditolak dengan pesan, data lama utuh.
- [ ] Produk tidak valid di dalam file valid (harga negatif, field hilang) dilewati dan dilaporkan.
- [ ] Me-refresh setelah impor tidak menggandakan atau menanam seed ulang.
- [ ] `localStorage` berisi JSON rusak secara manual → aplikasi tetap tampil (seed/empty state) dan memberi tahu pengguna.

**File disentuh:** `src/lib/storage.js`, `src/views/dashboard.js`, `src/main.js`, `src/styles.css`, `README.md` (format backup)

**Perintah uji**
```bash
npm run dev    # tambah produk → refresh → cek; ekspor → impor → bandingkan jumlah
npm run build
node --check src/lib/storage.js src/views/dashboard.js
# uji ketahanan: set localStorage 'bengkelku.products.v1' = '{rusak' lalu reload
```

---

## M7 — Vitest

**Tujuan:** logika inti dan render DOM terlindungi test otomatis.

**Deliverable**
- Dependency dev: `vitest`, `jsdom`, `@vitest/coverage-v8`.
- `vite.config.js`: konfigurasi `test.environment = 'jsdom'`, `setupFiles`, coverage `src/**` dengan threshold awal (mis. lines 70%).
- `tests/setup.js`: reset `localStorage` dan DOM per test; helper factory produk.
- Test wajib:
  - `seed.test.js` — 8 produk, bentuk data valid, id unik.
  - `storage.test.js` — seed saat kosong, tidak seed ulang, JSON rusak, quota error, migrasi skema.
  - `products.test.js` — search case-insensitive, filter, 4 mode sort, kombinasi, ringkasan.
  - `whatsapp.test.js` — normalisasi nomor, encoding pesan, stok 0.
  - `validate.test.js` — harga/stok negatif & non-angka, nama kosong, URL gambar.
  - `catalog.dom.test.js` — 8 kartu ter-render, pencarian mengubah jumlah kartu, empty state.
  - `dashboard.dom.test.js` — tambah/edit/hapus memperbarui tabel, ringkasan, dan storage; AC4 & AC5 sebagai test.
- `package.json`: `test`, `test:watch`, `test:coverage`.

**Acceptance criteria**
- [ ] `npm test` lulus semua dan exit code 0.
- [ ] Setiap AC1–AC6 punya minimal satu test otomatis yang merujuk AC-nya di nama/judul test.
- [ ] Coverage `src/lib/**` ≥ 80% baris; `src/views/**` ≥ 60%.
- [ ] Test tidak bergantung pada urutan eksekusi dan tidak membocorkan state `localStorage` antar test.
- [ ] Test gagal bila perilaku dirusak (buktikan dengan sengaja merusak satu validasi, lalu kembalikan).

**File disentuh:** `package.json`, `vite.config.js`, `tests/setup.js`, `tests/*.test.js`

**Perintah uji**
```bash
npm install -D vitest jsdom @vitest/coverage-v8
npm test
npm run test:coverage
npx vitest run tests/products.test.js
```

---

## M8 — Security Review

**Tujuan:** permukaan risiko klien (XSS, URL berbahaya, impor JSON, dependency) ditutup dan dibuktikan dengan test.

**Deliverable**
- Audit seluruh titik render: semua data pengguna lewat `escapeHtml`/`textContent`; tidak ada `innerHTML` dengan data mentah.
- `safeImageUrl()` dipakai di semua gambar; hanya `http`/`https`, blokir `javascript:`, `data:`, `vbscript:`.
- Validasi impor JSON ketat (whitelist field, tipe, batas panjang nama/deskripsi, batas jumlah produk).
- Meta CSP di `index.html` (`default-src 'self'; img-src 'self' https:; connect-src 'self'`) dan pengecekan tidak ada script inline.
- `tests/security.test.js` memuat payload: `<img src=x onerror=alert(1)>`, `"><script>`, `javascript:alert(1)` pada imageUrl, JSON dengan `__proto__`, string sangat panjang.
- Catatan risiko yang diterima: dashboard tanpa login (sesuai SPEC §7) — didokumentasikan di `README.md` sebagai batasan MVP.

**Acceptance criteria**
- [ ] Semua payload XSS tampil sebagai teks biasa, tidak ada dialog/eksekusi script.
- [ ] URL `javascript:` tidak pernah masuk ke atribut `src`.
- [ ] Payload `__proto__` pada impor tidak mencemari prototype (`Object.prototype` bersih setelah impor).
- [ ] Tidak ada `eval`, `new Function`, atau `document.write` di `src/`.
- [ ] `npm audit --omit=dev` tanpa kerentanan tingkat high/critical.
- [ ] CSP aktif dan aplikasi tetap berfungsi normal (tidak ada pelanggaran CSP di console).
- [ ] `README.md` mencantumkan batasan keamanan MVP secara eksplisit.

**File disentuh:** `index.html`, `src/lib/sanitize.js`, `src/lib/validate.js`, `src/lib/storage.js`, `tests/security.test.js`, `README.md`

**Perintah uji**
```bash
npm test
npm audit --omit=dev
grep -rnE "eval\(|new Function|document\.write" src/ || echo "bersih"
npm run build && npx vite preview --port 4173   # cek console: tidak ada pelanggaran CSP
```

---

## M9 — Deployment

**Tujuan:** build produksi dapat diakses publik dan terverifikasi.

**Deliverable**
- Target hosting statis (satu dipilih dan dicatat di `README.md`): Netlify / Vercel / Cloudflare Pages / GitHub Pages.
- Konfigurasi build: `npm ci && npm run build`, publish directory `dist`.
- `public/_redirects` atau konfigurasi rewrite setara **hanya jika** diperlukan (aplikasi satu halaman, kemungkinan tidak perlu).
- `dist/` tidak di-commit; deploy dari CI atau drag-and-drop.
- `README.md`: URL produksi, langkah deploy ulang, dan cara rollback.

**Acceptance criteria**
- [ ] URL publik merespons 200 dan menampilkan katalog 8 produk pada kunjungan pertama.
- [ ] Aset ber-hash termuat (tidak ada 404 di Network tab).
- [ ] `localStorage` berfungsi di origin produksi; CRUD + refresh konsisten.
- [ ] Tombol WhatsApp mengarah ke `wa.me` yang benar dari domain produksi.
- [ ] Waktu muat < 2 detik (NFR) di jaringan normal; total JS gzip wajar (< 100 KB).
- [ ] Deploy ulang dari commit baru berhasil tanpa langkah manual tambahan.
- [ ] `README.md` memuat URL, perintah deploy, dan prosedur rollback.

**File disentuh:** `README.md`, `netlify.toml` / `vercel.json` / `.github/workflows/deploy.yml` (pilih sesuai target), `public/` (jika perlu)

**Perintah uji**
```bash
npm ci
npm test
npm run build
npx vite preview --port 4173        # smoke test lokal
du -sh dist && find dist -name "*.js" -exec gzip -c {} \; | wc -c
curl -sI https://<domain-produksi> | head -n 5
```

---

## 10. Urutan, Dependensi, dan Ukuran

| Milestone | Bergantung pada | Ukuran | AC utama |
|---|---|---|---|
| M1 Scaffold | — | S | — |
| M2 Landing + seed | M1 | M | AC1 |
| M3 Search/filter/sort | M2 | M | AC2 |
| M4 WhatsApp | M2 | S | AC3 |
| M5 Dashboard CRUD | M2, M3 | L | AC4, AC5 |
| M6 Storage + import/export | M5 | M | AC6 |
| M7 Vitest | M2–M6 | M | semua |
| M8 Security review | M7 | M | NFR keamanan |
| M9 Deployment | M7, M8 | S | NFR performa |

M3 dan M4 dapat dikerjakan paralel setelah M2. M7 sebaiknya tidak ditunda sampai akhir jika ingin regresi cepat terdeteksi, tetapi ditulis setelah M6 agar cakupannya final.

## 11. Backlog di Luar 9 Milestone

- **E1 — Multi-peran & login:** admin/penjual/pembeli seperti pada `index.html` saat ini (sesi localStorage, guard akses, kategori global). Membutuhkan revisi M5/M6 bila dimasukkan.
- **E2 — Kategori sebagai entitas** (CRUD kategori terpisah, rename ikut memperbarui produk).
- **E3 — Multi-toko / nomor WA per penjual.**
- **E4 — Gambar lokal** (upload/kompresi base64) — bertentangan dengan §7 SPEC, perlu keputusan produk.
- **E5 — Aksesibilitas lanjutan** (fokus trap, aria-live untuk toast, audit axe).

## 12. Aturan Kerja

1. Jangan menulis kode sebelum milestone-nya disetujui; satu milestone = satu commit.
2. Jangan melewati acceptance criteria; tandai `[x]` hanya setelah perintah uji dijalankan dan hasilnya dicatat.
3. Jika sebuah AC ternyata tidak bisa dipenuhi tanpa mengubah `SPEC.md`, hentikan dan revisi dokumen dulu.
4. Perubahan di luar daftar file milestone harus dijelaskan di commit message.
