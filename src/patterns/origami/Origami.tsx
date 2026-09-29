import { useCallback, useEffect, useLayoutEffect, useRef, useState, type PointerEvent } from 'react'
import { AnimatePresence, motion } from 'motion/react'
import type { Spring } from '../../lib/dials/store'
import s from './Origami.module.css'

/* ─────────────────────────────────────────────────────────
 * ORIGAMI · breadcrumbs that fold instead of disappearing
 *
 * When a path doesn't fit, most breadcrumbs swap the middle
 * for "…", which hides how deep you are and costs a click to
 * see. Origami folds the middle into paper pleats. One pleat
 * per folder: depth stays countable, and a hover unfolds them
 * in place.
 *
 *   narrow     crumbs fold oldest-first (after the root) into
 *              pleats: width → pleatPx, rotateY ±foldAngle,
 *              label fades, alternating shade like a paper fan
 *   hover      pleats unfold in place, lifted, pushing the tail
 *   leave      refold after peekDelay (forgiving diagonal exits)
 *   touch      first tap unfolds, second tap navigates
 *   navigate   later crumbs collapse away; new ones grow in
 * ───────────────────────────────────────────────────────── */

export interface OrigamiTuning {
  pleatPx: number // width of one folded crumb
  foldAngle: number // degrees of rotateY on a pleat
  peekDelay: number // ms before refolding after the pointer leaves
  fold: Spring
}

export const ORIGAMI: OrigamiTuning = {
  pleatPx: 7,
  foldAngle: 32,
  peekDelay: 160,
  fold: { type: 'spring', visualDuration: 0.34, bounce: 0.08 },
}

const SEP_PX = 20 // separator slot
const PLEAT_GAP = 2 // px between neighbouring pleats

interface Props {
  path: string[]
  onNavigate: (index: number) => void
  tuning?: OrigamiTuning
}

/** How many crumbs (after the root) to fold so the row fits. */
function foldCount(widths: number[], available: number, pleat: number) {
  const n = widths.length
  let total = widths.reduce((a, b) => a + b, 0) + SEP_PX * (n - 1)
  let k = 0
  while (total > available && k < n - 2) {
    total += pleat - widths[1 + k] + (k > 0 ? PLEAT_GAP - SEP_PX : 0)
    k++
  }
  return k
}

export function Origami({ path, onNavigate, tuning = ORIGAMI }: Props) {
  const navRef = useRef<HTMLElement>(null)
  const measureRef = useRef<HTMLDivElement>(null)
  const [widths, setWidths] = useState<number[]>([])
  const [available, setAvailable] = useState(0)
  const [peek, setPeek] = useState(false)
  const peekTimer = useRef<ReturnType<typeof setTimeout>>(undefined)

  const measure = useCallback(() => {
    if (navRef.current) setAvailable(navRef.current.clientWidth)
    if (measureRef.current) {
      setWidths([...measureRef.current.children].map((el) => Math.ceil((el as HTMLElement).offsetWidth)))
    }
  }, [])

  useLayoutEffect(() => {
    measure()
  }, [path, measure])

  useEffect(() => {
    const ro = new ResizeObserver(measure)
    if (navRef.current) ro.observe(navRef.current)
    document.fonts?.ready.then(measure)
    return () => {
      ro.disconnect()
      clearTimeout(peekTimer.current)
    }
  }, [measure])

  const k = widths.length === path.length ? foldCount(widths, available, tuning.pleatPx) : 0
  const isFolded = (i: number) => i >= 1 && i <= k

  const openPeek = () => {
    clearTimeout(peekTimer.current)
    setPeek(true)
  }
  const closePeek = () => {
    clearTimeout(peekTimer.current)
    peekTimer.current = setTimeout(() => setPeek(false), tuning.peekDelay)
  }

  const keyOf = (i: number) => path.slice(0, i + 1).join('/')

  return (
    <nav ref={navRef} className={s.nav} aria-label="Breadcrumb" data-peek={peek && k > 0}>
      <ol className={s.row}>
        <AnimatePresence initial={false}>
          {path.map((name, i) => {
            const folded = isFolded(i)
            const closed = folded && !peek
            const last = i === path.length - 1
            const sepVisible = i > 0 && !(closed && isFolded(i - 1))
            return (
              <motion.li
                key={keyOf(i)}
                className={s.item}
                data-last={last}
                initial={{ opacity: 0, width: 0 }}
                animate={{ opacity: 1, width: 'auto' }}
                exit={{ opacity: 0, width: 0 }}
                transition={tuning.fold}
              >
                {i > 0 && (
                  <motion.span
                    className={s.sep}
                    aria-hidden
                    initial={false}
                    animate={{ width: sepVisible ? SEP_PX : PLEAT_GAP, opacity: sepVisible ? 1 : 0 }}
                    transition={tuning.fold}
                  >
                    /
                  </motion.span>
                )}
                {last ? (
                  <span className={s.current} aria-current="page">
                    {name}
                  </span>
                ) : (
                  <motion.button
                    className={s.crumb}
                    data-folded={folded}
                    data-closed={closed}
                    data-odd={i % 2 === 1}
                    initial={false}
                    animate={{
                      width: closed ? tuning.pleatPx : (widths[i] ?? 'auto'),
                      rotateY: closed ? (i % 2 ? 1 : -1) * tuning.foldAngle : 0,
                    }}
                    transition={tuning.fold}
                    onPointerEnter={(e: PointerEvent) => folded && e.pointerType === 'mouse' && openPeek()}
                    onPointerLeave={() => folded && closePeek()}
                    onFocus={() => folded && openPeek()}
                    onBlur={() => folded && closePeek()}
                    onClick={() => {
                      if (closed) return openPeek() // touch: first tap unfolds
                      setPeek(false)
                      onNavigate(i)
                    }}
                    aria-label={closed ? `${name}, folded. Activate to unfold` : undefined}
                  >
                    <motion.span
                      className={s.label}
                      initial={false}
                      animate={{ opacity: closed ? 0 : 1 }}
                      transition={{ duration: 0.15 }}
                    >
                      {name}
                    </motion.span>
                  </motion.button>
                )}
              </motion.li>
            )
          })}
        </AnimatePresence>
      </ol>

      {/* Natural widths, measured off-screen with identical styles. */}
      <div ref={measureRef} className={s.measure} aria-hidden>
        {path.map((name, i) => (
          <span key={keyOf(i)} className={i === path.length - 1 ? s.current : s.crumb}>
            {name}
          </span>
        ))}
      </div>
    </nav>
  )
}
