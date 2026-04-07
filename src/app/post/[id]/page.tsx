import { notFound } from 'next/navigation';
import Link from 'next/link';
import { auth } from '@/auth';
import { getPostById } from '@/lib/posts';
import PostCard from '@/components/PostCard';
import CommentSection from '@/components/CommentSection';

export const dynamic = 'force-dynamic';

interface PostPageProps {
  params: Promise<{ id: string }>;
}

export default async function PostPage({ params }: PostPageProps) {
  const { id } = await params;
  const session = await auth();
  const userId = session?.user?.id;

  const post = await getPostById(id, userId);

  if (!post) notFound();

  return (
    <main className="max-w-lg mx-auto px-4 pt-5 pb-28">
      <div className="mb-4">
        <Link
          href="/feed"
          className="inline-flex items-center gap-1.5 text-sm text-brown/50 hover:text-brown/80"
        >
          ← 피드로 돌아가기
        </Link>
      </div>

      <PostCard post={post} isLoggedIn={!!session} showLink={false} currentUserId={userId} />
      <CommentSection postId={post.id} postUserId={post.user_id} isLoggedIn={!!session} currentUserId={userId} />
    </main>
  );
}
