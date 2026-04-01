import { redirect } from 'next/navigation';
import Link from 'next/link';
import { auth } from '@/auth';
import { getUserStats, getUserPosts } from '@/lib/posts';
import PostCard from '@/components/PostCard';
import SignOutButton from '@/components/SignOutButton';

export const dynamic = 'force-dynamic';

export default async function ProfilePage() {
  const session = await auth();

  if (!session) redirect('/login');
  if (!session.user.nickname) redirect('/onboarding');

  const userId = session.user.id;
  const [stats, posts] = await Promise.all([
    getUserStats(userId),
    getUserPosts(userId),
  ]);

  return (
    <main className="max-w-lg mx-auto px-4 pt-5 pb-28">
      <header className="mb-5 flex items-center justify-between">
        <h1 className="text-xl font-bold" style={{ color: '#201a16' }}>내 프로필</h1>
        <SignOutButton />
      </header>

      {/* Profile card */}
      <div className="rounded-2xl shadow-sm p-5 mb-5" style={{ background: '#fef1ea' }}>
        <div className="flex items-center gap-4 mb-5">
          <div className="w-14 h-14 rounded-full flex items-center justify-center text-3xl" style={{ background: '#fcd8ce' }}>
            {session.user.avatarEmoji ?? '🙂'}
          </div>
          <div>
            <p className="text-lg font-bold" style={{ color: '#201a16' }}>
              {session.user.nickname}
            </p>
            <p className="text-xs" style={{ color: '#58413d' }}>인정협회 회원</p>
          </div>
        </div>

        <div className="rounded-2xl p-6 mb-3 text-center" style={{ background: '#fef1ea' }}>
          <p className="text-7xl font-extrabold leading-none" style={{ color: '#ac3323', fontFamily: 'Plus Jakarta Sans, sans-serif' }}>
            {stats.agreeRate !== null ? `${stats.agreeRate}%` : '-'}
          </p>
          <p className="text-sm font-bold uppercase tracking-widest mt-2" style={{ color: '#58413d', fontFamily: 'Manrope, sans-serif' }}>내 인정률</p>
        </div>
        <div className="grid grid-cols-2 gap-3">
          <div className="rounded-xl p-3 text-center" style={{ background: '#f2e6df' }}>
            <p className="text-xl font-bold" style={{ color: '#201a16' }}>{stats.postCount}</p>
            <p className="text-xs mt-0.5" style={{ color: '#58413d' }}>작성 글</p>
          </div>
          <div className="rounded-xl p-3 text-center" style={{ background: '#f2e6df' }}>
            <p className="text-xl font-bold" style={{ color: '#201a16' }}>{stats.totalVotes}</p>
            <p className="text-xs mt-0.5" style={{ color: '#58413d' }}>받은 투표</p>
          </div>
        </div>

        {stats.totalVotes > 0 && (
          <div className="mt-4">
            <div className="flex justify-between text-xs mb-1" style={{ color: '#58413d' }}>
              <span>인정 {stats.agreeCount}</span>
              <span>노인정 {stats.disagreeCount}</span>
            </div>
            <div className="h-2 rounded-full overflow-hidden flex">
              <div
                className="h-full transition-all"
                style={{ width: `${stats.agreeRate ?? 0}%`, background: '#ff6f59' }}
              />
              <div
                className="h-full flex-1"
                style={{ background: '#fcd8ce' }}
              />
            </div>
          </div>
        )}
      </div>

      {/* My posts */}
      <div className="mb-4 flex items-center justify-between">
        <h2 className="font-semibold" style={{ color: '#201a16' }}>내 주장들</h2>
        <Link
          href="/write"
          className="text-sm font-medium hover:opacity-80"
          style={{ color: '#ac3323' }}
        >
          + 새 주장
        </Link>
      </div>

      {posts.length === 0 ? (
        <div className="text-center py-14" style={{ color: '#58413d' }}>
          <p className="text-4xl mb-3">📭</p>
          <p className="text-sm">아직 올린 주장이 없어요</p>
          <Link
            href="/write"
            className="mt-4 inline-block text-sm text-white px-5 py-2.5 rounded-full font-semibold transition-colors hover:opacity-90"
            style={{ background: '#ac3323' }}
          >
            첫 주장 올리기
          </Link>
        </div>
      ) : (
        <div className="flex flex-col gap-3">
          {posts.map((post) => (
            <PostCard key={post.id} post={post} isLoggedIn={true} />
          ))}
        </div>
      )}
    </main>
  );
}
