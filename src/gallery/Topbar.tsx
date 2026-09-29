import { Inchworm } from '../patterns/inchworm/Inchworm'
import { THEMES, type ThemeId } from '../themes'
import s from './Shell.module.css'

interface Props {
  theme: ThemeId
  onTheme: (t: ThemeId) => void
  compare: boolean
  onCompare: () => void
  dialsOpen: boolean
  onDials: () => void
}

const THEME_OPTIONS = THEMES.map((t) => ({
  value: t.id,
  label: t.label,
  icon: <Swatch ground={t.ground} mark={t.mark} />,
}))

export function Topbar({ theme, onTheme, compare, onCompare, dialsOpen, onDials }: Props) {
  return (
    <header className={s.topbar}>
      <a href="#/" className={s.brand} aria-label="UI Playground home">
        <BrandMark />
        <span className={s.brandText}>
          ui<span className={s.brandSlash}>/</span>playground
        </span>
      </a>

      <div className={s.controls}>
        <Inchworm label="Theme" size="sm" options={THEME_OPTIONS} value={theme} onChange={onTheme} />
        <span className={s.divider} aria-hidden />
        <button
          className={s.toolBtn}
          aria-pressed={compare}
          onClick={onCompare}
          title="Compare every theme side by side (C)"
        >
          <CompareIcon />
          <span className={s.toolLabel}>Compare</span>
        </button>
        <button className={s.toolBtn} aria-pressed={dialsOpen} onClick={onDials} title="Live tuning dials (D)">
          <DialsIcon />
          <span className={s.toolLabel}>Dials</span>
        </button>
      </div>
    </header>
  )
}

function Swatch({ ground, mark }: { ground: string; mark: string }) {
  return (
    <svg width="12" height="12" viewBox="0 0 12 12" aria-hidden>
      <circle cx="6" cy="6" r="5.5" fill={ground} stroke="currentColor" strokeOpacity="0.35" />
      <circle cx="6" cy="6" r="2.25" fill={mark} />
    </svg>
  )
}

function BrandMark() {
  return (
    <svg width="18" height="18" viewBox="0 0 18 18" aria-hidden>
      <rect x="1" y="1" width="7" height="7" rx="2" fill="currentColor" opacity="0.9" />
      <rect x="10" y="1" width="7" height="7" rx="3.5" fill="var(--accent)" />
      <rect x="1" y="10" width="7" height="7" rx="3.5" fill="currentColor" opacity="0.35" />
      <rect x="10" y="10" width="7" height="7" rx="2" fill="currentColor" opacity="0.9" />
    </svg>
  )
}

function CompareIcon() {
  return (
    <svg width="16" height="16" viewBox="0 0 16 16" fill="none" aria-hidden>
      <rect x="1.5" y="3" width="3.5" height="10" rx="1" stroke="currentColor" strokeWidth="1.4" />
      <rect x="6.25" y="3" width="3.5" height="10" rx="1" stroke="currentColor" strokeWidth="1.4" />
      <rect x="11" y="3" width="3.5" height="10" rx="1" stroke="currentColor" strokeWidth="1.4" />
    </svg>
  )
}

function DialsIcon() {
  return (
    <svg width="16" height="16" viewBox="0 0 16 16" fill="none" aria-hidden>
      <path d="M2 4.5h7M12 4.5h2M2 11.5h2M7 11.5h7" stroke="currentColor" strokeWidth="1.4" strokeLinecap="round" />
      <circle cx="10.5" cy="4.5" r="1.6" stroke="currentColor" strokeWidth="1.4" />
      <circle cx="5.5" cy="11.5" r="1.6" stroke="currentColor" strokeWidth="1.4" />
    </svg>
  )
}
