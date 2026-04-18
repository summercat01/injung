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

export const REPORT_HIDE_THRESHOLD = 10;

/**
 * Build a SQL CASE expression that redacts a content column when the target
 * accumulates >= REPORT_HIDE_THRESHOLD reports. The author of the target and
 * admins always see the original content.
 *
 * The threshold is coerced with `| 0` to guarantee an integer — the only
 * safeguard if REPORT_HIDE_THRESHOLD ever becomes dynamic.
 */
export function redactedContentExpr(opts: {
  contentColumn: string;           // e.g. 'p.content' or 'c.content'
  targetIdColumn: string;          // e.g. 'p.id' or 'c.id'
  authorIdColumn: string;          // e.g. 'p.user_id' or 'c.user_id'
  targetType: 'post' | 'comment';
  viewerParamIndex: number;        // 0 when no viewer
  isAdmin: boolean;
  redactedText: string;            // e.g. '[신고 누적으로 숨겨진 게시물입니다]'
}): string {
  if (opts.isAdmin) return opts.contentColumn;
  const threshold = REPORT_HIDE_THRESHOLD | 0;
  const authorCondition = opts.viewerParamIndex > 0
    ? `${opts.authorIdColumn} = $${opts.viewerParamIndex}`
    : 'FALSE';
  return `CASE
    WHEN (SELECT COUNT(*) FROM reports r WHERE r.target_type = '${opts.targetType}' AND r.target_id = ${opts.targetIdColumn}) >= ${threshold}
      AND NOT (${authorCondition})
    THEN '${opts.redactedText.replace(/'/g, "''")}'
    ELSE ${opts.contentColumn}
  END`;
}

function postContentExpr(viewerParamIndex: number, isAdmin: boolean): string {
  return redactedContentExpr({
    contentColumn: 'p.content',
    targetIdColumn: 'p.id',
    authorIdColumn: 'p.user_id',
    targetType: 'post',
    viewerParamIndex,
    isAdmin,
    redactedText: '[신고 누적으로 숨겨진 게시물입니다]',
  });
}

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
  if (sort === '치열한순') having = 'HAVING COUNT(v.id) >= 3';

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
  page: number = 1,
  isAdmin: boolean = false
): Promise<PostRow[]> {
  const params: unknown[] = [];
  let viewerParamIndex = 0;
  if (userId) {
    params.push(userId);
    viewerParamIndex = params.length;
  }

  const myVoteSql = userId
    ? `(SELECT vote_type FROM votes v2 WHERE v2.post_id = p.id AND v2.user_id = $${viewerParamIndex})`
    : `NULL`;

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

  params.push(PAGE_SIZE);
  const limitParamIndex = params.length;
  params.push((page - 1) * PAGE_SIZE);
  const offsetParamIndex = params.length;

  const sql = `
    SELECT
      p.id,
      p.title,
      ${postContentExpr(viewerParamIndex, isAdmin)} AS content,
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
    LIMIT $${limitParamIndex} OFFSET $${offsetParamIndex}
  `;

  const result = await query<PostRow>(sql, params);
  return result.rows;
}

export async function getPostById(
  postId: string,
  userId?: string,
  isAdmin: boolean = false
): Promise<PostRow | null> {
  const params: unknown[] = [postId];
  let viewerParamIndex = 0;
  if (userId) {
    params.push(userId);
    viewerParamIndex = params.length;
  }

  const myVoteSql = userId
    ? `(SELECT vote_type FROM votes v2 WHERE v2.post_id = p.id AND v2.user_id = $${viewerParamIndex})`
    : `NULL`;

  const result = await query<PostRow>(
    `SELECT
      p.id,
      p.title,
      ${postContentExpr(viewerParamIndex, isAdmin)} AS content,
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
  // viewer is always the owner here → content never redacted (authorCondition true).
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
