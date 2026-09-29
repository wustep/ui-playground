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

export interface PatternMeta {
  /** URL slug: #/slug */
  slug: string
  name: string
  job: Job
  /** One line, shown in the index. */
  tagline: string
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
