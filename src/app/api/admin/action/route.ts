import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@/auth';
import { query } from '@/lib/db';

export async function POST(req: NextRequest) {
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json({ error: '로그인이 필요합니다.' }, { status: 401 });
  }
  if (!session.user.isAdmin) {
    return NextResponse.json({ error: '권한이 없습니다.' }, { status: 403 });
  }

  const { action, targetId } = await req.json();

  if (action === 'delete_post') {
    await query('DELETE FROM posts WHERE id = $1', [targetId]);
    return NextResponse.json({ ok: true });
  }

  if (action === 'delete_comment') {
    await query('DELETE FROM comments WHERE id = $1', [targetId]);
    return NextResponse.json({ ok: true });
  }

  if (action === 'ban_user_by_post') {
    await query(
      'UPDATE users SET is_banned = true WHERE id = (SELECT user_id FROM posts WHERE id = $1)',
      [targetId]
    );
    return NextResponse.json({ ok: true });
  }

  if (action === 'ban_user_by_comment') {
    await query(
      'UPDATE users SET is_banned = true WHERE id = (SELECT user_id FROM comments WHERE id = $1)',
      [targetId]
    );
    return NextResponse.json({ ok: true });
  }

  if (action === 'ban_user') {
    await query('UPDATE users SET is_banned = true WHERE id = $1', [targetId]);
    return NextResponse.json({ ok: true });
  }

  return NextResponse.json({ error: '알 수 없는 액션입니다.' }, { status: 400 });
}
