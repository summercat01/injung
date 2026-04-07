import Link from 'next/link';
import Footer from '@/components/Footer';
import { auth } from '@/auth';

export default async function HomePage() {
  const session = await auth();

  return (
    <main className="min-h-screen pb-32 px-6 max-w-2xl mx-auto">
      {/* Hero */}
      <section className="py-12 space-y-6">
        <h2 className="text-5xl font-extrabold leading-[0.95] tracking-tight" style={{ fontFamily: 'Plus Jakarta Sans, sans-serif', color: '#201a16' }}>
          당신의 주장,<br />
          <span style={{ color: '#ac3323', fontStyle: 'italic' }}>인정? 노인정?</span>
        </h2>
        <p className="text-lg leading-relaxed" style={{ color: '#58413d' }}>
          인정받고 싶은 주장을 올리고 다른 사람들의 생각을 확인해보세요.
        </p>
        <div className="flex flex-col sm:flex-row gap-4 pt-4">
          {session ? (
            <Link
              href="/feed"
              className="px-8 py-4 rounded-full font-bold text-lg flex items-center justify-center gap-2 hover:scale-105 active:scale-95 transition-all shadow-lg text-white"
              style={{ background: '#ac3323', fontFamily: 'Plus Jakarta Sans, sans-serif', boxShadow: '0 4px 20px rgba(172,51,35,0.2)' }}
            >
              피드 보기
              <span className="material-symbols-outlined">approval</span>
            </Link>
          ) : (
            <Link
              href="/login"
              className="px-8 py-4 rounded-full font-bold text-lg flex items-center justify-center gap-2 hover:scale-105 active:scale-95 transition-all shadow-lg text-white"
              style={{ background: '#ac3323', fontFamily: 'Plus Jakarta Sans, sans-serif', boxShadow: '0 4px 20px rgba(172,51,35,0.2)' }}
            >
              인정받으러 가기
              <span className="material-symbols-outlined">approval</span>
            </Link>
          )}
          <Link
            href="/write"
            className="px-8 py-4 rounded-full font-bold text-lg flex items-center justify-center gap-2 hover:opacity-80 transition-colors"
            style={{ background: '#f2e6df', color: '#201a16', fontFamily: 'Plus Jakarta Sans, sans-serif' }}
          >
            주장하러 가기
          </Link>
        </div>
      </section>

      {/* Stats/Info cards */}
      <section className="space-y-4">
        <div className="flex items-end justify-between mb-2">
          <h3 className="text-2xl font-extrabold" style={{ fontFamily: 'Plus Jakarta Sans, sans-serif', color: '#201a16' }}>
            인정협회란 무엇인가요?
          </h3>
        </div>
        <div className="grid grid-cols-1 gap-4">
          <div className="rounded-2xl p-6 flex gap-4 items-start" style={{ background: '#fef1ea' }}>
            <div className="p-3 rounded-2xl shrink-0" style={{ background: 'rgba(255,111,89,0.15)' }}>
              <span className="material-symbols-outlined text-2xl" style={{ color: '#ac3323' }}>edit_document</span>
            </div>
            <div>
              <h4 className="font-bold text-base mb-1" style={{ fontFamily: 'Plus Jakarta Sans, sans-serif', color: '#201a16' }}>주장 올리기</h4>
              <p className="text-sm leading-relaxed" style={{ color: '#58413d' }}>나만의 주장을 올리고 다른 회원들의 심의를 받아보세요</p>
            </div>
          </div>
          <div className="rounded-2xl p-6 flex gap-4 items-start" style={{ background: '#fef1ea' }}>
            <div className="p-3 rounded-2xl shrink-0" style={{ background: 'rgba(255,111,89,0.15)' }}>
              <span className="material-symbols-outlined text-2xl" style={{ color: '#ac3323' }}>thumb_up</span>
            </div>
            <div>
              <h4 className="font-bold text-base mb-1" style={{ fontFamily: 'Plus Jakarta Sans, sans-serif', color: '#201a16' }}>인정 / 노인정 투표</h4>
              <p className="text-sm leading-relaxed" style={{ color: '#58413d' }}>다른 사람의 주장에 인정 또는 노인정으로 투표하세요</p>
            </div>
          </div>
          <div className="rounded-2xl p-6 flex gap-4 items-start" style={{ background: '#fef1ea' }}>
            <div className="p-3 rounded-2xl shrink-0" style={{ background: 'rgba(255,111,89,0.15)' }}>
              <span className="material-symbols-outlined text-2xl" style={{ color: '#ac3323' }}>analytics</span>
            </div>
            <div>
              <h4 className="font-bold text-base mb-1" style={{ fontFamily: 'Plus Jakarta Sans, sans-serif', color: '#201a16' }}>인정률 확인</h4>
              <p className="text-sm leading-relaxed" style={{ color: '#58413d' }}>내 주장의 인정률과 통계를 확인하세요</p>
            </div>
          </div>
        </div>
      </section>

      <section className="mt-8 rounded-2xl p-10 text-center relative overflow-hidden" style={{ background: '#ece0d9' }}>
        <h3 className="text-3xl font-extrabold mb-4" style={{ fontFamily: 'Plus Jakarta Sans, sans-serif', color: '#201a16' }}>
          인정 여부, 여기서 판단하세요.
        </h3>
        <p className="text-base leading-relaxed" style={{ color: '#58413d' }}>
          엄격한 인정협회에서<br />공정하게 인정해 드립니다.
        </p>
      </section>

      <Footer />
    </main>
  );
}
