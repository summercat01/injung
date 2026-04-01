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

  const { postId, voteType } = await req.json();

  if (!postId || !['인정', '노인정'].includes(voteType)) {
    return NextResponse.json({ error: '잘못된 요청입니다.' }, { status: 400 });
  }

  const userId = session.user.id;

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
