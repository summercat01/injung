'use client';

import { useRouter, useSearchParams } from 'next/navigation';

interface PaginationProps {
  currentPage: number;
  totalPages: number;
}

export default function Pagination({ currentPage, totalPages }: PaginationProps) {
  const router = useRouter();
  const searchParams = useSearchParams();

  if (totalPages <= 1) return null;

  const goTo = (page: number) => {
    const params = new URLSearchParams(searchParams.toString());
    params.set('page', String(page));
    router.push(`/feed?${params.toString()}`);
  };

  const pages = Array.from({ length: totalPages }, (_, i) => i + 1);

  return (
    <div className="flex justify-center items-center gap-1 mt-6">
      <button
        onClick={() => goTo(currentPage - 1)}
        disabled={currentPage === 1}
        className="px-3 py-2 rounded-xl text-sm font-medium transition-all disabled:opacity-30"
        style={{ background: '#f2e6df', color: '#58413d' }}
      >
        ←
      </button>

      {pages.map((p) => (
        <button
          key={p}
          onClick={() => goTo(p)}
          className="w-9 h-9 rounded-xl text-sm font-medium transition-all"
          style={
            p === currentPage
              ? { background: '#ac3323', color: 'white' }
              : { background: '#f2e6df', color: '#58413d' }
          }
        >
          {p}
        </button>
      ))}

      <button
        onClick={() => goTo(currentPage + 1)}
        disabled={currentPage === totalPages}
        className="px-3 py-2 rounded-xl text-sm font-medium transition-all disabled:opacity-30"
        style={{ background: '#f2e6df', color: '#58413d' }}
      >
        →
      </button>
    </div>
  );
}
