import { NextResponse } from 'next/server';
import { getDatabase } from '../../../database/store.mjs';

export const dynamic = 'force-dynamic';
export const runtime = 'nodejs';

export async function GET() {
  try {
    const result = await getDatabase().query(
      'SELECT 1 FROM schema_migrations WHERE version = $1', ['002_signup_rate_limits'],
    );
    if (result.rowCount) return NextResponse.json({ status: 'ready' });
  } catch {
    // Readiness responses must not expose connection or schema errors.
  }
  return NextResponse.json({ status: 'unavailable' }, { status: 503 });
}
