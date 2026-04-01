import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@/auth';
import { query } from '@/lib/db';

// PATCH /api/profile — set nickname & avatar_emoji
export async function PATCH(req: NextRequest) {
  const session = await auth();

  if (!session?.user?.id) {
    return NextResponse.json({ error: '로그인이 필요합니다.' }, { status: 401 });
  }

  const { nickname, avatarEmoji } = await req.json();

  if (!nickname || typeof nickname !== 'string') {
    return NextResponse.json({ error: '닉네임을 입력해주세요.' }, { status: 400 });
  }

  const trimmed = nickname.trim();
  if (trimmed.length < 2 || trimmed.length > 15) {
    return NextResponse.json({ error: '닉네임은 2~15자 사이여야 합니다.' }, { status: 400 });
  }

  try {
    await query(
      'UPDATE users SET nickname = $1, avatar_emoji = $2 WHERE id = $3',
      [trimmed, avatarEmoji || '🙂', session.user.id]
    );
  } catch (err: unknown) {
    const pgErr = err as { code?: string };
    if (pgErr.code === '23505') {
      return NextResponse.json({ error: '이미 사용 중인 닉네임입니다.' }, { status: 409 });
    }
    throw err;
  }

  return NextResponse.json({ success: true });
}
