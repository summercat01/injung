'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { CATEGORIES } from '@/lib/categories';

const MAX_CHARS = 100;

const PLACEHOLDERS: Record<string, string> = {
  자유: '예: 화장실 갈 때 불 켜고 나오는 사람이 더 이상하다 인정?',
  게임: '예: 롤에서 정글이 제일 영향력 없는 포지션임 인정?',
  투자: '예: 지금 코인 사는 건 도박이 아니라 투자다 인정?',
  소비: '예: 배달비 4천원은 아깝지 않다 인정?',
  연애: '예: 연락 자주 안 하는 게 더 매력 있어 보인다 인정?',
  일상: '예: 이불 안 개도 청결함이랑 관계없음 인정?',
  운동: '예: 헬스보다 집에서 맨몸운동이 효과 더 좋다 인정?',
  음식: '예: 짜파게티에 계란 넣는 건 사치가 아니라 기본임 인정?',
  학교: '예: 급식 잔반 억지로 먹이는 건 진짜 아님 인정?',
  직장: '예: 야근 자주 하는 사람이 일 못하는 거다 인정?',
  기타: '예: 무언가 인정받고 싶은 주장을 올려보세요 인정?',
};

export default function WriteForm() {
  const router = useRouter();
  const [content, setContent] = useState('');
  const [category, setCategory] = useState<string>('자유');
  const [error, setError] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  const remaining = MAX_CHARS - content.length;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');

    if (content.trim().length === 0) {
      setError('내용을 입력해주세요.');
      return;
    }

    setIsSubmitting(true);
    try {
      const res = await fetch('/api/posts', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ content, category }),
      });

      const data = await res.json();

      if (!res.ok) {
        setError(data.error ?? '오류가 발생했어요. 다시 시도해주세요.');
        return;
      }

      router.push(`/post/${data.id}`);
      router.refresh();
    } catch {
      setError('네트워크 오류가 발생했어요.');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="flex flex-col gap-4">
      {/* Category selector */}
      <div>
        <p className="text-sm font-medium mb-2" style={{ color: '#58413d' }}>카테고리</p>
        <div className="flex flex-wrap gap-2">
          {CATEGORIES.map((cat) => (
            <button
              key={cat}
              type="button"
              onClick={() => setCategory(cat)}
              className="px-3 py-1.5 rounded-full text-sm font-medium transition-all"
              style={
                category === cat
                  ? { background: '#ac3323', color: 'white' }
                  : { background: '#f2e6df', color: '#58413d' }
              }
            >
              {cat}
            </button>
          ))}
        </div>
      </div>

      <div className="relative">
        <textarea
          value={content}
          onChange={(e) => setContent(e.target.value)}
          maxLength={MAX_CHARS}
          rows={6}
          placeholder={PLACEHOLDERS[category] ?? PLACEHOLDERS['자유']}
          className="w-full rounded-2xl border-0 p-4 text-base resize-none focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent"
          style={{ background: '#f2e6df', color: '#201a16' }}
        />
        <span className={`absolute bottom-3 right-4 text-xs ${remaining < 30 ? 'text-red-400' : 'text-gray-400'}`}>
          {remaining}
        </span>
      </div>

      {error && (
        <p className="text-sm text-red-500 bg-red-50 rounded-xl px-4 py-3">
          {error}
        </p>
      )}

      <button
        type="submit"
        disabled={isSubmitting || content.trim().length === 0}
        className="w-full py-5 rounded-full text-white font-bold text-base transition-colors disabled:opacity-40"
        style={{ background: '#ac3323', fontFamily: 'Plus Jakarta Sans, sans-serif' }}
      >
        {isSubmitting ? '올리는 중...' : '주장 올리기'}
      </button>
    </form>
  );
}
