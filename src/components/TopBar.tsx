'use client';

import Link from 'next/link';

export default function TopBar() {
  return (
    <header className="fixed top-0 w-full z-50 bg-[#fff8f5]/80 backdrop-blur-md border-b border-[#ece0d9]">
      <div className="flex justify-between items-center px-6 py-4 max-w-2xl mx-auto">
        <Link href="/" className="flex items-center gap-2">
          <span className="material-symbols-outlined text-[#ac3323] text-xl">verified_user</span>
          <span className="font-bold text-base tracking-tight text-[#ac3323] uppercase" style={{ fontFamily: 'Plus Jakarta Sans, sans-serif' }}>
            인정협회
          </span>
        </Link>
      </div>
    </header>
  );
}
