import { createHash, randomBytes, scrypt, timingSafeEqual } from 'node:crypto';
import { promisify } from 'node:util';
import pg from 'pg';

const deriveKey = promisify(scrypt);
let pool;

export const roles = ['jobseeker', 'company', 'admin'];
export const sessionLifetime = 60 * 60 * 24 * 7;
export const sessionCookie = 'lestari_session';

export function getDatabase() {
  if (pool) return pool;

  const connectionString = process.env.DATABASE_URL;
  if (!connectionString) {
    throw new Error('DATABASE_URL PostgreSQL belum diatur.');
  }
  pool = new pg.Pool({
    connectionString,
    max: 5,
    connectionTimeoutMillis: 5000,
    idleTimeoutMillis: 10000,
  });
  pool.on('error', (error) => {
    console.error('Koneksi PostgreSQL terputus.', error.code ?? error.name);
  });
  return pool;
}

export async function hashPassword(password) {
  const salt = randomBytes(16).toString('hex');
  const key = Buffer.from(await deriveKey(password, salt, 64));
  return `${salt}:${key.toString('hex')}`;
}

export async function verifyPassword(password, storedHash) {
  // Derive a key for unknown accounts as well to avoid a fast rejection path.
  const [salt, hash] = (storedHash ?? `${'0'.repeat(32)}:${'0'.repeat(128)}`).split(':');
  const actual = Buffer.from(await deriveKey(password, salt, 64));
  return timingSafeEqual(actual, Buffer.from(hash, 'hex')) && storedHash != null;
}

const hashToken = (token) => createHash('sha256').update(token).digest('hex');
const validToken = (token) => typeof token === 'string' && /^[a-f0-9]{64}$/.test(token);

export async function createSession(userId, previousToken) {
  const token = randomBytes(32).toString('hex');
  await getDatabase().query(`
    WITH revoked AS (
      DELETE FROM sessions WHERE expires_at <= now() OR token_hash = $4
    )
    INSERT INTO sessions (token_hash, user_id, expires_at)
    VALUES ($1, $2, now() + $3 * interval '1 second')
  `, [hashToken(token), userId, sessionLifetime, validToken(previousToken) ? hashToken(previousToken) : null]);
  return token;
}

export async function getSessionUser(token) {
  if (!validToken(token)) return null;
  const { rows } = await getDatabase().query(`
    SELECT users.id, users.role FROM sessions
    JOIN users ON users.id = sessions.user_id
    WHERE sessions.token_hash = $1 AND sessions.expires_at > now()
  `, [hashToken(token)]);
  return rows[0] ?? null;
}

export async function deleteSession(token) {
  if (!validToken(token)) return;
  await getDatabase().query('DELETE FROM sessions WHERE token_hash = $1', [hashToken(token)]);
}
