# UI-SPEC — BengkelKu

Spesifikasi antarmuka untuk katalog sparepart UMKM **BengkelKu**. Dokumen ini
mendeskripsikan UI yang **sudah diimplementasikan** di `index.html`, `src/style.css`,
`src/ui.js`, dan `src/main.js`, bukan konsep baru. Setiap penyimpangan antara dokumen dan
kode dianggap bug pada salah satunya.

| Atribut | Nilai |
| --- | --- |
| Versi | 1.0 |
| Tanggal | 16 November 2026 |
| Cakupan | Web app responsif, mobile-first, 3 peran + tamu |
| Sumber kebenaran | `src/style.css` (token), `index.html` (struktur), `src/ui.js` (render) |
| Status | Sesuai implementasi; temuan aksesibilitas §9.3 belum diperbaiki |

---

## 1. Tujuan & prinsip desain

1. **Mobile-first, tanpa horizontal scroll.** Semua layout disusun untuk 375 px lebih dulu,
   lalu melebar. Grid produk, kontrol, dan form turun menjadi satu kolom di layar sempit.
2. **Hangat dan lokal.** Palet krem + hijau rempah, aksen terra dan emas; terasa seperti
   bengkel/UMKM, bukan dashboard SaaS generik.
3. **Satu tugas per layar.** Tamu fokus mencari produk; penjual fokus mengelola produk dan
   kategori; admin fokus mengelola pengguna. Navigasi hanya menampilkan tujuan yang relevan.
4. **Aksi jelas, konsekuensi jelas.** Tombol utama hijau, aksi destruktif merah lembut, dan
   aksi yang tidak tersedia dinonaktifkan (mis. WhatsApp saat stok habis).
5. **Umpan balik segera.** Setiap simpan/hapus/impor memberi toast; validasi tampil per field.

---

## 2. Peta layar & hak akses

Aplikasi adalah **single page** dengan empat view yang di-toggle lewat atribut `[hidden]`.
Tidak ada URL terpisah; state view disimpan di memori (`state.view`), bukan di history.

| View | Elemen root | Tamu | Pembeli | Penjual | Admin |
| --- | --- | --- | --- | --- | --- |
| Katalog | `#view-katalog` + `#catalogSection` | ✅ | ✅ | ✅ (via nav) | ✅ (via nav) |
| Login | `#view-login` | ✅ | — (dialihkan) | — | — |
| Dashboard Toko | `#view-seller` | ⛔ | ⛔ | ✅ (home) | ⛔ |
| Panel Admin | `#view-admin` | ⛔ | ⛔ | ⛔ | ✅ (home) |

- **Home per peran:** tamu/pembeli → katalog, penjual → dashboard toko, admin → panel admin.
- **Guard:** membuka view terlarang menampilkan toast peringatan
  `"Anda tidak memiliki akses ke halaman tersebut."` lalu kembali ke home.
- **Nav "Dashboard"** hanya ditampilkan untuk penjual/admin (`hidden` untuk tamu/pembeli).
- Setelah logout selalu kembali ke katalog publik.

---

## 3. Design token

Semua token didefinisikan sebagai CSS custom property di `:root` (`src/style.css`).

### 3.1 Warna

| Token | Hex | Pemakaian |
| --- | --- | --- |
| `--cream` | `#faf4e8` | Latar halaman |
| `--cream-deep` | `#f1e8d6` | Hover ghost button, latar badge stok netral |
| `--card` | `#fffdf8` | Permukaan kartu, panel, header nav |
| `--ink` | `#2b2116` | Teks utama, latar toast default |
| `--muted` | `#6e6152` | Teks sekunder, label, metadata |
| `--line` | `#e4d9c6` | Garis/border 1 px, border input 1.5 px |
| `--green` | `#2f6b4f` | Aksi utama, nav aktif, avatar, fokus input |
| `--green-deep` | `#23523c` | Hover primer, harga, angka statistik |
| `--green-soft` | `#e3efe6` | Badge kategori, badge stok tersedia, latar media |
| `--terra` | `#b45428` | Eyebrow/label kecil di atas judul |
| `--gold` | `#a87b23` | Badge "Unggulan", toast peringatan |
| `--danger` | `#a63b2a` | Aksi hapus, error, toast error |
| `--danger-soft` | `#f8e1dc` | Latar tombol hapus, latar error |
| WhatsApp | `#1da851` (hard-coded) | Tombol "Pesan via WhatsApp" |
| WhatsApp hover | `#168a42` (hard-coded) | Hover tombol WhatsApp |
| WhatsApp disabled | `#d8d0c1` / teks `#7c7263` | Stok habis / nomor tidak valid |

Latar body memakai gradasi radial hangat:

```css
background: radial-gradient(1100px 500px at 90% -10%, #f6ecd6 0%, transparent 60%), var(--cream);
```

**Catatan:** warna WhatsApp belum menjadi token; jika dipakai ulang, angkat menjadi
`--wa`, `--wa-hover`, `--wa-disabled`.

### 3.2 Tipografi

| Peran | Font | Ukuran | Detail |
| --- | --- | --- | --- |
| Display (h1–h3, harga, statistik, brand) | `Bricolage Grotesque` → `Plus Jakarta Sans` → `Segoe UI` | h1 hero `clamp(2.1rem, 5.2vw, 3.5rem)`; h2 `clamp(1.6rem, 3vw, 2.1rem)`; h3 1.15rem | letter-spacing negatif tipis, line-height 1.03–1.25 |
| Body | `Plus Jakarta Sans` → `Segoe UI` → system-ui | 16 px, line-height 1.6 | anti-aliased |
| Eyebrow | body | 0.78 rem, bold, uppercase, `letter-spacing .14em` | warna `--terra`, margin bawah 12 px |
| Label form | body | 0.76 rem, bold, uppercase, `letter-spacing .05em` | warna `--muted` |
| Metadata | body | 0.76–0.94 rem | warna `--muted` |

Font dimuat dari Google Fonts dengan `preconnect` dan `display=swap`. Fallback lokal wajib
tersedia agar tetap terbaca saat offline.

Aturan hero: kata penekanan memakai `<em>` yang di-restyle **tidak miring**, berwarna hijau,
dengan garis bawah emas 3 px dan offset 7 px.

### 3.3 Bentuk, bayangan, gerak

| Token | Nilai | Dipakai pada |
| --- | --- | --- |
| `--radius` | `18px` | Kartu produk, panel, statistik, empty state |
| Radius kecil | `10–12px` | Input, tombol, baris kategori |
| Radius pil | `999px` | Nav, badge, chip pengguna, stok/status |
| `--shadow` | `0 12px 32px rgba(74,55,28,.10)` | Panel, kartu saat hover, auth card, kontrol katalog |
| Transisi | `150–180ms ease` | Hover kartu/tombol/nav, transform aktif |
| Hover kartu | `translateY(-3px)` + shadow | Desktop/penunjuk presisi |

Gerakan hanya dekoratif (hover/aktif). Tidak ada animasi masuk, skeleton, atau parallax.
`scroll-behavior: smooth` dipakai untuk `window.scrollTo` saat pindah view.

### 3.4 Spacing & container

- Container: `width: min(1180px, 100% - 40px)`, margin inline auto (gutter 20 px per sisi).
- Jarak vertikal halaman: hero `clamp(36px, 6vw, 76px)` atas; katalog/dashboard padding bawah 64 px.
- Grid gap: 20 px untuk kartu dan dashboard, 16 px statistik, 14 px kontrol.
- `#catalogSection` memakai `scroll-margin-top: 88px` agar tidak tertutup header sticky.

---

## 4. Layout responsif

Pendekatan: **mobile-first**; hanya ada dua breakpoint, keduanya `max-width`.

| Rentang | Perilaku kunci |
| --- | --- |
| ≤ 700 px | Navbar mobile: brand + tombol hamburger; nav dan area pengguna masuk panel dropdown `#navMenu`; dashboard dipadatkan (panel 14 px, tabel 0.82 rem, statistik 3 kolom / admin 2×2) |
| ≤ 560 px | Grid produk **1 kolom**; kontrol katalog **1 kolom**; `.field-row` (harga/stok, kategori) **1 kolom**; footer membungkus |
| 701–900 px | Navbar desktop (hamburger disembunyikan); kontrol katalog **2 kolom** dengan pencarian selebar baris; dashboard grid **1 kolom**; category grid **1 kolom** |
| > 900 px | Kontrol **3 kolom** (pencarian 1.6fr, kategori 1fr, sortir 1fr); dashboard **1.5fr + 1fr**; category grid **0.9fr + 1.4fr** |

- **Header sticky** (`position: sticky; top: 0; z-index: 50`) dengan latar krem transparan
  `rgba(250,244,232,.92)` + `backdrop-filter: blur(10px)` dan border bawah. Di ≤700 px
  isinya menjadi brand + hamburger, dengan panel menu yang turun dari bawah header.
- **Grid produk:** `repeat(auto-fill, minmax(235px, 1fr))`, gap 20 px. Di ≤560 px dipaksa
  `1fr` agar kartu tidak terlalu sempit.
- **Grid statistik:** `repeat(auto-fit, minmax(180px, 1fr))` — 3 kartu (penjual) atau 4
  (admin) menyesuaikan sendiri tanpa aturan tambahan.
- **Tabel** dibungkus `.table-wrap` dengan `overflow-x: auto`; di ponsel tabel menggeser
  horizontal, bukan memecah layout halaman.
- **Verifikasi:** pada 375 px, `scrollWidth === viewport` (tanpa scroll horizontal), grid
  produk 1 kolom, kontrol 1 kolom, header `sticky` pada `top: 0`.

---

## 5. Anatomi layar

### 5.1 Chrome (header)

Struktur: **brand → hamburger → panel menu** (`.header-inner`), dengan panel `#navMenu`
berisi nav dan area pengguna. Di desktop (≥701 px) panel tampil sebagai baris horizontal dan
hamburger disembunyikan; di ≤700 px panel menjadi dropdown kolom di bawah header.

- **Brand:** tautan ke `./`, ikon 🔧 dalam kotak hijau 34 px (radius 11 px), teks
  "BengkelKu" display 800 1.35 rem.
- **Hamburger (`#navToggle`):** hanya tampil ≤700 px. Tombol 42×42 px, ikon 3 garis yang
  beranimasi menjadi X saat terbuka, `aria-controls="navMenu"`, `aria-expanded` sinkron,
  dan `aria-label` berganti "Buka/Tutup menu navigasi". Panel menutup saat item nav dipilih,
  pindah view, Escape (fokus kembali ke tombol), klik di luar header, atau layar melebar
  melewati 700 px.
- **Panel menu (`#navMenu`):** di mobile berupa kartu krem selebar container, border dan
  shadow, berisi nav selebar penuh (tombol berbagi lebar) lalu area pengguna; chip pengguna
  melebar dan tombol "Keluar" menempel kanan. Di desktop panel menjadi flex row dengan
  `margin-left: auto`.
- **Nav pil** (`#mainNav`): latar kartu, border, radius 999 px, padding 5 px.
  - Tombol "Katalog" selalu ada.
  - Tombol "Dashboard" (`#dashboardBtn`) hanya tampil untuk penjual/admin; pada admin
    membuka panel admin, pada penjual dashboard toko.
  - State aktif: latar `--green`, teks putih, `aria-current="page"`.
- **Area pengguna** (`#userArea`):
  - **Tamu:** satu tombol pil "Masuk" (`btn btn-primary btn-small`).
  - **Login:** chip berisi avatar inisial, nama, badge peran, dan tombol "Keluar".
  - Avatar: lingkaran 32 px hijau, inisial 1–2 huruf (dua kata → huruf awal tiap kata).
  - Badge peran: `role-admin` (emas muda), `role-seller` (hijau), `role-pembeli`
    (oranye muda); teks dari `ROLE_LABEL`: Admin / Penjual / Pembeli.

### 5.2 Login (`#view-login`)

Kartu tunggal di tengah, lebar `min(470px, 100%)`, radius 22 px, shadow, padding
`clamp(24px, 4vw, 36px)`, `min-height` area 60vh.

Urutan konten:
1. Eyebrow "Masuk akun".
2. H1 "Selamat datang kembali".
3. Subjudul penjelasan tiga peran.
4. Field **Email** dan **Password** (label di atas, autocomplete `username` /
   `current-password`).
5. Kotak error inline `#loginError` (latar merah lembut) — hanya tampil saat gagal.
6. Tombol "Masuk" selebar kartu.
7. Kotak **Akun demo** dengan garis putus-putus di atasnya, berisi 3 baris
   (Admin/Penjual/Pembeli + kredensial).

Tidak ada: tampilkan password, "lupa password", registrasi mandiri, atau login sosial.
Kredensial demo sengaja ditampilkan karena ini aplikasi demo tanpa backend.

### 5.3 Katalog (tamu & pembeli)

**Hero** (`.hero`):
- Eyebrow "Sparepart lokal, stok jelas".
- H1 dua baris: "Suku cadang yang tepat, / *tanpa* perlu keliling bengkel." — kata "tanpa"
  memakai aksen hijau + garis bawah emas.
- Lead maksimal 56 ch: "Cari produk, saring sesuai kategori, lalu pesan langsung ke penjual
  lewat WhatsApp."

**Section head:** eyebrow "Katalog", H2 "Produk tersedia", dan teks jumlah di kanan
(`#resultCount`). Copy jumlah:
- Ada hasil → `"Menampilkan N produk"`.
- Tidak ada hasil → `"Tidak ada produk"`.

**Kontrol** (`.controls`, panel putih ber-shadow) berisi tiga field dengan label:
1. **Cari produk** — `input[type=search]`, placeholder "Nama atau deskripsi…", tanpa tombol cari
   (langsung saat mengetik).
2. **Kategori** — select, opsi pertama "Semua kategori", sisanya dari data kategori global.
3. **Urutkan** — "Terbaru" (default), "Harga termurah", "Harga termahal", "Nama A–Z".

**Baris meta** (`.catalog-meta`): hint "Klik “Pesan via WhatsApp” untuk menghubungi penjual."
di kiri; tombol "Reset filter" (`btn-ghost btn-small`) di kanan, **hanya tampil jika ada
filter/pencarian/sortir non-default**.

**Kartu produk** (`.product-card`, artikel mandiri):

| Bagian | Isi |
| --- | --- |
| Media 16:10 | Gambar `loading="lazy"` + `alt=nama`; jika kosong/URL tidak aman → emoji 🔧. Latar gradasi hijau–krem; varian `is-featured` lebih keemasan |
| Badge unggulan | Pojok kiri atas media, pil emas, "⭐ Unggulan" |
| Body | Badge kategori (uppercase), H3 nama, deskripsi (clamp 2 baris, fallback "Tidak ada deskripsi"), "Dijual oleh {toko/nama}" |
| Meta | Harga (format Rupiah, display 800) di kiri; badge stok di kanan |
| Aksi | Tombol WhatsApp selebar kartu |

**Badge stok:** `Stok N` (hijau) untuk stok > 0; `Habis` (merah lembut) untuk stok ≤ 0.
**Tombol WhatsApp:** tautan `https://wa.me/<nomor>?text=<pesan>` (nomor penjual, fallback
nomor default), `target="_blank"` + `rel="noopener noreferrer"`. Saat stok habis atau nomor
tidak valid, dirender sebagai `<button disabled>` dengan tooltip alasan; warna abu, kursor
`not-allowed`.

**Empty state** (mengisi seluruh baris grid, border putus-putus 2 px, teks tengah):
- Dengan filter aktif: judul **"Tidak ada produk yang cocok"**, penjelasan "Coba kata kunci
  atau kategori lain, atau reset filter.", dan tombol **"Reset filter"** di dalam empty state.
- Tanpa filter (katalog benar-benar kosong): judul **"Belum ada produk"**, penjelasan
  "Katalog masih kosong. Silakan kembali lagi nanti." tanpa tombol.

### 5.4 Dashboard Toko (`#view-seller`, penjual)

**Section head:** eyebrow "Pengelola", H2 "Dashboard Toko", catatan "Produk dan kategori
langsung tampil di katalog publik."

**Statistik (3 kartu):** "Produk saya", "Total stok" (hanya stok > 0 dijumlahkan), "Kategori"
(total kategori global, bukan hanya yang terpakai).

**Grid dashboard** (`minmax(0, 1.5fr) + minmax(0, 1fr)`, turun `minmax(0, 1fr)` ≤900 px
agar tabel tidak mendorong grid melewati container):

1. **Panel "Daftar produk"** — tabel 5 kolom: Produk (nama + badge unggulan inline), Kategori,
   Harga, Stok (badge), Aksi. Baris kosong: colspan 5, "Belum ada produk. Tambahkan lewat form
   di samping." Tombol per baris: **Edit** (ghost) dan **Hapus** (danger).
2. **Panel form produk** — judul dinamis "Tambah Produk" / "Edit Produk"; tombol submit
   "Simpan Produk" / "Perbarui Produk"; tombol **Batal** hanya tampil saat mode edit.
   Field: nama, kategori (select), harga & stok (dua kolom → satu kolom ≤560 px), deskripsi
   (textarea 3 baris), URL gambar, checkbox "Tandai sebagai produk unggulan".

**Panel Kategori** (di bawah grid): dua kolom (judul+catatan | form) → satu kolom ≤900 px,
lalu daftar baris kategori.
- Form: hidden id, nama, deskripsi (dua kolom → satu kolom ≤560 px), tombol "Simpan Kategori"
  dan **Batal** saat edit.
- Baris kategori: nama tebal + jumlah produk kecil, deskripsi opsional, tombol Edit/Hapus.
- Kategori dipakai bersama semua penjual; rename memperbarui produk terkait; hapus kategori
  yang masih dipakai ditolak dengan toast.

**Panel Data produk** (bawah, full width): catatan penjelasan + tiga aksi: "Ekspor JSON"
(ghost), "Impor JSON" (ghost, memicu file picker tersembunyi), "Reset data demo" (danger).
Semua aksi hanya menyentuh produk milik penjual yang login.

### 5.5 Panel Admin (`#view-admin`, admin)

**Section head:** eyebrow "Administrator", H2 "Kelola Pengguna", catatan "Atur akun admin,
penjual, dan pembeli."

**Statistik (4 kartu):** Total pengguna, Admin, Penjual, Pembeli (kelas `stats-4` ada di
markup, tetapi grid `auto-fit` sudah menanganinya tanpa aturan CSS khusus).

**Grid dashboard:**
1. **Panel "Daftar pengguna"** — tabel 4 kolom: Pengguna (nama + email kecil di bawahnya),
   Peran (badge), Status (pil hijau "Aktif" / merah "Nonaktif"), Aksi (Edit, Nonaktifkan/
   Aktifkan, Hapus).
2. **Panel form pengguna** — judul "Tambah Pengguna" / "Edit Pengguna"; field: nama, email,
   password (placeholder "Minimal 6 karakter"), peran (Pembeli/Penjual/Admin), nomor WhatsApp,
   nama toko (khusus penjual). Error per field di bawah input.

Tidak ada bulk action, pencarian pengguna, atau paginasi.

### 5.6 Footer & toast

- **Footer:** border atas, dua teks: "BengkelKu — prototype katalog UMKM. Data disimpan di
  perangkat Anda." dan "Vite + Vanilla JavaScript" (uppercase kecil). Membungkus di ponsel.
- **Toast** (`#toast`): fixed, tengah bawah (22 px), lebar maksimal 440 px, latar `--ink`
  untuk sukses, `--danger` untuk error, `--gold` untuk peringatan. Hilang otomatis setelah
  **2800 ms**; hanya satu toast pada satu waktu (timer di-reset). `role="status"`,
  `aria-live="polite"`.

---

## 6. Komponen & state

### 6.1 Tombol

| Varian | Tampilan | Pemakaian |
| --- | --- | --- |
| `btn-primary` | Latar `--green`, teks putih, shadow hijau | Masuk, Simpan/Perbarui Produk, Simpan Kategori, Simpan Pengguna |
| `btn-ghost` | Transparan, border `--line` | Batal, Edit, Ekspor/Impor, Reset filter, Keluar |
| `btn-danger` | Latar `--danger-soft`, teks `--danger` | Hapus produk/kategori/pengguna, Reset data demo |
| `btn-wa` | Latar `#1da851`, teks putih, selebar kartu | Pesan via WhatsApp |
| `btn-small` | Padding 6/12 px, teks 0.82 rem | Semua aksi di header, tabel, kategori |
| `btn-block` | `width: 100%` | Tombol Masuk di kartu login |

State: hover menggelap (primary/WA) atau `--cream-deep` (ghost); `:active` bergeser 1 px;
disabled (WA) abu-abu + `not-allowed`. **Belum ada** style `:focus-visible` khusus (§9.3).

### 6.2 Badge & status

| Komponen | Kelas | Warna |
| --- | --- | --- |
| Kategori | `badge-cat` | Latar hijau lembut, teks hijau tua, uppercase 0.7 rem |
| Unggulan | `badge-featured` (+ `badge-inline` di tabel) | Emas, teks putih; versi inline static di samping nama |
| Stok tersedia | `stock stock-aktif` | Hijau lembut |
| Stok habis | `stock stock-empty` | Merah lembut |
| Peran | `role-badge role-{admin,seller,pembeli}` | Emas / hijau / oranye |
| Status akun | `status-aktif` / `status-nonaktif` | Hijau / merah |

### 6.3 Form

- Label selalu tampil di atas input (bukan placeholder-only), uppercase kecil.
- Input/select/textarea: lebar penuh, padding 10/12 px, border 1.5 px, radius 10 px,
  latar putih, font inherit.
- Fokus: border berubah ke `--green` (tanpa outline tambahan).
- Error: border input menjadi `--danger` melalui `aria-invalid="true"`; pesan merah 0.8 rem
  di bawah field; elemen error disembunyikan (`hidden`) saat kosong.
- `.field-row` dua kolom untuk pasangan harga/stok dan nama/deskripsi kategori; menjadi satu
  kolom ≤560 px.
- Checkbox unggulan memakai `accent-color: --green`.

### 6.4 Tabel

- Header uppercase 0.72 rem muted, border bawah; sel padding 11/10 px; baris terakhir tanpa border.
- Nama produk/pengguna memakai `.row-name` (600); email pengguna di `.row-sub` (muted, 0.78 rem).
- Kolom aksi memakai `.cell-actions` (flex, gap 6 px, `nowrap`).
- Tabel kosong memakai baris `.table-empty` dengan teks tengah.
- Tabel tidak memiliki sortir/paginasi/selection; scroll horizontal di layar sempit.

### 6.5 Empty state

Dua varian katalog (dengan/tanpa filter, §5.3) + dua varian tabel (produk/pengguna) + daftar
kategori kosong. Semua memakai teks muted dan judul display; hanya empty state katalog
berfilter yang memiliki aksi.

---

## 7. Pola interaksi & copy

| Interaksi | Perilaku |
| --- | --- |
| Cari | Filter langsung saat mengetik (tanpa debounce eksplisit; data lokal) |
| Filter kategori / sortir | Langsung render ulang; kombinasi filter bersifat AND, sortir berlaku setelah filter |
| Reset filter | Mengosongkan pencarian, kategori, dan sortir ke "Terbaru"; juga tersedia di empty state |
| Login | Enter/submit; sukses → toast sapaan nama depan + home per peran; gagal → pesan inline, sesi tidak dibuat |
| Logout | Hapus sesi, reset mode edit, toast "Anda telah keluar.", kembali ke katalog |
| Edit produk/pengguna | Form terisi, judul & tombol berubah, tombol Batal muncul; Batal mengembalikan mode tambah |
| Hapus | Konfirmasi native `window.confirm` (produk, kategori, pengguna) + toast hasil |
| Reset data demo | Konfirmasi native, hanya produk penjual sendiri, lalu render ulang |
| Impor JSON | File picker; sukses → toast + katalog/dashboard diperbarui; gagal → toast error, data lama utuh |
| WhatsApp | Buka tab baru ke nomor penjual; pesan berisi nama produk + harga; nonaktif saat stok 0 |
| Navigasi | Tombol nav memanggil `go(view)`; view terlarang ditolak dengan toast |

**Nada copy:** Bahasa Indonesia, sapaan "Anda", kalimat pendek, sentence case untuk tombol
dan judul (kecuali label uppercase). Harga memakai format `Rp45.000` (tanpa spasi, pemisah
ribuan titik). Nama produk diambil apa adanya dari data pengguna (di-escape).

**Penanganan data:** semua teks dinamis di-escape (`esc()`); URL gambar hanya diterima bila
protokol `http:`/`https:`; nomor WhatsApp dinormalisasi dan divalidasi sebelum dipakai.

---

## 8. Validasi & pesan error

Error ditampilkan per field oleh `showProductErrors`, `showUserErrors`, dan
`showCategoryError`; error login memakai kotak `#loginError`.

| Form | Field | Elemen error | Contoh aturan |
| --- | --- | --- | --- |
| Produk | nama | `#err-nama` | wajib, minimal 3 karakter |
| Produk | kategori | `#err-kategori` | wajib, harus kategori terdaftar |
| Produk | harga | `#err-harga` | angka, tidak negatif |
| Produk | stok | `#err-stok` | bilangan bulat, tidak negatif |
| Kategori | nama | `#err-catNama` | wajib, unik (case-insensitive) |
| Pengguna | nama | `#err-userNama` | wajib |
| Pengguna | email | `#err-userEmail` | format email, unik |
| Pengguna | password | `#err-userPassword` | wajib saat tambah, minimal 6 karakter |
| Pengguna | peran | `#err-userRole` | salah satu dari 3 peran |
| Pengguna | telepon | `#err-userTelepon` | format nomor internasional bila diisi |

Aturan khusus (ditampilkan sebagai toast, bukan error field):
- Admin terakhir tidak boleh dihapus/dinonaktifkan/diturunkan perannya.
- Admin tidak boleh menghapus/menonaktifkan akunnya sendiri.
- Kategori yang masih dipakai tidak boleh dihapus.
- Akun nonaktif tidak boleh login ("Akun Anda dinonaktifkan…").

---

## 9. Aksesibilitas

### 9.1 Yang sudah diterapkan

- Struktur semantik: `header`, `nav`, `main`, `section`, `article`, `table` dengan `th scope`.
- Setiap input punya `<label for>`. Hanya email/password login memakai `required` di HTML;
  form produk, kategori, dan pengguna memakai `novalidate` dan divalidasi oleh JS agar pesan
  error konsisten per field.
- `aria-current="page"` pada nav aktif; `aria-invalid` pada input yang gagal validasi.
- Hamburger memiliki `aria-controls`/`aria-expanded`/`aria-label` dinamis, target 42 px, dan
  `:focus-visible` outline emas; Escape menutup menu dan mengembalikan fokus ke tombol.
- `aria-live="polite"` pada grid katalog dan toast; `role="status"` pada toast.
- `.sr-only` untuk header kolom aksi.
- Tombol ikon/emoji diberi `aria-hidden` (emoji produk) atau teks jelas.
- Kontras teks utama: `--ink` di `--cream` **14,39:1**, `--muted` di `--cream` **5,49:1**,
  putih di `--green` **6,29:1**, `--green-deep` di `--green-soft` **7,58:1**.
- Target sentuh tombol default (padding 11 px + line-height 1.6) ≈ 46 px; tombol kecil di
  tabel/header lebih rendah (≈ 33 px) dan diberi jarak 6–10 px.

### 9.2 Temuan yang perlu diperbaiki

| Temuan | Rasio kontras | Dampak | Rekomendasi |
| --- | --- | --- | --- |
| Teks putih pada badge unggulan emas `#a87b23` | **3,8:1** | Gagal AA untuk teks kecil 0.7 rem | Ganti latar badge ke `#7a5a11` (6,37:1) atau teks gelap |
| Teks putih pada tombol WhatsApp `#1da851` | **3,1:1** | Gagal AA teks normal | Gelapkan ke `#0f7a39` (5,44:1) |
| Teks `#7c7263` pada tombol WA disabled `#d8d0c1` | **3,09:1** | Rendah, meski kontrol disabled dikecualikan WCAG | Opsional: gelapkan teks ke `#5f564a` (4,7:1) |
| `:focus-visible` belum global | — | Selain hamburger (sudah punya outline emas), fokus keyboard pada tombol/link hanya terlihat dari perubahan border tipis | Terapkan `outline: 3px solid var(--gold); outline-offset: 2px` pada `:focus-visible` global |
| Toast error memakai `role="status"` | — | Error tidak diumumkan segera oleh screen reader | Gunakan `role="alert"`/`aria-live="assertive"` untuk tipe error |
| `.header-inner` terpusat ≤560 px | — | Urutan visual brand/nav/user bisa membingungkan tanpa pemisah | Pertahankan urutan DOM; tambahkan gap vertikal yang jelas |
| Konfirmasi hapus memakai `window.confirm` | — | Tidak dapat ditata, tidak konsisten di mobile | Ganti dengan dialog destruktif kustom (backlog) |

### 9.3 Belum diuji

- Navigasi keyboard penuh (Tab/Shift+Tab, Escape pada toast/dialog).
- Screen reader nyata (NVDA/VoiceOver) dan urutan baca kartu produk.
- Zoom 200% dan mode kontras paksa Windows.
- `prefers-reduced-motion` (transisi hover belum dinonaktifkan).

---

## 10. Aset & performa UI

- **Ikon:** hanya emoji (🔧, ⭐); tidak ada library ikon, sehingga tidak ada biaya JS tambahan.
  Emoji dapat berbeda antar-platform; untuk produksi pertimbangkan SVG inline.
- **Gambar produk:** `loading="lazy"`, rasio tetap 16:10 untuk mencegah layout shift; URL
  non-http(s) ditolak dan diganti emoji.
- **Font:** dua keluarga Google Fonts; fallback sistem mencegah FOIT total.
- **Render:** semua konten digambar ulang lewat `innerHTML` per perubahan filter/data. Untuk
  katalog besar (>200 produk) pertimbangkan paginasi atau `requestAnimationFrame`/virtualisasi
  (backlog).
- **Tanpa skeleton/loading state:** teks "Memuat produk…" hanya placeholder statis di HTML
  sebelum JS berjalan; pemuatan data lokal bersifat sinkron.

---

## 11. Di luar cakupan versi ini

- Mode gelap / tema alternatif dan token semantic terpisah.
- Paginasi, infinite scroll, atau grid/list toggle.
- Pencarian pengguna di panel admin dan bulk action.
- Modal kustom, drawer, tooltip kustom.
- Unggah gambar langsung (saat ini hanya URL) dan cropping.
- Registrasi mandiri, reset password, verifikasi email.
- Halaman detail produk terpisah (kartu hanya menampilkan ringkasan + WhatsApp).
- Internasionalisasi (copy masih hard-coded Bahasa Indonesia).
- Sinkronisasi lintas perangkat (data hanya `localStorage`).

---

## 12. Checklist QA visual

**Breakpoint:** 375, 560, 700, 768, 900, 1180, 1440 px.

**Per layar:**
- [ ] Header sticky tidak menutupi anchor katalog; nav tidak meluber di 320 px.
- [ ] Hamburger: tampil ≤700 px, panel tertutup default, ikon berubah X, `aria-expanded`
      sinkron, menu menutup setelah memilih view/Escape/klik luar, dan hilang di desktop.
- [ ] Katalog: kartu 1 kolom ≤560 px, tanpa scroll horizontal, badge unggulan tidak menutupi
      teks, deskripsi terpotong 2 baris.
- [ ] Filter: hasil 0 → empty state dengan tombol reset; reset memulihkan seluruh produk;
      sortir bekerja setelah filter.
- [ ] WhatsApp: tautan benar per penjual; stok 0 → tombol disabled; tidak ada `target` tanpa
      `rel="noopener"`.
- [ ] Login: error tampil tanpa menghapus input; sukses mengarah ke home per peran.
- [ ] Dashboard penjual & admin di 320–1280 px: grid tidak melewati container, tabel hanya
      scroll di dalam `.table-wrap`, statistik dan panel tetap ringkas di mobile.
- [ ] Penjual: form tambah vs edit (judul, tombol, Batal), tabel hanya produk sendiri,
      kategori terpakai gagal dihapus, panel data hanya menyentuh produk sendiri.
- [ ] Admin: statistik cocok dengan tabel, guard admin terakhir/self, status aktif/nonaktif
      konsisten dengan hasil login.
- [ ] Toast muncul < 3 detik dan tidak menutupi aksi bawah di 375 px.
- [ ] Semua form dapat diselesaikan dengan keyboard; error terbaca setelah submit.

---

## 13. Rujukan implementasi

| Kebutuhan | Lokasi |
| --- | --- |
| Token warna/tipe/radius | `src/style.css` `:root` |
| Struktur & id elemen | `index.html` |
| Markup kartu, tabel, empty state, toast | `src/ui.js` |
| Visibilitas view & guard peran | `src/main.js` (`canAccess`, `go`, `renderChrome`) |
| Aturan filter/sortir | `src/products.js` (`queryProducts`) |
| Format Rupiah & nomor default | `src/products.js` (`formatRp`, `WHATSAPP_NUMBER`) |
| URL WhatsApp & validasi nomor | `src/store.js` (`buildWhatsAppUrl`, `normalizePhone`) |
