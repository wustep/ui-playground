import { useId, useMemo, useState, type ReactNode } from 'react'
import { AnimatePresence, LayoutGroup, motion } from 'motion/react'
import type { Spring } from '../../lib/dials/store'
import s from './Sieve.module.css'

/* ─────────────────────────────────────────────────────────
 * SIEVE · filters that show what they cost
 *
 * Filtering usually just removes things, so you can't tell
 * which filter is starving your results. In Sieve, excluded
 * items physically travel into a tray, grouped under the
 * filter that caught them. Nothing disappears; it's held back.
 *
 *   toggle filter   excluded tiles shrink into tray tokens
 *                   (shared layout: tile → token, `flight`)
 *                   survivors reflow into the gaps (`reflow`)
 *                   emptied cells stay as faint slots: stable layout
 *   chip costs      inactive: −n it would hide
 *                   active:   +n it would bring back
 *   tray group      click to release that filter's plants
 *   zero results    names the filter to drop, and what it returns
 *
 * Attribution: an item is held by the first active filter it
 * fails, in the order you turned filters on.
 * ───────────────────────────────────────────────────────── */

export interface SieveTuning {
  flight: Spring // tile ↔ token travel
  reflow: Spring // survivors sliding into gaps
  showCosts: boolean
}

export const SIEVE: SieveTuning = {
  flight: { type: 'spring', visualDuration: 0.5, bounce: 0.12 },
  reflow: { type: 'spring', visualDuration: 0.38, bounce: 0.1 },
  showCosts: true,
}

export interface SieveFilter<T> {
  id: string
  label: string
  test: (item: T) => boolean
}

interface Props<T extends { id: string }> {
  items: readonly T[]
  filters: readonly SieveFilter<T>[]
  noun: [singular: string, plural: string]
  renderTile: (item: T) => ReactNode
  renderToken: (item: T) => ReactNode
  tuning?: SieveTuning
}

export function Sieve<T extends { id: string }>({
  items,
  filters,
  noun,
  renderTile,
  renderToken,
  tuning = SIEVE,
}: Props<T>) {
  const groupId = useId()
  const [active, setActive] = useState<string[]>([]) // activation order matters

  const model = useMemo(() => {
    const on = active.map((id) => filters.find((f) => f.id === id)!)
    const results = items.filter((it) => on.every((f) => f.test(it)))

    const held = on.map((f) => ({ filter: f, items: [] as T[] }))
    for (const it of items) {
      const i = on.findIndex((f) => !f.test(it))
      if (i >= 0) held[i].items.push(it)
    }

    // What toggling each filter would do to the current results.
    const cost = new Map<string, number>()
    for (const f of filters) {
      if (active.includes(f.id)) {
        const others = on.filter((o) => o.id !== f.id)
        cost.set(f.id, items.filter((it) => !f.test(it) && others.every((o) => o.test(it))).length)
      } else {
        cost.set(f.id, results.filter((it) => !f.test(it)).length)
      }
    }

    const release = on.length
      ? on.reduce((best, f) => (cost.get(f.id)! > cost.get(best.id)! ? f : best), on[0])
      : null

    return { results, held: held.filter((g) => g.items.length), cost, release }
  }, [active, filters, items])

  const toggle = (id: string) =>
    setActive((prev) => (prev.includes(id) ? prev.filter((x) => x !== id) : [...prev, id]))

  const count = model.results.length
  const heldCount = items.length - count

  return (
    <LayoutGroup id={groupId}>
      <div className={s.root}>
        <div className={s.bar}>
          <div className={s.chips} role="group" aria-label="Filters">
            {filters.map((f) => {
              const on = active.includes(f.id)
              const cost = model.cost.get(f.id)!
              return (
                <button
                  key={f.id}
                  className="ui-chip"
                  aria-pressed={on}
                  onClick={() => toggle(f.id)}
                  aria-label={`${f.label}: ${on ? `removing brings back ${cost}` : `hides ${cost}`}`}
                >
                  {f.label}
                  {tuning.showCosts && (
                    <span className={s.cost} data-on={on} data-zero={cost === 0}>
                      {on ? `+${cost}` : `−${cost}`}
                    </span>
                  )}
                </button>
              )
            })}
          </div>
          <p className={s.tally} aria-live="polite">
            <span className={s.tallyNum}>{count}</span> of {items.length} {items.length === 1 ? noun[0] : noun[1]}
          </p>
        </div>

        <div className={s.gridWrap}>
        <ul className={s.grid}>
          {model.results.map((it) => (
            // Tiles own `reflow` (sliding into gaps, and growing back out of the tray);
            // tokens own `flight` (the trip into the tray).
            <motion.li key={it.id} layoutId={it.id} className={s.tile} transition={tuning.reflow}>
              {renderTile(it)}
            </motion.li>
          ))}
          {/* Empty slots keep the grid's footprint, so the tray never jumps. */}
          {Array.from({ length: heldCount }, (_, i) => (
            <li key={`slot-${i}`} className={s.slot} aria-hidden />
          ))}
        </ul>

        <AnimatePresence>
          {count === 0 && model.release && (
            <motion.div
              className={s.empty}
              initial={{ opacity: 0, y: 6 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0 }}
              transition={tuning.reflow}
            >
              <p>
                Nothing fits all {active.length} filters. <strong>{model.release.label}</strong> is holding back{' '}
                {model.cost.get(model.release.id)}.
              </p>
              <button className="ui-btn" data-size="sm" onClick={() => toggle(model.release!.id)}>
                Drop {model.release.label}
              </button>
            </motion.div>
          )}
        </AnimatePresence>
        </div>

        <footer className={s.tray} aria-label="Held back">
          <span className={s.trayLabel}>
            Held back <span className={s.trayCount}>{heldCount}</span>
          </span>
          {model.held.length === 0 && <span className={s.trayEmpty}>Filters set aside what they exclude here.</span>}
          {model.held.map((g) => (
            <motion.button
              key={g.filter.id}
              layout
              transition={tuning.reflow}
              className={s.group}
              onClick={() => toggle(g.filter.id)}
              aria-label={`Release ${g.items.length} held back by ${g.filter.label}`}
              title={`Release ${g.filter.label}`}
            >
              <span className={s.groupLabel}>{g.filter.label}</span>
              <span className={s.tokens}>
                {g.items.map((it) => (
                  <motion.span key={it.id} layoutId={it.id} className={s.token} transition={tuning.flight}>
                    {renderToken(it)}
                  </motion.span>
                ))}
              </span>
              <span className={s.release} aria-hidden>
                ×
              </span>
            </motion.button>
          ))}
        </footer>
      </div>
    </LayoutGroup>
  )
}
