import type { PatternMeta } from '../types'
import { InchwormDemo } from './InchwormDemo'

export const inchworm: PatternMeta = {
  slug: 'inchworm',
  name: 'Inchworm',
  job: 'Selection',
  tagline: 'A segmented control whose pill stretches, then gathers itself.',
  try: 'Click Year, then Day. Watch which edge leads and where the label flips colour.',
  summary:
    'Segmented controls usually teleport or slide a rigid pill, so the eye loses the thread between old and new. Inchworm drives each edge on its own spring: the leading edge reaches, the trailing edge follows, and the labels invert exactly where the pill overlaps them.',
  craft: [
    'Two springs, one per edge. Direction decides which edge gets the stiff one.',
    'A duplicate label layer is clipped to the pill, so text changes color at the pill’s edge mid-flight instead of cross-fading.',
    'The pill thins slightly in proportion to its stretch, conserving a sense of mass.',
    'Pressing an option leans the near edge toward it before you release: anticipation that makes the control feel like it heard you.',
    'Roving tabindex + radiogroup semantics; selection follows focus like a native radio set.',
  ],
  keys: [
    { keys: ['←', '→'], action: 'Move selection' },
    { keys: ['Home', 'End'], action: 'First / last' },
  ],
  Demo: InchwormDemo,
  source: 'inchworm/Inchworm.tsx',
}
