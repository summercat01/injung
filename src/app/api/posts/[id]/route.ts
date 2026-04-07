import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@/auth';
import { query } from '@/lib/db';

export async function PATCH(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const session = await auth();
  if (!session?.user?.id) return NextResponse.json({ error: '로그인이 필요합니다.' }, { status: 401 });

  const { content } = await req.json();
  if (!content || typeof content !== 'string') return NextResponse.json({ error: '내용을 입력해주세요.' }, { status: 400 });
  const trimmed = content.trim();
  if (trimmed.length === 0 || trimmed.length > 100) return NextResponse.json({ error: '1~100자 사이로 입력해주세요.' }, { status: 400 });

  const result = await query<{ id: string }>(
    'UPDATE posts SET content = $1 WHERE id = $2 AND user_id = $3 RETURNING id',
    [trimmed, id, session.user.id]
  );
  if (result.rows.length === 0) return NextResponse.json({ error: '권한이 없거나 존재하지 않는 글입니다.' }, { status: 403 });

  return NextResponse.json({ content: trimmed });
}

export async function DELETE(_req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const session = await auth();
  if (!session?.user?.id) return NextResponse.json({ error: '로그인이 필요합니다.' }, { status: 401 });

  const result = await query<{ id: string }>(
    'DELETE FROM posts WHERE id = $1 AND user_id = $2 RETURNING id',
    [id, session.user.id]
  );
  if (result.rows.length === 0) return NextResponse.json({ error: '권한이 없거나 존재하지 않는 글입니다.' }, { status: 403 });

  return NextResponse.json({ ok: true });
}
