import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@/auth';
import { query } from '@/lib/db';

export async function POST(req: NextRequest) {
  const session = await auth();

  if (!session?.user?.id) {
    return NextResponse.json({ error: '로그인이 필요합니다.' }, { status: 401 });
  }

  const { commentId, type } = await req.json();
  if (!commentId || !['up', 'down'].includes(type)) {
    return NextResponse.json({ error: '잘못된 요청입니다.' }, { status: 400 });
  }

  const existing = await query<{ type: string }>(
    'SELECT type FROM comment_likes WHERE comment_id = $1 AND user_id = $2',
    [commentId, session.user.id]
  );

  if (existing.rows.length > 0) {
    if (existing.rows[0].type === type) {
      // Same type: remove
      await query('DELETE FROM comment_likes WHERE comment_id = $1 AND user_id = $2', [commentId, session.user.id]);
      return NextResponse.json({ action: 'removed', type });
    } else {
      // Different type: update
      await query('UPDATE comment_likes SET type = $1 WHERE comment_id = $2 AND user_id = $3', [type, commentId, session.user.id]);
      return NextResponse.json({ action: 'updated', type });
    }
  } else {
    await query('INSERT INTO comment_likes (comment_id, user_id, type) VALUES ($1, $2, $3)', [commentId, session.user.id, type]);
    return NextResponse.json({ action: 'added', type });
  }
}
