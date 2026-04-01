import { redirect } from 'next/navigation';
import { auth } from '@/auth';
import WriteForm from '@/components/WriteForm';

export const dynamic = 'force-dynamic';

export default async function WritePage() {
  const session = await auth();

  if (!session) redirect('/login');
  if (!session.user.nickname) redirect('/onboarding');

  return (
    <main className="max-w-lg mx-auto px-4 pt-5 pb-28">
      <header className="mb-6">
        <h2 className="font-extrabold text-4xl leading-tight tracking-tight mb-2" style={{ fontFamily: 'Plus Jakarta Sans, sans-serif', color: '#201a16' }}>
          주장을 <span style={{ color: '#ac3323', fontStyle: 'italic' }}>올려봐</span>
        </h2>
        <p className="text-sm" style={{ color: '#58413d' }}>
          틀렸으면 틀렸다고 해줄게. 맞으면 인정해줄게. 아마도.
        </p>
      </header>
      <WriteForm />
    </main>
  );
}
