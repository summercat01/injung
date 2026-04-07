import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@/auth';
import { query } from '@/lib/db';

export async function GET(req: NextRequest) {
  const postId = req.nextUrl.searchParams.get('postId');
  if (!postId) {
    return NextResponse.json({ error: 'postId가 필요합니다.' }, { status: 400 });
  }

  const session = await auth();
  const userId = session?.user?.id ?? null;

  const myVoteSql = userId
    ? `(SELECT type FROM comment_likes cl WHERE cl.comment_id = c.id AND cl.user_id = '${userId}')`
    : `NULL`;

  const result = await query<{
    id: string;
    user_id: string;
    parent_id: string | null;
    nickname: string;
    avatar_emoji: string;
    content: string;
    created_at: string;
    up_count: string;
    down_count: string;
    my_vote: string | null;
  }>(
    `SELECT c.id, c.user_id, c.parent_id, u.nickname, u.avatar_emoji, c.content, c.created_at,
       COUNT(cl.user_id) FILTER (WHERE cl.type = 'up') AS up_count,
       COUNT(cl.user_id) FILTER (WHERE cl.type = 'down') AS down_count,
       ${myVoteSql} AS my_vote,
       (SELECT COUNT(*) FROM reports r WHERE r.target_type = 'comment' AND r.target_id = c.id) AS report_count
     FROM comments c
     JOIN users u ON u.id = c.user_id
     LEFT JOIN comment_likes cl ON cl.comment_id = c.id
     WHERE c.post_id = $1
     GROUP BY c.id, u.nickname, u.avatar_emoji
     ORDER BY c.created_at ASC`,
    [postId]
  );

  return NextResponse.json(result.rows);
}

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

  const { postId, content, parentId } = await req.json();

  if (!postId || !content || typeof content !== 'string') {
    return NextResponse.json({ error: '내용을 입력해주세요.' }, { status: 400 });
  }

  const trimmed = content.trim();
  if (trimmed.length === 0 || trimmed.length > 50) {
    return NextResponse.json({ error: '1~50자 사이로 입력해주세요.' }, { status: 400 });
  }

  const result = await query<{ id: string; created_at: string }>(
    `INSERT INTO comments (post_id, user_id, parent_id, content)
     VALUES ($1, $2, $3, $4)
     RETURNING id, created_at`,
    [postId, session.user.id, parentId ?? null, trimmed]
  );

  return NextResponse.json({
    id: result.rows[0].id,
    user_id: session.user.id,
    parent_id: parentId ?? null,
    nickname: session.user.nickname,
    avatar_emoji: session.user.avatarEmoji ?? '🙂',
    content: trimmed,
    created_at: result.rows[0].created_at,
  }, { status: 201 });
}
