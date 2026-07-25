import type { Metadata } from 'next';
import { Instrument_Serif, JetBrains_Mono } from 'next/font/google';
import Link from 'next/link';
import { ALGORITHMS } from '@/algorithms/meta';
import './globals.css';
import styles from './layout.module.css';

// Self-hosted at build time by next/font — no external request, no layout shift.
const serif = Instrument_Serif({
  variable: '--font-serif',
  subsets: ['latin'],
  weight: '400',
  style: ['normal', 'italic'],
});

const mono = JetBrains_Mono({
  variable: '--font-mono',
  subsets: ['latin'],
  weight: ['300', '400', '500', '700'],
});

export const metadata: Metadata = {
  title: {
    default: 'Trace — algorithm studies',
    template: '%s — Trace',
  },
  description:
    'Step through classic algorithms one decision at a time, with the source line highlighted as it runs.',
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" className={`${serif.variable} ${mono.variable}`}>
      <body>
        <header className={styles.header}>
          <Link href="/" className={styles.wordmark}>
            <span className={styles.mark}>Trace</span>
            <span className={styles.tag}>Algorithm&nbsp;Studies</span>
          </Link>
          <nav className={styles.nav}>
            {ALGORITHMS.map((algorithm) => (
              <Link key={algorithm.slug} href={`/${algorithm.slug}`} className={styles.navLink}>
                {algorithm.title}
              </Link>
            ))}
          </nav>
        </header>
        {children}
      </body>
    </html>
  );
}
