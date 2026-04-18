import { NextRequest, NextResponse } from 'next/server';
import { query } from '@/lib/db';
import { requireActiveUser, isUuid } from '@/lib/guards';

export async function POST(req: NextRequest) {
  const guard = await requireActiveUser();
  if (!guard.ok) return guard.response;
  const { userId } = guard;

  const { commentId, type } = await req.json();
  if (!isUuid(commentId)) {
    return NextResponse.json({ error: '잘못된 commentId 형식입니다.' }, { status: 400 });
  }
  if (!['up', 'down'].includes(type)) {
    return NextResponse.json({ error: '잘못된 요청입니다.' }, { status: 400 });
  }

  const existing = await query<{ type: string }>(
    'SELECT type FROM comment_likes WHERE comment_id = $1 AND user_id = $2',
    [commentId, userId]
  );

  if (existing.rows.length > 0) {
    if (existing.rows[0].type === type) {
      // Same type: remove
      await query('DELETE FROM comment_likes WHERE comment_id = $1 AND user_id = $2', [commentId, userId]);
      return NextResponse.json({ action: 'removed', type });
    } else {
      // Different type: update
      await query('UPDATE comment_likes SET type = $1 WHERE comment_id = $2 AND user_id = $3', [type, commentId, userId]);
      return NextResponse.json({ action: 'updated', type });
    }
  } else {
    await query('INSERT INTO comment_likes (comment_id, user_id, type) VALUES ($1, $2, $3)', [commentId, userId, type]);
    return NextResponse.json({ action: 'added', type });
  }
}
