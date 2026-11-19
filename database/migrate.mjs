import { readFile } from 'node:fs/promises';
import { getDatabase } from './store.mjs';

const migrations = ['001_initial'];

export async function migrate() {
  const client = await getDatabase().connect();
  try {
    await client.query('BEGIN');
    // All deploys sharing this database serialize their schema changes.
    await client.query('SELECT pg_advisory_xact_lock(1785601932, 1)');
    await client.query(`
      CREATE TABLE IF NOT EXISTS schema_migrations (
        version text PRIMARY KEY,
        applied_at timestamptz NOT NULL DEFAULT now()
      )
    `);
    const { rows } = await client.query('SELECT version FROM schema_migrations');
    const applied = new Set(rows.map(({ version }) => version));
    for (const version of migrations) {
      if (applied.has(version)) continue;
      const sql = await readFile(new URL(`./migrations/${version}.sql`, import.meta.url), 'utf8');
      await client.query(sql);
      if (version === '001_initial') {
        for (const table of ['jobs', 'workshops']) {
          const catalog = JSON.parse(await readFile(new URL(`./${table}.json`, import.meta.url), 'utf8'));
          await client.query(`
            INSERT INTO ${table} (id, details)
            SELECT (item->>'id')::integer, item
            FROM jsonb_array_elements($1::jsonb) AS catalog(item)
          `, [JSON.stringify(catalog)]);
        }
      }
      await client.query('INSERT INTO schema_migrations (version) VALUES ($1)', [version]);
    }
    await client.query('COMMIT');
  } catch (error) {
    await client.query('ROLLBACK');
    throw error;
  } finally {
    client.release();
  }
}
