import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@/auth';
import { query } from '@/lib/db';
import { requireActiveUser, isUuid } from '@/lib/guards';
import { redactedContentExpr } from '@/lib/posts';

export async function GET(req: NextRequest) {
  const postId = req.nextUrl.searchParams.get('postId');
  if (!postId) {
    return NextResponse.json({ error: 'postId가 필요합니다.' }, { status: 400 });
  }
  if (!isUuid(postId)) {
    return NextResponse.json({ error: '잘못된 postId 형식입니다.' }, { status: 400 });
  }

  const session = await auth();
  const userId = session?.user?.id ?? null;
  const isAdmin = session?.user?.isAdmin === true;

  const params: unknown[] = [postId];
  let viewerParamIndex = 0;
  let myVoteSql = 'NULL';
  if (userId) {
    params.push(userId);
    viewerParamIndex = params.length;
    myVoteSql = `(SELECT type FROM comment_likes cl WHERE cl.comment_id = c.id AND cl.user_id = $${viewerParamIndex})`;
  }

  const contentExpr = redactedContentExpr({
    contentColumn: 'c.content',
    targetIdColumn: 'c.id',
    authorIdColumn: 'c.user_id',
    targetType: 'comment',
    viewerParamIndex,
    isAdmin,
    redactedText: '[신고 누적으로 숨겨진 댓글입니다]',
  });

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
    report_count: string;
  }>(
    `SELECT c.id, c.user_id, c.parent_id, u.nickname, u.avatar_emoji,
       ${contentExpr} AS content,
       c.created_at,
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
    params
  );

  return NextResponse.json(result.rows);
}

export async function POST(req: NextRequest) {
  const guard = await requireActiveUser();
  if (!guard.ok) return guard.response;
  const { session, userId } = guard;

  const { postId, content, parentId } = await req.json();

  if (!isUuid(postId)) {
    return NextResponse.json({ error: '잘못된 postId 형식입니다.' }, { status: 400 });
  }
  if (parentId !== undefined && parentId !== null && !isUuid(parentId)) {
    return NextResponse.json({ error: '잘못된 parentId 형식입니다.' }, { status: 400 });
  }
  if (!content || typeof content !== 'string') {
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
    [postId, userId, parentId ?? null, trimmed]
  );

  return NextResponse.json({
    id: result.rows[0].id,
    user_id: userId,
    parent_id: parentId ?? null,
    nickname: session.user.nickname,
    avatar_emoji: session.user.avatarEmoji ?? '🙂',
    content: trimmed,
    created_at: result.rows[0].created_at,
  }, { status: 201 });
}
