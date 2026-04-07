import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@/auth';
import { query } from '@/lib/db';

export async function POST(req: NextRequest) {
  const session = await auth();

  if (!session?.user?.id) {
    return NextResponse.json({ error: '로그인이 필요합니다.' }, { status: 401 });
  }

  const { targetType, targetId } = await req.json();

  if (!targetType || !targetId || !['post', 'comment', 'user'].includes(targetType)) {
    return NextResponse.json({ error: '잘못된 요청입니다.' }, { status: 400 });
  }

  try {
    await query(
      'INSERT INTO reports (reporter_id, target_type, target_id) VALUES ($1, $2, $3)',
      [session.user.id, targetType, targetId]
    );
    return NextResponse.json({ success: true });
  } catch {
    // UNIQUE constraint violation = already reported
    return NextResponse.json({ error: '이미 신고한 항목입니다.' }, { status: 409 });
  }
}
