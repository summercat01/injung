import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@/auth';
import { query } from '@/lib/db';
import { CATEGORIES } from '@/lib/categories';

export async function POST(req: NextRequest) {
  const session = await auth();

  if (!session?.user?.id) {
    return NextResponse.json({ error: '로그인이 필요합니다.' }, { status: 401 });
  }

  if (!session.user.nickname) {
    return NextResponse.json({ error: '닉네임 설정이 필요합니다.' }, { status: 403 });
  }

  const banCheck = await query<{ is_banned: boolean }>(
    'SELECT is_banned FROM users WHERE id = $1',
    [session.user.id]
  );
  if (banCheck.rows[0]?.is_banned) {
    return NextResponse.json({ error: '이용이 제한된 계정입니다.' }, { status: 403 });
  }

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
    [session.user.id, trimmed, validCategory]
  );

  return NextResponse.json({ id: result.rows[0].id }, { status: 201 });
}
