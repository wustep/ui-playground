import { useMemo } from 'react'
import type { Spring } from './store'

const CURVE = {
  width: 72,
  height: 26,
  samples: 64,
  pad: 3,
}

/**
 * Plots a time-defined spring exactly as Motion resolves it:
 *   stiffness = (2π / (visualDuration × 1.2))²
 *   damping   = 2 × clamp(0.05, 1, 1 − bounce) × √stiffness     (mass 1)
 */
export function SpringCurve({ spring }: { spring: Spring }) {
  const { d, restY } = useMemo(() => {
    const k = ((2 * Math.PI) / (spring.visualDuration * 1.2)) ** 2
    const c = 2 * Math.min(1, Math.max(0.05, 1 - spring.bounce)) * Math.sqrt(k)
    const total = Math.max(spring.visualDuration * 2.2, 0.4)
    const dt = total / (CURVE.samples * 8)

    const points: number[] = []
    let x = 0
    let v = 0
    for (let i = 0; i <= CURVE.samples * 8; i++) {
      if (i % 8 === 0) points.push(x)
      const a = -k * (x - 1) - c * v
      v += a * dt
      x += v * dt
    }

    const peak = Math.max(1.15, ...points)
    const w = CURVE.width - CURVE.pad * 2
    const h = CURVE.height - CURVE.pad * 2
    const path = points
      .map((p, i) => {
        const px = CURVE.pad + (i / CURVE.samples) * w
        const py = CURVE.pad + h - (p / peak) * h
        return `${i === 0 ? 'M' : 'L'}${px.toFixed(1)} ${py.toFixed(1)}`
      })
      .join(' ')
    return { d: path, restY: CURVE.pad + h - h / peak }
  }, [spring.visualDuration, spring.bounce])

  return (
    <svg width={CURVE.width} height={CURVE.height} aria-hidden style={{ overflow: 'visible' }}>
      <line
        x1={CURVE.pad}
        x2={CURVE.width - CURVE.pad}
        y1={restY}
        y2={restY}
        stroke="var(--line)"
        strokeDasharray="2 2"
      />
      <path d={d} fill="none" stroke="var(--accent)" strokeWidth={1.5} strokeLinecap="round" />
    </svg>
  )
}
