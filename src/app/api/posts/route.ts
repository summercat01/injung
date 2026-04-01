import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@/auth';
import { query } from '@/lib/db';

export async function POST(req: NextRequest) {
  const session = await auth();

  if (!session?.user?.id) {
    return NextResponse.json({ error: '로그인이 필요합니다.' }, { status: 401 });
  }

  if (!session.user.nickname) {
    return NextResponse.json({ error: '닉네임 설정이 필요합니다.' }, { status: 403 });
  }

  const { content } = await req.json();

  if (!content || typeof content !== 'string') {
    return NextResponse.json({ error: '내용을 입력해주세요.' }, { status: 400 });
  }

  const trimmed = content.trim();
  if (trimmed.length === 0 || trimmed.length > 300) {
    return NextResponse.json({ error: '1~300자 사이로 입력해주세요.' }, { status: 400 });
  }

  const result = await query<{ id: string }>(
    'INSERT INTO posts (user_id, content) VALUES ($1, $2) RETURNING id',
    [session.user.id, trimmed]
  );

  return NextResponse.json({ id: result.rows[0].id }, { status: 201 });
}
