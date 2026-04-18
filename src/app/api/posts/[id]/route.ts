import { NextRequest, NextResponse } from 'next/server';
import { query } from '@/lib/db';
import { requireActiveUser, isUuid } from '@/lib/guards';

export async function PATCH(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  if (!isUuid(id)) return NextResponse.json({ error: '잘못된 id 형식입니다.' }, { status: 400 });

  const guard = await requireActiveUser();
  if (!guard.ok) return guard.response;
  const { userId } = guard;

  const { content } = await req.json();
  if (!content || typeof content !== 'string') return NextResponse.json({ error: '내용을 입력해주세요.' }, { status: 400 });
  const trimmed = content.trim();
  if (trimmed.length === 0 || trimmed.length > 100) return NextResponse.json({ error: '1~100자 사이로 입력해주세요.' }, { status: 400 });

  const result = await query<{ id: string }>(
    'UPDATE posts SET content = $1 WHERE id = $2 AND user_id = $3 RETURNING id',
    [trimmed, id, userId]
  );
  if (result.rows.length === 0) return NextResponse.json({ error: '권한이 없거나 존재하지 않는 글입니다.' }, { status: 403 });

  return NextResponse.json({ content: trimmed });
}

export async function DELETE(_req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  if (!isUuid(id)) return NextResponse.json({ error: '잘못된 id 형식입니다.' }, { status: 400 });

  const guard = await requireActiveUser();
  if (!guard.ok) return guard.response;
  const { userId } = guard;

  const result = await query<{ id: string }>(
    'DELETE FROM posts WHERE id = $1 AND user_id = $2 RETURNING id',
    [id, userId]
  );
  if (result.rows.length === 0) return NextResponse.json({ error: '권한이 없거나 존재하지 않는 글입니다.' }, { status: 403 });

  return NextResponse.json({ ok: true });
}
