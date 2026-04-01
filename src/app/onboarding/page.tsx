import { redirect } from 'next/navigation';
import { auth } from '@/auth';
import OnboardingForm from '@/components/OnboardingForm';

export const dynamic = 'force-dynamic';

export default async function OnboardingPage() {
  const session = await auth();

  if (!session) redirect('/login');
  if (session.user.nickname) redirect('/');

  return (
    <main className="max-w-lg mx-auto px-4 py-16">
      <div className="text-center mb-8">
        <p className="text-5xl mb-4">👋</p>
        <h1 className="text-2xl font-bold text-gray-900">닉네임을 정해주세요</h1>
        <p className="text-gray-500 text-sm mt-2">
          인정협회에서 사용할 이름이에요
        </p>
      </div>
      <OnboardingForm />
    </main>
  );
}
