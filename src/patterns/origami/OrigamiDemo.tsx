import { useRef, useState, type KeyboardEvent, type PointerEvent } from 'react'
import { AnimatePresence, motion } from 'motion/react'
import { useDials } from '../../lib/dials/store'
import { ORIGAMI, Origami } from './Origami'
import { START_PATH, nodeAt } from './tree'
import s from './OrigamiDemo.module.css'

/* ─────────────────────────────────────────────────────────
 * DEMO · a file browser eight folders deep, in a window you
 * can narrow by dragging its right edge.
 *
 *   drag edge    breadcrumbs fold / unfold live
 *   open folder  a crumb grows in; list rows stagger in (24ms)
 * ───────────────────────────────────────────────────────── */

const WINDOW = {
  min: 240, // px
  max: 640,
  keyStep: 24, // px per arrow press on the grip
}

const LIST = {
  stagger: 0.024,
  y: 6,
  spring: { type: 'spring' as const, visualDuration: 0.3, bounce: 0 },
}

const DIALS = {
  pleatPx: [ORIGAMI.pleatPx, 3, 18, 1],
  foldAngle: [ORIGAMI.foldAngle, 0, 80, 1],
  peekDelay: [ORIGAMI.peekDelay, 0, 800, 10],
  fold: ORIGAMI.fold,
} as const

export function OrigamiDemo() {
  const dials = useDials('Origami', DIALS)
  const [path, setPath] = useState(START_PATH)
  const [width, setWidth] = useState<number>(WINDOW.max)
  const drag = useRef<{ x: number; w: number } | null>(null)
  const node = nodeAt(path)
  const children = node.children ?? []

  const onGripDown = (e: PointerEvent<HTMLDivElement>) => {
    e.currentTarget.setPointerCapture(e.pointerId)
    const current = e.currentTarget.parentElement!.offsetWidth
    drag.current = { x: e.clientX, w: current }
  }
  const onGripMove = (e: PointerEvent<HTMLDivElement>) => {
    if (!drag.current) return
    setWidth(Math.max(WINDOW.min, Math.min(WINDOW.max, drag.current.w + (e.clientX - drag.current.x) * 2)))
  }
  const onGripKey = (e: KeyboardEvent) => {
    const d = e.key === 'ArrowLeft' ? -WINDOW.keyStep : e.key === 'ArrowRight' ? WINDOW.keyStep : 0
    if (!d) return
    e.preventDefault()
    setWidth((w) => Math.max(WINDOW.min, Math.min(WINDOW.max, w + d)))
  }

  return (
    <div className={s.frame}>
      <div className={`ui-card ${s.window}`} style={{ width }}>
        <header className={s.bar}>
          <Origami path={path} onNavigate={(i) => setPath((p) => p.slice(0, i + 1))} tuning={dials} />
        </header>

        <AnimatePresence mode="popLayout" initial={false}>
          <motion.ul key={path.join('/')} className={s.list} exit={{ opacity: 0, transition: { duration: 0.1 } }}>
            {children.map((c, i) => {
              const isFolder = c.kind !== 'file'
              return (
                <motion.li
                  key={c.name}
                  initial={{ opacity: 0, y: LIST.y }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ ...LIST.spring, delay: i * LIST.stagger }}
                >
                  <button
                    className={s.entry}
                    disabled={!isFolder}
                    onClick={() => isFolder && setPath((p) => [...p, c.name])}
                  >
                    {isFolder ? <FolderIcon /> : <FileIcon />}
                    <span className={s.entryName}>{c.name}</span>
                    {isFolder && <span className={s.count}>{c.children?.length ?? 0}</span>}
                  </button>
                </motion.li>
              )
            })}
          </motion.ul>
        </AnimatePresence>

        <div
          className={s.grip}
          role="separator"
          aria-orientation="vertical"
          aria-label="Window width"
          aria-valuemin={WINDOW.min}
          aria-valuemax={WINDOW.max}
          aria-valuenow={Math.round(width)}
          tabIndex={0}
          onPointerDown={onGripDown}
          onPointerMove={onGripMove}
          onPointerUp={() => (drag.current = null)}
          onPointerCancel={() => (drag.current = null)}
          onKeyDown={onGripKey}
        >
          <span />
        </div>
      </div>
      <p className={s.hint}>Drag the window’s edge ↔ · hover the pleats</p>
    </div>
  )
}

function FolderIcon() {
  return (
    <svg width="16" height="16" viewBox="0 0 16 16" fill="none" aria-hidden>
      <path
        d="M1.75 4.25c0-.83.67-1.5 1.5-1.5h3l1.5 1.5h5c.83 0 1.5.67 1.5 1.5v6c0 .83-.67 1.5-1.5 1.5h-9.5c-.83 0-1.5-.67-1.5-1.5v-7.5Z"
        fill="var(--accent-soft)"
        stroke="var(--accent-ink)"
        strokeWidth="1.2"
      />
    </svg>
  )
}

function FileIcon() {
  return (
    <svg width="16" height="16" viewBox="0 0 16 16" fill="none" aria-hidden>
      <path
        d="M3.75 1.75h5.5l3 3v9.5H3.75v-12.5Z"
        fill="var(--surface-2)"
        stroke="var(--fg-3)"
        strokeWidth="1.2"
        strokeLinejoin="round"
      />
      <path d="M9.25 1.75v3h3" stroke="var(--fg-3)" strokeWidth="1.2" strokeLinejoin="round" />
    </svg>
  )
}
