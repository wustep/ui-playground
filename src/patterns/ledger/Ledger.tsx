import { useEffect, useId, useRef, useState, type ReactNode } from 'react'
import { AnimatePresence, LayoutGroup, motion } from 'motion/react'
import type { Spring } from '../../lib/dials/store'
import s from './Ledger.module.css'

/* ─────────────────────────────────────────────────────────
 * LEDGER · a multi-step form that keeps its own receipt
 *
 * Every step is always on screen, in one of three forms:
 *
 *   todo   a faint receipt line ("Seating ········ —"),
 *          so you can see how much is left before you start
 *   open   a card that pops out of the receipt with the form
 *   done   a receipt line with your answer; click to reopen
 *
 *   continue   card folds into its line (layout, `fold`)
 *              label glides from card title to line label
 *              next todo line unfolds into a card
 *   edit       any done line reopens in place; later lines stay
 *   complete   the receipt *is* the review. Confirm stamps it.
 * ───────────────────────────────────────────────────────── */

export interface LedgerTuning {
  fold: Spring // card ⇄ line
  stamp: Spring // confirmation stamp landing
  leader: 'dots' | 'dashes' | 'none'
}

export const LEDGER: LedgerTuning = {
  fold: { type: 'spring', visualDuration: 0.42, bounce: 0.1 },
  stamp: { type: 'spring', visualDuration: 0.35, bounce: 0.35 },
  leader: 'dots',
}

const STAMP = {
  fromScale: 1.8, // lands from above the page
  rotate: -6, // degrees, resting tilt
}

export interface LedgerStep<V> {
  id: string
  label: string // short receipt label
  title: string // card heading
  summary: (values: V) => string
  valid: (values: V) => boolean
  render: (values: V, set: (patch: Partial<V>) => void, next: () => void) => ReactNode
}

interface Props<V> {
  steps: LedgerStep<V>[]
  initial: V
  heading: ReactNode
  totals?: (values: V) => { label: string; value: string } | null
  confirmLabel: (values: V) => string
  confirmation: string
  tuning?: LedgerTuning
}

export function Ledger<V>({
  steps,
  initial,
  heading,
  totals,
  confirmLabel,
  confirmation,
  tuning = LEDGER,
}: Props<V>) {
  const groupId = useId()
  const [values, setValues] = useState<V>(initial)
  const [done, setDone] = useState<boolean[]>(() => steps.map(() => false))
  const [open, setOpen] = useState<number | null>(0)
  const [confirmed, setConfirmed] = useState(false)
  const cardRef = useRef<HTMLDivElement>(null)

  const set = (patch: Partial<V>) => setValues((v) => ({ ...v, ...patch }))
  const complete = open === null && steps.every((st, i) => done[i] && st.valid(values))

  // Focus follows the open card, so keyboard users land in the form.
  useEffect(() => {
    if (open === null) return
    const t = setTimeout(() => {
      cardRef.current?.querySelector<HTMLElement>('input, button:not([data-skip-focus]), [tabindex="0"]')?.focus()
    }, 60)
    return () => clearTimeout(t)
  }, [open])

  const next = () => {
    if (open === null || !steps[open].valid(values)) return
    const nextDone = done.map((d, i) => (i === open ? true : d))
    setDone(nextDone)
    // Next stop: the first step that is unanswered, or answered but no longer valid
    // (e.g. party grew past what the chosen seating allows).
    const firstTodo = steps.findIndex((st, i) => !nextDone[i] || !st.valid(values))
    setOpen(firstTodo === -1 ? null : firstTodo)
  }

  const edit = (i: number) => {
    if (confirmed) return
    setOpen(i)
  }

  const total = totals?.(values)

  return (
    <LayoutGroup id={groupId}>
      <motion.div className={s.receipt} layout transition={tuning.fold} data-leader={tuning.leader}>
        <motion.header layout="position" className={s.head}>
          {heading}
        </motion.header>

        <ol className={s.steps}>
          {steps.map((step, i) => {
            const mode = i === open ? 'open' : done[i] ? 'done' : 'todo'
            const stale = mode === 'done' && !step.valid(values)
            return (
              <motion.li
                key={step.id}
                layout
                transition={tuning.fold}
                className={s.step}
                data-mode={mode}
                data-stale={stale}
                style={{ borderRadius: mode === 'open' ? 'var(--radius-lg)' : 'var(--radius-xs)' }}
              >
                {mode === 'open' ? (
                  <motion.div
                    key="card"
                    ref={cardRef}
                    layout="position"
                    className={s.card}
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    transition={{ ...tuning.fold, delay: 0.06 }}
                    onKeyDown={(e) => {
                      if (e.key === 'Enter' && (e.target as HTMLElement).tagName === 'INPUT') next()
                    }}
                  >
                    <div className={s.cardHead}>
                      <motion.h3
                        layoutId={`label-${step.id}`}
                        layout="position"
                        className={s.cardTitle}
                        transition={tuning.fold}
                      >
                        {step.title}
                      </motion.h3>
                      <span className={s.progress}>
                        {i + 1} / {steps.length}
                      </span>
                    </div>
                    {step.render(values, set, next)}
                    <div className={s.cardFoot}>
                      <button
                        className="ui-btn"
                        data-variant="primary"
                        data-skip-focus
                        disabled={!step.valid(values)}
                        onClick={next}
                      >
                        {done.filter(Boolean).length === steps.length - 1 && !done[i] ? 'Review' : 'Continue'}
                      </button>
                    </div>
                  </motion.div>
                ) : (
                  <motion.button
                    key="line"
                    layout="position"
                    className={s.line}
                    disabled={mode === 'todo' || confirmed}
                    onClick={() => edit(i)}
                    aria-label={mode === 'done' ? `${step.label}: ${step.summary(values)}. Edit` : `${step.label}: not yet`}
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    transition={{ duration: 0.2 }}
                  >
                    <motion.span
                      layoutId={`label-${step.id}`}
                      layout="position"
                      className={s.lineLabel}
                      transition={tuning.fold}
                    >
                      {step.label}
                    </motion.span>
                    <span className={s.leader} aria-hidden />
                    <span className={s.lineValue}>
                      {stale && <span className={s.staleMark}>Check · </span>}
                      {mode === 'done' ? step.summary(values) : '—'}
                    </span>
                  </motion.button>
                )}
              </motion.li>
            )
          })}
        </ol>

        {total && (
          <motion.div layout="position" className={s.total}>
            <span>{total.label}</span>
            <span className={s.leader} aria-hidden />
            <span className={s.totalValue}>{total.value}</span>
          </motion.div>
        )}

        <AnimatePresence>
          {complete && !confirmed && (
            <motion.div
              layout
              className={s.confirm}
              initial={{ opacity: 0, y: 8 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0 }}
              transition={tuning.fold}
            >
              <button className="ui-btn" data-variant="primary" onClick={() => setConfirmed(true)}>
                {confirmLabel(values)}
              </button>
              <p className={s.confirmNote}>Tap any line to change it.</p>
            </motion.div>
          )}
        </AnimatePresence>

        <AnimatePresence>
          {confirmed && (
            <motion.div
              layout="position"
              className={s.stamp}
              role="status"
              initial={{ opacity: 0, scale: STAMP.fromScale, rotate: 0 }}
              animate={{ opacity: 1, scale: 1, rotate: STAMP.rotate }}
              transition={tuning.stamp}
            >
              <span className={s.stampWord}>Confirmed</span>
              <span className={s.stampCode}>{confirmation}</span>
            </motion.div>
          )}
        </AnimatePresence>
        {confirmed && (
          <motion.div layout className={s.after} initial={{ opacity: 0 }} animate={{ opacity: 1 }}>
            <button className="ui-btn" data-variant="ghost" data-size="sm" onClick={() => {
              setConfirmed(false)
              setDone(steps.map(() => false))
              setValues(initial)
              setOpen(0)
            }}>
              Start over
            </button>
          </motion.div>
        )}
        <div className={s.tear} aria-hidden />
      </motion.div>
    </LayoutGroup>
  )
}
