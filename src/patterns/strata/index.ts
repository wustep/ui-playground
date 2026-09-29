import type { PatternMeta } from '../types'
import { StrataDemo } from './StrataDemo'

export const strata: PatternMeta = {
  slug: 'strata',
  name: 'Strata',
  job: 'Feedback',
  tagline: 'Toasts that settle into sediment instead of vanishing.',
  try: 'Press Publish, let it settle, then hover the coloured bands.',
  summary:
    'Auto-dismissing toasts are gone before you look up, and an error that disappears is an error you never saw. Strata lets each toast have its moment, then compresses it into a thin band coloured by severity. The bands pile into a glanceable history that opens back up into readable rows on hover.',
  craft: [
    'Nothing is thrown away. A toast becomes a band through a shared layout transition: the paper fades as the ink fades in.',
    'Sediment compacts. The newest bands are thicker and brighter; older ones thin to 2px and fade, so recency reads without timestamps.',
    'Errors stay up twice as long and settle unread: a taller, hatched band plus a count that doesn’t go away until you look.',
    'A hairline under each toast drains toward the moment it settles. Hover to pause every clock.',
    'Open the strata and each band grows back into its row via the same layoutId. Excavation is the reverse of settling.',
    'Everything stays inside the app frame, anchored to its corner, so the history is where your eyes already go for toasts.',
  ],
  keys: [
    { keys: ['Tab'], action: 'Reach the history' },
    { keys: ['↵'], action: 'Open / close history' },
    { keys: ['Esc'], action: 'Close history' },
  ],
  Demo: StrataDemo,
  source: 'strata/Strata.tsx',
}
