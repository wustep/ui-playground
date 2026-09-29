import {
  useCallback,
  useEffect,
  useLayoutEffect,
  useRef,
  useState,
  type KeyboardEvent,
  type ReactNode,
} from 'react'
import { animate, motion, useMotionValue, useTransform } from 'motion/react'
import type { Spring } from '../../lib/dials/store'
import s from './Inchworm.module.css'

/* ─────────────────────────────────────────────────────────
 * INCHWORM · segmented control
 *
 * The indicator has two edges on two springs. The edge in the
 * direction of travel uses a stiff spring (it leads); the other
 * uses a looser one (it trails). So the pill stretches toward
 * the target, then gathers itself up behind, like an inchworm.
 *
 *   press   leading edge leans toward the pressed option
 *   select  lead edge → target   (fast spring)
 *           trail edge → target  (slow spring)
 *           pill thins while stretched (squash)
 *   labels  a second, clipped label layer inverts text exactly
 *           where the pill overlaps it, mid-flight included
 * ───────────────────────────────────────────────────────── */

export interface InchwormTuning {
  lead: Spring // edge in the direction of travel
  trail: Spring // edge being pulled along
  squash: number // 0–1, how much the pill thins while stretched
  leanPx: number // anticipation on press
}

export const INCHWORM: InchwormTuning = {
  lead: { type: 'spring', visualDuration: 0.22, bounce: 0.16 },
  trail: { type: 'spring', visualDuration: 0.44, bounce: 0.06 },
  squash: 0.3,
  leanPx: 8,
}

const MAX_SQUASH = 0.16 // never thinner than 84% height

export interface InchwormOption<T extends string> {
  value: T
  label: ReactNode
  icon?: ReactNode
}

interface Props<T extends string> {
  options: readonly InchwormOption<T>[]
  value: T
  onChange: (value: T) => void
  label: string
  size?: 'sm' | 'md'
  tuning?: InchwormTuning
  showEdges?: boolean
}

type Rect = { left: number; right: number }

export function Inchworm<T extends string>({
  options,
  value,
  onChange,
  label,
  size = 'md',
  tuning = INCHWORM,
  showEdges = false,
}: Props<T>) {
  const rootRef = useRef<HTMLDivElement>(null)
  const optionRefs = useRef<(HTMLButtonElement | null)[]>([])
  const [rects, setRects] = useState<Rect[]>([])
  const [width, setWidth] = useState(0)

  const left = useMotionValue(0)
  const right = useMotionValue(0)
  const placed = useRef(false)
  const restWidth = useRef(0)

  const selectedIndex = Math.max(
    0,
    options.findIndex((o) => o.value === value),
  )

  /* Measure every option. Re-measure on resize and font load. */
  const measure = useCallback(() => {
    const root = rootRef.current
    if (!root) return
    setWidth(root.clientWidth)
    setRects(
      optionRefs.current.map((el) =>
        el ? { left: el.offsetLeft, right: el.offsetLeft + el.offsetWidth } : { left: 0, right: 0 },
      ),
    )
  }, [])

  useLayoutEffect(() => {
    measure()
    const ro = new ResizeObserver(measure)
    if (rootRef.current) ro.observe(rootRef.current)
    optionRefs.current.forEach((el) => el && ro.observe(el))
    document.fonts?.ready.then(measure)
    return () => ro.disconnect()
  }, [measure, options.length])

  /* Move the edges. The leading edge gets the stiff spring. */
  useEffect(() => {
    const target = rects[selectedIndex]
    if (!target) return
    restWidth.current = target.right - target.left

    if (!placed.current) {
      left.jump(target.left)
      right.jump(target.right)
      placed.current = true
      return
    }

    const movingRight = target.left > left.get()
    const a = animate(left, target.left, movingRight ? tuning.trail : tuning.lead)
    const b = animate(right, target.right, movingRight ? tuning.lead : tuning.trail)
    return () => {
      a.stop()
      b.stop()
    }
  }, [rects, selectedIndex, left, right, tuning.lead, tuning.trail])

  /* Anticipation: lean the near edge toward a pressed option. */
  const lean = (index: number) => {
    const target = rects[selectedIndex]
    if (!target || index === selectedIndex || tuning.leanPx === 0) return
    if (index > selectedIndex) animate(right, target.right + tuning.leanPx, tuning.lead)
    else animate(left, target.left - tuning.leanPx, tuning.lead)
  }
  const unlean = () => {
    const target = rects[selectedIndex]
    if (!target) return
    animate(left, target.left, tuning.lead)
    animate(right, target.right, tuning.lead)
  }

  const pillWidth = useTransform(() => right.get() - left.get())
  const scaleY = useTransform(() => {
    const rest = restWidth.current || 1
    const stretch = Math.max(0, (right.get() - left.get()) / rest - 1)
    return 1 - Math.min(MAX_SQUASH, stretch * tuning.squash * 0.5)
  })
  const clip = useTransform(
    () => `inset(var(--iw-pad) ${width - right.get()}px var(--iw-pad) ${left.get()}px round var(--iw-radius))`,
  )

  const onKeyDown = (e: KeyboardEvent) => {
    const last = options.length - 1
    const step: Record<string, number> = { ArrowRight: 1, ArrowDown: 1, ArrowLeft: -1, ArrowUp: -1 }
    let next = selectedIndex
    if (e.key in step) next = (selectedIndex + step[e.key] + options.length) % options.length
    else if (e.key === 'Home') next = 0
    else if (e.key === 'End') next = last
    else return
    e.preventDefault()
    onChange(options[next].value)
    optionRefs.current[next]?.focus()
  }

  const renderContent = (o: InchwormOption<T>) => (
    <>
      {o.icon && <span className={s.icon}>{o.icon}</span>}
      {o.label && <span>{o.label}</span>}
    </>
  )

  return (
    <div
      ref={rootRef}
      className={s.root}
      data-size={size}
      role="radiogroup"
      aria-label={label}
      onKeyDown={onKeyDown}
    >
      <motion.span
        className={s.pill}
        style={{ x: left, width: pillWidth, scaleY }}
        data-ready={rects.length > 0}
        aria-hidden
      />

      {options.map((o, i) => (
        <button
          key={o.value}
          ref={(el) => {
            optionRefs.current[i] = el
          }}
          type="button"
          role="radio"
          aria-checked={i === selectedIndex}
          tabIndex={i === selectedIndex ? 0 : -1}
          className={s.option}
          onPointerDown={() => lean(i)}
          onPointerLeave={unlean}
          onPointerCancel={unlean}
          onClick={() => onChange(o.value)}
        >
          {renderContent(o)}
        </button>
      ))}

      {/* Inverted label layer, clipped to the pill. Purely visual. */}
      <motion.div className={s.inverse} style={{ clipPath: clip }} aria-hidden>
        {options.map((o) => (
          <span key={o.value} className={s.option}>
            {renderContent(o)}
          </span>
        ))}
      </motion.div>

      {showEdges && (
        <>
          <motion.span className={s.edge} style={{ x: left }} data-edge="left" />
          <motion.span className={s.edge} style={{ x: right }} data-edge="right" />
        </>
      )}
    </div>
  )
}
