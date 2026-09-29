import { useEffect, useId, useMemo, useRef, useState, type KeyboardEvent, type PointerEvent } from 'react'
import { AnimatePresence, animate, motion, useMotionValue, useTransform } from 'motion/react'
import type { Spring } from '../../lib/dials/store'
import { clamp } from '../../lib/random'
import s from './Detent.module.css'

/* ─────────────────────────────────────────────────────────
 * DETENT · scrub-to-set numeric field
 *
 * A compact field that you drag sideways to change. While you
 * scrub, a ruler unfurls beneath it, and meaningful values
 * (16px, weight 400, 0% tracking) behave like physical detents:
 * the value sticks for a few pixels, then clicks free.
 *
 *   press      nothing yet (a click without drag = type a number)
 *   drag 3px   ruler unfurls under the field (spring)
 *   drag       ticks slide under a fixed needle
 *              slow hand = fine steps, fast hand = coarse (gain)
 *   detent     value holds for detentPx of hand travel, needle pulses
 *   past ends  ruler rubber-bands, value clamps
 *   release    ruler settles to the value, folds away after 240ms
 *   keys       ↑↓ step · ⇧ ×10 · PgUp/PgDn jump between detents
 * ───────────────────────────────────────────────────────── */

export interface DetentTuning {
  detentPx: number // hand travel (px) a detent holds the value for
  rulerScale: number // multiplies each field's px-per-step
  accelerate: boolean // velocity-scaled gain
  rubberBand: boolean // visual overshoot past min/max
  unfurl: Spring // ruler appear
  settle: Spring // ruler catching up to the value
}

export const DETENT: DetentTuning = {
  detentPx: 10,
  rulerScale: 1,
  accelerate: true,
  rubberBand: true,
  unfurl: { type: 'spring', visualDuration: 0.22, bounce: 0.18 },
  settle: { type: 'spring', visualDuration: 0.3, bounce: 0.1 },
}

const GESTURE = {
  dragThreshold: 3, // px before a press becomes a scrub
  foldDelay: 240, // ms the ruler lingers after release
  keyLinger: 900, // ms the ruler stays up after a key press
  gainMin: 0.35, // slowest hand → 0.35× steps
  gainMax: 3, // fastest hand → 3× steps
  gainSlope: 1.15, // gain per px/ms of hand speed
  smoothing: 0.72, // speed low-pass
  rubberMaxPx: 36, // furthest the ruler can overshoot
  rubberSoftPx: 70, // how quickly overshoot saturates
}

const PULSE = {
  scale: [1, 1.9, 1],
  transition: { duration: 0.32, ease: [0.2, 0, 0, 1] as const },
}

export interface DetentFieldProps {
  label: string
  value: number
  onChange: (value: number) => void
  min: number
  max: number
  step: number
  unit?: string
  detents?: readonly number[]
  pxPerStep?: number // ruler density
  majorEvery?: number // steps between major ticks
  format?: (v: number) => string
  tuning?: DetentTuning
}

export function DetentField({
  label,
  value,
  onChange,
  min,
  max,
  step,
  unit = '',
  detents = [],
  pxPerStep = 8,
  majorEvery = 10,
  format = (v) => String(v),
  tuning = DETENT,
}: DetentFieldProps) {
  const id = useId()
  const px = pxPerStep * tuning.rulerScale
  const decimals = (String(step).split('.')[1] ?? '').length
  const round = (v: number) => Number((Math.round(v / step) * step).toFixed(decimals))

  const [scrubbing, setScrubbing] = useState(false)
  const [lingering, setLingering] = useState(false)
  const [editing, setEditing] = useState(false)
  const [draft, setDraft] = useState('')
  const [onDetent, setOnDetent] = useState<number | null>(null)

  /* The ruler follows `display`, which can rubber-band past the range. */
  const display = useMotionValue(value)
  const rulerX = useTransform(display, (v) => -((v - min) / step) * px)
  const needle = useMotionValue(1)

  const gesture = useRef<{
    startX: number
    lastX: number
    lastT: number
    raw: number
    speed: number
    moved: boolean
    pointerId: number
    held: number | null // detent currently holding the value
    heldTravel: number // hand px spent pushing against it
  } | null>(null)
  const lingerTimer = useRef<ReturnType<typeof setTimeout>>(undefined)

  // Keep the ruler in step with outside changes (keys, reset, typing).
  useEffect(() => {
    if (gesture.current?.moved) return
    const a = animate(display, value, tuning.settle)
    return () => a.stop()
  }, [value, display, tuning.settle])

  useEffect(() => () => clearTimeout(lingerTimer.current), [])

  const commit = (next: number, fromDetent: number | null) => {
    const v = clamp(min, max, round(next))
    if (fromDetent !== onDetent) {
      setOnDetent(fromDetent)
      if (fromDetent !== null) {
        animate(needle, PULSE.scale, PULSE.transition)
        navigator.vibrate?.(6)
      }
    }
    if (v !== value) onChange(v)
  }

  const linger = (ms: number) => {
    setLingering(true)
    clearTimeout(lingerTimer.current)
    lingerTimer.current = setTimeout(() => setLingering(false), ms)
  }

  /* ── Pointer: drag to scrub, click to type ───────────── */

  const onPointerDown = (e: PointerEvent<HTMLDivElement>) => {
    if (editing || e.button !== 0) return
    e.currentTarget.setPointerCapture(e.pointerId)
    gesture.current = {
      startX: e.clientX,
      lastX: e.clientX,
      lastT: e.timeStamp,
      raw: value,
      speed: 0,
      moved: false,
      pointerId: e.pointerId,
      held: detents.includes(value) ? value : null,
      heldTravel: 0,
    }
  }

  const onPointerMove = (e: PointerEvent<HTMLDivElement>) => {
    const g = gesture.current
    if (!g || g.pointerId !== e.pointerId) return
    if (!g.moved) {
      if (Math.abs(e.clientX - g.startX) < GESTURE.dragThreshold) return
      g.moved = true
      g.lastX = e.clientX
      setScrubbing(true)
      return
    }

    const dx = e.clientX - g.lastX
    const dt = Math.max(1, e.timeStamp - g.lastT)
    g.speed = g.speed * GESTURE.smoothing + (Math.abs(dx) / dt) * (1 - GESTURE.smoothing)
    g.lastX = e.clientX
    g.lastT = e.timeStamp

    const gain = tuning.accelerate
      ? clamp(GESTURE.gainMin, GESTURE.gainMax, GESTURE.gainMin + g.speed * GESTURE.gainSlope)
      : 1
    const toValue = (handPx: number) => (handPx / px) * step * gain

    // Held by a detent: the hand has to push detentPx before it lets go.
    // Measured in hand pixels, so slow and fast drags feel the same stop.
    let handPx = dx
    if (g.held !== null) {
      g.heldTravel += dx
      if (Math.abs(g.heldTravel) <= tuning.detentPx) return
      handPx = g.heldTravel - Math.sign(g.heldTravel) * tuning.detentPx
      g.raw = g.held
      g.held = null
      g.heldTravel = 0
    }

    // Scrubbing right moves the ruler left, so values increase to the right.
    const overshootLimit = (GESTURE.rubberSoftPx / px) * step
    const next = clamp(min - overshootLimit, max + overshootLimit, g.raw + toValue(handPx))
    const crossed = tuning.detentPx > 0 ? detentBetween(g.raw, next) : null
    if (crossed !== null) {
      g.raw = crossed
      g.held = crossed
      g.heldTravel = 0
      commit(crossed, crossed)
      display.set(crossed)
      return
    }
    g.raw = next
    commit(next, null)
    display.set(visualFor(next))
  }

  /** First detent passed when moving from a to b (a itself excluded). */
  const detentBetween = (a: number, b: number) => {
    const lo = Math.min(a, b)
    const hi = Math.max(a, b)
    const hits = detents.filter((d) => d !== a && d >= lo && d <= hi)
    if (!hits.length) return null
    return b > a ? Math.min(...hits) : Math.max(...hits)
  }

  const onPointerUp = (e: PointerEvent<HTMLDivElement>) => {
    const g = gesture.current
    if (!g || g.pointerId !== e.pointerId) return
    gesture.current = null
    if (!g.moved) {
      setDraft(format(value))
      setEditing(true)
      return
    }
    setScrubbing(false)
    linger(GESTURE.foldDelay)
    animate(display, clamp(min, max, round(g.held ?? g.raw)), tuning.settle)
  }

  /** Where the ruler sits: rubber-banded past the ends. */
  const visualFor = (raw: number) => {
    if (!tuning.rubberBand) return clamp(min, max, raw)
    const over = raw > max ? raw - max : raw < min ? raw - min : 0
    if (over === 0) return raw
    const overPx = (Math.abs(over) / step) * px
    const bandPx = GESTURE.rubberMaxPx * (1 - Math.exp(-overPx / GESTURE.rubberSoftPx))
    const edge = over > 0 ? max : min
    return edge + Math.sign(over) * (bandPx / px) * step
  }

  /* ── Keyboard: spinbutton semantics + detent jumps ───── */

  const onKeyDown = (e: KeyboardEvent<HTMLDivElement>) => {
    if (editing) return
    const mult = e.shiftKey ? 10 : 1
    let next: number | null = null
    switch (e.key) {
      case 'ArrowUp':
      case 'ArrowRight':
        next = value + step * mult
        break
      case 'ArrowDown':
      case 'ArrowLeft':
        next = value - step * mult
        break
      case 'PageUp':
        next = detents.find((d) => d > value) ?? max
        break
      case 'PageDown':
        next = [...detents].reverse().find((d) => d < value) ?? min
        break
      case 'Home':
        next = min
        break
      case 'End':
        next = max
        break
      case 'Enter':
        e.preventDefault()
        setDraft(format(value))
        setEditing(true)
        return
    }
    if (next === null) return
    e.preventDefault()
    const v = clamp(min, max, round(next))
    commit(v, detents.includes(v) ? v : null)
    linger(GESTURE.keyLinger)
  }

  const finishEdit = (save: boolean) => {
    setEditing(false)
    if (!save) return
    const parsed = parseFloat(draft.replace(/[^\d.-]/g, ''))
    if (Number.isFinite(parsed)) commit(parsed, null)
  }

  /* ── Ruler geometry ──────────────────────────────────── */

  const ticks = useMemo(() => {
    const count = Math.round((max - min) / step)
    return Array.from({ length: count + 1 }, (_, i) => {
      const v = Number((min + i * step).toFixed(decimals))
      return { v, x: i * px, major: i % majorEvery === 0, detent: detents.includes(v) }
    })
  }, [min, max, step, px, majorEvery, detents, decimals])
  const rulerWidth = ((max - min) / step) * px

  const rulerOpen = scrubbing || lingering

  return (
    <div className={s.field} data-active={rulerOpen || editing}>
      <div
        className={s.surface}
        role="spinbutton"
        tabIndex={editing ? -1 : 0}
        aria-label={label}
        aria-valuemin={min}
        aria-valuemax={max}
        aria-valuenow={value}
        aria-valuetext={`${format(value)}${unit}`}
        aria-describedby={`${id}-hint`}
        onPointerDown={onPointerDown}
        onPointerMove={onPointerMove}
        onPointerUp={onPointerUp}
        onPointerCancel={onPointerUp}
        onKeyDown={onKeyDown}
        data-scrubbing={scrubbing}
      >
        <span className={s.label}>{label}</span>
        {editing ? (
          <input
            className={s.input}
            autoFocus
            value={draft}
            inputMode="decimal"
            aria-label={`${label} value`}
            onChange={(e) => setDraft(e.target.value)}
            onFocus={(e) => e.target.select()}
            onBlur={() => finishEdit(true)}
            onKeyDown={(e) => {
              if (e.key === 'Enter') finishEdit(true)
              if (e.key === 'Escape') finishEdit(false)
            }}
          />
        ) : (
          <span className={s.value}>
            {format(value)}
            {unit && <span className={s.unit}>{unit}</span>}
          </span>
        )}
      </div>
      <span id={`${id}-hint`} className="sr-only">
        Drag sideways or use arrow keys. Page up and down jump between suggested values.
      </span>

      <AnimatePresence>
        {rulerOpen && (
          <motion.div
            className={s.ruler}
            initial={{ opacity: 0, y: -6, scaleY: 0.4 }}
            animate={{ opacity: 1, y: 0, scaleY: 1 }}
            exit={{ opacity: 0, y: -4, scaleY: 0.6, transition: { duration: 0.14 } }}
            transition={tuning.unfurl}
            aria-hidden
          >
            <div className={s.track}>
              <motion.svg
                className={s.ticks}
                width={rulerWidth + 1}
                height={40}
                style={{ x: rulerX }}
                overflow="visible"
              >
                {ticks.map((t) => (
                  <g key={t.v} transform={`translate(${t.x + 0.5} 0)`}>
                    <line
                      y1={t.detent ? 4 : t.major ? 8 : 12}
                      y2={22}
                      className={t.detent ? s.tickDetent : t.major ? s.tickMajor : s.tickMinor}
                    />
                    {t.detent && (
                      <text y={36} textAnchor="middle" className={s.tickLabel} data-on={onDetent === t.v}>
                        {format(t.v)}
                      </text>
                    )}
                  </g>
                ))}
              </motion.svg>
              <motion.span className={s.needle} style={{ scaleY: needle }} data-held={onDetent !== null} />
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  )
}
