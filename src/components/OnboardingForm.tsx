'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { EMOJI_OPTIONS } from '@/lib/emojis';

export default function OnboardingForm() {
  const router = useRouter();
  const [nickname, setNickname] = useState('');
  const [selectedEmoji, setSelectedEmoji] = useState('🙂');
  const [error, setError] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');

    const trimmed = nickname.trim();
    if (trimmed.length < 2 || trimmed.length > 15) {
      setError('닉네임은 2~15자 사이여야 합니다.');
      return;
    }

    setIsSubmitting(true);
    try {
      const res = await fetch('/api/profile', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ nickname: trimmed, avatarEmoji: selectedEmoji }),
      });

      const data = await res.json();

      if (!res.ok) {
        setError(data.error ?? '오류가 발생했어요.');
        return;
      }

      window.location.href = '/feed';
    } catch {
      setError('네트워크 오류가 발생했어요.');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="flex flex-col gap-5">
      {/* Emoji picker */}
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-2">
          프로필 이모지
        </label>
        <div className="grid grid-cols-5 sm:grid-cols-8 gap-2">
          {EMOJI_OPTIONS.map((emoji) => (
            <button
              key={emoji}
              type="button"
              onClick={() => setSelectedEmoji(emoji)}
              className={`text-2xl p-1.5 rounded-xl transition-all ${
                selectedEmoji === emoji
                  ? 'bg-coral-light ring-2 ring-coral scale-110'
                  : 'hover:bg-cream'
              }`}
            >
              {emoji}
            </button>
          ))}
        </div>
      </div>

      {/* Nickname input */}
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-2">
          닉네임 <span className="text-gray-400 font-normal">(2~15자)</span>
        </label>
        <input
          type="text"
          value={nickname}
          onChange={(e) => setNickname(e.target.value)}
          maxLength={15}
          placeholder="인정맨, 노인정왕, ..."
          className="w-full rounded-xl border border-cream bg-white px-4 py-3 text-base text-brown focus:outline-none focus:ring-2 focus:ring-coral focus:border-transparent placeholder-brown/30"
        />
      </div>

      {error && (
        <p className="text-sm text-red-500 bg-red-50 rounded-xl px-4 py-3">
          {error}
        </p>
      )}

      {/* Preview */}
      {nickname.trim() && (
        <div className="bg-gray-50 rounded-xl p-3 flex items-center gap-2 text-sm text-gray-600">
          <span className="text-xl">{selectedEmoji}</span>
          <span className="font-semibold">{nickname.trim()}</span>
          <span className="text-gray-400">로 활동할게요</span>
        </div>
      )}

      <button
        type="submit"
        disabled={isSubmitting || nickname.trim().length < 2}
        className="w-full py-3.5 rounded-xl bg-coral hover:bg-coral/90 disabled:bg-cream disabled:text-brown/30 text-white font-semibold text-base transition-colors"
      >
        {isSubmitting ? '저장 중...' : '시작하기'}
      </button>
    </form>
  );
}
