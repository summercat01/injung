import { NextRequest, NextResponse } from 'next/server';
import { query } from '@/lib/db';
import { requireUnbanned } from '@/lib/guards';
import { isValidEmoji } from '@/lib/emojis';

// PATCH /api/profile — set nickname & avatar_emoji
export async function PATCH(req: NextRequest) {
  // Uses requireUnbanned (not requireActiveUser) because nickname-less users
  // must be allowed to set their initial nickname via this endpoint.
  const guard = await requireUnbanned();
  if (!guard.ok) return guard.response;
  const { userId } = guard;

  const { nickname, avatarEmoji } = await req.json();

  if (!nickname || typeof nickname !== 'string') {
    return NextResponse.json({ error: '닉네임을 입력해주세요.' }, { status: 400 });
  }

  const trimmed = nickname.trim().normalize('NFC');
  if (trimmed.length < 2 || trimmed.length > 15) {
    return NextResponse.json({ error: '닉네임은 2~15자 사이여야 합니다.' }, { status: 400 });
  }
  if (!/^[A-Za-z0-9가-힣_\-]+$/.test(trimmed)) {
    return NextResponse.json(
      { error: '닉네임은 한글, 영문, 숫자, _, - 만 사용할 수 있어요.' },
      { status: 400 }
    );
  }

  if (!isValidEmoji(avatarEmoji)) {
    return NextResponse.json({ error: '유효하지 않은 이모지입니다.' }, { status: 400 });
  }

  try {
    await query(
      'UPDATE users SET nickname = $1, avatar_emoji = $2 WHERE id = $3',
      [trimmed, avatarEmoji, userId]
    );
  } catch (err: unknown) {
    const pgErr = err as { code?: string };
    if (pgErr.code === '23505') {
      return NextResponse.json({ error: '이미 사용 중인 닉네임입니다.' }, { status: 409 });
    }
    console.error('[api/profile] update failed', err);
    return NextResponse.json({ error: '프로필 저장에 실패했어요.' }, { status: 500 });
  }

  return NextResponse.json({ success: true });
}
