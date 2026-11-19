import { getDatabase, hashPassword, roles } from './store.mjs';
import { migrate } from './migrate.mjs';

let db;

async function main() {
  const [command, rawEmail, role, rawPhone] = process.argv.slice(2);
  if (command === 'migrate') {
    db = getDatabase();
    await migrate();
    const { rows: [{ jobs, workshops }] } = await db.query(`
      SELECT (SELECT count(*) FROM jobs) AS jobs,
             (SELECT count(*) FROM workshops) AS workshops
    `);
    console.log(`PostgreSQL Lestari siap. Lowongan: ${jobs}. Workshop: ${workshops}.`);
    return;
  }

  const email = rawEmail?.trim().toLowerCase();
  const phone = rawPhone?.replace(/[\s()-]/g, '') || null;
  const password = process.env.LESTARI_NEW_USER_PASSWORD;
  if (command !== 'create-user' || !roles.includes(role) ||
      !email || email.length > 254 || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email) ||
      (phone && (role !== 'company' || !/^\+?\d{7,20}$/.test(phone)))) {
    throw new Error('Penggunaan: npm run db:user -- <email> <jobseeker|company|admin> [telepon-perusahaan]');
  }
  if (!password || password.length < 12 || password.length > 256) {
    throw new Error('Atur LESTARI_NEW_USER_PASSWORD dengan kata sandi sepanjang 12–256 karakter.');
  }

  db = getDatabase();
  const { rowCount } = await db.query(`
    INSERT INTO users (email, phone, role, password_hash)
    VALUES ($1, $2, $3, $4)
    ON CONFLICT DO NOTHING
  `, [email, phone, role, await hashPassword(password)]);
  if (!rowCount) {
    throw new Error('Email atau nomor telepon sudah terdaftar.');
  }
  console.log(`Akun ${role} untuk ${email} berhasil dibuat.`);
}

main().catch((error) => {
  console.error(error.message);
  process.exitCode = 1;
}).finally(async () => {
  await db?.end();
});
