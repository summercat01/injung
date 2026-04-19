import { NextRequest, NextResponse } from 'next/server';
import { query } from '@/lib/db';
import { CATEGORIES } from '@/lib/categories';
import { requireActiveUser } from '@/lib/guards';

export async function POST(req: NextRequest) {
  const guard = await requireActiveUser();
  if (!guard.ok) return guard.response;
  const { userId } = guard;

  const { content, category } = await req.json();

  if (!content || typeof content !== 'string') {
    return NextResponse.json({ error: '내용을 입력해주세요.' }, { status: 400 });
  }

  const trimmed = content.trim();
  if (trimmed.length === 0 || trimmed.length > 100) {
    return NextResponse.json({ error: '1~100자 사이로 입력해주세요.' }, { status: 400 });
  }

  const validCategory = CATEGORIES.includes(category) ? category : '자유';

  const result = await query<{ id: string }>(
    'INSERT INTO posts (user_id, content, category) VALUES ($1, $2, $3) RETURNING id',
    [userId, trimmed, validCategory]
  );

  return NextResponse.json({ id: result.rows[0].id }, { status: 201 });
}
