'use client';

import { signOut } from 'next-auth/react';

export default function SignOutButton() {
  return (
    <button
      onClick={() => signOut({ callbackUrl: '/login' })}
      className="text-sm font-medium" style={{ color: 'rgba(85,61,54,0.5)' }}
    >
      로그아웃
    </button>
  );
}
