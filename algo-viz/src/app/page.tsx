import Link from 'next/link';
import { ALGORITHMS } from '@/algorithms/meta';
import styles from './page.module.css';

export default function Home() {
  return (
    <main className={styles.main}>
      <section className={styles.hero}>
        <h1 className={styles.title}>
          Algorithms, <em>one decision at a time</em>
        </h1>
        <p className={styles.lede}>
          Each study runs its algorithm once, records every decision it makes, and then lets you
          walk the recording — forwards, backwards, or straight to the interesting part. The source
          sits beside the picture with the current line lit up.
        </p>
      </section>

      <div className="lab">Studies</div>

      <ul className={styles.grid}>
        {ALGORITHMS.map((algorithm, i) => (
          <li key={algorithm.slug}>
            <Link href={`/${algorithm.slug}`} className={styles.card}>
              <span className={styles.index}>№{String(i + 1).padStart(2, '0')}</span>
              <h2 className={styles.cardTitle}>{algorithm.title}</h2>
              <span className={styles.family}>{algorithm.family}</span>
              <p className={styles.blurb}>{algorithm.blurb}</p>
              <span className={styles.go}>open the study →</span>
            </Link>
          </li>
        ))}
      </ul>
    </main>
  );
}
