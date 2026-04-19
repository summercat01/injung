import { NextResponse } from 'next/server';
import type { Session } from 'next-auth';
import { auth } from '@/auth';
import { query } from '@/lib/db';

const UUID_RE = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

export function isUuid(v: unknown): v is string {
  return typeof v === 'string' && UUID_RE.test(v);
}

type GuardOk = { ok: true; session: Session; userId: string };
type GuardErr = { ok: false; response: NextResponse };
type GuardResult = GuardOk | GuardErr;

async function getSession(): Promise<Session | null> {
  // auth() is overloaded (middleware-wrap vs session-retrieval). We only use
  // the zero-arg form here, which returns Session | null.
  return (await auth()) as Session | null;
}

export async function requireUser(): Promise<GuardResult> {
  const session = await getSession();
  if (!session?.user?.id) {
    return {
      ok: false,
      response: NextResponse.json({ error: '로그인이 필요합니다.' }, { status: 401 }),
    };
  }
  return { ok: true, session, userId: session.user.id };
}

// Auth + ban check only (no nickname requirement).
// Use for routes that must be callable by users still in onboarding — e.g., PATCH /api/profile.
export async function requireUnbanned(): Promise<GuardResult> {
  const base = await requireUser();
  if (!base.ok) return base;

  const banCheck = await query<{ is_banned: boolean }>(
    'SELECT is_banned FROM users WHERE id = $1',
    [base.userId]
  );
  if (banCheck.rows[0]?.is_banned) {
    return {
      ok: false,
      response: NextResponse.json({ error: '이용이 제한된 계정입니다.' }, { status: 403 }),
    };
  }
  return base;
}

export async function requireActiveUser(): Promise<GuardResult> {
  const base = await requireUnbanned();
  if (!base.ok) return base;

  if (!base.session.user?.nickname) {
    return {
      ok: false,
      response: NextResponse.json({ error: '닉네임 설정이 필요합니다.' }, { status: 403 }),
    };
  }
  return base;
}

export async function requireAdmin(): Promise<GuardResult> {
  const base = await requireUser();
  if (!base.ok) return base;
  if (!base.session.user?.isAdmin) {
    return {
      ok: false,
      response: NextResponse.json({ error: '권한이 없습니다.' }, { status: 403 }),
    };
  }
  return base;
}
