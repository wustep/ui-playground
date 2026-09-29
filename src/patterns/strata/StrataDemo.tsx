import { useEffect, useRef } from 'react'
import { useDials } from '../../lib/dials/store'
import { STRATA, Strata, type Note } from './Strata'
import s from './StrataDemo.module.css'

/* ─────────────────────────────────────────────────────────
 * DEMO · a writing app that talks back.
 *
 *    0ms   history already holds six settled notes
 *  600ms   "Draft saved" rises
 * 1500ms   "Synced" rises
 *   then   both settle into the strata as their clocks drain
 * ───────────────────────────────────────────────────────── */

const TIMING = {
  firstNote: 600,
  secondNote: 1500,
}

type Emit = (n: Omit<Note, 'id' | 'at'>) => void

const minutesAgo = (m: number) => Date.now() - m * 60_000

const SEED: Note[] = [
  { id: 's1', severity: 'success', title: 'Draft saved', at: minutesAgo(2) },
  { id: 's2', severity: 'error', title: 'Image upload failed', body: 'cover.png is over 10 MB', at: minutesAgo(4) },
  { id: 's3', severity: 'info', title: 'Ari joined the doc', at: minutesAgo(7) },
  { id: 's4', severity: 'success', title: 'Draft saved', at: minutesAgo(11) },
  { id: 's5', severity: 'warning', title: 'Offline: changes queued', at: minutesAgo(19) },
  { id: 's6', severity: 'success', title: 'Synced 12 changes', at: minutesAgo(26) },
]

const ACTIONS: { label: string; note: Omit<Note, 'id' | 'at'> }[] = [
  { label: 'Save', note: { severity: 'success', title: 'Draft saved', body: 'All changes are safe.' } },
  { label: 'Sync', note: { severity: 'info', title: 'Synced 3 changes', body: 'Up to date with Ari and Sam.' } },
  { label: 'Go offline', note: { severity: 'warning', title: 'You’re offline', body: 'Edits will sync when you reconnect.' } },
  { label: 'Publish', note: { severity: 'error', title: 'Publish failed', body: '2 links point to deleted pages.' } },
]

const DIALS = {
  ttlMs: [STRATA.ttlMs, 1000, 10000, 100],
  maxLive: [STRATA.maxLive, 1, 5, 1],
  compact: STRATA.compact,
  settle: STRATA.settle,
} as const

export function StrataDemo() {
  const dials = useDials('Strata', DIALS)
  const emit = useRef<Emit | null>(null)

  useEffect(() => {
    const timers = [
      setTimeout(() => emit.current?.(ACTIONS[0].note), TIMING.firstNote),
      setTimeout(() => emit.current?.({ severity: 'info', title: 'Synced 5 changes' }), TIMING.secondNote),
    ]
    return () => timers.forEach(clearTimeout)
  }, [])

  return (
    <div className={`ui-card ${s.app}`}>
      <header className={s.toolbar}>
        <span className={s.docTitle}>On noticing</span>
        <div className={s.actions}>
          {ACTIONS.map((a) => (
            <button key={a.label} className="ui-btn" data-size="sm" onClick={() => emit.current?.(a.note)}>
              {a.label}
            </button>
          ))}
        </div>
      </header>

      <article className={s.doc} aria-hidden>
        <h4 className={`t-display ${s.docHeading}`}>On noticing</h4>
        {[92, 100, 96, 64, 0, 98, 88, 100, 72].map((w, i) =>
          w ? <span key={i} className={s.lineSkeleton} style={{ width: `${w}%` }} /> : <br key={i} />,
        )}
      </article>

      <Strata seed={SEED} emitRef={emit} tuning={dials} />
    </div>
  )
}
