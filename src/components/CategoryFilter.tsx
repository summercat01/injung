'use client';

import { useRouter, useSearchParams } from 'next/navigation';
import { CATEGORIES } from '@/lib/categories';

interface CategoryFilterProps {
  current?: string;
}

export default function CategoryFilter({ current }: CategoryFilterProps) {
  const router = useRouter();
  const searchParams = useSearchParams();

  const handleCategory = (cat: string | null) => {
    const params = new URLSearchParams(searchParams.toString());
    if (cat) params.set('category', cat);
    else params.delete('category');
    router.push(`/feed?${params.toString()}`);
  };

  const all = [{ label: '전체', value: null }, ...CATEGORIES.map((c) => ({ label: c, value: c }))];

  return (
    <div className="rounded-2xl p-4 border" style={{ background: 'white', borderColor: '#fcd8ce' }}>
      <p className="text-xs font-semibold mb-3" style={{ color: '#58413d' }}>카테고리</p>
      <div className="flex flex-wrap gap-2">
        {all.map(({ label, value }) => {
          const isActive = value === null ? !current : current === value;
          return (
            <button
              key={label}
              onClick={() => handleCategory(value)}
              className="shrink-0 px-3 py-1.5 rounded-full text-sm font-medium transition-all"
              style={
                isActive
                  ? { background: '#ac3323', color: 'white' }
                  : { background: 'rgba(85,61,54,0.08)', color: '#58413d' }
              }
            >
              {label}
            </button>
          );
        })}
      </div>
    </div>
  );
}
