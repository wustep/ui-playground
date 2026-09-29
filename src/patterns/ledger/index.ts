import type { PatternMeta } from '../types'
import { LedgerDemo } from './LedgerDemo'

export const ledger: PatternMeta = {
  slug: 'ledger',
  name: 'Ledger',
  job: 'Progressive disclosure',
  tagline: 'A multi-step form that writes its own receipt as you go.',
  summary:
    'Wizards hide what’s ahead, then make you confirm everything again on a separate review page. Ledger shows every step as a receipt line from the start, opens one at a time as a card, folds each answer back into its line, and by the end the receipt already is the review.',
  craft: [
    'Future steps are visible as faint lines, so the length of the task is known before you begin.',
    'Answers fold back into the receipt. Progress shows up as the receipt filling in, not as a stepper counting down.',
    'Any line reopens in place. Change the party to 6 and the chef’s counter (max 4) goes stale, gets flagged in the receipt, and the flow routes you back to it.',
    'The step title glides into its receipt label on the same spring as the fold, so the card visibly becomes the line.',
    'The deposit line reacts live to party size and seating, and the confirm button quotes it, so the money is never a surprise.',
    'Focus follows the open card and Enter advances from inputs, so the whole flow works without a mouse.',
  ],
  keys: [
    { keys: ['Tab'], action: 'Move through the open step' },
    { keys: ['↵'], action: 'Continue (from inputs)' },
  ],
  Demo: LedgerDemo,
  source: 'ledger/Ledger.tsx',
}
