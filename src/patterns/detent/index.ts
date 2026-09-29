import type { PatternMeta } from '../types'
import { DetentDemo } from './DetentDemo'

export const detent: PatternMeta = {
  slug: 'detent',
  name: 'Detent',
  job: 'Input',
  tagline: 'Numeric fields you scrub, with stops that click like hardware.',
  try: 'Drag Size slowly past 32, then flick it. Or click a field and type.',
  summary:
    'Typing numbers is precise but slow; sliders are fast but eat space and hide the value. Detent keeps a compact field, unfurls a ruler only while you drag, and gives the values that matter a physical click, so you can land on 16px by feel.',
  craft: [
    'The ruler exists only during the gesture. At rest the field is as small as a text input.',
    'Detents hold the value for a few pixels of travel, then release. The needle pulses (and phones buzz) on entry, so you feel the stop without looking.',
    'Gain follows hand speed: slow drags move in fine steps, flicks cover the range. Your hand sets the precision, no modifier needed.',
    'Past min or max the ruler rubber-bands instead of stopping dead, so the limit reads as a limit, not a bug.',
    'Click without dragging to type. PgUp and PgDn jump between detents, so the keyboard gets the same stops.',
  ],
  keys: [
    { keys: ['↑', '↓'], action: 'Step' },
    { keys: ['⇧', '↑'], action: 'Step ×10' },
    { keys: ['PgUp', 'PgDn'], action: 'Next / previous detent' },
    { keys: ['↵'], action: 'Type a value' },
  ],
  Demo: DetentDemo,
  source: 'detent/Detent.tsx',
}
