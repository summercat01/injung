'use client';

import { useRouter, useSearchParams } from 'next/navigation';

const TABS = ['최신순', '인기순', '인정률높은순', '치열한순'] as const;
type Tab = (typeof TABS)[number];

interface FeedTabsProps {
  current: Tab;
}

export default function FeedTabs({ current }: FeedTabsProps) {
  const router = useRouter();
  const searchParams = useSearchParams();

  const handleTab = (tab: Tab) => {
    const params = new URLSearchParams(searchParams.toString());
    params.set('sort', tab);
    router.push(`/feed?${params.toString()}`);
  };

  return (
    <div className="rounded-2xl p-4" style={{ background: '#fef1ea' }}>
      <p className="text-xs font-semibold mb-3" style={{ color: '#58413d' }}>필터</p>
      <div className="flex gap-1 rounded-xl p-1" style={{ backgroundColor: 'rgba(85,61,54,0.08)' }}>
        {TABS.map((tab) => (
          <button
            key={tab}
            onClick={() => handleTab(tab)}
            className={`flex-1 py-1.5 text-xs font-medium rounded-lg transition-all ${
              current === tab
                ? 'bg-white text-brown shadow-sm'
                : 'text-brown/50 hover:text-brown/80'
            }`}
          >
            {tab}
          </button>
        ))}
      </div>
    </div>
  );
}
