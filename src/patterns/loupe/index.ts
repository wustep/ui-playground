import type { PatternMeta } from '../types'
import { LoupeDemo } from './LoupeDemo'

export const loupe: PatternMeta = {
  slug: 'loupe',
  name: 'Loupe',
  job: 'Data density',
  tagline: 'Scan sixteen rows at a glance; the one you’re on opens itself.',
  summary:
    'Dense lists make you choose between overview (one line per row) and detail (click to open, lose your place). Loupe keeps every row one line tall and magnifies only where you are looking, so you can sweep the whole list and read each item’s detail without a single click.',
  craft: [
    'Emphasis falls off by distance in opacity, not scale. Scaling text blurs it and shifts layout; opacity keeps the fisheye readable.',
    'Rows resize under a still cursor, so only real pointer movement moves the loupe. Otherwise the list would chase itself.',
    'Moving your pointer off the list leaves the loupe where it was. Pointing away isn’t a request to forget.',
    'The rail marker reads the focused row’s live box every frame and follows on its own softer spring, so it glides instead of jumping.',
    'Build bars share one scale (the slowest deploy), so sweeping the loupe becomes a comparison, not just a reveal.',
    'Full listbox semantics with aria-activedescendant: ↑↓, PgUp/PgDn and Home/End work, and screen readers announce the active row.',
  ],
  keys: [
    { keys: ['↑', '↓'], action: 'Move the loupe' },
    { keys: ['PgUp', 'PgDn'], action: 'Jump 5 rows' },
    { keys: ['Home', 'End'], action: 'First / last' },
  ],
  Demo: LoupeDemo,
  source: 'loupe/Loupe.tsx',
}
