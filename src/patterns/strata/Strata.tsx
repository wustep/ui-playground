import { useEffect, useId, useRef, useState } from 'react'
import { AnimatePresence, LayoutGroup, motion } from 'motion/react'
import type { Spring } from '../../lib/dials/store'
import s from './Strata.module.css'

/* ─────────────────────────────────────────────────────────
 * STRATA · toasts that settle instead of vanishing
 *
 * An auto-dismissing toast is gone before you look up, and an
 * error that disappears is an error you never saw. In Strata
 * each toast lives its moment, then settles into a thin band,
 * coloured by severity. Bands pile up like sediment: newest on
 * top, older ones compacting thinner and fainter.
 *
 *   emit       toast rises in above the strata (spring)
 *              a hairline under it drains over ttlMs
 *   hover      the drain pauses
 *   ttl ends   toast compresses into a band (shared layout,
 *              paper layer fades as colour layer fades in)
 *   age        bands compact: 5px → 3px → 2px, fade with depth
 *   errors     settle *unread*: taller band + marker + count
 *   open       bands grow back into readable rows (same layoutId)
 *              opening marks everything read
 * ───────────────────────────────────────────────────────── */

export type Severity = 'success' | 'info' | 'warning' | 'error'

export interface Note {
  id: string
  severity: Severity
  title: string
  body?: string
  at: number
}

export interface StrataTuning {
  ttlMs: number // how long a toast stays up (errors get 2×)
  maxLive: number // toasts on screen at once
  compact: boolean // older bands get thinner
  settle: Spring
}

export const STRATA: StrataTuning = {
  ttlMs: 3200,
  maxLive: 3,
  compact: true,
  settle: { type: 'spring', visualDuration: 0.45, bounce: 0.1 },
}

const BANDS = {
  max: 14, // bands drawn before "+n older"
  heights: [5, 5, 4, 4, 3, 3, 3, 2], // by depth; deeper = 2px
  unreadHeight: 7,
  fadeFloor: 0.35,
}

const RISE = { y: 16, scale: 0.96 }

type Item = Note & { live: boolean; read: boolean; expires: number }

interface Props {
  seed?: Note[] // settled history on mount
  emitRef?: { current: ((n: Omit<Note, 'id' | 'at'>) => void) | null }
  tuning?: StrataTuning
}

let seq = 0
const newId = () => `n${++seq}`

export function Strata({ seed = [], emitRef, tuning = STRATA }: Props) {
  const group = useId()
  const [items, setItems] = useState<Item[]>(() =>
    seed.map((n) => ({ ...n, live: false, read: n.severity !== 'error', expires: 0 })),
  )
  const [open, setOpen] = useState(false)
  const [hovered, setHovered] = useState<string | null>(null)
  const [, tick] = useState(0)
  const pausedAt = useRef<number | null>(null)

  /* Public: emit a toast. */
  useEffect(() => {
    if (!emitRef) return
    emitRef.current = (n) => {
      const ttl = n.severity === 'error' ? tuning.ttlMs * 2 : tuning.ttlMs
      setItems((prev) => {
        const next: Item[] = [
          { ...n, id: newId(), at: Date.now(), live: true, read: n.severity !== 'error', expires: Date.now() + ttl },
          ...prev,
        ]
        // Too many on screen: the oldest live toast settles early.
        let live = 0
        return next.map((it) => (it.live && ++live > tuning.maxLive ? { ...it, live: false } : it))
      })
    }
    return () => {
      emitRef.current = null
    }
  }, [emitRef, tuning.ttlMs, tuning.maxLive])

  /* Settle toasts whose time is up. Hovering a toast pauses the clock for everyone. */
  useEffect(() => {
    const id = setInterval(() => {
      if (hovered) return
      const now = Date.now()
      setItems((prev) =>
        prev.some((it) => it.live && it.expires <= now)
          ? prev.map((it) => (it.live && it.expires <= now ? { ...it, live: false } : it))
          : prev,
      )
      tick((t) => t + 1) // refresh relative times + drain bars
    }, 100)
    return () => clearInterval(id)
  }, [hovered])

  // Pausing shifts every live expiry forward by the time spent hovering.
  useEffect(() => {
    if (hovered) {
      pausedAt.current = Date.now()
      return
    }
    if (pausedAt.current !== null) {
      const paused = Date.now() - pausedAt.current
      pausedAt.current = null
      setItems((prev) => prev.map((it) => (it.live ? { ...it, expires: it.expires + paused } : it)))
    }
  }, [hovered])

  const live = items.filter((it) => it.live)
  const settled = items.filter((it) => !it.live)
  const unread = settled.filter((it) => !it.read && it.severity === 'error').length
  const shown = settled.slice(0, BANDS.max)
  const older = settled.length - shown.length

  const setExpanded = (v: boolean) => {
    setOpen(v)
    if (v) setItems((prev) => prev.map((it) => (it.live ? it : { ...it, read: true })))
  }

  const dismiss = (id: string) => setItems((prev) => prev.map((it) => (it.id === id ? { ...it, live: false } : it)))

  return (
    <LayoutGroup id={group}>
      <div className={s.dock} onMouseLeave={() => setExpanded(false)}>
        {/* Live toasts */}
        <div className={s.live} aria-live="polite">
          <AnimatePresence initial={false}>
            {live
              .slice()
              .reverse()
              .map((it) => {
                const ttl = it.severity === 'error' ? tuning.ttlMs * 2 : tuning.ttlMs
                // While paused, the drain freezes where it was.
                const now = pausedAt.current ?? Date.now()
                const left = Math.min(1, Math.max(0, (it.expires - now) / ttl))
                return (
                  <motion.div
                    key={it.id}
                    layoutId={it.id}
                    className={s.toast}
                    data-severity={it.severity}
                    role={it.severity === 'error' ? 'alert' : 'status'}
                    initial={{ opacity: 0, y: RISE.y, scale: RISE.scale }}
                    animate={{ opacity: 1, y: 0, scale: 1 }}
                    transition={tuning.settle}
                    style={{ borderRadius: 'var(--radius-md)' }}
                    onMouseEnter={() => setHovered(it.id)}
                    onMouseLeave={() => setHovered(null)}
                  >
                    <SeverityIcon severity={it.severity} />
                    <div className={s.toastText}>
                      <p className={s.title}>{it.title}</p>
                      {it.body && <p className={s.body}>{it.body}</p>}
                    </div>
                    <button className={s.close} onClick={() => dismiss(it.id)} aria-label="Settle now">
                      ×
                    </button>
                    <span className={s.drain} style={{ transform: `scaleX(${left})` }} aria-hidden />
                  </motion.div>
                )
              })}
          </AnimatePresence>
        </div>

        {/* Strata: bands at rest, rows when opened */}
        {settled.length > 0 && (
          <div
            className={s.strata}
            data-open={open}
            onMouseEnter={() => setExpanded(true)}
          >
            {open ? (
              <ul className={s.rows} aria-label="Notification history">
                {shown.map((it) => (
                  <motion.li
                    key={it.id}
                    layoutId={it.id}
                    className={s.row}
                    data-severity={it.severity}
                    transition={tuning.settle}
                    style={{ borderRadius: 'var(--radius-sm)' }}
                  >
                    <motion.span
                      className={s.rowContent}
                      initial={{ opacity: 0 }}
                      animate={{ opacity: 1 }}
                      transition={{ delay: 0.08, duration: 0.2 }}
                    >
                      <span className={s.rowMark} aria-hidden />
                      <span className={s.rowTitle}>{it.title}</span>
                      <span className={s.rowAgo}>{ago(it.at)}</span>
                    </motion.span>
                  </motion.li>
                ))}
              </ul>
            ) : (
              <div className={s.bands} aria-hidden>
                {shown.map((it, depth) => {
                  const unreadError = !it.read && it.severity === 'error'
                  const h = unreadError
                    ? BANDS.unreadHeight
                    : tuning.compact
                      ? (BANDS.heights[depth] ?? 2)
                      : 5
                  const fade = tuning.compact ? Math.max(BANDS.fadeFloor, 1 - depth / BANDS.max) : 1
                  return (
                    <motion.div
                      key={it.id}
                      layoutId={it.id}
                      className={s.band}
                      data-severity={it.severity}
                      data-unread={unreadError}
                      transition={tuning.settle}
                      style={{ height: h, borderRadius: 2 }}
                    >
                      <motion.span
                        className={s.bandPaper}
                        initial={{ opacity: 1 }}
                        animate={{ opacity: 0 }}
                        transition={{ duration: 0.3 }}
                      />
                      <motion.span
                        className={s.bandInk}
                        initial={{ opacity: 0 }}
                        animate={{ opacity: fade }}
                        transition={{ duration: 0.35 }}
                      />
                    </motion.div>
                  )
                })}
              </div>
            )}
            <button
              className={s.legend}
              onClick={() => setExpanded(!open)}
              onKeyDown={(e) => e.key === 'Escape' && setExpanded(false)}
              aria-expanded={open}
              aria-label={`History, ${settled.length} notifications${unread ? `, ${unread} unread error${unread > 1 ? 's' : ''}` : ''}`}
            >
              <span>History</span>
              <span className={s.legendCount}>{settled.length}</span>
              {older > 0 && !open && <span className={s.legendOlder}>+{older} older</span>}
              {unread > 0 && (
                <span className={s.unread}>
                  {unread} unread error{unread > 1 ? 's' : ''}
                </span>
              )}
            </button>
          </div>
        )}
      </div>
    </LayoutGroup>
  )
}

function SeverityIcon({ severity }: { severity: Severity }) {
  const paths: Record<Severity, string> = {
    success: 'M4.5 8.5l2.2 2.2 4.8-5.2',
    info: 'M8 7.25v4M8 5v.01',
    warning: 'M8 4.75v3.75M8 10.75v.01',
    error: 'M5.75 5.75l4.5 4.5M10.25 5.75l-4.5 4.5',
  }
  return (
    <span className={s.icon} data-severity={severity} aria-hidden>
      <svg width="16" height="16" viewBox="0 0 16 16" fill="none">
        <path d={paths[severity]} stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" />
      </svg>
    </span>
  )
}

function ago(at: number) {
  const sec = Math.max(0, Math.round((Date.now() - at) / 1000))
  if (sec < 60) return `${sec}s`
  const min = Math.round(sec / 60)
  return min < 60 ? `${min}m` : `${Math.round(min / 60)}h`
}
