import type { ComponentType } from 'react'

export type Job =
  | 'Selection'
  | 'Input'
  | 'Confirmation'
  | 'Data density'
  | 'Filtering'
  | 'Progressive disclosure'
  | 'Navigation'
  | 'Feedback'

/** Compact labels where space is tight (sidebar). */
export const JOB_SHORT: Partial<Record<Job, string>> = {
  'Progressive disclosure': 'Disclosure',
}

export interface PatternMeta {
  /** URL slug: #/slug */
  slug: string
  name: string
  job: Job
  /** One line, shown in the index. */
  tagline: string
  /** An instruction that sets up the pattern's key moment. Shown above the stage. */
  try: string
  /** The problem, then the move. Two sentences max. */
  summary: string
  /** Specific details that make it feel right. */
  craft: string[]
  keys?: { keys: string[]; action: string }[]
  /** The live demo. Must be self-contained: no portals, no globals. */
  Demo: ComponentType
  /** Path under src/patterns, for the source link. */
  source: string
}
