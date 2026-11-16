# Spesifikasi Sistem: BengkelKu (Katalog & Dashboard UMKM Sparepart)

## 1. Tujuan
Menyediakan aplikasi berbasis web *Minimum Viable Product* (MVP) untuk UMKM bengkel/sparepart guna menampilkan katalog produk kepada pelanggan dan mengelola inventaris secara mandiri pada satu perangkat. Proyek ini dirancang untuk latihan pengembangan 1 hari menggunakan LocalStorage.

## 2. Pengguna
*   **Calon Pembeli:** Mengakses halaman utama untuk mencari, menyaring, mengurutkan produk, dan memesan via WhatsApp.
*   **Pengelola Toko:** Mengakses halaman dashboard (pada perangkat yang sama) untuk mengelola data produk (CRUD) dan melihat ringkasan inventaris.

## 3. Daftar Fitur
*   **Katalog Publik:** Menampilkan grid produk dengan informasi nama, harga, stok, dan gambar.
*   **Pencarian & Filter:** Mencari produk berdasarkan nama, filter berdasarkan kategori, dan pengurutan (harga termurah/termahal, nama A-Z).
*   **Pemesanan WhatsApp:** Tombol "Pesan via WA" yang menghasilkan *pre-filled message* ke nomor WhatsApp toko.
*   **Dashboard Admin (Demo):** Antarmuka tabel untuk Tambah, Baca, Ubah, dan Hapus (CRUD) data produk.
*   **Ringkasan Data:** Menampilkan total produk, total stok, jumlah kategori, dan ringkasan spesifikasi di dashboard.
*   **Penyimpanan Lokal:** Persistensi data menggunakan `localStorage` browser.

## 4. Data Model
Entitas `Product` disimpan dalam bentuk array of objects berformat JSON:
*   `id` (String/UUID): Identifier unik (dihasilkan via `Date.now()`).
*   `nama` (String): Nama suku cadang.
*   `kategori` (String): Kategori produk (misal: Mesin, Kelistrikan, Roda, Aksesoris).
*   `harga` (Number): Harga dalam Rupiah (>= 0).
*   `stok` (Integer): Jumlah stok tersedia (>= 0).
*   `deskripsi` (String): Penjelasan singkat produk.
*   `imageUrl` (String): URL placeholder gambar produk.
*   `unggulan` (Boolean): Status apakah produk di-highlight atau tidak.

## 5. Non-functional Requirements (NFR)
*   **Performa:** Waktu muat halaman kurang dari 2 detik (karena hanya menggunakan JS sisi klien).
*   **Teknologi:** Vite + Vanilla JavaScript, HTML5, CSS3 (prototipe ini disatukan dalam single HTML).
*   **Keamanan:** Tidak menyimpan API Key, sanitasi input dasar untuk mencegah XSS saat *render* HTML, tidak ada eksekusi *script* berbahaya.
*   **Lisensi Aset:** Hanya menggunakan aset/placeholder *open-source* atau non-pribadi.

## 6. Risiko
*   **Kehilangan Data:** Karena menggunakan `localStorage`, data akan hilang jika pengguna membersihkan *cache/data* browser.
*   **Tidak Ada Autentikasi:** Pembeli dan Pengelola menggunakan antarmuka tanpa *login*, berisiko pembeli memodifikasi data jika menemukan akses dashboard.

## 7. Out-of-Scope
*   Sistem backend dan database (SQL/NoSQL).
*   Autentikasi dan Otorisasi (Login/Register).
*   *Payment Gateway* atau sistem *checkout* internal.
*   Fitur unggah *file* gambar (hanya menerima input URL).

## 8. Acceptance Criteria (Kriteria Penerimaan)
*   [ ] **AC1:** Saat aplikasi pertama kali dibuka, 8 produk contoh otomatis dimuat jika `localStorage` kosong.
*   [ ] **AC2:** Pengguna dapat mengetik di kolom pencarian dan daftar produk langsung terfilter sesuai nama.
*   [ ] **AC3:** Tombol pesan WA saat diklik akan membuka tab baru ke URL `wa.me` dengan teks berisi nama produk.
*   [ ] **AC4:** Pengelola dapat menambah produk baru di Dashboard, dan produk tersebut langsung muncul di halaman Katalog.
*   [ ] **AC5:** Pengelola tidak dapat memasukkan harga atau stok bernilai negatif (validasi form HTML).
*   [ ] **AC6:** Data tidak hilang ketika halaman di-*refresh* (F5).

## 9. Implementation Plan (Rencana Implementasi per Iterasi)
*   **Iterasi 1 (Jam 1-2):** Setup *boilerplate*, definisi struktur HTML (layout Katalog & Dashboard), dan inisialisasi CSS dasar.
*   **Iterasi 2 (Jam 3-4):** Pembuatan skrip `localStorage`, injeksi 8 *seed data* (produk awal), dan *render* data ke DOM Katalog.
*   **Iterasi 3 (Jam 5-6):** Implementasi fungsi pencarian, filter kategori, pengurutan, dan integrasi *link* WhatsApp.
*   **Iterasi 4 (Jam 7-8):** Pembuatan logika CRUD pada Dashboard, kalkulasi metrik ringkasan, dan pengujian *end-to-end* manual.
