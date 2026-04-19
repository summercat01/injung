import { NextRequest, NextResponse } from 'next/server';
import { query } from '@/lib/db';
import { requireActiveUser, isUuid } from '@/lib/guards';

const VALID_TARGET_TYPES = ['post', 'comment', 'user'] as const;
type TargetType = typeof VALID_TARGET_TYPES[number];

function isTargetType(v: unknown): v is TargetType {
  return typeof v === 'string' && (VALID_TARGET_TYPES as readonly string[]).includes(v);
}

export async function POST(req: NextRequest) {
  const guard = await requireActiveUser();
  if (!guard.ok) return guard.response;
  const { userId } = guard;

  const { targetType, targetId } = await req.json();

  if (!isTargetType(targetType)) {
    return NextResponse.json({ error: '잘못된 targetType 입니다.' }, { status: 400 });
  }
  if (!isUuid(targetId)) {
    return NextResponse.json({ error: '잘못된 targetId 형식입니다.' }, { status: 400 });
  }

  // Resolve the authoring user so we can block self-reports & confirm existence.
  let targetOwnerId: string | null = null;
  if (targetType === 'post') {
    const r = await query<{ user_id: string }>(
      'SELECT user_id FROM posts WHERE id = $1',
      [targetId]
    );
    targetOwnerId = r.rows[0]?.user_id ?? null;
  } else if (targetType === 'comment') {
    const r = await query<{ user_id: string }>(
      'SELECT user_id FROM comments WHERE id = $1',
      [targetId]
    );
    targetOwnerId = r.rows[0]?.user_id ?? null;
  } else {
    const r = await query<{ id: string }>(
      'SELECT id FROM users WHERE id = $1',
      [targetId]
    );
    targetOwnerId = r.rows[0]?.id ?? null;
  }

  if (!targetOwnerId) {
    return NextResponse.json({ error: '신고 대상을 찾을 수 없습니다.' }, { status: 404 });
  }
  if (targetOwnerId === userId) {
    return NextResponse.json({ error: '자기 자신은 신고할 수 없습니다.' }, { status: 403 });
  }

  try {
    await query(
      'INSERT INTO reports (reporter_id, target_type, target_id) VALUES ($1, $2, $3)',
      [userId, targetType, targetId]
    );
    return NextResponse.json({ success: true });
  } catch (err: unknown) {
    const pgErr = err as { code?: string };
    if (pgErr.code === '23505') {
      return NextResponse.json({ error: '이미 신고한 항목입니다.' }, { status: 409 });
    }
    console.error('[api/reports] insert failed', err);
    return NextResponse.json({ error: '신고 처리에 실패했어요.' }, { status: 500 });
  }
}
