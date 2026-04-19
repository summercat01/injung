import { NextRequest, NextResponse } from 'next/server';
import { query } from '@/lib/db';
import { requireAdmin, isUuid } from '@/lib/guards';

const ALLOWED_ACTIONS = [
  'delete_post',
  'delete_comment',
  'ban_user',
  'ban_user_by_post',
  'ban_user_by_comment',
] as const;
type AdminAction = typeof ALLOWED_ACTIONS[number];

function isAdminAction(v: unknown): v is AdminAction {
  return typeof v === 'string' && (ALLOWED_ACTIONS as readonly string[]).includes(v);
}

export async function POST(req: NextRequest) {
  const guard = await requireAdmin();
  if (!guard.ok) return guard.response;
  const { userId: adminId } = guard;

  const { action, targetId, targetType } = await req.json();

  if (!isAdminAction(action)) {
    return NextResponse.json({ error: '알 수 없는 액션입니다.' }, { status: 400 });
  }
  if (!isUuid(targetId)) {
    return NextResponse.json({ error: '잘못된 targetId 형식입니다.' }, { status: 400 });
  }

  // Resolve the user who will be banned (so we can protect admins / self).
  let targetUserId: string | null = null;
  if (action === 'ban_user') {
    targetUserId = targetId;
  } else if (action === 'ban_user_by_post') {
    const r = await query<{ user_id: string }>(
      'SELECT user_id FROM posts WHERE id = $1',
      [targetId]
    );
    targetUserId = r.rows[0]?.user_id ?? null;
  } else if (action === 'ban_user_by_comment') {
    const r = await query<{ user_id: string }>(
      'SELECT user_id FROM comments WHERE id = $1',
      [targetId]
    );
    targetUserId = r.rows[0]?.user_id ?? null;
  }

  if (action === 'ban_user' || action === 'ban_user_by_post' || action === 'ban_user_by_comment') {
    if (!targetUserId) {
      return NextResponse.json({ error: '대상 사용자를 찾을 수 없습니다.' }, { status: 404 });
    }
    if (targetUserId === adminId) {
      return NextResponse.json({ error: '자기 자신은 벤할 수 없습니다.' }, { status: 403 });
    }
    const targetCheck = await query<{ is_admin: boolean }>(
      'SELECT is_admin FROM users WHERE id = $1',
      [targetUserId]
    );
    if (targetCheck.rows[0]?.is_admin) {
      return NextResponse.json({ error: '관리자는 벤할 수 없습니다.' }, { status: 403 });
    }
  }

  // Perform the action.
  if (action === 'delete_post') {
    await query('DELETE FROM posts WHERE id = $1', [targetId]);
  } else if (action === 'delete_comment') {
    await query('DELETE FROM comments WHERE id = $1', [targetId]);
  } else if (action === 'ban_user') {
    await query('UPDATE users SET is_banned = TRUE WHERE id = $1', [targetId]);
  } else if (action === 'ban_user_by_post' || action === 'ban_user_by_comment') {
    await query('UPDATE users SET is_banned = TRUE WHERE id = $1', [targetUserId]);
  }

  // Audit log (best-effort — never block the action on audit failure).
  try {
    await query(
      `INSERT INTO admin_audit (admin_id, action, target_type, target_id)
       VALUES ($1, $2, $3, $4)`,
      [adminId, action, typeof targetType === 'string' ? targetType : null, targetId]
    );
  } catch (err) {
    console.error('[admin_audit] insert failed', err);
  }

  return NextResponse.json({ ok: true });
}
