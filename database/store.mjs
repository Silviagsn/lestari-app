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

export async function createUser(email, role, password, phone = null) {
  const passwordHash = await hashPassword(password);
  const { rowCount } = await getDatabase().query(`
    INSERT INTO users (email, phone, role, password_hash)
    VALUES ($1, $2, $3, $4)
    ON CONFLICT DO NOTHING
  `, [email, phone, role, passwordHash]);
  return rowCount === 1;
}

const hashToken = (token) => createHash('sha256').update(token).digest('hex');
const validToken = (token) => typeof token === 'string' && /^[a-f0-9]{64}$/.test(token);

export async function createSession(userId, previousToken, expectedPasswordHash = null) {
  const token = randomBytes(32).toString('hex');
  const result = await getDatabase().query(`
    WITH account AS (
      SELECT id FROM users WHERE id = $2 AND ($5::text IS NULL OR password_hash = $5) FOR SHARE
    ), revoked AS (
      DELETE FROM sessions WHERE expires_at <= now() OR (token_hash = $4 AND EXISTS (SELECT 1 FROM account))
    )
    INSERT INTO sessions (token_hash, user_id, expires_at)
    SELECT $1, id, now() + $3 * interval '1 second' FROM account
  `, [hashToken(token), userId, sessionLifetime, validToken(previousToken) ? hashToken(previousToken) : null, expectedPasswordHash]);
  return result.rowCount ? token : null;
}

export async function replacePassword(userId, token, previousHash, nextHash) {
  if (!validToken(token)) return false;
  const client = await getDatabase().connect();
  const currentSession = hashToken(token);
  try {
    await client.query('BEGIN');
    const updated = await client.query(`
      UPDATE users SET password_hash = $3 WHERE id = $1 AND password_hash = $2 AND EXISTS (
        SELECT 1 FROM sessions WHERE user_id = $1 AND token_hash = $4 AND expires_at > now()
      )
    `, [userId, previousHash, nextHash, currentSession]);
    if (!updated.rowCount) {
      await client.query('ROLLBACK');
      return false;
    }
    await client.query('DELETE FROM sessions WHERE user_id = $1 AND token_hash <> $2', [userId, currentSession]);
    await client.query('COMMIT');
    return true;
  } catch (error) {
    await client.query('ROLLBACK');
    throw error;
  } finally {
    client.release();
  }
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
