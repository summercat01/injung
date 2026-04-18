import { NextRequest, NextResponse } from 'next/server';
import { query } from '@/lib/db';
import { requireActiveUser, isUuid } from '@/lib/guards';

export async function POST(req: NextRequest) {
  const guard = await requireActiveUser();
  if (!guard.ok) return guard.response;
  const { userId } = guard;

  const { postId, voteType } = await req.json();

  if (!isUuid(postId)) {
    return NextResponse.json({ error: '잘못된 postId 형식입니다.' }, { status: 400 });
  }
  if (!['인정', '노인정'].includes(voteType)) {
    return NextResponse.json({ error: '잘못된 요청입니다.' }, { status: 400 });
  }

  // Check if user already voted
  const existing = await query<{ id: string; vote_type: string }>(
    'SELECT id, vote_type FROM votes WHERE post_id = $1 AND user_id = $2',
    [postId, userId]
  );

  if (existing.rows[0]) {
    if (existing.rows[0].vote_type === voteType) {
      // Same vote → cancel (delete)
      await query('DELETE FROM votes WHERE id = $1', [existing.rows[0].id]);
      return NextResponse.json({ action: 'removed' });
    } else {
      // Different vote → update
      await query('UPDATE votes SET vote_type = $1 WHERE id = $2', [
        voteType,
        existing.rows[0].id,
      ]);
      return NextResponse.json({ action: 'updated' });
    }
  }

  // New vote
  await query(
    'INSERT INTO votes (post_id, user_id, vote_type) VALUES ($1, $2, $3)',
    [postId, userId, voteType]
  );

  return NextResponse.json({ action: 'added' }, { status: 201 });
}
