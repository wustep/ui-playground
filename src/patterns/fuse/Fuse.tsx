import { useCallback, useEffect, useId, useLayoutEffect, useRef, useState, type ReactNode } from 'react'
import { AnimatePresence, animate, motion, useMotionValue, useTransform, type AnimationPlaybackControls } from 'motion/react'
import type { Spring } from '../../lib/dials/store'
import s from './Fuse.module.css'

/* ─────────────────────────────────────────────────────────
 * FUSE · hold-to-commit, with the undo window on the same fuse
 *
 * One motion value, `burn` (0 → 1), is the fuse. The button's
 * whole life is told by where that value is and which way it
 * is moving.
 *
 *   idle      fuse hidden
 *   press     fuse lights at the left edge and burns clockwise
 *             around the button, linear over holdMs (time is honest)
 *   release   (early) fuse rewinds on a spring, nothing happens
 *   tap       (< tapMs) button shakes, hint explains the gesture
 *   burn = 1  commit → button becomes “Undo · n”
 *             the fuse now burns *down* over undoMs
 *   burn = 0  undo window closes → onCommit
 *   undo      fuse snaps home, onUndo, nothing was lost
 * ───────────────────────────────────────────────────────── */

export interface FuseTuning {
  holdMs: number // how long you hold to commit
  undoMs: number // grace period after commit
  tapMs: number // presses shorter than this count as taps
  rewind: Spring // fuse returning after an early release
  spark: boolean // glowing tip on the fuse
}

export const FUSE: FuseTuning = {
  holdMs: 1100,
  undoMs: 5000,
  tapMs: 220,
  rewind: { type: 'spring', visualDuration: 0.35, bounce: 0 },
  spark: true,
}

const RING = {
  gap: 3, // px between button edge and fuse
  width: 2, // stroke px
}

const LABEL = {
  y: 8, // px labels slide
  spring: { type: 'spring' as const, visualDuration: 0.22, bounce: 0.1 },
}

const SHAKE = {
  x: [0, -5, 5, -3, 3, 0],
  transition: { duration: 0.34, ease: 'easeOut' as const },
}

const HINT = { ms: 1600 }

type Phase = 'idle' | 'holding' | 'undo'

interface Props {
  children: ReactNode // idle label, e.g. "Hold to delete"
  holdingLabel?: ReactNode
  onArm?: () => void // fired at the moment the fuse completes
  onCommit: () => void // fired when the undo window closes
  onUndo?: () => void
  tuning?: FuseTuning
}

export function Fuse({ children, holdingLabel = 'Keep holding', onArm, onCommit, onUndo, tuning = FUSE }: Props) {
  const [phase, setPhase] = useState<Phase>('idle')
  const [hint, setHint] = useState(false)
  const [box, setBox] = useState({ w: 0, h: 0, r: 0 })

  const burn = useMotionValue(0)
  const shakeX = useMotionValue(0)
  const run = useRef<AnimationPlaybackControls | null>(null)
  const pressedAt = useRef(0)
  const buttonRef = useRef<HTMLButtonElement>(null)
  const pathRef = useRef<SVGPathElement>(null)
  const sparkRef = useRef<SVGGElement>(null)
  const hintTimer = useRef<ReturnType<typeof setTimeout>>(undefined)
  const held = useRef(false) // pointer or key is physically down
  const swallowClick = useRef(false) // the release that follows an arm is not an Undo
  const hintId = useId()

  /* Measure the button (radius comes from the theme, so read it live). */
  const measure = useCallback(() => {
    const el = buttonRef.current
    if (!el) return
    const r = parseFloat(getComputedStyle(el).borderTopLeftRadius) || 0
    setBox({ w: el.offsetWidth, h: el.offsetHeight, r })
  }, [])

  useLayoutEffect(() => {
    measure()
    const ro = new ResizeObserver(measure)
    if (buttonRef.current) ro.observe(buttonRef.current)
    return () => ro.disconnect()
  }, [measure])

  useEffect(() => () => {
    run.current?.stop()
    clearTimeout(hintTimer.current)
  }, [])

  /* Spark rides the tip of the fuse. */
  // Round caps draw a dot even at length 0, so the lit path hides near zero.
  // The spark only shows while the fuse is actually burning (not rewinding).
  const phaseRef = useRef<Phase>('idle')
  phaseRef.current = phase
  useEffect(() => {
    return burn.on('change', (v) => {
      const path = pathRef.current
      if (!path) return
      path.style.opacity = v < 0.004 ? '0' : '1'
      const spark = sparkRef.current
      if (!spark) return
      const p = path.getPointAtLength(v * path.getTotalLength())
      spark.setAttribute('transform', `translate(${p.x} ${p.y})`)
      const burning = phaseRef.current !== 'idle' && v > 0.004 && v < 0.996
      spark.style.opacity = burning ? '1' : '0'
    })
  }, [burn])

  const start = () => {
    if (phase === 'undo') return
    measure()
    held.current = true
    swallowClick.current = false
    pressedAt.current = performance.now()
    setPhase('holding')
    setHint(false)
    run.current?.stop()
    run.current = animate(burn, 1, {
      duration: ((1 - burn.get()) * tuning.holdMs) / 1000,
      ease: 'linear',
      onComplete: arm,
    })
  }

  const release = () => {
    held.current = false
    // Any click this release produces fires in the same task; after that, clicks are real.
    if (swallowClick.current) setTimeout(() => (swallowClick.current = false), 0)
    if (phase !== 'holding') return
    run.current?.stop()
    setPhase('idle')
    run.current = animate(burn, 0, tuning.rewind)
    if (performance.now() - pressedAt.current < tuning.tapMs) {
      animate(shakeX, SHAKE.x, SHAKE.transition)
      setHint(true)
      clearTimeout(hintTimer.current)
      hintTimer.current = setTimeout(() => setHint(false), HINT.ms)
    }
  }

  function arm() {
    swallowClick.current = held.current
    setPhase('undo')
    onArm?.()
    burn.jump(1)
    run.current = animate(burn, 0, {
      duration: tuning.undoMs / 1000,
      ease: 'linear',
      onComplete: () => {
        setPhase('idle')
        onCommit()
      },
    })
  }

  const undo = () => {
    run.current?.stop()
    setPhase('idle')
    run.current = animate(burn, 0, tuning.rewind)
    onUndo?.()
    buttonRef.current?.focus()
  }

  const seconds = useTransform(burn, (v) => Math.max(1, Math.ceil((v * tuning.undoMs) / 1000)))

  /* Rounded-rect path starting at the left middle, running clockwise. */
  const o = RING.gap + RING.width / 2
  const W = box.w + o * 2
  const H = box.h + o * 2
  const R = Math.min(box.r + RING.gap, H / 2)
  const path = box.w
    ? [
        `M 0 ${H / 2}`,
        `L 0 ${R}`,
        `A ${R} ${R} 0 0 1 ${R} 0`,
        `L ${W - R} 0`,
        `A ${R} ${R} 0 0 1 ${W} ${R}`,
        `L ${W} ${H - R}`,
        `A ${R} ${R} 0 0 1 ${W - R} ${H}`,
        `L ${R} ${H}`,
        `A ${R} ${R} 0 0 1 0 ${H - R}`,
        'Z',
      ].join(' ')
    : ''

  const label = phase === 'holding' ? 'holding' : phase === 'undo' ? 'undo' : 'idle'

  return (
    <div className={s.wrap}>
      <motion.div className={s.buttonWrap} style={{ x: shakeX }}>
        <button
          ref={buttonRef}
          type="button"
          className={s.button}
          data-phase={phase}
          onPointerDown={(e) => {
            if (e.button !== 0 || phase === 'undo') return
            e.currentTarget.setPointerCapture(e.pointerId)
            start()
          }}
          onPointerUp={release}
          onPointerCancel={release}
          onKeyDown={(e) => {
            if (e.key !== ' ' && e.key !== 'Enter') return
            if (e.repeat) return e.preventDefault() // auto-repeat must never click Undo
            if (phase === 'undo') return // native click → undo
            e.preventDefault()
            start()
          }}
          onKeyUp={(e) => {
            if (e.key === ' ' || e.key === 'Enter') release()
          }}
          onBlur={release}
          onClick={() => {
            if (swallowClick.current) {
              swallowClick.current = false
              return
            }
            if (phase === 'undo') undo()
          }}
          onContextMenu={(e) => e.preventDefault()}
          aria-describedby={hint ? hintId : undefined}
        >
          <AnimatePresence mode="popLayout" initial={false}>
            <motion.span
              key={label}
              className={s.label}
              initial={{ opacity: 0, y: LABEL.y }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -LABEL.y }}
              transition={LABEL.spring}
            >
              {phase === 'idle' && children}
              {phase === 'holding' && holdingLabel}
              {phase === 'undo' && (
                <>
                  Undo <span className={s.count}>·</span> <motion.span className={s.count}>{seconds}</motion.span>
                </>
              )}
            </motion.span>
          </AnimatePresence>
        </button>

        {box.w > 0 && (
          <svg
            className={s.ring}
            width={W + RING.width}
            height={H + RING.width}
            viewBox={`${-RING.width / 2} ${-RING.width / 2} ${W + RING.width} ${H + RING.width}`}
            style={{ left: -o - RING.width / 2, top: -o - RING.width / 2 }}
            data-phase={phase}
            aria-hidden
          >
            <path d={path} className={s.cord} pathLength={1} />
            <motion.path ref={pathRef} d={path} className={s.lit} style={{ pathLength: burn }} />
            {tuning.spark && (
              <g ref={sparkRef} className={s.spark} style={{ opacity: 0 }}>
                <circle r={7} className={s.halo} />
                <circle r={2.5} className={s.core} />
              </g>
            )}
          </svg>
        )}
      </motion.div>

      <AnimatePresence>
        {hint && (
          <motion.p
            id={hintId}
            role="status"
            className={s.hint}
            initial={{ opacity: 0, y: -4 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -4 }}
            transition={LABEL.spring}
          >
            Press and hold to confirm
          </motion.p>
        )}
      </AnimatePresence>
    </div>
  )
}
