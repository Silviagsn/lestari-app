This is a [Next.js](https://nextjs.org) project bootstrapped with [`create-next-app`](https://nextjs.org/docs/app/api-reference/cli/create-next-app).

## Database dan backend Lestari

Lestari memakai satu aplikasi Next.js untuk antarmuka dan API, dengan PostgreSQL sebagai penyimpanan. Ikuti [panduan backend dan Railway](docs/backend.md) untuk membuat akun, menjalankan migrasi, dan menghubungkan layanan.

## Getting Started

Gunakan Node.js 22.13 atau yang lebih baru dan database PostgreSQL yang sudah dibuat. Salin `.env.example` ke `.env.local` dan isi `DATABASE_URL`, lalu jalankan:

```bash
npm ci
npm run db:migrate
npm run dev
```

Open [http://localhost:3000](http://localhost:3000) with your browser to see the result.

You can start editing the page by modifying `app/page.tsx`. The page auto-updates as you edit the file.

## Learn More

To learn more about Next.js, take a look at the following resources:

- [Next.js Documentation](https://nextjs.org/docs) - learn about Next.js features and API.
- [Learn Next.js](https://nextjs.org/learn) - an interactive Next.js tutorial.

You can check out [the Next.js GitHub repository](https://github.com/vercel/next.js) - your feedback and contributions are welcome!

# LesterV2
# LesterV2
