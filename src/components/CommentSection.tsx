'use client';

import { useState, useEffect } from 'react';
import DotsMenu from './DotsMenu';

interface Comment {
  id: string;
  user_id: string;
  parent_id: string | null;
  nickname: string;
  avatar_emoji: string;
  content: string;
  created_at: string;
  up_count: number;
  down_count: number;
  my_vote: 'up' | 'down' | null;
  report_count: number;
}

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

interface CommentSectionProps {
  postId: string;
  postUserId: string;
  isLoggedIn: boolean;
  currentUserId?: string;
}

function CommentInput({
  onSubmit,
  placeholder = '댓글을 입력하세요...',
}: {
  onSubmit: (content: string) => Promise<void>;
  placeholder?: string;
}) {
  const [content, setContent] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState('');

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!content.trim() || isSubmitting) return;
    setIsSubmitting(true);
    setError('');
    try {
      await onSubmit(content);
      setContent('');
    } catch (err) {
      setError(err instanceof Error ? err.message : '오류가 발생했어요.');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="flex flex-col gap-2">
      <div className="relative">
        <textarea
          value={content}
          onChange={(e) => setContent(e.target.value)}
          maxLength={50}
          rows={2}
          placeholder={placeholder}
          className="w-full rounded-2xl border-0 p-4 text-sm resize-none focus:outline-none focus:ring-2 focus:ring-primary"
          style={{ background: '#f2e6df', color: '#201a16' }}
        />
        <span className="absolute bottom-3 right-4 text-xs text-gray-400">
          {50 - content.length}
        </span>
      </div>
      {error && <p className="text-xs text-red-500">{error}</p>}
      <button
        type="submit"
        disabled={isSubmitting || content.trim().length === 0}
        className="self-end px-5 py-2.5 rounded-full text-white text-sm font-semibold transition-colors disabled:opacity-40"
        style={{ background: '#ac3323' }}
      >
        {isSubmitting ? '등록 중...' : '등록'}
      </button>
    </form>
  );
}

function VoteButtons({
  comment,
  onVote,
}: {
  comment: Comment;
  onVote: (id: string, type: 'up' | 'down') => void;
}) {
  return (
    <div className="flex items-center gap-2">
      <button
        onClick={() => onVote(comment.id, 'up')}
        className="flex items-center gap-0.5 text-[10px] transition-all"
        style={{ color: comment.my_vote === 'up' ? '#ac3323' : 'rgba(88,65,61,0.45)' }}
      >
        <span className="material-symbols-outlined text-[11px]" style={comment.my_vote === 'up' ? { fontVariationSettings: "'FILL' 1, 'wght' 300, 'opsz' 20" } : { fontVariationSettings: "'wght' 300, 'opsz' 20" }}>thumb_up</span>
        {Number(comment.up_count) > 0 && <span>{comment.up_count}</span>}
      </button>
      <button
        onClick={() => onVote(comment.id, 'down')}
        className="flex items-center gap-0.5 text-[10px] transition-all"
        style={{ color: comment.my_vote === 'down' ? '#58413d' : 'rgba(88,65,61,0.45)' }}
      >
        <span className="material-symbols-outlined text-[11px]" style={comment.my_vote === 'down' ? { fontVariationSettings: "'FILL' 1, 'wght' 300, 'opsz' 20" } : { fontVariationSettings: "'wght' 300, 'opsz' 20" }}>thumb_down</span>
      </button>
    </div>
  );
}

function InlineEdit({
  initialContent,
  maxLength,
  onSave,
  onCancel,
}: {
  initialContent: string;
  maxLength: number;
  onSave: (content: string) => Promise<void>;
  onCancel: () => void;
}) {
  const [content, setContent] = useState(initialContent);
  const [isSaving, setIsSaving] = useState(false);

  const handleSave = async () => {
    if (!content.trim()) return;
    setIsSaving(true);
    await onSave(content.trim());
    setIsSaving(false);
  };

  return (
    <div className="mt-1">
      <div className="relative">
        <textarea
          value={content}
          onChange={(e) => setContent(e.target.value)}
          maxLength={maxLength}
          rows={2}
          className="w-full rounded-xl border-0 p-3 text-sm resize-none focus:outline-none focus:ring-2 focus:ring-primary"
          style={{ background: 'rgba(88,65,61,0.08)', color: '#201a16' }}
        />
        <span className="absolute bottom-2 right-3 text-xs text-gray-400">{maxLength - content.length}</span>
      </div>
      <div className="flex gap-2 mt-1">
        <button
          onClick={handleSave}
          disabled={isSaving || content.trim().length === 0}
          className="px-3 py-1 rounded-full text-white text-xs font-semibold disabled:opacity-40"
          style={{ background: '#ac3323' }}
        >
          {isSaving ? '저장 중...' : '저장'}
        </button>
        <button
          onClick={onCancel}
          className="px-3 py-1 rounded-full text-xs font-semibold"
          style={{ background: '#ece0d9', color: '#58413d' }}
        >
          취소
        </button>
      </div>
    </div>
  );
}

export default function CommentSection({ postId, postUserId, isLoggedIn, currentUserId }: CommentSectionProps) {
  const [comments, setComments] = useState<Comment[]>([]);
  const [replyingTo, setReplyingTo] = useState<string | null>(null);
  const [expandedReplies, setExpandedReplies] = useState<Set<string>>(new Set());
  const [editingId, setEditingId] = useState<string | null>(null);

  const toggleReplies = (commentId: string) => {
    setExpandedReplies((prev) => {
      const next = new Set(prev);
      if (next.has(commentId)) next.delete(commentId);
      else next.add(commentId);
      return next;
    });
  };

  useEffect(() => {
    fetch(`/api/comments?postId=${postId}`)
      .then((r) => r.json())
      .then(setComments)
      .catch(() => {});
  }, [postId]);

  const submitComment = async (content: string, parentId?: string) => {
    const res = await fetch('/api/comments', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ postId, content, parentId }),
    });
    const data = await res.json();
    if (!res.ok) throw new Error(data.error ?? '오류가 발생했어요.');
    setComments((prev) => [...prev, { ...data, up_count: 0, down_count: 0, my_vote: null, report_count: 0 }]);
    setReplyingTo(null);
    if (parentId) {
      setExpandedReplies((prev) => new Set(prev).add(parentId));
    }
  };

  const handleVote = async (commentId: string, type: 'up' | 'down') => {
    if (!isLoggedIn) return;
    const res = await fetch('/api/comment-likes', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ commentId, type }),
    });
    if (!res.ok) return;
    const { action } = await res.json();
    setComments((prev) =>
      prev.map((c) => {
        if (c.id !== commentId) return c;
        const up = Number(c.up_count);
        const down = Number(c.down_count);
        const prev_vote = c.my_vote;
        if (action === 'removed') {
          return { ...c, up_count: type === 'up' ? up - 1 : up, down_count: type === 'down' ? down - 1 : down, my_vote: null };
        } else if (action === 'added') {
          return { ...c, up_count: type === 'up' ? up + 1 : up, down_count: type === 'down' ? down + 1 : down, my_vote: type };
        } else {
          return {
            ...c,
            up_count: type === 'up' ? up + 1 : up - (prev_vote === 'up' ? 1 : 0),
            down_count: type === 'down' ? down + 1 : down - (prev_vote === 'down' ? 1 : 0),
            my_vote: type,
          };
        }
      })
    );
  };

  const handleDeleteComment = async (commentId: string) => {
    if (!confirm('정말 삭제하시겠습니까?')) return;
    const res = await fetch(`/api/comments/${commentId}`, { method: 'DELETE' });
    if (!res.ok) {
      const data = await res.json();
      alert(data.error ?? '오류가 발생했어요.');
      return;
    }
    setComments((prev) => prev.filter((c) => c.id !== commentId));
  };

  const handleSaveEdit = async (commentId: string, content: string) => {
    const res = await fetch(`/api/comments/${commentId}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ content }),
    });
    if (!res.ok) {
      const data = await res.json();
      alert(data.error ?? '오류가 발생했어요.');
      return;
    }
    setComments((prev) => prev.map((c) => c.id === commentId ? { ...c, content } : c));
    setEditingId(null);
  };

  const topLevel = comments.filter((c) => !c.parent_id);
  const replies = (parentId: string) => comments.filter((c) => c.parent_id === parentId);

  const renderComment = (c: Comment, isReply = false) => {
    const isOwner = !!currentUserId && c.user_id === currentUserId;
    return (
      <div key={c.id} className={`rounded-2xl p-4`} style={{ background: isReply ? '#ece0d9' : '#f2e6df' }}>
        <div className="flex items-center gap-1.5 text-xs mb-2 flex-wrap" style={{ color: '#58413d' }}>
          <span>{c.avatar_emoji}</span>
          <span className="font-semibold">{c.nickname}</span>
          {c.user_id === postUserId && (
            <span className="px-1.5 py-0.5 rounded-full text-[10px] font-bold" style={{ background: '#ac3323', color: 'white' }}>글쓴이</span>
          )}
          <span>·</span>
          <span>{timeAgo(c.created_at)}</span>
          <VoteButtons comment={c} onVote={handleVote} />
          <div className="ml-auto flex items-center gap-2">
            {!isReply && isLoggedIn && (
              <button
                onClick={() => setReplyingTo(replyingTo === c.id ? null : c.id)}
                className="text-xs hover:underline"
                style={{ color: '#ac3323' }}
              >
                {replyingTo === c.id ? '접기' : '답글'}
              </button>
            )}
            <DotsMenu
              targetType="comment"
              targetId={c.id}
              isLoggedIn={isLoggedIn}
              isOwner={isOwner}
              userId={isOwner ? undefined : c.user_id}
              onEdit={() => setEditingId(c.id)}
              onDelete={() => handleDeleteComment(c.id)}
            />
          </div>
        </div>
        {editingId === c.id ? (
          <InlineEdit
            initialContent={c.content}
            maxLength={50}
            onSave={(content) => handleSaveEdit(c.id, content)}
            onCancel={() => setEditingId(null)}
          />
        ) : Number(c.report_count) >= 10 ? (
          <p className="text-xs py-1" style={{ color: 'rgba(88,65,61,0.5)' }}>신고받은 댓글입니다.</p>
        ) : (
          <p className="text-sm leading-relaxed break-words whitespace-pre-wrap" style={{ color: '#201a16' }}>
            {c.content}
          </p>
        )}
      </div>
    );
  };

  return (
    <div className="mt-4">
      <h3 className="text-sm font-bold mb-3" style={{ color: '#201a16' }}>
        댓글 {comments.length}
      </h3>

      <div className="flex flex-col gap-3 mb-4">
        {topLevel.map((c) => (
          <div key={c.id}>
            {renderComment(c)}

            {replies(c.id).length > 0 && (
              <div className="ml-4 mt-1">
                <button
                  onClick={() => toggleReplies(c.id)}
                  className="text-xs font-semibold flex items-center gap-1"
                  style={{ color: '#ac3323' }}
                >
                  <span>{expandedReplies.has(c.id) ? '▲' : '▼'}</span>
                  답글 {replies(c.id).length}개
                </button>
                {expandedReplies.has(c.id) && (
                  <div className="mt-2 flex flex-col gap-2">
                    {replies(c.id).map((r) => renderComment(r, true))}
                  </div>
                )}
              </div>
            )}

            {replyingTo === c.id && (
              <div className="ml-4 mt-2">
                <CommentInput
                  onSubmit={(content) => submitComment(content, c.id)}
                  placeholder={`@${c.nickname}에게 답글...`}
                />
              </div>
            )}
          </div>
        ))}
      </div>

      {isLoggedIn ? (
        <CommentInput onSubmit={(content) => submitComment(content)} />
      ) : (
        <p className="text-sm text-center py-3 rounded-2xl" style={{ background: '#f2e6df', color: 'rgba(88,65,61,0.6)' }}>
          댓글을 달려면 <a href="/login" className="font-semibold underline" style={{ color: '#ac3323' }}>로그인</a>해주세요
        </p>
      )}
    </div>
  );
}
