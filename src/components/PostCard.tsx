'use client';

import { useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import type { PostRow } from '@/lib/posts';
import DotsMenu from './DotsMenu';

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
  currentUserId?: string;
  onDeleted?: () => void;
}

export default function PostCard({ post, isLoggedIn, showLink = true, currentUserId, onDeleted }: PostCardProps) {
  const router = useRouter();
  const [localPost, setLocalPost] = useState(post);
  const [isVoting, setIsVoting] = useState(false);
  const [isDeleted, setIsDeleted] = useState(false);
  const [isEditing, setIsEditing] = useState(false);
  const [editContent, setEditContent] = useState(post.content);
  const [isSaving, setIsSaving] = useState(false);

  const isOwner = !!currentUserId && localPost.user_id === currentUserId;
  const [copied, setCopied] = useState(false);

  const handleShare = async () => {
    const url = `https://injung.semo3.com/post/${localPost.id}`;
    if (navigator.share) {
      await navigator.share({ title: localPost.content, url });
    } else {
      await navigator.clipboard.writeText(url);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    }
  };

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

  const handleDelete = async () => {
    const res = await fetch(`/api/posts/${localPost.id}`, { method: 'DELETE' });
    if (!res.ok) {
      const data = await res.json();
      alert(data.error ?? '오류가 발생했어요.');
      return;
    }
    setIsDeleted(true);
    onDeleted?.();
    if (!showLink) router.push('/feed');
  };

  const handleSaveEdit = async () => {
    const trimmed = editContent.trim();
    if (!trimmed) return;
    setIsSaving(true);
    const res = await fetch(`/api/posts/${localPost.id}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ content: trimmed }),
    });
    setIsSaving(false);
    if (!res.ok) {
      const data = await res.json();
      alert(data.error ?? '오류가 발생했어요.');
      return;
    }
    setLocalPost((prev) => ({ ...prev, content: trimmed }));
    setIsEditing(false);
  };

  if (isDeleted) return null;

  return (
    <article className="rounded-2xl p-5 relative overflow-hidden border" style={{ background: '#fef1ea', borderColor: '#fcd8ce', borderWidth: '2px' }}>
      {Number(localPost.report_count) >= 10 && (
        <div className="absolute inset-0 z-10 flex items-center justify-center rounded-2xl" style={{ background: 'rgba(254,241,234,0.92)', backdropFilter: 'blur(4px)' }}>
          <p className="text-sm font-semibold" style={{ color: 'rgba(88,65,61,0.6)' }}>신고받은 주장입니다.</p>
        </div>
      )}
      {/* Category badge */}
      {localPost.category && (
        <span className="inline-block text-[11px] font-semibold px-2 py-0.5 rounded-full mb-2" style={{ background: 'rgba(172,51,35,0.1)', color: '#ac3323' }}>
          {localPost.category}
        </span>
      )}

      {/* Content */}
      {isEditing ? (
        <div className="mb-3">
          <div className="relative">
            <textarea
              value={editContent}
              onChange={(e) => setEditContent(e.target.value)}
              maxLength={100}
              rows={3}
              className="w-full rounded-xl border-0 p-3 text-sm resize-none focus:outline-none focus:ring-2 focus:ring-primary"
              style={{ background: '#f2e6df', color: '#201a16' }}
            />
            <span className="absolute bottom-3 right-3 text-xs text-gray-400">{100 - editContent.length}</span>
          </div>
          <div className="flex gap-2 mt-2">
            <button
              onClick={handleSaveEdit}
              disabled={isSaving || editContent.trim().length === 0}
              className="px-4 py-1.5 rounded-full text-white text-xs font-semibold disabled:opacity-40"
              style={{ background: '#ac3323' }}
            >
              {isSaving ? '저장 중...' : '저장'}
            </button>
            <button
              onClick={() => { setIsEditing(false); setEditContent(localPost.content); }}
              className="px-4 py-1.5 rounded-full text-xs font-semibold"
              style={{ background: '#ece0d9', color: '#58413d' }}
            >
              취소
            </button>
          </div>
        </div>
      ) : showLink ? (
        <Link href={`/post/${localPost.id}`} className="block mb-2">
          <p className="text-base leading-snug break-words whitespace-pre-wrap" style={{ color: '#201a16' }}>
            {localPost.content}
          </p>
        </Link>
      ) : (
        <p className="text-lg leading-relaxed break-words whitespace-pre-wrap mb-3" style={{ color: '#201a16' }}>
          {localPost.content}
        </p>
      )}

      {/* Author & time */}
      <div className="flex items-center gap-1.5 text-xs mt-2 mb-3" style={{ color: '#58413d' }}>
        <span>{localPost.avatar_emoji}</span>
        <span className="font-medium">{localPost.nickname ?? '익명'}</span>
        <span>·</span>
        <span>{timeAgo(localPost.created_at)}</span>
        <div className="ml-auto">
          <DotsMenu
            targetType="post"
            targetId={localPost.id}
            isLoggedIn={isLoggedIn}
            isOwner={isOwner}
            userId={isOwner ? undefined : localPost.user_id}
            onEdit={() => { setEditContent(localPost.content); setIsEditing(true); }}
            onDelete={handleDelete}
          />
        </div>
      </div>

      {/* Feed: compact vote summary */}
      {showLink && (
        <div className="mt-1 pt-3 border-t" style={{ borderColor: '#f2e6df' }}>
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <span className="flex items-center gap-1 text-sm font-semibold" style={{ color: '#ff6f59' }}>
                <span className="material-symbols-outlined text-[16px]" style={{ fontVariationSettings: "'FILL' 1" }}>thumb_up</span>
                {agreeCount}
              </span>
              <span className="flex items-center gap-1 text-sm font-semibold" style={{ color: '#58413d' }}>
                <span className="material-symbols-outlined text-[16px]" style={{ fontVariationSettings: "'FILL' 1" }}>thumb_down</span>
                {disagreeCount}
              </span>
            </div>
            <div className="flex items-center gap-2">
              {agreeRate !== null ? (
                <span className="text-xs font-bold px-2 py-0.5 rounded-full" style={{ background: 'rgba(172,51,35,0.1)', color: '#ac3323' }}>
                  인정률 {agreeRate}%
                </span>
              ) : (
                <span className="text-xs" style={{ color: 'rgba(88,65,61,0.4)' }}>아직 투표 없음</span>
              )}
              <button onClick={handleShare} className="flex items-center" title="공유">
                <span className="material-symbols-outlined text-[16px]" style={{ color: copied ? '#ac3323' : 'rgba(88,65,61,0.5)' }}>
                  {copied ? 'check' : 'share'}
                </span>
              </button>
            </div>
          </div>
          {agreeRate !== null && (
            <div className="h-1 rounded-full overflow-hidden flex mt-2">
              <div className="h-full" style={{ width: `${agreeRate}%`, background: '#ff6f59' }} />
              <div className="h-full flex-1" style={{ background: '#fcd8ce' }} />
            </div>
          )}
        </div>
      )}

      {/* Detail: vote buttons + rate */}
      {!showLink && (
        <>
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
                <div className="h-full transition-all" style={{ width: `${agreeRate}%`, background: '#ff6f59' }} />
                <div className="h-full flex-1 transition-all" style={{ background: '#fcd8ce' }} />
              </div>
            </div>
          )}
          <button
            onClick={handleShare}
            className="mt-3 flex items-center gap-1.5 text-xs font-semibold px-3 py-1.5 rounded-full"
            style={{ background: 'rgba(172,51,35,0.08)', color: copied ? '#ac3323' : '#58413d' }}
          >
            <span className="material-symbols-outlined text-[14px]">{copied ? 'check' : 'share'}</span>
            {copied ? '링크 복사됨!' : '공유하기'}
          </button>
        </>
      )}
    </article>
  );
}
