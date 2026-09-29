import { useMemo } from 'react'
import { motion } from 'motion/react'
import { useDials } from '../../lib/dials/store'
import { LOUPE, Loupe } from './Loupe'
import { fmtDuration, makeDeploys, type Deploy } from './data'
import s from './LoupeDemo.module.css'

/* ─────────────────────────────────────────────────────────
 * DEMO · sixteen deploys, one line each, one open at a time
 *
 *   detail enters  → build bar grows from 0 (spring)
 *                   segments stagger 40ms, install → build → upload
 *   bar width is relative to the slowest deploy in the list,
 *   so sweeping the loupe compares durations across rows
 * ───────────────────────────────────────────────────────── */

const BAR = {
  stagger: 0.04,
  spring: { type: 'spring' as const, visualDuration: 0.45, bounce: 0.05 },
}

const DIFF_BLOCKS = 5

const STATUS_LABEL: Record<Deploy['status'], string> = {
  ready: 'Ready',
  failed: 'Failed',
  building: 'Building',
  canceled: 'Canceled',
}

const DIALS = {
  reach: [LOUPE.reach, 0, 5, 1],
  opacityFloor: [LOUPE.opacityFloor, 0.15, 1, 0.01],
  expand: LOUPE.expand,
  lensStiffness: [LOUPE.lensStiffness, 60, 1000, 10],
  lensDamping: [LOUPE.lensDamping, 5, 80, 1],
} as const

export function LoupeDemo() {
  const dials = useDials('Loupe', DIALS)
  const deploys = useMemo(makeDeploys, [])
  const slowest = useMemo(() => Math.max(...deploys.map((d) => sum(d.phases))), [deploys])
  const failed = deploys.filter((d) => d.status === 'failed').length

  return (
    <div className={`ui-card ${s.card}`}>
      <header className={s.head}>
        <div>
          <h3 className={s.title}>Deploys</h3>
          <p className={s.sub}>
            {deploys.length} today · <span className={failed ? s.failedCount : undefined}>{failed} failed</span>
          </p>
        </div>
        <p className={s.hint}>
          Hover or <kbd>↑</kbd>
          <kbd>↓</kbd>
        </p>
      </header>

      <Loupe
        items={deploys}
        getKey={(d) => d.id}
        label="Deploys"
        tuning={dials}
        renderRow={(d) => (
          <>
            <StatusDot status={d.status} />
            <span className={s.message}>{d.message}</span>
            <span className={s.branch}>{d.branch}</span>
            <span className={s.ago}>{d.ago}</span>
          </>
        )}
        renderDetail={(d) => <Detail deploy={d} slowest={slowest} />}
      />
    </div>
  )
}

function Detail({ deploy: d, slowest }: { deploy: Deploy; slowest: number }) {
  const total = sum(d.phases)
  const churn = d.adds + d.dels
  const addBlocks = Math.round((d.adds / Math.max(churn, 1)) * DIFF_BLOCKS)

  return (
    <div className={s.detail}>
      <div className={s.metaRow}>
        <span className={s.author}>
          <span className={s.avatar} style={{ ['--hue' as string]: d.author.hue }}>
            {d.author.initials}
          </span>
          {d.author.name}
        </span>
        <span className={s.hash}>{d.hash}</span>
        <span className={s.diff}>
          <span className={s.adds}>+{d.adds}</span>
          <span className={s.dels}>−{d.dels}</span>
          <span className={s.blocks} aria-hidden>
            {Array.from({ length: DIFF_BLOCKS }, (_, i) => (
              <i key={i} data-kind={i < addBlocks ? 'add' : 'del'} />
            ))}
          </span>
        </span>
        <span className={s.status} data-status={d.status}>
          {STATUS_LABEL[d.status]}
        </span>
      </div>

      <div className={s.buildRow}>
        <span className={s.buildLabel}>{fmtDuration(total)}</span>
        <div className={s.track}>
          <div className={s.bar} style={{ width: `${(total / slowest) * 100}%` }}>
            {d.phases.map((sec, i) => (
              <motion.span
                key={i}
                className={s.segment}
                data-phase={i}
                data-status={d.status}
                style={{ flexGrow: sec }}
                initial={{ scaleX: 0 }}
                animate={{ scaleX: 1 }}
                transition={{ ...BAR.spring, delay: i * BAR.stagger }}
              />
            ))}
          </div>
        </div>
        <span className={s.checks}>
          {d.checks[0]}/{d.checks[1]} checks
        </span>
      </div>

      {d.error && <p className={s.error}>{d.error}</p>}
    </div>
  )
}

function StatusDot({ status }: { status: Deploy['status'] }) {
  return <span className={s.dot} data-status={status} aria-label={STATUS_LABEL[status]} />
}

const sum = (xs: readonly number[]) => xs.reduce((a, b) => a + b, 0)
