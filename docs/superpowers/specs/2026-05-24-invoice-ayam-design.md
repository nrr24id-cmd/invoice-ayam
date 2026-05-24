# Invoice Ayam — Design Spec

**Date:** 2026-05-24  
**Stack:** React (Vite) + Express + SQLite  
**Scope:** Web app internal untuk generate dan arsip invoice pembelian ayam

---

## 1. Overview

Aplikasi web internal untuk membuat, menyimpan, dan mengunduh invoice pembelian ayam. Digunakan oleh tim kecil tanpa sistem login. Buyer (pembeli) berasal dari koperasi yang dikelola lewat master data dengan autocomplete.

---

## 2. Arsitektur

```
invoice-ayam/
├── client/                        # React frontend (Vite)
│   ├── src/
│   │   ├── pages/
│   │   │   ├── InvoiceList.jsx        # Daftar riwayat invoice
│   │   │   ├── InvoiceForm.jsx        # Form buat invoice baru
│   │   │   └── InvoiceDetail.jsx      # Preview & download PDF
│   │   ├── components/
│   │   │   ├── InvoiceTemplate.jsx    # Template tampilan invoice
│   │   │   └── CooperativeAutocomplete.jsx  # Input koperasi dengan autocomplete
│   │   └── App.jsx
│   └── package.json
├── server/                        # Express backend
│   ├── routes/
│   │   ├── invoices.js            # CRUD invoice
│   │   └── cooperatives.js        # CRUD master koperasi
│   ├── db/
│   │   └── database.js            # SQLite setup (better-sqlite3)
│   ├── pdf/
│   │   └── generator.js           # Generate PDF (puppeteer)
│   └── index.js
└── package.json
```

**Alur data:**
1. User isi form → POST `/api/invoices` → simpan ke SQLite → redirect ke halaman detail
2. User klik "Download PDF" → GET `/api/invoices/:id/pdf` → server render HTML invoice → puppeteer convert ke PDF → browser download
3. Input nama koperasi → GET `/api/cooperatives?q=<keyword>` → autocomplete dropdown → jika baru, POST `/api/cooperatives` otomatis saat invoice disimpan

---

## 3. Database Schema

### Tabel `cooperatives` — Master data koperasi
| Kolom | Tipe | Keterangan |
|---|---|---|
| id | INTEGER PK | Auto increment |
| name | TEXT UNIQUE | Nama koperasi |
| address | TEXT | Alamat |
| phone | TEXT | Nomor telepon |
| created_at | TEXT | Timestamp |

### Tabel `invoices` — Header invoice
| Kolom | Tipe | Keterangan |
|---|---|---|
| id | INTEGER PK | Auto increment |
| invoice_number | TEXT UNIQUE | Format: INV-YYYYMMDD-XXX |
| date | TEXT | Tanggal transaksi |
| seller_name | TEXT | Nama penjual |
| seller_address | TEXT | Alamat penjual |
| seller_phone | TEXT | Telepon penjual |
| buyer_name | TEXT | Nama pembeli / PIC |
| cooperative_id | INTEGER FK | Referensi ke tabel cooperatives |
| cooperative_name | TEXT | Snapshot nama koperasi saat invoice dibuat |
| cooperative_address | TEXT | Snapshot alamat koperasi |
| cooperative_phone | TEXT | Snapshot telepon koperasi |
| notes | TEXT | Catatan / keterangan (opsional) |
| signer_name | TEXT | Nama penandatangan |
| signer_title | TEXT | Jabatan penandatangan |
| created_at | TEXT | Timestamp |

> Kolom snapshot koperasi (`cooperative_name`, dll) disimpan langsung di invoice agar data historis tidak berubah jika master koperasi diedit.

### Tabel `invoice_items` — Baris produk ayam
| Kolom | Tipe | Keterangan |
|---|---|---|
| id | INTEGER PK | Auto increment |
| invoice_id | INTEGER FK | Referensi ke tabel invoices |
| product_name | TEXT | Nama produk (cth: Ayam Broiler, Ayam Fillet) |
| unit | TEXT | Satuan: `kg` / `pcs` / `filet` |
| quantity | REAL | Jumlah |
| unit_price | REAL | Harga satuan (Rupiah) |
| subtotal | REAL | quantity × unit_price |

---

## 4. API Endpoints

### Invoices
| Method | Path | Fungsi |
|---|---|---|
| GET | `/api/invoices` | Daftar semua invoice (support query `?q=` untuk search) |
| GET | `/api/invoices/:id` | Detail satu invoice beserta item-itemnya |
| POST | `/api/invoices` | Buat invoice baru (beserta items) |
| DELETE | `/api/invoices/:id` | Hapus invoice |
| GET | `/api/invoices/:id/pdf` | Download invoice sebagai PDF |

### Cooperatives
| Method | Path | Fungsi |
|---|---|---|
| GET | `/api/cooperatives?q=` | Search koperasi untuk autocomplete |
| POST | `/api/cooperatives` | Tambah koperasi baru |

---

## 5. Halaman Frontend

### `/` — Daftar Invoice
- Tabel: Nomor Invoice, Tanggal, Nama Koperasi, Total, Aksi (Lihat / Hapus)
- Search bar (filter by nomor invoice atau nama koperasi)
- Tombol "Buat Invoice Baru"

### `/invoice/new` — Form Invoice Baru
- Section: Info Invoice (nomor auto-generate, tanggal)
- Section: Info Penjual (nama, alamat, telepon)
- Section: Info Pembeli (nama PIC, koperasi — autocomplete)
- Section: Tabel Item Produk (dinamis, bisa tambah/hapus baris)
  - Kolom: Nama Produk, Satuan (dropdown: kg/pcs/filet), Jumlah, Harga Satuan, Subtotal
  - Grand total otomatis terhitung di bawah tabel
- Section: Footer (catatan, nama & jabatan penandatangan)
- Tombol: "Simpan & Preview"

### `/invoice/:id` — Detail & Preview
- Tampilan invoice siap cetak (format A4)
- Tombol "Download PDF"
- Tombol "Kembali ke Daftar"
- Tombol "Hapus Invoice"

---

## 6. Generate PDF

- Library: **Puppeteer** — render halaman HTML invoice di headless browser, export ke PDF
- Ukuran kertas: A4, portrait
- Layout invoice: header (logo/nama penjual), info pembeli, tabel item, total, area tanda tangan kanan bawah
- Font: sistem (tidak butuh embed font khusus)

---

## 7. Validasi & Error Handling

**Frontend (sebelum submit):**
- Nama penjual, nama pembeli, nama koperasi: wajib diisi
- Minimal 1 baris item produk
- Jumlah dan harga satuan: angka positif, tidak boleh 0
- Satuan: harus dipilih dari dropdown

**Backend:**
- Nomor invoice: unique constraint di database, generate ulang jika collision
- Jika puppeteer gagal generate PDF: return HTTP 500 dengan pesan error yang jelas
- Input disanitasi sebelum masuk ke query SQLite (gunakan parameterized query)

---

## 8. Penomoran Invoice Otomatis

Format: `INV-YYYYMMDD-XXX`  
Contoh: `INV-20260524-001`, `INV-20260524-002`

- Counter di-reset per tanggal
- Dihitung dari jumlah invoice pada tanggal yang sama + 1
- Di-pad ke 3 digit (001, 002, ...)

---

## 9. Out of Scope

- Sistem login / autentikasi
- Multi-user dengan data terpisah
- Pajak / PPN
- Diskon
- Metode pembayaran
- Export Excel
- Notifikasi / email
