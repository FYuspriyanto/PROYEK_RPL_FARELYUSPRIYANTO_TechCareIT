import { NextRequest } from 'next/server';
import { clearSessionCookie } from '@/lib/auth';
import { jsonSuccess } from '@/lib/response';

export async function POST(_req: NextRequest) {
  await clearSessionCookie();
  return jsonSuccess(null, 'Logout berhasil');
}
