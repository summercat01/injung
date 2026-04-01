'use client';

import { signIn } from 'next-auth/react';

export default function LoginButtons() {
  return (
    <div className="flex flex-col gap-3 max-w-xs mx-auto">
      <button
        onClick={() => signIn('kakao', { callbackUrl: '/feed' })}
        className="flex items-center justify-center gap-3 w-full py-3.5 rounded-xl bg-yellow-300 hover:bg-yellow-400 text-gray-900 font-semibold transition-colors"
      >
        <svg width="20" height="20" viewBox="0 0 512 512" fill="none">
          <path
            d="M255.5 48C149.3 48 64 115.1 64 198.4c0 50.9 32.2 95.7 81.5 122.7l-20.8 77.7c-1.8 6.8 5.4 12.3 11.4 8.5l91.3-61c9.5 1.1 19.2 1.7 29.1 1.7 106.2 0 191.5-67.1 191.5-150.6C448 115.1 361.7 48 255.5 48z"
            fill="#3A1D1D"
          />
        </svg>
        카카오로 로그인
      </button>

      <button
        onClick={() => signIn('google', { callbackUrl: '/feed' })}
        className="flex items-center justify-center gap-3 w-full py-3.5 rounded-xl bg-white hover:bg-gray-50 text-gray-900 font-semibold border border-gray-200 transition-colors"
      >
        <svg width="20" height="20" viewBox="0 0 24 24">
          <path
            d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
            fill="#4285F4"
          />
          <path
            d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
            fill="#34A853"
          />
          <path
            d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l3.66-2.84z"
            fill="#FBBC05"
          />
          <path
            d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"
            fill="#EA4335"
          />
        </svg>
        Google로 로그인
      </button>
    </div>
  );
}
