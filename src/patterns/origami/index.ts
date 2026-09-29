import type { PatternMeta } from '../types'
import { OrigamiDemo } from './OrigamiDemo'

export const origami: PatternMeta = {
  slug: 'origami',
  name: 'Origami',
  job: 'Navigation',
  tagline: 'Breadcrumbs that fold into pleats instead of collapsing to “…”.',
  try: 'Drag the window’s right edge inward, then hover the pleats.',
  summary:
    'Truncated breadcrumbs swap the middle of a path for an ellipsis, which hides how deep you are and turns every jump into two clicks. Origami folds middle folders into paper pleats, one pleat per folder, so depth stays countable, and hovering unfolds them in place, ready to click.',
  craft: [
    'Fold order follows how people navigate: the root and the last folders stay; the oldest middle folders fold first.',
    'Each pleat stands for exactly one folder. Four pleats means four levels, readable at a glance without opening anything.',
    'Natural widths come from an off-screen measuring row with identical styles, so folding decisions never guess at text size.',
    'Refolding waits a beat (peekDelay) after the pointer leaves, so a sloppy diagonal exit doesn’t slam the pleats shut.',
    'On touch the first tap unfolds and the second navigates. Hover is never a requirement.',
    'Pleats stay real buttons, so Tab walks through them, focus unfolds the group, and each one is labelled as folded.',
  ],
  keys: [
    { keys: ['Tab'], action: 'Walk crumbs (focus unfolds)' },
    { keys: ['←', '→'], action: 'Resize window (on grip)' },
  ],
  Demo: OrigamiDemo,
  source: 'origami/Origami.tsx',
}
