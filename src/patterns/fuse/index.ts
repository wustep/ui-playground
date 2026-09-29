import type { PatternMeta } from '../types'
import { FuseDemo } from './FuseDemo'

export const fuse: PatternMeta = {
  slug: 'fuse',
  name: 'Fuse',
  job: 'Confirmation',
  tagline: 'Hold to commit. The same fuse then burns down as your undo window.',
  summary:
    'Confirmation dialogs get dismissed on reflex, and undo toasts appear somewhere your eyes aren’t. Fuse asks for a deliberate hold, shows progress where your finger already is, and turns the button itself into the undo, timed by the same fuse burning back down.',
  craft: [
    'One motion value tells the whole story: 0→1 while you hold, 1→0 while undo is possible. Direction is meaning.',
    'The hold is linear, not eased. When you are timing something, honest progress beats a nice curve.',
    'Let go early and the fuse rewinds on a spring. Nothing happened, and it looks like nothing happened.',
    'A quick tap shakes the button and explains the gesture, instead of silently ignoring you.',
    'The release that completes a hold can never trigger Undo by accident: pointer-up clicks, Space key-up and Enter auto-repeat are all swallowed.',
    'The ring’s radius is read from the live theme, so the fuse hugs a pill in Paper and a square in Volt.',
  ],
  keys: [
    { keys: ['Space'], action: 'Hold to commit' },
    { keys: ['↵'], action: 'Undo (while armed)' },
  ],
  Demo: FuseDemo,
  source: 'fuse/Fuse.tsx',
}
