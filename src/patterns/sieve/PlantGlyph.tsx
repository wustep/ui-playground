import type { Plant } from './data'

/** A tiny generated plant: a fan of leaves over a pot. Hue and leaf count vary per plant. */
export function PlantGlyph({ plant, size = 40 }: { plant: Plant; size?: number }) {
  const n = plant.leaves
  const spread = 110 // degrees across the fan
  const leaf = `oklch(0.68 0.14 ${plant.hue})`
  const vein = `oklch(0.52 0.12 ${plant.hue})`

  return (
    <svg width={size} height={size} viewBox="0 0 40 40" aria-hidden>
      {Array.from({ length: n }, (_, i) => {
        const angle = -spread / 2 + (spread / (n - 1)) * i
        const len = 13 + ((i * 7 + plant.hue) % 5)
        return (
          <g key={i} transform={`rotate(${angle} 20 25)`}>
            <ellipse cx={20} cy={25 - len / 2} rx={3.6} ry={len / 2} fill={leaf} />
            <line x1={20} y1={25} x2={20} y2={25 - len + 2} stroke={vein} strokeWidth={0.8} />
          </g>
        )
      })}
      <path d="M12 25 H28 L26 36 H14 Z" fill="var(--sunken)" stroke="var(--edge)" strokeWidth={1} />
      <rect x={11} y={23.5} width={18} height={3} rx={1} fill="var(--surface-2)" stroke="var(--edge)" strokeWidth={1} />
    </svg>
  )
}
