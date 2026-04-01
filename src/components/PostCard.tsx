'use client';

import { useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import type { PostRow } from '@/lib/posts';

function timeAgo(dateStr: string): string {
  const diff = Date.now() - new Date(dateStr).getTime();
  const minutes = Math.floor(diff / 60000);
  if (minutes < 1) return '방금 전';
  if (minutes < 60) return `${minutes}분 전`;
  const hours = Math.floor(minutes / 60);
  if (hours < 24) return `${hours}시간 전`;
  const days = Math.floor(hours / 24);
  if (days < 7) return `${days}일 전`;
  return new Date(dateStr).toLocaleDateString('ko-KR');
}

interface PostCardProps {
  post: PostRow;
  isLoggedIn: boolean;
  showLink?: boolean;
}

export default function PostCard({ post, isLoggedIn, showLink = true }: PostCardProps) {
  const router = useRouter();
  const [localPost, setLocalPost] = useState(post);
  const [isVoting, setIsVoting] = useState(false);

  const agreeCount = Number(localPost.agree_count);
  const disagreeCount = Number(localPost.disagree_count);
  const totalVotes = agreeCount + disagreeCount;
  const agreeRate =
    totalVotes > 0 ? Math.round((agreeCount / totalVotes) * 1000) / 10 : null;

  const handleVote = async (voteType: '인정' | '노인정') => {
    if (!isLoggedIn) {
      router.push('/login');
      return;
    }
    if (isVoting) return;
    setIsVoting(true);

    try {
      const res = await fetch('/api/votes', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ postId: localPost.id, voteType }),
      });

      if (res.status === 403) {
        router.push('/onboarding');
        return;
      }

      if (!res.ok) return;

      const { action } = await res.json();

      setLocalPost((prev) => {
        const prevAgree = Number(prev.agree_count);
        const prevDisagree = Number(prev.disagree_count);
        const prevMyVote = prev.my_vote;

        let newAgree = prevAgree;
        let newDisagree = prevDisagree;
        let newMyVote: '인정' | '노인정' | null = voteType;

        if (action === 'removed') {
          newMyVote = null;
          if (voteType === '인정') newAgree = prevAgree - 1;
          else newDisagree = prevDisagree - 1;
        } else if (action === 'updated') {
          if (voteType === '인정') {
            newAgree = prevAgree + 1;
            newDisagree = prevDisagree - 1;
          } else {
            newAgree = prevAgree - 1;
            newDisagree = prevDisagree + 1;
          }
        } else if (action === 'added') {
          if (voteType === '인정') newAgree = prevAgree + 1;
          else newDisagree = prevDisagree + 1;
        }

        void prevMyVote;

        return {
          ...prev,
          agree_count: newAgree,
          disagree_count: newDisagree,
          total_votes: newAgree + newDisagree,
          my_vote: newMyVote,
        };
      });
    } finally {
      setIsVoting(false);
    }
  };

  const contentEl = showLink ? (
    <Link href={`/post/${localPost.id}`} className="block">
      <p className="text-lg leading-relaxed mb-3 break-words" style={{ color: '#201a16' }}>
        {localPost.content}
      </p>
    </Link>
  ) : (
    <p className="text-lg leading-relaxed mb-3 break-words" style={{ color: '#201a16' }}>
      {localPost.content}
    </p>
  );

  return (
    <article className="rounded-2xl p-6 relative overflow-hidden" style={{ background: '#fef1ea' }}>
      {contentEl}

      <div className="flex items-center gap-1.5 text-xs mb-4" style={{ color: '#58413d' }}>
        <span>{localPost.avatar_emoji}</span>
        <span className="font-medium">
          {localPost.nickname ?? '익명'}
        </span>
        <span>·</span>
        <span>{timeAgo(localPost.created_at)}</span>
      </div>

      <div className="flex gap-3">
        <button
          onClick={() => handleVote('인정')}
          disabled={isVoting}
          className="flex-1 flex flex-col items-center justify-center py-4 rounded-xl font-semibold text-sm transition-all active:scale-95"
          style={
            localPost.my_vote === '인정'
              ? { background: '#ff6f59', color: 'white' }
              : { background: '#ece0d9', color: '#58413d' }
          }
        >
          <span className="material-symbols-outlined text-[20px] mb-1"
            style={localPost.my_vote === '인정' ? { fontVariationSettings: "'FILL' 1, 'wght' 400, 'GRAD' 0, 'opsz' 24" } : {}}
          >
            thumb_up
          </span>
          <span>인정 {agreeCount}</span>
        </button>

        <button
          onClick={() => handleVote('노인정')}
          disabled={isVoting}
          className="flex-1 flex flex-col items-center justify-center py-4 rounded-xl font-semibold text-sm transition-all active:scale-95"
          style={
            localPost.my_vote === '노인정'
              ? { background: '#ac3323', color: 'white' }
              : { background: '#ece0d9', color: '#58413d' }
          }
        >
          <span className="material-symbols-outlined text-[20px] mb-1"
            style={localPost.my_vote === '노인정' ? { fontVariationSettings: "'FILL' 1, 'wght' 400, 'GRAD' 0, 'opsz' 24" } : {}}
          >
            thumb_down
          </span>
          <span>노인정 {disagreeCount}</span>
        </button>
      </div>

      {agreeRate !== null && (
        <div className="mt-3">
          <div className="flex justify-between text-xs mb-1" style={{ color: '#58413d' }}>
            <span>인정률 {agreeRate}%</span>
            <span>{totalVotes}표</span>
          </div>
          <div className="h-1.5 rounded-full overflow-hidden flex">
            <div
              className="h-full transition-all"
              style={{ width: `${agreeRate}%`, background: '#ff6f59' }}
            />
            <div
              className="h-full flex-1 transition-all"
              style={{ background: '#fcd8ce' }}
            />
          </div>
        </div>
      )}
    </article>
  );
}
