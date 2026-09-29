import { useState } from 'react'
import { numberOf, PATTERNS } from '../patterns'
import type { PatternMeta } from '../patterns/types'
import { THEMES } from '../themes'
import s from './Shell.module.css'

const REPO = 'https://github.com/wustep/ui-playground/blob/main/src/patterns/'

export function PatternPage({ pattern, compare }: { pattern: PatternMeta; compare: boolean }) {
  const [runId, setRunId] = useState(0)
  const { Demo } = pattern
  const index = PATTERNS.indexOf(pattern)
  const next = PATTERNS[(index + 1) % PATTERNS.length]

  return (
    <article className={s.page}>
      <header className={s.pageHead}>
        <p className={s.eyebrow}>
          <span className="t-mono">{numberOf(pattern)}</span>
          <span className={s.jobTag}>{pattern.job}</span>
        </p>
        <h1 className={`t-display ${s.pageTitle}`}>{pattern.name}</h1>
        <p className={s.tagline}>{pattern.tagline}</p>
      </header>

      <div className={s.stageBar}>
        <span className="t-label">{compare ? 'Every theme, one set of dials' : 'Live'}</span>
        <button className="ui-btn" data-variant="ghost" data-size="sm" onClick={() => setRunId((n) => n + 1)}>
          <ResetIcon /> Reset demo
        </button>
      </div>

      {compare ? (
        <div className={s.compareGrid}>
          {THEMES.map((t) => (
            <section key={t.id} data-theme={t.id} className={s.stage} data-compare aria-label={`${t.label} theme`}>
              <span className={s.stageTheme}>{t.label}</span>
              <Demo key={runId} />
            </section>
          ))}
        </div>
      ) : (
        <section className={s.stage}>
          <Demo key={runId} />
        </section>
      )}

      <div className={s.notes}>
        <section className={s.noteMain}>
          <h2 className="t-label">The job</h2>
          <p className={s.summary}>{pattern.summary}</p>

          <h2 className="t-label">Craft notes</h2>
          <ol className={s.craft}>
            {pattern.craft.map((c, i) => (
              <li key={i}>
                <span className={s.craftNum}>{String(i + 1).padStart(2, '0')}</span>
                <span>{c}</span>
              </li>
            ))}
          </ol>
        </section>

        <aside className={s.noteSide}>
          {pattern.keys && (
            <>
              <h2 className="t-label">Keyboard</h2>
              <dl className={s.keys}>
                {pattern.keys.map((k) => (
                  <div key={k.action}>
                    <dt>
                      {k.keys.map((key) => (
                        <kbd key={key}>{key}</kbd>
                      ))}
                    </dt>
                    <dd>{k.action}</dd>
                  </div>
                ))}
              </dl>
            </>
          )}
          <h2 className="t-label">Source</h2>
          <a className={s.sourceLink} href={REPO + pattern.source} target="_blank" rel="noreferrer">
            src/patterns/{pattern.source} ↗
          </a>
        </aside>
      </div>

      <a className={s.nextLink} href={`#/${next.slug}`}>
        <span className="t-label">Next</span>
        <span className={`t-display ${s.nextName}`}>{next.name}</span>
        <span className={s.nextArrow} aria-hidden>
          →
        </span>
      </a>
    </article>
  )
}

function ResetIcon() {
  return (
    <svg width="14" height="14" viewBox="0 0 14 14" fill="none" aria-hidden>
      <path
        d="M2.5 7a4.5 4.5 0 1 0 1.4-3.27M2.5 2.5v2.75h2.75"
        stroke="currentColor"
        strokeWidth="1.4"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  )
}
