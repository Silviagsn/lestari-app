# Backend dan database Lestari

## Arsitektur

Browser mengakses antarmuka dan Route Handlers dari satu aplikasi Next.js. Hanya server yang mengakses PostgreSQL melalui `DATABASE_URL` dan pool koneksi. Railway menjalankan dua layanan di environment yang sama, yaitu aplikasi Next.js dan PostgreSQL.

| Komponen | Implementasi |
| --- | --- |
| Akun dan sesi | `/api/session` memeriksa password dan peran pencari kerja, perusahaan, atau admin. Password dan token sesi disimpan sebagai hash. Browser menerima cookie sesi HttpOnly. |
| Pendaftaran | `/api/signup` membuat akun pencari kerja atau perusahaan dari formulir **Daftar akun**. Setelah berhasil, pengguna kembali ke login dengan email dan peran sudah terisi. PostgreSQL membatasi percobaan pendaftaran per IP. Verifikasi kepemilikan email belum tersedia. |
| Profil | `/api/profile` membaca dan menyimpan profil pemilik sesi. Kolom yang dapat diubah mengikuti peran akun. Migrasi profil mengisi contoh untuk tiga akun uji `@lestari.example` yang sudah ada. |
| Lowongan dan workshop | `/api/catalog/jobs` dan `/api/catalog/workshops` membaca katalog. PostgreSQL menyimpan detail katalog dalam JSONB serta relasi favorit, lamaran, dan pendaftaran dalam tabel dengan foreign key. |
| Aktivitas pengguna | API mengambil ID akun dari sesi. Satu akun hanya dapat membaca aktivitasnya sendiri. Pasangan pengguna dan item unik untuk setiap favorit, lamaran, dan pendaftaran. |
| Migrasi | `npm run db:migrate` menjalankan migrasi SQL dalam transaksi dan mencatat versinya. Migrasi pertama memasukkan 18 lowongan dan 18 workshop contoh. Perintah dapat diulang tanpa menambahkan data duplikat. |
| Kesiapan aplikasi | `GET /api/health` mengembalikan 200 jika PostgreSQL dapat dihubungi dan migrasi awal tercatat, atau 503 jika belum siap. |
| Lesbot | Route `/api/chat` yang sudah ada menghubungi Gemini menggunakan `GEMINI_API_KEY`. Percakapan tidak disimpan di PostgreSQL. |

Skema awal ada di [database/migrations/001_initial.sql](../database/migrations/001_initial.sql). Buat migrasi bernomor berikutnya untuk perubahan setelah skema awal diterapkan.

## Buat akun lokal

Migrasikan PostgreSQL terlebih dahulu. Contoh untuk PowerShell:

```powershell
$secret = Read-Host 'Kata sandi (minimal 12 karakter)' -AsSecureString
$env:LESTARI_NEW_USER_PASSWORD = [System.Net.NetworkCredential]::new('', $secret).Password
try {
  npm run db:user -- kamu@example.com jobseeker
} finally {
  Remove-Item Env:LESTARI_NEW_USER_PASSWORD
}
```

Peran yang diterima adalah `jobseeker`, `company`, dan `admin`. Pembuatan akun admin dilakukan melalui perintah ini. Untuk akun perusahaan, tambahkan nomor telepon sebagai argumen terakhir bila akun perlu mendukung login dengan telepon.

## Hubungkan ke Railway

1. Setelah perubahan tersedia di GitHub, tambahkan layanan aplikasi dari repositori Lestari dan layanan PostgreSQL dalam satu environment Railway. [Panduan PostgreSQL Railway](https://docs.railway.com/databases/postgresql)
2. Di **Variables** layanan aplikasi, tambahkan `DATABASE_URL=${{Postgres.DATABASE_URL}}`. Ganti `Postgres` jika nama layanannya berbeda. Tambahkan `GEMINI_API_KEY` jika ingin mengaktifkan Lesbot. [Referensi variabel Railway](https://docs.railway.com/integrations/api/manage-variables#variable-references)
3. Di pengaturan layanan aplikasi, isi **Pre-Deploy Command** dengan `npm run db:migrate`, **Start Command** dengan `npm start -- --hostname 0.0.0.0 --port $PORT`, dan **Healthcheck Path** dengan `/api/health`. Migrasi berjalan setelah build dengan akses ke jaringan privat. [Pre-deploy Railway](https://docs.railway.com/deployments/pre-deploy-command) · [Healthcheck Railway](https://docs.railway.com/deployments/healthchecks)
4. Setelah deploy, gunakan **Daftar akun** untuk menguji pendaftaran pencari kerja atau perusahaan. Jalankan `npm run db:user -- email@example.com admin` dari terminal layanan aplikasi dengan `LESTARI_NEW_USER_PASSWORD` disetel untuk membuat akun admin.

## Kebutuhan backend yang masih terbuka

| Fitur di antarmuka | Kebutuhan backend |
| --- | --- |
| Perusahaan dan admin | Model profil perusahaan, pemilik lowongan, status publikasi, serta endpoint dan UI untuk meninjau lowongan dan lamaran. Saat ini peran tersedia untuk login, dan katalog berasal dari data contoh. |
| Lamaran dan CV | Formulir menyimpan lamaran ke akun pencari kerja. Alur perekrut membutuhkan akses berdasarkan kepemilikan lowongan, perubahan status, dan penyimpanan objek privat untuk berkas CV. Kontak email saat ini terpisah. |
| Workshop | Pendaftaran sudah tersimpan. Untuk workshop nyata, tentukan bagaimana jadwal, kapasitas, biaya, dan progres peserta dikelola. |
| Assessment dan transkripsi | Assessment saat ini hanya mengarahkan pengguna. Transkripsi memakai penyimpanan browser. Sinkronisasi antarperangkat membutuhkan model profil atau riwayat per akun serta pengaturan retensi dan penghapusan. |
| Operasional publik | Tingkatkan Next.js 14 ke versi LTS yang masih didukung. Tambahkan pembatasan percobaan login, pemulihan akun, autentikasi dan kuota Lesbot, serta jadwal backup dan uji pemulihan PostgreSQL sebelum membuka layanan untuk pengguna umum. [Kebijakan dukungan Next.js](https://nextjs.org/support-policy) |
