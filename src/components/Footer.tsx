import Link from 'next/link';

export default function Footer() {
  return (
    <footer className="mt-12 pt-6 border-t text-center space-y-2" style={{ borderColor: '#ece0d9' }}>
      <p className="text-xs" style={{ color: 'rgba(88,65,61,0.5)' }}>
        © 2026 인정협회
      </p>
      <div className="flex justify-center gap-4 text-xs" style={{ color: 'rgba(88,65,61,0.5)' }}>
        <Link href="/terms" className="hover:underline">이용약관</Link>
      </div>
    </footer>
  );
}
