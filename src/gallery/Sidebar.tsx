import { motion } from 'motion/react'
import { PATTERNS, numberOf } from '../patterns'
import s from './Shell.module.css'

const SHORTCUTS: [string[], string][] = [
  [['[', ']'], 'Previous / next'],
  [['T'], 'Cycle theme'],
  [['C'], 'Compare themes'],
  [['D'], 'Dials'],
]

const MARKER = {
  spring: { type: 'spring' as const, visualDuration: 0.3, bounce: 0.12 },
}

export function Sidebar({ active }: { active: string }) {
  return (
    <nav className={s.sidebar} aria-label="Patterns">
      <a href="#/" className={s.navHome} aria-current={active === '' ? 'page' : undefined}>
        Index
      </a>
      <ol className={s.navList}>
        {PATTERNS.map((p) => {
          const current = p.slug === active
          return (
            <li key={p.slug}>
              <a href={`#/${p.slug}`} className={s.navItem} aria-current={current ? 'page' : undefined}>
                {current && <motion.span layoutId="nav-marker" className={s.navMarker} transition={MARKER.spring} />}
                <span className={s.navNum}>{numberOf(p)}</span>
                <span className={s.navName}>{p.name}</span>
                <span className={s.navJob}>{p.job}</span>
              </a>
            </li>
          )
        })}
      </ol>
      <dl className={s.sideFoot}>
        {SHORTCUTS.map(([keys, label]) => (
          <div key={label}>
            <dt>
              {keys.map((k) => (
                <kbd key={k}>{k}</kbd>
              ))}
            </dt>
            <dd>{label}</dd>
          </div>
        ))}
      </dl>
    </nav>
  )
}
