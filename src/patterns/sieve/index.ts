import type { PatternMeta } from '../types'
import { SieveDemo } from './SieveDemo'

export const sieve: PatternMeta = {
  slug: 'sieve',
  name: 'Sieve',
  job: 'Filtering',
  tagline: 'Filters that show what they cost, and where the results went.',
  summary:
    'Stack three filters, get zero results, and most UIs leave you guessing which one to drop. Sieve never makes anything vanish: excluded items travel into a tray grouped by the filter that caught them, every chip shows its cost before and after you press it, and the empty state names the culprit.',
  craft: [
    'Excluded tiles shrink into tray tokens through a shared layout transition, so you watch cause become effect instead of reading a count.',
    'Chips preview their cost: “−5” before you press, “+5” after. The sign says which way results will move.',
    'Attribution follows the order you turned filters on. The filter you added last is the one blamed for what it newly excluded.',
    'Each tray group is also its release button. The explanation doubles as the fix.',
    'At zero results the copy names the filter holding back the most and offers to drop it. A dead end becomes a next step.',
  ],
  keys: [
    { keys: ['Tab'], action: 'Move between filters' },
    { keys: ['Space'], action: 'Toggle filter / release group' },
  ],
  Demo: SieveDemo,
  source: 'sieve/Sieve.tsx',
}
