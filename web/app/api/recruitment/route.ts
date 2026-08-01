import { NextRequest, NextResponse } from 'next/server';
import { executeRedisCommand } from '@/lib/upstash-redis';
import { getOpenRecruitment, submitApplication, type ApplicationInput } from '@/lib/recruitment';

export const dynamic = 'force-dynamic';
const MAX_BODY_BYTES = 256 * 1024;

async function isRateLimited(request: NextRequest) {
  if (!process.env.UPSTASH_REDIS_REST_URL || !process.env.UPSTASH_REDIS_REST_TOKEN) return false;
  const ip = request.headers.get('x-forwarded-for')?.split(',')[0]?.trim() || 'unknown';
  const bucket = Math.floor(Date.now() / 600_000);
  const key = `recruitment:submit:${ip}:${bucket}`;
  const count = await executeRedisCommand<number>(['INCR', key]);
  if (count === 1) await executeRedisCommand(['EXPIRE', key, 600]);
  return Number(count) > 8;
}

export async function GET() {
  try {
    return NextResponse.json({ recruitment: await getOpenRecruitment() });
  } catch (error) {
    console.error('GET /api/recruitment error:', error);
    return NextResponse.json({ error: '모집 정보를 불러오지 못했습니다.' }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  if (Number(request.headers.get('content-length') ?? 0) > MAX_BODY_BYTES) {
    return NextResponse.json({ error: '지원서의 용량이 너무 큽니다.' }, { status: 413 });
  }
  try {
    if (await isRateLimited(request)) return NextResponse.json({ error: '잠시 후 다시 시도해 주세요.' }, { status: 429 });
    const raw = await request.text();
    if (new TextEncoder().encode(raw).length > MAX_BODY_BYTES) return NextResponse.json({ error: '지원서의 용량이 너무 큽니다.' }, { status: 413 });
    const result = await submitApplication(JSON.parse(raw) as ApplicationInput);
    return NextResponse.json({ success: true, applicationId: result.id }, { status: 201 });
  } catch (error) {
    const message = error instanceof Error ? error.message : '지원서 제출에 실패했습니다.';
    console.error('POST /api/recruitment error:', error);
    return NextResponse.json({ error: message }, { status: 400 });
  }
}
