import { NextRequest, NextResponse } from 'next/server';
import { requireAdminApiAccess } from '@/lib/admin-auth';
import { createNotice, deleteNotice, getAllNotices, updateNotice } from '@/lib/supabase-notices';

export const dynamic = 'force-dynamic';

export async function GET() {
  const auth = await requireAdminApiAccess();
  if (auth.response) return auth.response;

  try {
    const notices = await getAllNotices();
    return NextResponse.json({ notices });
  } catch (error) {
    console.error('GET /api/notices error:', error);
    return NextResponse.json({ error: '공지 데이터를 불러오지 못했습니다.' }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  const auth = await requireAdminApiAccess();
  if (auth.response) return auth.response;

  let body: {
    category: string;
    title: string;
    author: string;
    date: string;
    content: string;
    images?: string[];
  };

  try {
    body = (await request.json()) as typeof body;
  } catch {
    return NextResponse.json({ error: '요청 형식이 올바르지 않습니다.' }, { status: 400 });
  }

  if (!body.category?.trim() || !body.title?.trim() || !body.author?.trim() || !body.date || !body.content?.trim()) {
    return NextResponse.json({ error: '필수 항목이 누락되었습니다.' }, { status: 400 });
  }

  try {
    const notice = await createNotice({
      category: body.category.trim(),
      title: body.title.trim(),
      author: body.author.trim(),
      date: body.date,
      content: body.content.trim(),
      images: (body.images ?? []).map((image) => image.trim()).filter(Boolean),
    });

    return NextResponse.json({ success: true, notice });
  } catch (error) {
    console.error('POST /api/notices error:', error);
    return NextResponse.json({ error: '공지 생성에 실패했습니다.' }, { status: 500 });
  }
}

export async function PATCH(request: NextRequest) {
  const auth = await requireAdminApiAccess();
  if (auth.response) return auth.response;

  let body: {
    id: number;
    category: string;
    title: string;
    author: string;
    date: string;
    content: string;
    images?: string[];
  };

  try {
    body = (await request.json()) as typeof body;
  } catch {
    return NextResponse.json({ error: '요청 형식이 올바르지 않습니다.' }, { status: 400 });
  }

  if (!body.id || !body.category?.trim() || !body.title?.trim() || !body.author?.trim() || !body.date || !body.content?.trim()) {
    return NextResponse.json({ error: '필수 항목이 누락되었습니다.' }, { status: 400 });
  }

  try {
    const notice = await updateNotice({
      id: body.id,
      category: body.category.trim(),
      title: body.title.trim(),
      author: body.author.trim(),
      date: body.date,
      content: body.content.trim(),
      images: (body.images ?? []).map((image) => image.trim()).filter(Boolean),
    });

    return NextResponse.json({ success: true, notice });
  } catch (error) {
    console.error('PATCH /api/notices error:', error);
    return NextResponse.json({ error: '공지 수정에 실패했습니다.' }, { status: 500 });
  }
}

export async function DELETE(request: NextRequest) {
  const auth = await requireAdminApiAccess();
  if (auth.response) return auth.response;

  const rawId = request.nextUrl.searchParams.get('id');
  const id = rawId ? Number(rawId) : NaN;

  if (!Number.isInteger(id) || id <= 0) {
    return NextResponse.json({ error: '삭제할 공지 ID가 올바르지 않습니다.' }, { status: 400 });
  }

  try {
    await deleteNotice(id);
    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('DELETE /api/notices error:', error);
    return NextResponse.json({ error: '공지 삭제에 실패했습니다.' }, { status: 500 });
  }
}
