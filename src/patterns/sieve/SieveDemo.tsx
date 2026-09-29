import { useDials } from '../../lib/dials/store'
import { SIEVE, Sieve } from './Sieve'
import { PlantGlyph } from './PlantGlyph'
import { FILTERS, PLANTS, type Plant } from './data'
import s from './SieveDemo.module.css'

/* ─────────────────────────────────────────────────────────
 * DEMO · sixteen houseplants, four filters.
 * Try Pet-safe → Low light → Under $40, then read the tray.
 * ───────────────────────────────────────────────────────── */

const DIALS = {
  flight: SIEVE.flight,
  reflow: SIEVE.reflow,
  showCosts: SIEVE.showCosts,
} as const

export function SieveDemo() {
  const dials = useDials('Sieve', DIALS)
  return (
    <div className={`ui-card ${s.card}`}>
      <Sieve
        items={PLANTS}
        filters={FILTERS}
        noun={['plant', 'plants']}
        tuning={dials}
        renderTile={(p) => (
          <div className={s.tile}>
            <PlantGlyph plant={p} size={34} />
            <span className={s.name}>{p.name}</span>
            <span className={s.meta}>
              <span className={s.price}>${p.price}</span>
              <Traits plant={p} />
            </span>
          </div>
        )}
        renderToken={(p) => <PlantGlyph plant={p} size={20} />}
      />
    </div>
  )
}

/** Three tiny trait marks: paw (pet-safe), moon (low light), sprout (easy care). */
function Traits({ plant: p }: { plant: Plant }) {
  const marks = [
    p.petSafe && { key: 'pet', label: 'Pet-safe', d: PAW },
    p.light === 'low' && { key: 'low', label: 'Low light', d: MOON },
    p.care === 'easy' && { key: 'easy', label: 'Easy care', d: SPROUT },
  ].filter(Boolean) as { key: string; label: string; d: string }[]
  return (
    <span className={s.traits} aria-label={marks.map((m) => m.label).join(', ')}>
      {marks.map((m) => (
        <svg key={m.key} width="11" height="11" viewBox="0 0 12 12" aria-hidden>
          <title>{m.label}</title>
          <path d={m.d} fill="currentColor" stroke="currentColor" strokeWidth={m.key === 'easy' ? 1.1 : 0} strokeLinecap="round" />
        </svg>
      ))}
    </span>
  )
}

const PAW =
  'M6 6.2c1.6 0 3 1.5 3 2.9 0 1-.8 1.4-1.6 1.4-.6 0-.9-.3-1.4-.3s-.8.3-1.4.3C3.8 10.5 3 10.1 3 9.1 3 7.7 4.4 6.2 6 6.2ZM3.2 3.4c.6 0 1 .6 1 1.3s-.4 1.2-1 1.2-1-.6-1-1.2.4-1.3 1-1.3Zm5.6 0c.6 0 1 .6 1 1.3s-.4 1.2-1 1.2-1-.6-1-1.2.4-1.3 1-1.3ZM4.9 1.5c.6 0 1 .6 1 1.3S5.5 4 4.9 4s-1-.6-1-1.2.4-1.3 1-1.3Zm2.2 0c.6 0 1 .6 1 1.3S7.7 4 7.1 4s-1-.6-1-1.2.4-1.3 1-1.3Z'
const MOON = 'M7.6 1.3A4.8 4.8 0 1 0 10.7 9 3.9 3.9 0 0 1 7.6 1.3Z'
const SPROUT =
  'M6 11V6.5M6 6.5C6 4 4.3 2.5 1.8 2.5 1.8 5 3.5 6.5 6 6.5Zm0 0c0-2.2 1.5-3.6 4.2-3.6 0 2.4-1.7 3.6-4.2 3.6Z'
