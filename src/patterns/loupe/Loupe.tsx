import { useId, useRef, useState, type KeyboardEvent, type ReactNode } from 'react'
import { AnimatePresence, motion, useAnimationFrame, useSpring } from 'motion/react'
import type { Spring } from '../../lib/dials/store'
import { lerp } from '../../lib/random'
import s from './Loupe.module.css'

/* ─────────────────────────────────────────────────────────
 * LOUPE · a dense list with a travelling magnifier
 *
 * Every row stays one line tall, so you can scan the whole
 * list. The row under the loupe opens to show its detail, and
 * emphasis falls off with distance (a fisheye in opacity,
 * not scale, so text never blurs or reflows).
 *
 *   hover / ↑↓   loupe moves to that row
 *                detail opens (height: auto, spring)
 *                previous detail closes in the same frame
 *                rows at distance d fade toward opacityFloor
 *   lens         a rail marker glides after the focused row,
 *                sized to it, on its own softer spring
 *   leave        loupe stays put: pointing away is not intent
 * ───────────────────────────────────────────────────────── */

export interface LoupeTuning {
  reach: number // rows on each side that stay partly emphasized
  opacityFloor: number // emphasis far from the loupe
  expand: Spring // detail open/close
  lensStiffness: number // rail marker follow
  lensDamping: number
}

export const LOUPE: LoupeTuning = {
  reach: 2,
  opacityFloor: 0.42,
  expand: { type: 'spring', visualDuration: 0.3, bounce: 0.08 },
  lensStiffness: 420,
  lensDamping: 38,
}

interface Props<T> {
  items: readonly T[]
  getKey: (item: T) => string
  label: string
  renderRow: (item: T, focused: boolean) => ReactNode
  renderDetail: (item: T) => ReactNode
  tuning?: LoupeTuning
}

export function Loupe<T>({ items, getKey, label, renderRow, renderDetail, tuning = LOUPE }: Props<T>) {
  const [focus, setFocus] = useState(0)
  const baseId = useId()
  const listRef = useRef<HTMLDivElement>(null)
  const rowRefs = useRef<(HTMLDivElement | null)[]>([])
  const lastPointer = useRef({ x: -1, y: -1 })

  /* The lens follows the focused row's live box, every frame. */
  const lensSpring = { stiffness: tuning.lensStiffness, damping: tuning.lensDamping }
  const lensTop = useSpring(0, lensSpring)
  const lensHeight = useSpring(0, lensSpring)
  const lensPlaced = useRef(false)
  useAnimationFrame(() => {
    const row = rowRefs.current[focus]
    if (!row) return
    if (!lensPlaced.current) {
      lensTop.jump(row.offsetTop)
      lensHeight.jump(row.offsetHeight)
      lensPlaced.current = true
      return
    }
    if (lensTop.get() !== row.offsetTop) lensTop.set(row.offsetTop)
    if (lensHeight.get() !== row.offsetHeight) lensHeight.set(row.offsetHeight)
  })

  const move = (next: number) => {
    const i = Math.max(0, Math.min(items.length - 1, next))
    setFocus(i)
    rowRefs.current[i]?.scrollIntoView({ block: 'nearest' })
  }

  const onKeyDown = (e: KeyboardEvent) => {
    const map: Record<string, number> = {
      ArrowDown: focus + 1,
      ArrowUp: focus - 1,
      PageDown: focus + 5,
      PageUp: focus - 5,
      Home: 0,
      End: items.length - 1,
    }
    if (!(e.key in map)) return
    e.preventDefault()
    move(map[e.key])
  }

  /** Emphasis by distance: 1 at the loupe, easing to the floor over `reach` rows. */
  const emphasis = (d: number) => {
    if (d === 0) return 1
    if (d > tuning.reach) return tuning.opacityFloor
    return lerp(1, tuning.opacityFloor, d / (tuning.reach + 1))
  }

  return (
    <div
      ref={listRef}
      className={s.list}
      role="listbox"
      tabIndex={0}
      aria-label={label}
      aria-activedescendant={`${baseId}-${focus}`}
      onKeyDown={onKeyDown}
    >
      <span className={s.rail} aria-hidden />
      <motion.span className={s.lens} style={{ y: lensTop, height: lensHeight }} aria-hidden />

      {items.map((item, i) => {
        const d = Math.abs(i - focus)
        const focused = d === 0
        return (
          <motion.div
            key={getKey(item)}
            ref={(el) => {
              rowRefs.current[i] = el
            }}
            id={`${baseId}-${i}`}
            role="option"
            aria-selected={focused}
            className={s.row}
            data-focused={focused}
            initial={false}
            animate={{ opacity: emphasis(d) }}
            transition={tuning.expand}
            onPointerMove={(e) => {
              // Rows resize under a still pointer; only real movement moves the loupe.
              const p = lastPointer.current
              if (p.x === e.clientX && p.y === e.clientY) return
              lastPointer.current = { x: e.clientX, y: e.clientY }
              if (!focused) setFocus(i)
            }}
            onClick={() => setFocus(i)}
          >
            <div className={s.line}>{renderRow(item, focused)}</div>
            <AnimatePresence initial={false}>
              {focused && (
                <motion.div
                  className={s.detail}
                  initial={{ height: 0, opacity: 0 }}
                  animate={{ height: 'auto', opacity: 1 }}
                  exit={{ height: 0, opacity: 0 }}
                  transition={tuning.expand}
                >
                  <div className={s.detailInner}>{renderDetail(item)}</div>
                </motion.div>
              )}
            </AnimatePresence>
          </motion.div>
        )
      })}
    </div>
  )
}
