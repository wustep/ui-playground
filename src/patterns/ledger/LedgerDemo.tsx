import { useDials } from '../../lib/dials/store'
import { Inchworm } from '../inchworm/Inchworm'
import { LEDGER, Ledger, type LedgerStep } from './Ledger'
import s from './LedgerDemo.module.css'

/* ─────────────────────────────────────────────────────────
 * DEMO · booking a table. Four steps, one receipt.
 * The patio needs a deposit, so the total line reacts live
 * to both party size and seating.
 * ───────────────────────────────────────────────────────── */

interface Booking {
  guests: number
  day: 'tonight' | 'tomorrow' | 'fri' | 'sat'
  time: string | null
  seat: 'dining' | 'counter' | 'patio' | null
  name: string
  phone: string
}

const DAYS = [
  { value: 'tonight', label: 'Tonight' },
  { value: 'tomorrow', label: 'Tmrw' },
  { value: 'fri', label: 'Fri' },
  { value: 'sat', label: 'Sat' },
] as const

const TIMES = ['5:30', '6:00', '6:30', '7:00', '7:30', '8:00', '8:30', '9:00']
// Full slots differ per day, so switching days visibly changes availability.
const FULL: Record<Booking['day'], string[]> = {
  tonight: ['6:30', '7:00', '7:30'],
  tomorrow: ['7:00'],
  fri: ['6:30', '7:00', '7:30', '8:00'],
  sat: ['7:30', '8:00'],
}

const SEATS = [
  { value: 'dining', name: 'Dining room', note: 'Quiet, by the windows' },
  { value: 'counter', name: 'Chef’s counter', note: 'Watch the pass · max 4' },
  { value: 'patio', name: 'Garden patio', note: 'Heated · $10 deposit per guest' },
] as const

const DEPOSIT_PER_GUEST = 10
const MAX_GUESTS = 10

const INITIAL: Booking = { guests: 2, day: 'fri', time: null, seat: null, name: '', phone: '' }

const dayLabel = (d: Booking['day']) =>
  ({ tonight: 'Tonight', tomorrow: 'Tomorrow', fri: 'Fri', sat: 'Sat' })[d]

const STEPS: LedgerStep<Booking>[] = [
  {
    id: 'party',
    label: 'Party',
    title: 'How many guests?',
    summary: (v) => `${v.guests} ${v.guests === 1 ? 'guest' : 'guests'}`,
    valid: (v) => v.guests >= 1,
    render: (v, set) => (
      <div className={s.party}>
        <button
          className={s.stepBtn}
          onClick={() => set({ guests: Math.max(1, v.guests - 1) })}
          disabled={v.guests <= 1}
          aria-label="Fewer guests"
        >
          −
        </button>
        <output className={`t-numeral ${s.guests}`} aria-live="polite">
          {v.guests}
        </output>
        <button
          className={s.stepBtn}
          onClick={() => set({ guests: Math.min(MAX_GUESTS, v.guests + 1) })}
          disabled={v.guests >= MAX_GUESTS}
          aria-label="More guests"
        >
          +
        </button>
      </div>
    ),
  },
  {
    id: 'when',
    label: 'When',
    title: 'Pick a time',
    summary: (v) => `${dayLabel(v.day)} · ${v.time} pm`,
    valid: (v) => v.time !== null && !FULL[v.day].includes(v.time),
    render: (v, set) => (
      <div className={s.when}>
        <Inchworm
          label="Day"
          size="sm"
          options={DAYS}
          value={v.day}
          onChange={(day) => set({ day, time: v.time && FULL[day].includes(v.time) ? null : v.time })}
        />
        <div className={s.times} role="radiogroup" aria-label="Time">
          {TIMES.map((t) => {
            const full = FULL[v.day].includes(t)
            return (
              <button
                key={t}
                role="radio"
                aria-checked={v.time === t}
                disabled={full}
                className={`ui-chip ${s.time}`}
                data-full={full}
                onClick={() => set({ time: t })}
              >
                {t}
              </button>
            )
          })}
        </div>
      </div>
    ),
  },
  {
    id: 'seat',
    label: 'Seating',
    title: 'Where would you like to sit?',
    summary: (v) => SEATS.find((x) => x.value === v.seat)?.name ?? '',
    valid: (v) => v.seat !== null && !(v.seat === 'counter' && v.guests > 4),
    render: (v, set) => (
      <div className={s.seats} role="radiogroup" aria-label="Seating">
        {SEATS.map((seat) => {
          const blocked = seat.value === 'counter' && v.guests > 4
          return (
            <button
              key={seat.value}
              role="radio"
              aria-checked={v.seat === seat.value}
              disabled={blocked}
              className={s.seat}
              onClick={() => set({ seat: seat.value })}
            >
              <span className={s.radio} aria-hidden />
              <span className={s.seatName}>{seat.name}</span>
              <span className={s.seatNote}>{blocked ? `Not available for ${v.guests}` : seat.note}</span>
            </button>
          )
        })}
      </div>
    ),
  },
  {
    id: 'contact',
    label: 'Name',
    title: 'Who is the booking for?',
    summary: (v) => v.name.trim(),
    valid: (v) => v.name.trim().length >= 2 && v.phone.replace(/\D/g, '').length >= 7,
    render: (v, set) => (
      <div className={s.contact}>
        <label className={s.field}>
          <span className="t-label">Name</span>
          <input
            className="ui-input"
            value={v.name}
            onChange={(e) => set({ name: e.target.value })}
            placeholder="Sam Reyes"
            autoComplete="name"
          />
        </label>
        <label className={s.field}>
          <span className="t-label">Phone</span>
          <input
            className="ui-input"
            value={v.phone}
            onChange={(e) => set({ phone: e.target.value })}
            placeholder="(555) 014-2231"
            inputMode="tel"
            autoComplete="tel"
          />
        </label>
      </div>
    ),
  },
]

const DIALS = {
  fold: LEDGER.fold,
  stamp: LEDGER.stamp,
  leader: { type: 'select', options: ['dots', 'dashes', 'none'], default: LEDGER.leader },
} as const

export function LedgerDemo() {
  const dials = useDials('Ledger', DIALS)
  return (
    <div className={s.wrap}>
      <Ledger
        steps={STEPS}
        initial={INITIAL}
        tuning={dials}
        heading={
          <>
            <span className={`t-display ${s.venue}`}>Osteria Nove</span>
            <span className={s.venueMeta}>Table request · 14 Mercer St</span>
          </>
        }
        totals={(v) => {
          const deposit = v.seat === 'patio' ? v.guests * DEPOSIT_PER_GUEST : 0
          return { label: 'Deposit', value: `$${deposit.toFixed(2)}` }
        }}
        confirmLabel={(v) => (v.seat === 'patio' ? `Hold table · $${v.guests * DEPOSIT_PER_GUEST}` : 'Hold table')}
        confirmation="ON-4821"
      />
    </div>
  )
}
