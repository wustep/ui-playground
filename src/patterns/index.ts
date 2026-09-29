import type { PatternMeta } from './types'
import { inchworm } from './inchworm'
import { detent } from './detent'
import { fuse } from './fuse'

/** Gallery order. Add a pattern: create a folder, export its meta, list it here. */
export const PATTERNS: PatternMeta[] = [inchworm, detent, fuse]

export const findPattern = (slug: string) => PATTERNS.find((p) => p.slug === slug)
export const numberOf = (p: PatternMeta) => String(PATTERNS.indexOf(p) + 1).padStart(2, '0')
