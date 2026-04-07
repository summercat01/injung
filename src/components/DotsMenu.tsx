'use client';

import { useState, useRef, useEffect } from 'react';

interface DotsMenuProps {
  targetType: 'post' | 'comment';
  targetId: string;
  isLoggedIn: boolean;
  isOwner?: boolean;
  userId?: string;
  onEdit?: () => void;
  onDelete?: () => void;
}

export default function DotsMenu({ targetType, targetId, isLoggedIn, isOwner, userId, onEdit, onDelete }: DotsMenuProps) {
  const [open, setOpen] = useState(false);
  const [reportStatus, setReportStatus] = useState<'idle' | 'done'>('idle');
  const [profileReportStatus, setProfileReportStatus] = useState<'idle' | 'done'>('idle');
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handleClick = (e: MouseEvent) => {
      if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false);
    };
    document.addEventListener('mousedown', handleClick);
    return () => document.removeEventListener('mousedown', handleClick);
  }, []);

  const handleReport = async () => {
    if (!isLoggedIn) {
      window.location.href = '/login';
      return;
    }
    const res = await fetch('/api/reports', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ targetType, targetId }),
    });
    if (res.ok) {
      setReportStatus('done');
    } else {
      const data = await res.json();
      alert(data.error ?? '오류가 발생했어요.');
    }
    setOpen(false);
  };

  const handleProfileReport = async () => {
    if (!isLoggedIn) {
      window.location.href = '/login';
      return;
    }
    const res = await fetch('/api/reports', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ targetType: 'user', targetId: userId }),
    });
    if (res.ok) {
      setProfileReportStatus('done');
    } else {
      const data = await res.json();
      alert(data.error ?? '오류가 발생했어요.');
    }
    setOpen(false);
  };

  const handleDelete = async () => {
    if (!confirm('정말 삭제하시겠습니까?')) return;
    setOpen(false);
    onDelete?.();
  };

  const handleEdit = () => {
    setOpen(false);
    onEdit?.();
  };

  return (
    <div ref={ref} className="relative">
      <button
        onClick={() => setOpen((v) => !v)}
        className="text-xs px-1 py-0.5 rounded hover:opacity-60 transition-opacity"
        style={{ color: 'rgba(88,65,61,0.5)' }}
      >
        •••
      </button>
      {open && (
        <div
          className="absolute right-0 top-full mt-1 rounded-xl shadow-lg z-50 min-w-[100px] py-1"
          style={{ background: 'white', border: '1px solid #ece0d9' }}
        >
          {isOwner ? (
            <>
              <button
                onClick={handleEdit}
                className="w-full text-left px-3 py-1.5 text-xs hover:opacity-70 transition-opacity"
                style={{ color: '#58413d' }}
              >
                수정
              </button>
              <button
                onClick={handleDelete}
                className="w-full text-left px-3 py-1.5 text-xs hover:opacity-70 transition-opacity"
                style={{ color: '#ac3323' }}
              >
                삭제
              </button>
            </>
          ) : (
            <>
              {reportStatus === 'done' ? (
                <div className="px-3 py-1.5 text-xs" style={{ color: 'rgba(88,65,61,0.5)' }}>신고 완료</div>
              ) : (
                <button
                  onClick={handleReport}
                  className="w-full text-left px-3 py-1.5 text-xs hover:opacity-70 transition-opacity"
                  style={{ color: '#ac3323' }}
                >
                  신고
                </button>
              )}
              {userId && (
                profileReportStatus === 'done' ? (
                  <div className="px-3 py-1.5 text-xs" style={{ color: 'rgba(88,65,61,0.5)' }}>프로필 신고 완료</div>
                ) : (
                  <button
                    onClick={handleProfileReport}
                    className="w-full text-left px-3 py-1.5 text-xs hover:opacity-70 transition-opacity"
                    style={{ color: '#ac3323' }}
                  >
                    프로필 신고
                  </button>
                )
              )}
            </>
          )}
        </div>
      )}
    </div>
  );
}
