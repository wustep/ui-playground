import { PATTERNS, numberOf } from '../patterns'
import s from './Shell.module.css'

const PRINCIPLES = [
  { name: 'Readable', body: 'Every animated file opens with a storyboard: a shot list you can read before the code.' },
  { name: 'Tunable', body: 'Timing, springs and geometry are named constants, wired to live Dials.' },
  { name: 'Stage-driven', body: 'Sequences run off one state value, never a tangle of booleans.' },
  { name: 'Spring-first', body: 'Motion that can be interrupted mid-flight and still land somewhere sensible.' },
  { name: 'Theme-true', body: 'Themes change geometry, elevation and voice, not just color. Check any pattern in all three.' },
  { name: 'Useful', body: 'Each pattern answers a real interface job. Keyboard and screen readers included.' },
]

export function Home() {
  return (
    <div className={s.home}>
      <header className={s.hero}>
        <p className="t-label">A pattern laboratory</p>
        <h1 className={`t-display ${s.heroTitle}`}>Small interface ideas, built with uncommon care.</h1>
        <p className={s.heroBody}>
          {PATTERNS.length} patterns for everyday UI jobs like choosing, entering, confirming, filtering and
          finding your way. Each one is storyboarded, tunable live, and has to look deliberate in three very
          different themes.
        </p>
      </header>

      <ol className={s.index}>
        {PATTERNS.map((p) => (
          <li key={p.slug}>
            <a href={`#/${p.slug}`} className={s.indexRow}>
              <span className={s.indexNum}>{numberOf(p)}</span>
              <span className={`t-display ${s.indexName}`}>{p.name}</span>
              <span className={s.indexTagline}>{p.tagline}</span>
              <span className={s.indexJob}>{p.job}</span>
            </a>
          </li>
        ))}
      </ol>

      <section className={s.principles} aria-label="Principles">
        {PRINCIPLES.map((p) => (
          <div key={p.name} className={s.principle}>
            <h2>{p.name}</h2>
            <p>{p.body}</p>
          </div>
        ))}
      </section>
    </div>
  )
}
