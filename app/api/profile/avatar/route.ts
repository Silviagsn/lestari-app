import { randomUUID } from 'node:crypto';
import { NextRequest, NextResponse } from 'next/server';
import sharp from 'sharp';
import { getDatabase, getSessionUser, sessionCookie } from '../../../../database/store.mjs';
import { avatarMaxBytes, avatarTypes } from '../../../utils/avatar';

export const dynamic = 'force-dynamic';
export const runtime = 'nodejs';

const headers = { 'Cache-Control': 'private, no-store', 'X-Content-Type-Options': 'nosniff' };
const error = (message: string, status: number) => NextResponse.json({ error: message }, { status, headers });

async function readPhoto(request: NextRequest) {
  if (Number(request.headers.get('content-length')) > avatarMaxBytes) return null;
  const reader = request.body?.getReader();
  if (!reader) return Buffer.alloc(0);
  const chunks: Uint8Array[] = [];
  let length = 0;
  try {
    while (true) {
      const { done, value } = await reader.read();
      if (done) return Buffer.concat(chunks, length);
      length += value.byteLength;
      if (length > avatarMaxBytes) {
        await reader.cancel().catch(() => undefined);
        return null;
      }
      chunks.push(value);
    }
  } finally {
    reader.releaseLock();
  }
}

function matchesImageType(input: Buffer, type: string) {
  if (type === 'image/jpeg') return input.subarray(0, 3).equals(Buffer.from([0xff, 0xd8, 0xff]));
  if (type === 'image/png') return input.subarray(0, 8).equals(Buffer.from([137, 80, 78, 71, 13, 10, 26, 10]));
  return input.toString('ascii', 0, 4) === 'RIFF' && input.toString('ascii', 8, 12) === 'WEBP';
}

export async function GET(request: NextRequest) {
  const user = await getSessionUser(request.cookies.get(sessionCookie)?.value);
  if (!user) return error('Silakan masuk kembali.', 401);
  const { rows: [avatar] } = await getDatabase().query('SELECT jpeg FROM profile_avatars WHERE user_id = $1', [user.id]);
  if (!avatar) return error('Foto profil belum ada.', 404);
  return new NextResponse(new Uint8Array(avatar.jpeg), { headers: { ...headers, 'Content-Type': 'image/jpeg' } });
}

export async function PUT(request: NextRequest) {
  const user = await getSessionUser(request.cookies.get(sessionCookie)?.value);
  if (!user) return error('Silakan masuk kembali.', 401);

  const type = request.headers.get('content-type') ?? '';
  if (!avatarTypes.includes(type)) return error('Pilih foto JPG, PNG, atau WebP.', 415);

  let jpeg: Buffer;
  try {
    const input = await readPhoto(request);
    if (!input) return error('Ukuran foto maksimal 5 MB.', 413);
    if (!matchesImageType(input, type)) return error('File foto tidak valid.', 415);
    jpeg = await sharp(input, { limitInputPixels: 50_000_000, failOn: 'warning' })
      .rotate()
      .resize(512, 512, { fit: 'cover' })
      .flatten({ background: '#eef2ff' })
      .jpeg({ quality: 85 })
      .toBuffer();
  } catch {
    return error('Foto tidak bisa dibaca. Coba pilih file lain.', 422);
  }

  const avatarVersion = randomUUID();
  await getDatabase().query(`
    INSERT INTO profile_avatars (user_id, version, jpeg) VALUES ($1, $2, $3)
    ON CONFLICT (user_id) DO UPDATE SET version = excluded.version, jpeg = excluded.jpeg
  `, [user.id, avatarVersion, jpeg]);
  return NextResponse.json({ avatarVersion }, { headers });
}

export async function DELETE(request: NextRequest) {
  const user = await getSessionUser(request.cookies.get(sessionCookie)?.value);
  if (!user) return error('Silakan masuk kembali.', 401);
  await getDatabase().query('DELETE FROM profile_avatars WHERE user_id = $1', [user.id]);
  return NextResponse.json({ avatarVersion: null }, { headers });
}
