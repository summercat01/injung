import { auth } from '@/auth';
import { redirect } from 'next/navigation';
import LoginButtons from '@/components/LoginButtons';

export const dynamic = 'force-dynamic';

export default async function LoginPage() {
  const session = await auth();
  if (session) redirect('/');

  return (
    <main className="max-w-lg mx-auto px-4 py-16">
      <div className="text-center mb-10">
        <p className="text-5xl mb-4">🏅</p>
        <h1 className="text-3xl font-bold text-brown">인정협회</h1>
        <p className="mt-2 text-sm" style={{ color: 'rgba(85,61,54,0.55)' }}>
          인정하고 싶다면 로그인하세요
        </p>
      </div>

      <LoginButtons />
    </main>
  );
}
