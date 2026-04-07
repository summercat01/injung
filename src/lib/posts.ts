import { query } from './db';
import { CATEGORIES } from './categories';

export { CATEGORIES } from './categories';
export type { Category } from './categories';

export type SortMode = '최신순' | '인기순' | '인정률높은순' | '치열한순';

export interface PostRow {
  id: string;
  title: string;
  content: string;
  category: string;
  created_at: string;
  user_id: string;
  nickname: string;
  avatar_emoji: string;
  agree_count: number;
  disagree_count: number;
  total_votes: number;
  agree_rate: number | null;
  my_vote: '인정' | '노인정' | null;
  report_count: number;
}

export const PAGE_SIZE = 20;

export async function getPostsCount(
  sort: SortMode,
  category?: string
): Promise<number> {
  const params: unknown[] = [];
  let categoryWhere = '';
  if (category) {
    params.push(category);
    categoryWhere = `AND p.category = $${params.length}`;
  }

  let having = '';
  if (sort === '인정률높은순') having = 'HAVING COUNT(v.id) >= 1';
  if (sort === '치열한순') {
    const rateExpr = `ROUND(COUNT(v.id) FILTER (WHERE v.vote_type = '인정')::NUMERIC / NULLIF(COUNT(v.id), 0) * 100, 1)`;
    having = `HAVING COUNT(v.id) >= 3`;
  }

  const sql = `
    SELECT COUNT(*) FROM (
      SELECT p.id
      FROM posts p
      JOIN users u ON u.id = p.user_id
      LEFT JOIN votes v ON v.post_id = p.id
      WHERE 1=1 ${categoryWhere}
      GROUP BY p.id
      ${having}
    ) sub
  `;
  const result = await query<{ count: string }>(sql, params);
  return parseInt(result.rows[0]?.count ?? '0');
}

export async function getPosts(
  sort: SortMode,
  userId?: string,
  category?: string,
  page: number = 1
): Promise<PostRow[]> {
  const myVoteSql = userId
    ? `(SELECT vote_type FROM votes v2 WHERE v2.post_id = p.id AND v2.user_id = $1)`
    : `NULL`;

  const params: unknown[] = userId ? [userId] : [];

  let categoryWhere = '';
  if (category) {
    params.push(category);
    categoryWhere = `AND p.category = $${params.length}`;
  }

  let orderBy: string;
  let having = '';

  switch (sort) {
    case '인기순':
      orderBy = 'total_votes DESC, p.created_at DESC';
      break;
    case '인정률높은순':
      orderBy = 'ROUND(COUNT(v.id) FILTER (WHERE v.vote_type = \'인정\')::NUMERIC / NULLIF(COUNT(v.id), 0) * 100, 1) DESC NULLS LAST, p.created_at DESC';
      having = 'HAVING COUNT(v.id) >= 1';
      break;
    case '치열한순': {
      const rateExpr = `ROUND(COUNT(v.id) FILTER (WHERE v.vote_type = '인정')::NUMERIC / NULLIF(COUNT(v.id), 0) * 100, 1)`;
      orderBy = `ABS(${rateExpr} - 50) ASC NULLS LAST, p.created_at DESC`;
      having = `HAVING COUNT(v.id) >= 3`;
      break;
    }
    default:
      orderBy = 'p.created_at DESC';
  }

  const sql = `
    SELECT
      p.id,
      p.title,
      p.content,
      p.category,
      p.created_at,
      p.user_id,
      u.nickname,
      u.avatar_emoji,
      COUNT(v.id) FILTER (WHERE v.vote_type = '인정') AS agree_count,
      COUNT(v.id) FILTER (WHERE v.vote_type = '노인정') AS disagree_count,
      COUNT(v.id) AS total_votes,
      CASE WHEN COUNT(v.id) > 0
        THEN ROUND(COUNT(v.id) FILTER (WHERE v.vote_type = '인정')::NUMERIC / COUNT(v.id) * 100, 1)
        ELSE NULL
      END AS agree_rate,
      ${myVoteSql} AS my_vote,
      (SELECT COUNT(*) FROM reports r WHERE r.target_type = 'post' AND r.target_id = p.id) AS report_count
    FROM posts p
    JOIN users u ON u.id = p.user_id
    LEFT JOIN votes v ON v.post_id = p.id
    WHERE 1=1 ${categoryWhere}
    GROUP BY p.id, u.nickname, u.avatar_emoji
    ${having}
    ORDER BY ${orderBy}
    LIMIT ${PAGE_SIZE} OFFSET ${(page - 1) * PAGE_SIZE}
  `;

  const result = await query<PostRow>(sql, params);
  return result.rows;
}

export async function getPostById(
  postId: string,
  userId?: string
): Promise<PostRow | null> {
  const myVoteSql = userId
    ? `(SELECT vote_type FROM votes v2 WHERE v2.post_id = p.id AND v2.user_id = $2)`
    : `NULL`;

  const params: unknown[] = userId ? [postId, userId] : [postId];

  const result = await query<PostRow>(
    `SELECT
      p.id,
      p.title,
      p.content,
      p.category,
      p.created_at,
      p.user_id,
      u.nickname,
      u.avatar_emoji,
      COUNT(v.id) FILTER (WHERE v.vote_type = '인정') AS agree_count,
      COUNT(v.id) FILTER (WHERE v.vote_type = '노인정') AS disagree_count,
      COUNT(v.id) AS total_votes,
      CASE WHEN COUNT(v.id) > 0
        THEN ROUND(COUNT(v.id) FILTER (WHERE v.vote_type = '인정')::NUMERIC / COUNT(v.id) * 100, 1)
        ELSE NULL
      END AS agree_rate,
      ${myVoteSql} AS my_vote,
      (SELECT COUNT(*) FROM reports r WHERE r.target_type = 'post' AND r.target_id = p.id) AS report_count
    FROM posts p
    JOIN users u ON u.id = p.user_id
    LEFT JOIN votes v ON v.post_id = p.id
    WHERE p.id = $1
    GROUP BY p.id, u.nickname, u.avatar_emoji`,
    params
  );

  return result.rows[0] ?? null;
}

export async function getUserStats(userId: string) {
  const postsResult = await query<{ count: string }>(
    'SELECT COUNT(*) FROM posts WHERE user_id = $1',
    [userId]
  );

  const votesResult = await query<{
    agree_count: string;
    disagree_count: string;
    total_count: string;
  }>(
    `SELECT
      COUNT(*) FILTER (WHERE v.vote_type = '인정') AS agree_count,
      COUNT(*) FILTER (WHERE v.vote_type = '노인정') AS disagree_count,
      COUNT(*) AS total_count
     FROM votes v
     JOIN posts p ON p.id = v.post_id
     WHERE p.user_id = $1`,
    [userId]
  );

  const postCount = parseInt(postsResult.rows[0]?.count ?? '0');
  const agreeCount = parseInt(votesResult.rows[0]?.agree_count ?? '0');
  const disagreeCount = parseInt(votesResult.rows[0]?.disagree_count ?? '0');
  const totalVotes = parseInt(votesResult.rows[0]?.total_count ?? '0');
  const agreeRate =
    totalVotes > 0 ? Math.round((agreeCount / totalVotes) * 1000) / 10 : null;

  return { postCount, agreeCount, disagreeCount, totalVotes, agreeRate };
}

export async function getUserPosts(userId: string): Promise<PostRow[]> {
  const result = await query<PostRow>(
    `SELECT
      p.id,
      p.title,
      p.content,
      p.category,
      p.created_at,
      p.user_id,
      u.nickname,
      u.avatar_emoji,
      COUNT(v.id) FILTER (WHERE v.vote_type = '인정') AS agree_count,
      COUNT(v.id) FILTER (WHERE v.vote_type = '노인정') AS disagree_count,
      COUNT(v.id) AS total_votes,
      CASE WHEN COUNT(v.id) > 0
        THEN ROUND(COUNT(v.id) FILTER (WHERE v.vote_type = '인정')::NUMERIC / COUNT(v.id) * 100, 1)
        ELSE NULL
      END AS agree_rate,
      NULL AS my_vote,
      (SELECT COUNT(*) FROM reports r WHERE r.target_type = 'post' AND r.target_id = p.id) AS report_count
    FROM posts p
    JOIN users u ON u.id = p.user_id
    LEFT JOIN votes v ON v.post_id = p.id
    WHERE p.user_id = $1
    GROUP BY p.id, u.nickname, u.avatar_emoji
    ORDER BY p.created_at DESC
    LIMIT 30`,
    [userId]
  );
  return result.rows;
}
