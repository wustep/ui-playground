import { useEffect, useMemo, useState } from 'react'
import { animate, motion, useMotionValue, useTransform } from 'motion/react'
import { useDials } from '../../lib/dials/store'
import { seeded } from '../../lib/random'
import { INCHWORM, Inchworm } from './Inchworm'
import s from './InchwormDemo.module.css'

/* ─────────────────────────────────────────────────────────
 * DEMO · a revenue card whose range control drives the chart
 *
 *    0ms   range changes → pill edges begin (lead / trail)
 *    0ms   total counts to the new figure
 *   ~0ms   bars re-grow left → right (staggered 14ms)
 * ───────────────────────────────────────────────────────── */

const RANGES = [
  { value: 'day', label: 'Day', span: '12h', unit: 'vs yesterday', seed: 11, scale: 4_200 },
  { value: 'week', label: 'Week', span: '7d', unit: 'vs last week', seed: 23, scale: 31_000 },
  { value: 'month', label: 'Month', span: '30d', unit: 'vs last month', seed: 37, scale: 128_000 },
  { value: 'quarter', label: 'Qtr', span: '13w', unit: 'vs last quarter', seed: 41, scale: 402_000 },
  { value: 'year', label: 'Year', span: '12mo', unit: 'vs last year', seed: 59, scale: 1_610_000 },
] as const

type Range = (typeof RANGES)[number]['value']

const CHART = {
  bars: 12,
  stagger: 0.014, // s between bars
  minHeight: 0.08, // bars never vanish completely
  headroom: 0.94, // tallest bar's share of the chart height
  spring: { type: 'spring' as const, visualDuration: 0.5, bounce: 0.14 },
}

const COUNT = {
  spring: { type: 'spring' as const, visualDuration: 0.6, bounce: 0 },
}

const DIALS = {
  lead: INCHWORM.lead,
  trail: INCHWORM.trail,
  squash: [INCHWORM.squash, 0, 1, 0.01],
  leanPx: [INCHWORM.leanPx, 0, 24, 1],
  showEdges: false,
} as const

function series(seed: number, scale: number) {
  const rand = seeded(seed)
  let v = 0.45 + rand() * 0.2
  const bars = Array.from({ length: CHART.bars }, () => {
    v = Math.min(1, Math.max(CHART.minHeight, v + (rand() - 0.42) * 0.3))
    return v
  })
  const total = bars.reduce((a, b) => a + b, 0) * (scale / CHART.bars)
  const delta = (rand() - 0.3) * 24
  const peak = Math.max(...bars)
  return { bars: bars.map((b) => (b / peak) * CHART.headroom), total, delta }
}

const money = new Intl.NumberFormat('en-US', {
  style: 'currency',
  currency: 'USD',
  notation: 'compact',
  maximumFractionDigits: 1,
})

export function InchwormDemo() {
  const dials = useDials('Inchworm', DIALS)
  const [range, setRange] = useState<Range>('week')
  const meta = RANGES.find((r) => r.value === range)!
  const data = useMemo(() => series(meta.seed, meta.scale), [meta])

  const total = useMotionValue(data.total)
  const totalText = useTransform(total, (v) => money.format(v))
  useEffect(() => {
    const a = animate(total, data.total, COUNT.spring)
    return () => a.stop()
  }, [data.total, total])

  const up = data.delta >= 0

  return (
    <div className={`ui-card ${s.card}`}>
      <header className={s.head}>
        <div>
          <h3 className="t-label">Revenue</h3>
          <div className={s.figure}>
            <motion.span className={`t-numeral ${s.total}`}>{totalText}</motion.span>
            <span className={s.delta} data-up={up}>
              {up ? '↑' : '↓'} {Math.abs(data.delta).toFixed(1)}%
            </span>
          </div>
          <p className={s.caption}>{meta.unit}</p>
        </div>
        <Inchworm
          label="Range"
          options={RANGES}
          value={range}
          onChange={setRange}
          tuning={{ lead: dials.lead, trail: dials.trail, squash: dials.squash, leanPx: dials.leanPx }}
          showEdges={dials.showEdges}
        />
      </header>

      <div className={s.chart} role="img" aria-label={`Revenue, last ${meta.span}`}>
        {data.bars.map((h, i) => (
          <div key={i} className={s.slot}>
            <motion.div
              className={s.bar}
              data-current={i === CHART.bars - 1}
              initial={false}
              animate={{ height: `${h * 100}%` }}
              transition={{ ...CHART.spring, delay: i * CHART.stagger }}
            />
          </div>
        ))}
      </div>
      <footer className={s.axis}>
        <span>{meta.span} ago</span>
        <span>Now</span>
      </footer>
    </div>
  )
}
