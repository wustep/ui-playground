import { useState } from 'react'
import { AnimatePresence, motion } from 'motion/react'
import {
  dials,
  isAction,
  isSelect,
  isSlider,
  isSpring,
  useMountedPanels,
  type DialDef,
  type Panel,
  type SliderDef,
  type Spring,
} from './store'
import { SpringCurve } from './SpringCurve'
import s from './DialPanel.module.css'

const PANEL = {
  spring: { type: 'spring' as const, visualDuration: 0.28, bounce: 0.12 },
  offsetY: 12, // px the panel rises from
  scaleFrom: 0.96,
}

export function DialPanel({ open, onClose }: { open: boolean; onClose: () => void }) {
  const panels = useMountedPanels()

  return (
    <AnimatePresence>
      {open && (
        <motion.aside
          className={s.panel}
          aria-label="Dials"
          initial={{ opacity: 0, y: PANEL.offsetY, scale: PANEL.scaleFrom }}
          animate={{ opacity: 1, y: 0, scale: 1 }}
          exit={{ opacity: 0, y: PANEL.offsetY, scale: PANEL.scaleFrom }}
          transition={PANEL.spring}
        >
          <header className={s.header}>
            <span className={s.title}>
              <DialGlyph />
              Dials
            </span>
            <button className={s.close} onClick={onClose} aria-label="Close dials">
              <kbd>D</kbd>
            </button>
          </header>
          {panels.length === 0 ? (
            <p className={s.empty}>Open a pattern to tune its motion and geometry live.</p>
          ) : (
            panels.map((panel) => <PanelSection key={panel.name} panel={panel} />)
          )}
        </motion.aside>
      )}
    </AnimatePresence>
  )
}

function PanelSection({ panel }: { panel: Panel }) {
  const [copied, setCopied] = useState(false)

  const copy = async () => {
    try {
      await navigator.clipboard.writeText(dials.serialize(panel.name))
      setCopied(true)
      setTimeout(() => setCopied(false), 1400)
    } catch {
      /* clipboard unavailable (insecure context): no-op */
    }
  }

  return (
    <section className={s.section}>
      <div className={s.sectionHead}>
        <h3 className={s.sectionName}>{panel.name}</h3>
        <div className={s.sectionActions}>
          <button className={s.textBtn} onClick={() => dials.reset(panel.name)}>
            Reset
          </button>
          <button className={s.textBtn} onClick={copy} aria-live="polite">
            {copied ? 'Copied' : 'Copy'}
          </button>
        </div>
      </div>
      <div className={s.controls}>
        {Object.entries(panel.schema).map(([key, def]) => (
          <Control key={key} panel={panel} name={key} def={def} />
        ))}
      </div>
    </section>
  )
}

function Control({ panel, name, def }: { panel: Panel; name: string; def: DialDef }) {
  const value = panel.values[name]
  const set = (v: unknown) => dials.set(panel.name, name, v)
  const label = humanize(name)

  if (isSlider(def)) return <SliderRow label={label} def={def} value={value as number} onChange={set} />

  if (typeof def === 'boolean') {
    const on = value as boolean
    return (
      <button className={s.toggleRow} role="switch" aria-checked={on} onClick={() => set(!on)}>
        <span>{label}</span>
        <span className={s.switch} data-on={on}>
          <motion.span className={s.knob} layout transition={PANEL.spring} />
        </span>
      </button>
    )
  }

  if (isSpring(def)) {
    const spring = value as Spring
    return (
      <div className={s.springGroup}>
        <div className={s.springHead}>
          <span>{label}</span>
          <SpringCurve spring={spring} />
        </div>
        <SliderRow
          label="Duration"
          def={[def.visualDuration, 0.05, 1.5, 0.01]}
          value={spring.visualDuration}
          onChange={(v) => set({ ...spring, visualDuration: v })}
          unit="s"
        />
        <SliderRow
          label="Bounce"
          def={[def.bounce, 0, 0.9, 0.01]}
          value={spring.bounce}
          onChange={(v) => set({ ...spring, bounce: v })}
        />
      </div>
    )
  }

  if (isSelect(def)) {
    return (
      <div className={s.selectRow}>
        <span>{label}</span>
        <div className={s.options} role="radiogroup" aria-label={label}>
          {def.options.map((opt) => (
            <button
              key={opt}
              role="radio"
              aria-checked={value === opt}
              className={s.option}
              onClick={() => set(opt)}
            >
              {opt}
            </button>
          ))}
        </div>
      </div>
    )
  }

  if (isAction(def)) {
    return (
      <button className={s.actionBtn} onClick={() => dials.trigger(panel.name, name)}>
        {def.label ?? label}
      </button>
    )
  }

  return null
}

function SliderRow({
  label,
  def,
  value,
  onChange,
  unit,
}: {
  label: string
  def: SliderDef
  value: number
  onChange: (v: number) => void
  unit?: string
}) {
  const [, min, max, explicitStep] = def
  const step = explicitStep ?? autoStep(max - min)
  const pct = ((value - min) / (max - min)) * 100
  const decimals = decimalsOf(step)
  const inferredUnit = unit ?? unitOf(label)

  return (
    <label className={s.slider} onDoubleClick={() => onChange(def[0])} title="Double-click to reset">
      <span className={s.fill} style={{ width: `${pct}%` }} />
      <span className={s.sliderLabel}>{stripUnit(label)}</span>
      <span className={s.sliderValue}>
        {value.toFixed(decimals)}
        {inferredUnit && <span className={s.unit}>{inferredUnit}</span>}
      </span>
      <input
        type="range"
        min={min}
        max={max}
        step={step}
        value={value}
        onChange={(e) => onChange(Number(e.target.value))}
        aria-label={label}
      />
    </label>
  )
}

function DialGlyph() {
  return (
    <svg width="14" height="14" viewBox="0 0 14 14" aria-hidden>
      <circle cx="7" cy="7" r="5.5" fill="none" stroke="currentColor" strokeWidth="1.5" />
      <path d="M7 7 L10 4" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
    </svg>
  )
}

/* ── helpers ────────────────────────────────────────────── */

const autoStep = (range: number) => (range <= 1 ? 0.01 : range <= 10 ? 0.1 : 1)
const decimalsOf = (step: number) => (String(step).split('.')[1] ?? '').length

function humanize(key: string) {
  const words = key.replace(/([a-z0-9])([A-Z])/g, '$1 $2').toLowerCase()
  return words.charAt(0).toUpperCase() + words.slice(1)
}

const UNITS: Record<string, string> = { ms: 'ms', px: 'px', deg: '°', pct: '%' }
function unitOf(label: string) {
  const last = label.split(' ').pop()!.toLowerCase()
  return UNITS[last]
}
function stripUnit(label: string) {
  return unitOf(label) ? label.split(' ').slice(0, -1).join(' ') : label
}
