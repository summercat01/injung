import { NextResponse } from 'next/server';
import { auth } from '@/auth';
import { query } from '@/lib/db';

export async function GET() {
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json({ error: '로그인이 필요합니다.' }, { status: 401 });
  }

  if (!session.user.isAdmin) {
    return NextResponse.json({ error: '권한이 없습니다.' }, { status: 403 });
  }

  const posts = await query<{
    id: string;
    content: string;
    nickname: string;
    created_at: string;
    report_count: string;
  }>(
    `SELECT p.id, p.content, u.nickname, p.created_at,
       COUNT(r.id) AS report_count
     FROM posts p
     JOIN users u ON u.id = p.user_id
     JOIN reports r ON r.target_type = 'post' AND r.target_id = p.id
     GROUP BY p.id, u.nickname
     ORDER BY report_count DESC, p.created_at DESC
     LIMIT 100`,
    []
  );

  const comments = await query<{
    id: string;
    content: string;
    nickname: string;
    post_id: string;
    created_at: string;
    report_count: string;
  }>(
    `SELECT c.id, c.content, u.nickname, c.post_id, c.created_at,
       COUNT(r.id) AS report_count
     FROM comments c
     JOIN users u ON u.id = c.user_id
     JOIN reports r ON r.target_type = 'comment' AND r.target_id = c.id
     GROUP BY c.id, u.nickname
     ORDER BY report_count DESC, c.created_at DESC
     LIMIT 100`,
    []
  );

  const users = await query<{
    id: string;
    nickname: string;
    avatar_emoji: string;
    report_count: string;
  }>(
    `SELECT u.id, u.nickname, u.avatar_emoji,
       COUNT(r.id) AS report_count
     FROM users u
     JOIN reports r ON r.target_type = 'user' AND r.target_id = u.id
     GROUP BY u.id
     ORDER BY report_count DESC
     LIMIT 100`,
    []
  );

  return NextResponse.json({ posts: posts.rows, comments: comments.rows, users: users.rows });
}
