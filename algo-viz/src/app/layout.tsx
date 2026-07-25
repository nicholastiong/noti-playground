import type { Metadata } from 'next';
import { IBM_Plex_Sans, Instrument_Serif, JetBrains_Mono } from 'next/font/google';
import Link from 'next/link';
import Script from 'next/script';
import { ALGORITHMS } from '@/algorithms/meta';
import ThemeToggle from '@/components/ThemeToggle';
import './globals.css';
import styles from './layout.module.css';

/** Runs before paint so a stored light preference never flashes dark. */
const THEME_INIT = `try{if(localStorage.getItem('theme')==='light')document.documentElement.dataset.theme='light'}catch(e){}`;

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

const sans = IBM_Plex_Sans({
  variable: '--font-sans',
  subsets: ['latin'],
  weight: ['400', '500', '600'],
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
    <html
      lang="en"
      className={`${serif.variable} ${mono.variable} ${sans.variable}`}
      suppressHydrationWarning
    >
      <body>
        <Script id="theme-init" strategy="beforeInteractive">
          {THEME_INIT}
        </Script>
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
          <ThemeToggle />
        </header>
        {children}
      </body>
    </html>
  );
}
