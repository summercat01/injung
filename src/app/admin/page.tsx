'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';

interface ReportedPost {
  id: string;
  content: string;
  nickname: string;
  created_at: string;
  report_count: string;
}

interface ReportedUser {
  id: string;
  nickname: string;
  avatar_emoji: string;
  report_count: string;
}

interface ReportedComment {
  id: string;
  content: string;
  nickname: string;
  post_id: string;
  created_at: string;
  report_count: string;
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

async function adminAction(action: string, targetId: string) {
  const res = await fetch('/api/admin/action', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ action, targetId }),
  });
  return res.ok;
}

function UserItem({ user }: { user: ReportedUser }) {
  const [loading, setLoading] = useState(false);
  const [banned, setBanned] = useState(false);

  const handleBan = async () => {
    if (!confirm('정말 벤하시겠습니까?')) return;
    setLoading(true);
    const res = await fetch('/api/admin/action', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ action: 'ban_user', targetId: user.id }),
    });
    setLoading(false);
    if (res.ok) setBanned(true);
    else alert('오류가 발생했어요.');
  };

  return (
    <div className="rounded-2xl p-4 flex items-center justify-between" style={{ background: '#f2e6df' }}>
      <div className="flex items-center gap-2 text-sm" style={{ color: '#201a16' }}>
        <span>{user.avatar_emoji}</span>
        <span className="font-semibold">{user.nickname}</span>
        {banned && <span className="px-1.5 py-0.5 rounded-full text-[10px] font-bold" style={{ background: '#58413d', color: 'white' }}>벤됨</span>}
      </div>
      <div className="flex items-center gap-2">
        <span
          className="text-xs font-bold px-2 py-0.5 rounded-full"
          style={{
            background: Number(user.report_count) >= 5 ? '#ac3323' : 'rgba(172,51,35,0.1)',
            color: Number(user.report_count) >= 5 ? 'white' : '#ac3323',
          }}
        >
          신고 {user.report_count}
        </span>
        <button
          onClick={handleBan}
          disabled={loading || banned}
          className="text-xs px-3 py-1 rounded-full font-semibold disabled:opacity-40"
          style={{ background: '#58413d', color: 'white' }}
        >
          {loading ? '처리중...' : banned ? '벤 완료' : '벤'}
        </button>
      </div>
    </div>
  );
}

function PostItem({ post, onRemove }: { post: ReportedPost; onRemove: (id: string) => void }) {
  const [loading, setLoading] = useState<string | null>(null);
  const [banned, setBanned] = useState(false);

  const handle = async (action: string) => {
    if (!confirm('정말 처리하시겠습니까?')) return;
    setLoading(action);
    const ok = await adminAction(action, post.id);
    setLoading(null);
    if (!ok) return alert('오류가 발생했어요.');
    if (action === 'delete_post') onRemove(post.id);
    if (action === 'ban_user_by_post') setBanned(true);
  };

  return (
    <div className="rounded-2xl p-4" style={{ background: '#f2e6df' }}>
      <div className="flex items-center justify-between mb-2">
        <div className="flex items-center gap-1.5 text-xs" style={{ color: '#58413d' }}>
          <span className="font-semibold">{post.nickname}</span>
          {banned && <span className="px-1.5 py-0.5 rounded-full text-[10px] font-bold" style={{ background: '#58413d', color: 'white' }}>벤됨</span>}
          <span>·</span>
          <span>{timeAgo(post.created_at)}</span>
        </div>
        <span
          className="text-xs font-bold px-2 py-0.5 rounded-full"
          style={{
            background: Number(post.report_count) >= 10 ? '#ac3323' : 'rgba(172,51,35,0.1)',
            color: Number(post.report_count) >= 10 ? 'white' : '#ac3323',
          }}
        >
          신고 {post.report_count}
        </span>
      </div>
      <p className="text-sm break-words whitespace-pre-wrap mb-3" style={{ color: '#201a16' }}>
        {post.content}
      </p>
      <div className="flex items-center gap-2 flex-wrap">
        <Link
          href={`/post/${post.id}`}
          className="text-xs hover:underline"
          style={{ color: '#ac3323' }}
        >
          글 보기 →
        </Link>
        <button
          onClick={() => handle('delete_post')}
          disabled={!!loading}
          className="text-xs px-3 py-1 rounded-full font-semibold transition-opacity disabled:opacity-40"
          style={{ background: '#ac3323', color: 'white' }}
        >
          {loading === 'delete_post' ? '처리중...' : '글 삭제'}
        </button>
        <button
          onClick={() => handle('ban_user_by_post')}
          disabled={!!loading || banned}
          className="text-xs px-3 py-1 rounded-full font-semibold transition-opacity disabled:opacity-40"
          style={{ background: '#58413d', color: 'white' }}
        >
          {loading === 'ban_user_by_post' ? '처리중...' : banned ? '벤 완료' : '유저 벤'}
        </button>
      </div>
    </div>
  );
}

function CommentItem({ comment, onRemove }: { comment: ReportedComment; onRemove: (id: string) => void }) {
  const [loading, setLoading] = useState<string | null>(null);
  const [banned, setBanned] = useState(false);

  const handle = async (action: string) => {
    if (!confirm('정말 처리하시겠습니까?')) return;
    setLoading(action);
    const ok = await adminAction(action, comment.id);
    setLoading(null);
    if (!ok) return alert('오류가 발생했어요.');
    if (action === 'delete_comment') onRemove(comment.id);
    if (action === 'ban_user_by_comment') setBanned(true);
  };

  return (
    <div className="rounded-2xl p-4" style={{ background: '#f2e6df' }}>
      <div className="flex items-center justify-between mb-2">
        <div className="flex items-center gap-1.5 text-xs" style={{ color: '#58413d' }}>
          <span className="font-semibold">{comment.nickname}</span>
          {banned && <span className="px-1.5 py-0.5 rounded-full text-[10px] font-bold" style={{ background: '#58413d', color: 'white' }}>벤됨</span>}
          <span>·</span>
          <span>{timeAgo(comment.created_at)}</span>
        </div>
        <span
          className="text-xs font-bold px-2 py-0.5 rounded-full"
          style={{
            background: Number(comment.report_count) >= 10 ? '#ac3323' : 'rgba(172,51,35,0.1)',
            color: Number(comment.report_count) >= 10 ? 'white' : '#ac3323',
          }}
        >
          신고 {comment.report_count}
        </span>
      </div>
      <p className="text-sm break-words whitespace-pre-wrap mb-3" style={{ color: '#201a16' }}>
        {comment.content}
      </p>
      <div className="flex items-center gap-2 flex-wrap">
        <Link
          href={`/post/${comment.post_id}`}
          className="text-xs hover:underline"
          style={{ color: '#ac3323' }}
        >
          원글 보기 →
        </Link>
        <button
          onClick={() => handle('delete_comment')}
          disabled={!!loading}
          className="text-xs px-3 py-1 rounded-full font-semibold transition-opacity disabled:opacity-40"
          style={{ background: '#ac3323', color: 'white' }}
        >
          {loading === 'delete_comment' ? '처리중...' : '댓글 삭제'}
        </button>
        <button
          onClick={() => handle('ban_user_by_comment')}
          disabled={!!loading || banned}
          className="text-xs px-3 py-1 rounded-full font-semibold transition-opacity disabled:opacity-40"
          style={{ background: '#58413d', color: 'white' }}
        >
          {loading === 'ban_user_by_comment' ? '처리중...' : banned ? '벤 완료' : '유저 벤'}
        </button>
      </div>
    </div>
  );
}

export default function AdminPage() {
  const [posts, setPosts] = useState<ReportedPost[]>([]);
  const [comments, setComments] = useState<ReportedComment[]>([]);
  const [users, setUsers] = useState<ReportedUser[]>([]);
  const [status, setStatus] = useState<'loading' | 'forbidden' | 'ok'>('loading');

  useEffect(() => {
    fetch('/api/admin/reports')
      .then((r) => {
        if (r.status === 403 || r.status === 401) {
          setStatus('forbidden');
          return null;
        }
        return r.json();
      })
      .then((data) => {
        if (!data) return;
        setPosts(data.posts);
        setComments(data.comments);
        setUsers(data.users);
        setStatus('ok');
      })
      .catch(() => setStatus('forbidden'));
  }, []);

  if (status === 'loading') {
    return (
      <div className="min-h-screen flex items-center justify-center" style={{ background: '#fff8f4' }}>
        <p className="text-sm" style={{ color: '#58413d' }}>불러오는 중...</p>
      </div>
    );
  }

  if (status === 'forbidden') {
    return (
      <div className="min-h-screen flex items-center justify-center" style={{ background: '#fff8f4' }}>
        <p className="text-sm font-semibold" style={{ color: '#ac3323' }}>접근 권한이 없습니다.</p>
      </div>
    );
  }

  return (
    <div className="min-h-screen px-4 py-8 max-w-2xl mx-auto" style={{ background: '#fff8f4' }}>
      <h1 className="text-xl font-bold mb-6" style={{ color: '#201a16' }}>관리자 — 신고 목록</h1>

      <section className="mb-8">
        <h2 className="text-sm font-bold mb-3" style={{ color: '#58413d' }}>
          신고된 주장 ({posts.length})
        </h2>
        {posts.length === 0 ? (
          <p className="text-xs" style={{ color: 'rgba(88,65,61,0.5)' }}>신고된 주장이 없습니다.</p>
        ) : (
          <div className="flex flex-col gap-3">
            {posts.map((p) => (
              <PostItem
                key={p.id}
                post={p}
                onRemove={(id) => setPosts((prev) => prev.filter((x) => x.id !== id))}
              />
            ))}
          </div>
        )}
      </section>

      <section className="mb-8">
        <h2 className="text-sm font-bold mb-3" style={{ color: '#58413d' }}>
          신고된 유저 ({users.length})
        </h2>
        {users.length === 0 ? (
          <p className="text-xs" style={{ color: 'rgba(88,65,61,0.5)' }}>신고된 유저가 없습니다.</p>
        ) : (
          <div className="flex flex-col gap-3">
            {users.map((u) => (
              <UserItem key={u.id} user={u} />
            ))}
          </div>
        )}
      </section>

      <section>
        <h2 className="text-sm font-bold mb-3" style={{ color: '#58413d' }}>
          신고된 댓글 ({comments.length})
        </h2>
        {comments.length === 0 ? (
          <p className="text-xs" style={{ color: 'rgba(88,65,61,0.5)' }}>신고된 댓글이 없습니다.</p>
        ) : (
          <div className="flex flex-col gap-3">
            {comments.map((c) => (
              <CommentItem
                key={c.id}
                comment={c}
                onRemove={(id) => setComments((prev) => prev.filter((x) => x.id !== id))}
              />
            ))}
          </div>
        )}
      </section>
    </div>
  );
}
