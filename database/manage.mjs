import { createUser, getDatabase, roles } from './store.mjs';
import { migrate } from './migrate.mjs';
import { isAccountEmail, isAccountPassword, minimumPasswordLength, maximumPasswordLength } from '../app/utils/accountPolicy.mjs';

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
      !isAccountEmail(email) ||
      (phone && (role !== 'company' || !/^\+?\d{7,20}$/.test(phone)))) {
    throw new Error('Penggunaan: npm run db:user -- <email> <jobseeker|company|admin> [telepon-perusahaan]');
  }
  if (!isAccountPassword(password)) {
    throw new Error(`Atur LESTARI_NEW_USER_PASSWORD dengan kata sandi sepanjang ${minimumPasswordLength}–${maximumPasswordLength} karakter.`);
  }

  db = getDatabase();
  if (!(await createUser(email, role, password, phone))) {
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
