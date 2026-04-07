import { Suspense } from 'react';
import { auth } from '@/auth';
import { getPosts, getPostsCount, PAGE_SIZE, type SortMode } from '@/lib/posts';
import { CATEGORIES } from '@/lib/categories';
import PostCard from '@/components/PostCard';
import FeedTabs from '@/components/FeedTabs';
import CategoryFilter from '@/components/CategoryFilter';
import Pagination from '@/components/Pagination';

export const dynamic = 'force-dynamic';

const VALID_SORTS: SortMode[] = ['최신순', '인기순', '인정률높은순', '치열한순'];

interface FeedPageProps {
  searchParams: Promise<{ sort?: string; category?: string; page?: string }>;
}

export default async function FeedPage({ searchParams }: FeedPageProps) {
  const params = await searchParams;
  const sort: SortMode = VALID_SORTS.includes(params.sort as SortMode)
    ? (params.sort as SortMode)
    : '최신순';

  const category = CATEGORIES.includes(params.category as (typeof CATEGORIES)[number])
    ? params.category
    : undefined;

  const page = Math.max(1, parseInt(params.page ?? '1') || 1);

  const session = await auth();
  const userId = session?.user?.id;

  const [posts, totalCount] = await Promise.all([
    getPosts(sort, userId, category, page),
    getPostsCount(sort, category),
  ]);

  const totalPages = Math.ceil(totalCount / PAGE_SIZE);

  return (
    <main className="max-w-lg mx-auto px-4 pt-5 pb-28">
      <header className="mb-8">
        <div className="rounded-2xl px-5 py-5 text-center" style={{ background: '#ac3323' }}>
          <h1 className="text-2xl font-extrabold" style={{ fontFamily: 'Plus Jakarta Sans, sans-serif', color: 'white' }}>
            인정 게시판
          </h1>

        </div>
      </header>

      <div className="mb-3">
        <Suspense fallback={null}>
          <CategoryFilter current={category} />
        </Suspense>
      </div>

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
              currentUserId={userId}
            />
          ))}
        </div>
      )}

      <Suspense fallback={null}>
        <Pagination currentPage={page} totalPages={totalPages} />
      </Suspense>
    </main>
  );
}
