'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';

const navItems = [
  { href: '/', label: '홈', icon: 'home' },
  { href: '/feed', label: '게시판', icon: 'reorder' },
  { href: '/write', label: '글쓰기', icon: 'edit_document' },
  { href: '/profile', label: '프로필', icon: 'person' },
];

export default function BottomNav() {
  const pathname = usePathname();

  return (
    <nav className="fixed bottom-0 left-0 right-0 z-50 flex justify-around items-center px-4 pb-6 pt-3 bg-[#fff8f5]/90 backdrop-blur-xl rounded-t-[2rem] shadow-[0_-4px_24px_rgba(32,26,22,0.06)] safe-area-pb">
      {navItems.map((item) => {
        const isActive = pathname === item.href;
        return (
          <Link
            key={item.href}
            href={item.href}
            className={`flex flex-col items-center justify-center transition-all duration-300 ${
              isActive
                ? 'bg-[#ff6f59]/20 text-[#ac3323] rounded-full px-5 py-2'
                : 'text-[#50453e] opacity-70 hover:opacity-100'
            }`}
          >
            <span
              className="material-symbols-outlined text-[22px] mb-0.5"
              style={isActive ? { fontVariationSettings: "'FILL' 1, 'wght' 400, 'GRAD' 0, 'opsz' 24" } : {}}
            >
              {item.icon}
            </span>
            <span className="text-[11px] font-bold uppercase tracking-widest" style={{ fontFamily: 'Manrope, sans-serif' }}>
              {item.label}
            </span>
          </Link>
        );
      })}
    </nav>
  );
}
