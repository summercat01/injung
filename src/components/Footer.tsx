import Link from 'next/link';

export default function Footer() {
  return (
    <footer className="mt-12 pt-6 border-t text-center space-y-2" style={{ borderColor: '#ece0d9' }}>
      <p className="text-xs" style={{ color: 'rgba(88,65,61,0.5)' }}>
        © 2026 인정협회
      </p>
      <div className="flex justify-center gap-4 text-xs">
        <Link href="/terms" className="hover:underline" style={{ color: '#ac3323' }}>이용약관</Link>
      </div>
      <p className="text-xs" style={{ color: 'rgba(88,65,61,0.5)' }}>
        Developed by{' '}
        <a
          href="https://github.com/summercat01/injung"
          target="_blank"
          rel="noopener noreferrer"
          className="hover:underline font-semibold"
          style={{ color: '#ac3323' }}
        >
          SummerCat
        </a>
      </p>
    </footer>
  );
}
