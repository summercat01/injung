'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';

const MAX_CHARS = 300;

export default function WriteForm() {
  const router = useRouter();
  const [content, setContent] = useState('');
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
        body: JSON.stringify({ content }),
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
      <div className="relative">
        <textarea
          value={content}
          onChange={(e) => setContent(e.target.value)}
          maxLength={MAX_CHARS}
          rows={6}
          placeholder="예: 화장실 갈 때 불 켜고 나오는 사람이 더 이상하다"
          className="w-full rounded-2xl border-0 p-4 text-base resize-none focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent"
          style={{ background: '#f2e6df', color: '#201a16' }}
        />
        <span
          className={`absolute bottom-3 right-4 text-xs ${
            remaining < 30 ? 'text-red-400' : 'text-gray-400'
          }`}
        >
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
