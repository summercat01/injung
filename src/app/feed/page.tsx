import { Suspense } from 'react';
import { auth } from '@/auth';
import { getPosts, type SortMode } from '@/lib/posts';
import PostCard from '@/components/PostCard';
import FeedTabs from '@/components/FeedTabs';

export const dynamic = 'force-dynamic';

const VALID_SORTS: SortMode[] = ['최신순', '인기순', '인정률높은순', '치열한순'];

interface FeedPageProps {
  searchParams: Promise<{ sort?: string }>;
}

export default async function FeedPage({ searchParams }: FeedPageProps) {
  const params = await searchParams;
  const sort: SortMode = VALID_SORTS.includes(params.sort as SortMode)
    ? (params.sort as SortMode)
    : '최신순';

  const session = await auth();
  const userId = session?.user?.id;

  const posts = await getPosts(sort, userId);

  return (
    <main className="max-w-lg mx-auto px-4 pt-5 pb-28">
      <header className="mb-8 text-center space-y-2">
        <span className="inline-block font-bold text-[10px] uppercase tracking-widest px-4 py-1 rounded-full" style={{ background: 'rgba(255,111,89,0.15)', color: '#ac3323', fontFamily: 'Manrope, sans-serif' }}>
          🏅 인정협회 공식 심의
        </span>
        <h2 className="text-3xl font-extrabold leading-tight" style={{ fontFamily: 'Plus Jakarta Sans, sans-serif', color: '#201a16' }}>
          이거 인정돼?
        </h2>
        <p className="text-sm" style={{ color: '#58413d' }}>읽고 판단해. 인정이면 인정, 아니면 노인정.</p>
      </header>

      <div className="mb-4">
        <Suspense fallback={null}>
          <FeedTabs current={sort} />
        </Suspense>
      </div>

      {posts.length === 0 ? (
        <div className="text-center py-16" style={{ color: 'rgba(85,61,54,0.4)' }}>
          <p className="text-4xl mb-3">🫙</p>
          <p className="text-sm">
            {sort === '치열한순'
              ? '아직 치열한 대결이 없어요.'
              : '아직 게시물이 없어요. 첫 주장을 올려보세요!'}
          </p>
        </div>
      ) : (
        <div className="flex flex-col gap-3">
          {posts.map((post) => (
            <PostCard
              key={post.id}
              post={post}
              isLoggedIn={!!session}
            />
          ))}
        </div>
      )}
    </main>
  );
}
