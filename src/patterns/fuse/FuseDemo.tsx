import { useState } from 'react'
import { AnimatePresence, motion } from 'motion/react'
import { useDials } from '../../lib/dials/store'
import { FUSE, Fuse } from './Fuse'
import s from './FuseDemo.module.css'

/* ─────────────────────────────────────────────────────────
 * DEMO · a project's danger zone
 *
 *   live      project row at rest
 *   pending   fuse armed: row dims, name is struck through,
 *             button offers Undo while the fuse burns down
 *   deleted   card body swaps to a quiet confirmation
 * ───────────────────────────────────────────────────────── */

type State = 'live' | 'pending' | 'deleted'

const PROJECT = { name: 'Atlas', meta: ['128 files', '3 collaborators', '2.4 GB'] }

const SWAP = {
  spring: { type: 'spring' as const, visualDuration: 0.4, bounce: 0.08 },
  y: 10,
}

const STRIKE = {
  spring: { type: 'spring' as const, visualDuration: 0.45, bounce: 0 },
}

const DIALS = {
  holdMs: [FUSE.holdMs, 400, 3000, 50],
  undoMs: [FUSE.undoMs, 2000, 10000, 250],
  tapMs: [FUSE.tapMs, 0, 500, 10],
  rewind: FUSE.rewind,
  spark: FUSE.spark,
} as const

export function FuseDemo() {
  const dials = useDials('Fuse', DIALS)
  const [state, setState] = useState<State>('live')
  const [announce, setAnnounce] = useState('')

  return (
    <div className={`ui-card ${s.card}`}>
      <p className="sr-only" role="status" aria-live="polite">
        {announce}
      </p>
      <AnimatePresence mode="wait" initial={false}>
        {state !== 'deleted' ? (
          <motion.div
            key="settings"
            initial={{ opacity: 0, y: -SWAP.y }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: SWAP.y, transition: { duration: 0.15 } }}
            transition={SWAP.spring}
          >
            <div className={s.project} data-pending={state === 'pending'}>
              <span className={s.avatar} aria-hidden>
                A
              </span>
              <div className={s.projectText}>
                <span className={s.name}>
                  {PROJECT.name}
                  <motion.span
                    className={s.strike}
                    initial={false}
                    animate={{ scaleX: state === 'pending' ? 1 : 0 }}
                    transition={STRIKE.spring}
                    aria-hidden
                  />
                </span>
                <span className={s.meta}>{PROJECT.meta.join(' · ')}</span>
              </div>
              <AnimatePresence>
                {state === 'pending' && (
                  <motion.span
                    className={s.badge}
                    initial={{ opacity: 0, scale: 0.9 }}
                    animate={{ opacity: 1, scale: 1 }}
                    exit={{ opacity: 0, scale: 0.9 }}
                    transition={SWAP.spring}
                  >
                    Deleting
                  </motion.span>
                )}
              </AnimatePresence>
            </div>

            <div className={s.danger}>
              <div>
                <h3 className={s.dangerTitle}>Delete project</h3>
                <p className={s.dangerBody}>Removes every file, its history, and all share links.</p>
              </div>
              <Fuse
                tuning={dials}
                onArm={() => {
                  setState('pending')
                  setAnnounce(`${PROJECT.name} will be deleted. Undo available for ${Math.round(dials.undoMs / 1000)} seconds.`)
                }}
                onUndo={() => {
                  setState('live')
                  setAnnounce(`${PROJECT.name} restored.`)
                }}
                onCommit={() => {
                  setState('deleted')
                  setAnnounce(`${PROJECT.name} deleted.`)
                }}
              >
                Hold to delete
              </Fuse>
            </div>
          </motion.div>
        ) : (
          <motion.div
            key="deleted"
            className={s.done}
            initial={{ opacity: 0, y: -SWAP.y }}
            animate={{ opacity: 1, y: 0 }}
            transition={SWAP.spring}
          >
            <span className={s.doneMark} aria-hidden>
              <svg width="16" height="16" viewBox="0 0 16 16" fill="none">
                <path d="M3.5 8.5l3 3 6-7" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" />
              </svg>
            </span>
            <div>
              <h3 className={s.dangerTitle}>{PROJECT.name} was deleted</h3>
              <p className={s.dangerBody}>Share links now return 404. Collaborators have been notified.</p>
            </div>
            <button className="ui-btn" data-size="sm" onClick={() => setState('live')}>
              Bring it back
            </button>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  )
}
