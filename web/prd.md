PRD — Sistem Manajemen Klinik Gigi

Nama Produk: Sistem Manajemen Klinik Gigi
Versi: 1.0
Platform: Web Application
Tech Stack: Next.js + Supabase
Target Pengguna: Admin/Perawat dan Dokter
Skala Awal: ±5 pasien/hari
Karakteristik Klinik: Klinik gigi umum, belum memiliki sistem digital, pencatatan saat ini masih menggunakan buku besar.

1. Ringkasan Produk

Sistem ini merupakan aplikasi web sederhana untuk membantu klinik gigi menggantikan proses pencatatan manual menggunakan buku besar menjadi sistem digital.

Fokus utama sistem:

Mengelola data pasien.
Mencatat kunjungan pasien.
Mencatat riwayat/perawatan gigi.
Mencatat biaya/tindakan.
Mencatat pembayaran.
Melihat riwayat perawatan pasien.
Mengelola reservasi yang masuk melalui WhatsApp secara manual.
Menyediakan dashboard klinik.
Menyediakan laporan sederhana.
Menyediakan autentikasi dan role pengguna.

Tidak termasuk dalam scope:

AI chatbot.
Sistem antrean.
Online booking otomatis.
Integrasi WhatsApp API.
Payment gateway.
Rekam medis kompleks/EMR rumah sakit.
Inventory obat.
Apotek.
Akuntansi lengkap.
2. Tujuan Sistem
Masalah Saat Ini

Klinik masih menggunakan buku besar untuk mencatat:

Nama pasien → perawatan → biaya.

Hal ini menimbulkan beberapa masalah:

Sulit mencari riwayat pasien.
Risiko data hilang/rusak.
Sulit mengetahui pasien yang pernah datang.
Sulit melihat total biaya perawatan.
Sulit mengetahui pembayaran pasien.
Sulit membuat laporan pemasukan.
Data tidak terstruktur.
Tidak ada dashboard kondisi klinik.
Tujuan

Sistem harus membuat proses pencatatan menjadi:

Pasien datang → cari/daftarkan pasien → catat kunjungan → catat tindakan/perawatan → catat biaya → catat pembayaran → data tersimpan dalam riwayat pasien.

3. Scope MVP

MVP wajib memiliki modul:

Modul	Status
Login	Required
Dashboard	Required
Data Pasien	Required
Detail Pasien	Required
Kunjungan	Required
Perawatan/Tindakan	Required
Biaya	Required
Pembayaran	Required
Riwayat Pasien	Required
Reservasi	Recommended
Laporan	Required
User Management	Required
Pengaturan Klinik	Required
Audit Log	Recommended
4. Role Pengguna

Minimal terdapat 2 role.

4.1 Admin / Perawat

Admin/perawat dapat:

Login.
Melihat dashboard.
Menambahkan pasien.
Mengubah data pasien.
Mencari pasien.
Mencatat reservasi.
Mencatat kunjungan.
Melihat riwayat pasien.
Mencatat pembayaran.
Melihat laporan.
Mengelola data tindakan/perawatan.
4.2 Dokter

Dokter dapat:

Login.
Melihat dashboard.
Melihat pasien.
Melihat riwayat pasien.
Mencatat hasil pemeriksaan.
Mencatat tindakan/perawatan.
Melihat biaya perawatan.
Melihat riwayat kunjungan.

Untuk MVP, Admin dapat diberikan akses penuh, sedangkan Dokter tidak perlu mengakses pengaturan sistem dan user management.

5. Struktur Navigasi

Sidebar utama:

Dashboard

Pasien
├── Semua Pasien
└── Tambah Pasien

Kunjungan
├── Semua Kunjungan
└── Tambah Kunjungan

Reservasi

Perawatan
├── Daftar Tindakan
└── Kategori Tindakan

Pembayaran

Laporan
├── Laporan Kunjungan
├── Laporan Pendapatan
└── Laporan Perawatan

Pengaturan
├── Profil Klinik
├── Pengguna
└── Tindakan & Harga

Logout
6. Halaman Login

Route:

/login
UI

Halaman login sederhana dan profesional.

Bagian kiri:

Logo klinik.
Nama klinik.
Deskripsi singkat.

Bagian kanan:

Selamat Datang

Email
[____________________]

Password
[____________________]

[ ] Ingat saya

[ Masuk ]

Error:

Email atau password salah.

Loading:

Sedang masuk...
Authentication

Menggunakan:

Supabase Auth

Metode:

Email + Password.

Forgot password dapat disiapkan sebagai fitur tambahan.

7. Dashboard

Route:

/dashboard

Dashboard menjadi halaman utama setelah login.

Header
Selamat pagi, Admin

Kamis, 9 Oktober 2026

[ + Tambah Pasien ]
[ + Kunjungan Baru ]
Statistik

Tampilkan card:

Total Pasien
1,248
Total pasien
Kunjungan Hari Ini
5
Kunjungan hari ini
Pendapatan Hari Ini
Rp 1.250.000
Belum Lunas
2
Transaksi
8. Dashboard — Kunjungan Hari Ini

Table:

Jam	Pasien	Dokter	Perawatan	Status
09:00	Budi	drg. Andi	Scaling	Selesai
10:30	Siti	drg. Andi	Tambal gigi	Menunggu

Status:

Menunggu
Sedang diperiksa
Selesai
Batal
9. Dashboard — Pendapatan

Tampilkan grafik sederhana:

Pendapatan 7 Hari Terakhir

Contoh:

Sen  Rp 500.000
Sel  Rp 750.000
Rab  Rp 1.200.000
Kam  Rp 900.000
Jum  Rp 1.500.000
Sab  Rp 700.000
Min  Rp 0

Filter:

Hari ini
7 Hari
30 Hari
Bulan ini
10. Halaman Pasien

Route:

/patients
Header
Data Pasien

[ + Tambah Pasien ]

Search:

Cari nama / nomor HP / nomor pasien...

Filter:

Semua.
Aktif.
Nonaktif.
Table
No. RM	Nama	No. HP	Jenis Kelamin	Kunjungan Terakhir	Action
P-00001	Budi Santoso	0812xxx	L	08/10/2026	Detail
P-00002	Siti Aminah	0813xxx	P	05/10/2026	Detail

Pagination.

11. Tambah Pasien

Route:

/patients/new

Form:

Data Identitas
No. Pasien
[ Auto Generate ]

Nama Lengkap *
[________________]

NIK
[________________]

Tanggal Lahir
[________________]

Jenis Kelamin *
( ) Laki-laki
( ) Perempuan

Nomor WhatsApp
[________________]

Alamat
[____________________________]

Email
[________________]

Catatan
[____________________________]

Button:

[ Batal ] [ Simpan Pasien ]

No. pasien dibuat otomatis:

P-000001
P-000002
P-000003
12. Detail Pasien

Route:

/patients/[id]

Halaman ini sangat penting.

Header:

Budi Santoso
P-000001

0812xxxxxxx

[ Edit Pasien ]
[ + Kunjungan Baru ]
Patient Summary
Nama
Budi Santoso

Tanggal Lahir
12 Januari 1990

Jenis Kelamin
Laki-laki

No. WhatsApp
0812xxxx

Alamat
Pekanbaru
13. Tab Detail Pasien

Gunakan tab:

Ringkasan
Riwayat Kunjungan
Perawatan
Pembayaran
14. Ringkasan Pasien

Card:

Total Kunjungan
8

Total Perawatan
12

Total Pengeluaran
Rp 3.500.000

Saldo Belum Dibayar
Rp 250.000
15. Riwayat Kunjungan

Table:

Tanggal	Dokter	Keluhan	Tindakan	Total	Status
08/10/26	drg. Andi	Sakit gigi	Tambal	Rp 500k	Lunas
20/09/26	drg. Andi	Karang gigi	Scaling	Rp 300k	Lunas

Klik row → detail kunjungan.

16. Halaman Kunjungan

Route:

/visits

Table:

Tanggal	Pasien	Dokter	Keluhan	Total	Pembayaran	Status

Filter:

Tanggal
Dokter
Status
Metode pembayaran
17. Tambah Kunjungan

Route:

/visits/new

Flow:

Step 1 — Pilih Pasien
Cari pasien
[ Budi Santoso              ]

[ + Pasien Baru ]

Setelah dipilih:

Budi Santoso
P-000001
0812xxxx
18. Informasi Kunjungan
Tanggal
[ 09/10/2026 ]

Dokter
[ drg. Andi ]

Keluhan Utama
[________________________]

Catatan Pemeriksaan
[________________________
 ________________________]

Diagnosa
[________________________]
19. Perawatan / Tindakan

User dapat menambahkan beberapa tindakan.

+ Tambah Tindakan

Table:

Tindakan	Gigi	Qty	Harga	Subtotal
Scaling	-	1	Rp 300.000	Rp 300.000
Tambal Gigi	16	1	Rp 500.000	Rp 500.000

Total:

Subtotal       Rp 800.000
Diskon         Rp 0
Total          Rp 800.000
20. Kondisi Gigi

Untuk MVP, tidak perlu membuat dental chart kompleks.

Cukup menyediakan:

Nomor Gigi
[ 16 ]

Kondisi / Catatan
[_____________________]

Jika nanti klinik membutuhkan dental chart visual, bisa menjadi Phase 2.

21. Pembayaran

Pada halaman kunjungan:

Total Tagihan
Rp 800.000

Dibayar
Rp 500.000

Sisa
Rp 300.000

Metode:

Tunai
Transfer
QRIS
Debit
Lainnya

Status otomatis:

Rp 0       → Belum Dibayar
Rp < total → Sebagian
Rp = total → Lunas
22. Detail Kunjungan

Route:

/visits/[id]

Tampilan:

Detail Kunjungan

Budi Santoso
P-000001

Tanggal:
09 Oktober 2026

Dokter:
drg. Andi

Kemudian:

Pemeriksaan
Keluhan:
Gigi belakang sakit

Diagnosa:
Karies

Catatan:
...
Perawatan
Tindakan	Gigi	Harga
Tambal Gigi	16	Rp500.000
Pembayaran
Total       Rp500.000
Dibayar     Rp500.000
Status      LUNAS
23. Modul Perawatan

Route:

/treatments

Tujuan: menyimpan daftar tindakan dan harga default.

Contoh:

Tindakan	Kategori	Harga	Status
Konsultasi	Konsultasi	Rp100.000	Aktif
Scaling	Preventif	Rp300.000	Aktif
Tambal Gigi	Restoratif	Rp500.000	Aktif
Cabut Gigi	Bedah	Rp400.000	Aktif

Button:

+ Tambah Tindakan
24. Tambah/Edit Tindakan

Form:

Nama Tindakan *
[ Scaling ]

Kategori
[ Preventif ]

Harga Default *
[ Rp 300.000 ]

Deskripsi
[____________________]

Status
[ Aktif ]

Harga hanya menjadi default.

Ketika harga berubah di masa depan, transaksi lama tidak boleh ikut berubah.

Karena harga transaksi harus disimpan pada detail perawatan.

25. Modul Reservasi

Walaupun pasien melakukan janji melalui WhatsApp, sistem sebaiknya menyediakan pencatatan reservasi sederhana.

Route:

/appointments

Ini bukan WhatsApp integration.

Admin tetap menerima pesan WhatsApp secara manual, kemudian mencatatnya ke sistem.

Contoh:

Tanggal	Jam	Pasien	Dokter	Status
09/10/26	09:00	Budi	drg. Andi	Confirmed
09/10/26	10:00	Siti	drg. Andi	Waiting

Status:

Pending
Confirmed
Completed
Cancelled
No Show
26. Modul Pembayaran

Route:

/payments

Table:

Tanggal	No. Transaksi	Pasien	Total	Dibayar	Sisa	Status

Filter:

Tanggal.
Status.
Metode pembayaran.

Status:

Belum Lunas.
Sebagian.
Lunas.
27. Laporan

Route:

/reports
Laporan Pendapatan

Filter:

Tanggal Mulai
Tanggal Akhir

Summary:

Total Transaksi
Rp 15.500.000

Total Pembayaran
Rp 14.200.000

Piutang
Rp 1.300.000

Table:

Tanggal	Pasien	Perawatan	Total	Dibayar	Sisa
28. Laporan Kunjungan

Contoh:

Total Kunjungan
125

Pasien Baru
32

Pasien Lama
93

Chart:

Jumlah pasien per hari
29. Laporan Perawatan

Menampilkan tindakan paling sering dilakukan.

Contoh:

Perawatan	Jumlah	Pendapatan
Scaling	40	Rp12.000.000
Tambal	35	Rp17.500.000
Cabut	15	Rp6.000.000
30. Export

Laporan dapat diekspor:

[ Export Excel ]

Format:

.xlsx

PDF bisa menjadi fitur tambahan.

31. Pengaturan Klinik

Route:

/settings/clinic

Form:

Nama Klinik
[ Klinik Gigi ABC ]

Alamat
[________________]

No. WhatsApp
[________________]

No. Telepon
[________________]

Email
[________________]

Nama Dokter
[________________]

Logo
[ Upload ]
32. User Management

Route:

/settings/users

Admin dapat membuat user:

Nama	Email	Role	Status
Admin	admin@clinic.com	Admin	Aktif
drg. Andi	dokter@clinic.com	Dokter	Aktif

Action:

Edit
Nonaktifkan
Reset Password
33. Database Architecture

Gunakan:

Supabase PostgreSQL

Architecture:

Next.js
   |
   | Supabase SDK
   |
Supabase
├── PostgreSQL
├── Auth
├── Storage
└── Row Level Security
34. Database Tables

Struktur utama:

profiles
clinics
patients
appointments
visits
treatments
visit_treatments
payments
payment_items
audit_logs
35. Table: clinics
clinics

Fields:

id UUID PK
name TEXT
address TEXT
phone TEXT
whatsapp TEXT
email TEXT
logo_url TEXT
created_at TIMESTAMP
updated_at TIMESTAMP
36. Table: profiles

Terhubung dengan:

auth.users

Fields:

id UUID PK
clinic_id UUID FK
full_name TEXT
role TEXT
phone TEXT
avatar_url TEXT
is_active BOOLEAN
created_at TIMESTAMP
updated_at TIMESTAMP

Role:

admin
doctor
37. Table: patients
patients

Fields:

id UUID PK

clinic_id UUID FK

medical_record_number TEXT UNIQUE

full_name TEXT

nik TEXT nullable

date_of_birth DATE nullable

gender TEXT

phone TEXT

email TEXT nullable

address TEXT nullable

notes TEXT nullable

is_active BOOLEAN

created_at TIMESTAMP

updated_at TIMESTAMP

created_by UUID

Gender:

male
female
38. Table: appointments
appointments

Fields:

id UUID PK

clinic_id UUID FK

patient_id UUID FK

doctor_id UUID FK

appointment_date DATE

appointment_time TIME

complaint TEXT

notes TEXT

status TEXT

created_by UUID

created_at TIMESTAMP

updated_at TIMESTAMP

Status:

pending
confirmed
completed
cancelled
no_show
39. Table: visits
visits

Fields:

id UUID PK

clinic_id UUID FK

patient_id UUID FK

doctor_id UUID FK

appointment_id UUID nullable

visit_date TIMESTAMP

complaint TEXT

examination_notes TEXT

diagnosis TEXT

notes TEXT

status TEXT

created_by UUID

created_at TIMESTAMP

updated_at TIMESTAMP

Status:

waiting
in_progress
completed
cancelled
40. Table: treatments
treatments

Fields:

id UUID PK

clinic_id UUID FK

name TEXT

category TEXT

default_price NUMERIC

description TEXT

is_active BOOLEAN

created_at TIMESTAMP

updated_at TIMESTAMP
41. Table: visit_treatments

Ini merupakan tabel penting.

visit_treatments

Fields:

id UUID PK

visit_id UUID FK

treatment_id UUID FK

tooth_number TEXT nullable

quantity INTEGER

unit_price NUMERIC

subtotal NUMERIC

notes TEXT

created_at TIMESTAMP
Kenapa unit_price harus disimpan?

Misalnya:

2026:

Scaling = Rp300.000

2027:

Scaling = Rp350.000

Riwayat pasien tahun 2026 harus tetap menunjukkan:

Rp300.000

bukan otomatis berubah menjadi Rp350.000.

42. Table: payments
payments

Fields:

id UUID PK

clinic_id UUID FK

visit_id UUID FK

patient_id UUID FK

payment_number TEXT

payment_date TIMESTAMP

amount NUMERIC

payment_method TEXT

notes TEXT

created_by UUID

created_at TIMESTAMP

Payment method:

cash
bank_transfer
qris
debit
other
43. Table: audit_logs

Untuk mencatat aktivitas penting.

audit_logs

Fields:

id UUID PK

clinic_id UUID FK

user_id UUID FK

action TEXT

entity_type TEXT

entity_id UUID

old_data JSONB

new_data JSONB

created_at TIMESTAMP

Contoh:

Admin mengubah data pasien Budi
44. Database Relationship

Relasi utama:

clinics
   |
   ├── profiles
   |
   ├── patients
   |      |
   |      ├── appointments
   |      |
   |      └── visits
   |             |
   |             ├── visit_treatments
   |             |       |
   |             |       └── treatments
   |             |
   |             └── payments
   |
   └── audit_logs
45. Supabase Auth

Gunakan:

Supabase Auth

User login menggunakan email/password.

Setelah login:

auth.users
      ↓
profiles
      ↓
clinic_id
      ↓
akses data klinik
46. Row Level Security

RLS wajib digunakan.

Contoh konsep:

User A
clinic_id = A

User B
clinic_id = B

User A tidak boleh membaca data klinik B.

Semua query harus dibatasi berdasarkan:

clinic_id

Ini sangat penting karena aplikasi menyimpan data pasien.

47. Security Rules
Patient

Admin:

SELECT
INSERT
UPDATE

Dokter:

SELECT
UPDATE terbatas
Payment

Admin:

SELECT
INSERT
UPDATE

Dokter:

SELECT
User Management

Admin:

FULL ACCESS

Dokter:

NO ACCESS
48. Next.js Architecture

Recommended:

Next.js 15/16+
TypeScript
App Router
Supabase
Tailwind CSS
shadcn/ui
React Hook Form
Zod

Structure:

app/
├── (auth)/
│   └── login/
│       └── page.tsx
│
├── (dashboard)/
│   ├── dashboard/
│   │   └── page.tsx
│   │
│   ├── patients/
│   │   ├── page.tsx
│   │   ├── new/
│   │   │   └── page.tsx
│   │   └── [id]/
│   │       └── page.tsx
│   │
│   ├── visits/
│   │   ├── page.tsx
│   │   ├── new/
│   │   └── [id]/
│   │
│   ├── appointments/
│   │   └── page.tsx
│   │
│   ├── treatments/
│   │   └── page.tsx
│   │
│   ├── payments/
│   │   └── page.tsx
│   │
│   ├── reports/
│   │   └── page.tsx
│   │
│   └── settings/
│       ├── clinic/
│       └── users/
│
├── api/
│   └── ...
│
└── layout.tsx
49. Components

Reusable components:

Button
Input
Select
DatePicker
Modal
Dialog
Dropdown
Table
Pagination
SearchInput
StatCard
Badge
EmptyState
LoadingState
ConfirmDialog
Toast

Domain components:

PatientForm
PatientTable
PatientSummary
VisitForm
VisitTreatmentForm
PaymentForm
TreatmentForm
AppointmentForm
50. UI/UX Direction

Design harus terlihat:

Bersih.
Profesional.
Modern.
Tidak terlalu ramai.
Mudah digunakan oleh admin/perawat.
Desktop-first.
Tetap responsive untuk tablet/mobile.

Karena user utama adalah admin/perawat, jangan membuat UI terlalu kompleks.

Prioritas:

Cepat input data > dekorasi.

51. Search

Search pasien harus mendukung:

Nama
Nomor pasien
Nomor HP

Contoh:

Budi
0812
P-00001
52. Validasi Pasien

Required:

Nama
Nomor WhatsApp / Telepon
Jenis Kelamin

Tanggal lahir optional.

NIK optional.

Karena klinik kecil, jangan membuat terlalu banyak field wajib.

53. Nomor Rekam Pasien

Format:

P-000001
P-000002
P-000003

Generate otomatis dari backend.

Tidak boleh bergantung pada frontend.

54. Nomor Pembayaran

Format:

PAY-20261009-0001

Contoh:

PAY-20261009-0002
55. Nomor Kunjungan

Bisa menggunakan:

VIS-20261009-0001

atau cukup UUID internal dan nomor display.

Rekomendasi:

VIS-20261009-0001

supaya mudah disebutkan kepada admin.

56. Business Flow Utama
Skenario 1 — Pasien Baru
Pasien WhatsApp klinik
        ↓
Admin menerima janji
        ↓
Admin mencatat reservasi
        ↓
Pasien datang
        ↓
Admin mencari pasien
        ↓
Tidak ditemukan
        ↓
Tambah pasien
        ↓
Dokter melakukan pemeriksaan
        ↓
Buat kunjungan
        ↓
Tambah tindakan
        ↓
Sistem menghitung total
        ↓
Pasien melakukan pembayaran
        ↓
Simpan pembayaran
        ↓
Kunjungan selesai
57. Skenario 2 — Pasien Lama
Pasien datang
    ↓
Cari nama / nomor HP
    ↓
Buka pasien
    ↓
+ Kunjungan Baru
    ↓
Catat keluhan
    ↓
Catat pemeriksaan
    ↓
Catat tindakan
    ↓
Total otomatis
    ↓
Pembayaran
    ↓
Selesai
58. Perhitungan Biaya

Misalnya:

Scaling
Qty 1
Harga 300.000

Tambal
Qty 2
Harga 500.000

Sistem:

Scaling       300.000
Tambal      1.000.000
---------------------
Subtotal    1.300.000
Diskon              0
---------------------
TOTAL       1.300.000

Jika dibayar:

Rp1.000.000

Maka:

Total     Rp1.300.000
Bayar     Rp1.000.000
Sisa        Rp300.000
Status     SEBAGIAN
59. Business Rules
Rule 1

Pasien tidak boleh dihapus secara permanen dari UI.

Gunakan:

is_active = false

agar histori medis/keuangan tetap aman.

Rule 2

Data pembayaran tidak boleh mengubah harga historis tindakan.

Rule 3

Kunjungan yang sudah selesai tidak boleh dihapus sembarangan.

Rule 4

Pembayaran tidak boleh lebih besar dari total tagihan kecuali memang mendukung uang kembali.

Untuk MVP:

payment <= outstanding balance
Rule 5

Dokter tidak dapat mengelola user.

Rule 6

Semua data harus memiliki clinic_id.

60. Empty States

Jika belum ada pasien:

Belum ada pasien

Belum ada data pasien yang terdaftar.

[ + Tambah Pasien ]

Jika belum ada kunjungan:

Belum ada kunjungan hari ini.
61. Loading State

Semua halaman harus memiliki loading state.

Contoh:

Loading pasien...

atau skeleton table.

62. Error Handling

Contoh:

Gagal menyimpan data pasien.

Silakan coba lagi.

Tidak boleh menampilkan error database mentah kepada user.

63. Confirmation Dialog

Untuk action penting:

Apakah Anda yakin ingin menonaktifkan pasien ini?

[ Batal ] [ Ya, Nonaktifkan ]

Untuk pembayaran:

Simpan pembayaran Rp500.000?

[ Batal ] [ Simpan Pembayaran ]
64. Audit

Action penting:

CREATE_PATIENT
UPDATE_PATIENT

CREATE_VISIT
UPDATE_VISIT

CREATE_TREATMENT
UPDATE_TREATMENT

CREATE_PAYMENT

UPDATE_CLINIC
CREATE_USER
UPDATE_USER

disimpan di:

audit_logs
65. Storage Supabase

Supabase Storage digunakan untuk:

clinic-logo
user-avatar

Untuk MVP tidak perlu menyimpan dokumen medis/file pasien kecuali memang dibutuhkan.

66. API / Server Architecture

Rekomendasi:

Client
 ↓
Next.js Server Actions / Route Handlers
 ↓
Supabase
 ↓
PostgreSQL

Untuk operasi sensitif:

pembayaran,
pembuatan nomor transaksi,
role management,

sebaiknya dilakukan server-side.

Jangan mempercayai perhitungan harga yang hanya berasal dari client.

67. Validasi

Gunakan:

Zod

Contoh:

PatientSchema
VisitSchema
TreatmentSchema
PaymentSchema
AppointmentSchema

Validasi dilakukan:

Frontend
+
Server
68. Performance

Karena hanya ±5 pasien/hari, sistem tidak membutuhkan arsitektur yang terlalu kompleks.

Namun tetap:

Pagination.
Database index.
Search server-side.
Lazy loading jika diperlukan.
Hindari mengambil seluruh tabel pasien sekaligus.
69. Database Index

Recommended:

patients(clinic_id)
patients(full_name)
patients(phone)
patients(medical_record_number)

visits(clinic_id)
visits(patient_id)
visits(visit_date)

appointments(clinic_id)
appointments(appointment_date)

payments(clinic_id)
payments(payment_date)
payments(patient_id)
70. Dashboard Query

Dashboard harus mengambil:

total patients
today visits
today revenue
outstanding payments
today appointments
recent visits

Tidak perlu melakukan query satu per satu jika bisa dibuat query/view yang efisien.

71. Backup

Karena menggunakan Supabase PostgreSQL, database berada di cloud.

Tetap disarankan memiliki:

Backup database.
Migration versioning.
Supabase project backup sesuai plan.
Tidak menyimpan database hanya di browser/local storage.
72. Environment Variables

Contoh:

NEXT_PUBLIC_SUPABASE_URL=
NEXT_PUBLIC_SUPABASE_ANON_KEY=
SUPABASE_SERVICE_ROLE_KEY=

SUPABASE_SERVICE_ROLE_KEY:

Tidak boleh dikirim ke browser.

73. Deployment

Recommended:

GitHub
   ↓
Vercel
   ↓
Next.js

Supabase
   ↓
Database
Auth
Storage

Architecture:

                ┌──────────────┐
                │    Admin     │
                └──────┬───────┘
                       │
                ┌──────▼───────┐
                │    Next.js   │
                │   Web App    │
                └──────┬───────┘
                       │
              ┌────────▼─────────┐
              │     Supabase     │
              ├──────────────────┤
              │ Auth             │
              │ PostgreSQL       │
              │ Storage          │
              │ RLS              │
              └──────────────────┘
74. MVP Acceptance Criteria

Sistem dianggap selesai apabila:

Authentication
 User dapat login.
 User tidak login tidak dapat membuka dashboard.
 Role dapat dibedakan.
 Logout bekerja.
Patient
 Admin dapat membuat pasien.
 Admin dapat mencari pasien.
 Admin dapat edit pasien.
 Admin dapat melihat detail pasien.
 Riwayat pasien tampil.
Visit
 User dapat membuat kunjungan.
 User dapat memilih pasien.
 User dapat memilih dokter.
 User dapat mengisi keluhan.
 User dapat mengisi pemeriksaan.
 User dapat menambahkan beberapa tindakan.
Treatment
 User dapat membuat tindakan.
 User dapat mengubah harga default.
 Harga historis transaksi tidak berubah.
Payment
 User dapat memasukkan pembayaran.
 Total otomatis dihitung.
 Sisa pembayaran otomatis dihitung.
 Status otomatis berubah.
 Metode pembayaran tercatat.
Dashboard
 Total pasien tampil.
 Kunjungan hari ini tampil.
 Pendapatan tampil.
 Piutang tampil.
 Kunjungan hari ini tampil.
Reports
 Laporan pendapatan.
 Laporan kunjungan.
 Filter tanggal.
 Export Excel.
75. Phase 2 — Optional

Tidak perlu dimasukkan ke MVP, tetapi bisa disiapkan untuk pengembangan berikutnya:

WhatsApp Integration

Pasien melakukan:

WhatsApp
   ↓
Bot / Admin
   ↓
Booking
   ↓
Sistem
Dental Chart

Visual gigi:

11 12 13 14 15 16 17 18
21 22 23 24 25 26 27 28
31 32 33 34 35 36 37 38
41 42 43 44 45 46 47 48
Medical Documents

Upload:

Foto gigi.
X-Ray.
Dokumen pemeriksaan.
Invoice

Generate:

Invoice PDF
Receipt

Cetak:

Struk pembayaran
Reminder

Reminder WhatsApp:

Pengingat kontrol
76. Hal yang Sengaja Tidak Dibuat

Sesuai kebutuhan klinik, jangan over-engineering.

Tidak perlu:

❌ AI Chatbot
❌ Sistem antrean
❌ Online booking kompleks
❌ Integrasi WhatsApp API di MVP
❌ Inventory
❌ Apotek
❌ Akuntansi double-entry
❌ Klaim BPJS
❌ Dental chart kompleks
❌ Multi-cabang
❌ HR/payroll
❌ CRM kompleks

Fokus sistem adalah:

Pasien → Kunjungan → Perawatan → Biaya → Pembayaran → Riwayat → Laporan.

77. Prioritas Development

Saya menyarankan development dilakukan dengan urutan:

Sprint 1 — Foundation
Next.js
Supabase
Authentication
Database
RLS
Layout
Sidebar
Sprint 2 — Patient
Patient list
Patient create
Patient edit
Patient detail
Patient history
Sprint 3 — Visit
Visit
Examination
Treatment
Treatment pricing
Visit detail
Sprint 4 — Payment
Payment
Outstanding
Payment history
Sprint 5 — Dashboard
Statistics
Recent visits
Revenue
Sprint 6 — Reports
Revenue report
Visit report
Treatment report
Excel export
Sprint 7 — Settings
Clinic profile
Users
Roles
Sprint 8 — QA
Validation
RLS testing
Permission testing
Responsive testing
Error handling
Production deployment
78. Definition of Done

Sebuah fitur dianggap selesai jika:

UI selesai.
Database migration selesai.
Validation selesai.
Server-side validation selesai.
RLS selesai.
Loading state tersedia.
Error state tersedia.
Empty state tersedia.
Mobile responsive.
Permission sesuai role.
Tidak ada data klinik lain yang bisa terbaca.
Tested pada production/staging.
79. Kesimpulan Product Scope

Versi pertama aplikasi sebaiknya sangat sederhana dan cepat digunakan.

Core flow:

                    ┌──────────────┐
                    │    LOGIN     │
                    └──────┬───────┘
                           │
                    ┌──────▼───────┐
                    │  DASHBOARD   │
                    └──────┬───────┘
                           │
          ┌────────────────┼────────────────┐
          │                │                │
     ┌────▼────┐      ┌────▼────┐     ┌────▼─────┐
     │ PASIEN  │      │KUNJUNGAN│     │RESERVASI │
     └────┬────┘      └────┬────┘     └──────────┘
          │                │
          │          ┌─────▼──────┐
          │          │ PERAWATAN  │
          │          └─────┬──────┘
          │                │
          │          ┌─────▼──────┐
          └─────────►│ PEMBAYARAN │
                     └─────┬──────┘
                           │
                    ┌──────▼───────┐
                    │   LAPORAN    │
                    └──────────────┘

Inti produk ini bukan sistem rumah sakit besar. Ini adalah digitalisasi buku besar klinik gigi dengan struktur yang rapi sehingga admin cukup melakukan:

Cari pasien → buka kunjungan → masukkan perawatan → sistem hitung biaya → catat pembayaran → selesai.