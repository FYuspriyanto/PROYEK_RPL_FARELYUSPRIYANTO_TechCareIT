import { NextResponse } from 'next/server';
import { ApiResponse } from '@/types';

export function jsonSuccess<T>(data?: T, message?: string, status = 200) {
  const payload: ApiResponse<T> = {
    success: true,
    ...(message ? { message } : {}),
    ...(data !== undefined ? { data } : {}),
  };
  return NextResponse.json(payload, { status });
}

export function jsonError(error: string, status = 400, data?: any) {
  const payload: ApiResponse = {
    success: false,
    error,
    ...(data !== undefined ? { data } : {}),
  };
  return NextResponse.json(payload, { status });
}
