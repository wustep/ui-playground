import { useState } from 'react'
import { useDials } from '../../lib/dials/store'
import { DETENT, DetentField } from './Detent'
import s from './DetentDemo.module.css'

/* ─────────────────────────────────────────────────────────
 * DEMO · a type specimen tuned with four Detent fields.
 * Detents sit on the values a designer actually reaches for.
 * ───────────────────────────────────────────────────────── */

const FIELDS = [
  {
    key: 'size',
    label: 'Size',
    min: 12,
    max: 96,
    step: 1,
    unit: 'px',
    detents: [12, 16, 24, 32, 48, 64, 96],
    pxPerStep: 7,
    majorEvery: 4,
  },
  {
    key: 'weight',
    label: 'Weight',
    min: 100,
    max: 900,
    step: 10,
    detents: [300, 400, 500, 600, 700],
    pxPerStep: 5,
    majorEvery: 10,
  },
  {
    key: 'tracking',
    label: 'Tracking',
    min: -8,
    max: 12,
    step: 0.1,
    unit: '%',
    detents: [-4, -2, 0, 2, 5],
    pxPerStep: 5,
    majorEvery: 10,
    format: (v: number) => (v > 0 ? `+${v.toFixed(1)}` : v.toFixed(1)),
  },
  {
    key: 'leading',
    label: 'Leading',
    min: 0.8,
    max: 2,
    step: 0.01,
    detents: [1, 1.2, 1.5],
    pxPerStep: 4,
    majorEvery: 10,
    format: (v: number) => v.toFixed(2),
  },
] as const

type Key = (typeof FIELDS)[number]['key']

const START: Record<Key, number> = { size: 40, weight: 500, tracking: -2, leading: 1.1 }

const DIALS = {
  detentPx: [DETENT.detentPx, 0, 30, 1],
  rulerScale: [DETENT.rulerScale, 0.5, 2, 0.05],
  accelerate: DETENT.accelerate,
  rubberBand: DETENT.rubberBand,
  unfurl: DETENT.unfurl,
  settle: DETENT.settle,
} as const

export function DetentDemo() {
  const dials = useDials('Detent', DIALS)
  const [spec, setSpec] = useState(START)
  const changed = (Object.keys(START) as Key[]).some((k) => spec[k] !== START[k])

  return (
    <div className={`ui-card ${s.card}`}>
      <header className={s.head}>
        <span className="t-label">Specimen · Geist</span>
        <button
          className="ui-btn"
          data-variant="ghost"
          data-size="sm"
          onClick={() => setSpec(START)}
          disabled={!changed}
        >
          Reset
        </button>
      </header>

      <div className={s.preview}>
        <p
          style={{
            fontSize: spec.size,
            fontWeight: spec.weight,
            letterSpacing: `${spec.tracking / 100}em`,
            lineHeight: spec.leading,
          }}
        >
          Uncommon care is mostly noticing.
        </p>
      </div>

      <div className={s.fields}>
        {FIELDS.map((f) => (
          <DetentField
            key={f.key}
            label={f.label}
            value={spec[f.key]}
            onChange={(v) => setSpec((prev) => ({ ...prev, [f.key]: v }))}
            min={f.min}
            max={f.max}
            step={f.step}
            unit={'unit' in f ? f.unit : undefined}
            detents={f.detents}
            pxPerStep={f.pxPerStep}
            majorEvery={f.majorEvery}
            format={'format' in f ? f.format : undefined}
            tuning={dials}
          />
        ))}
      </div>
      <p className={s.hint}>Drag a field sideways · click to type</p>
    </div>
  )
}
