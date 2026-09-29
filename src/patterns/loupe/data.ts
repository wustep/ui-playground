import { seeded } from '../../lib/random'

export type Status = 'ready' | 'failed' | 'building' | 'canceled'

export interface Deploy {
  id: string
  message: string
  branch: string
  author: { name: string; initials: string; hue: number }
  status: Status
  ago: string
  hash: string
  adds: number
  dels: number
  checks: [passed: number, total: number]
  phases: [install: number, build: number, upload: number] // seconds
  error?: string
}

const MESSAGES = [
  'Fix hydration mismatch in header',
  'Cache font subsets at the edge',
  'Collapse settings into one sheet',
  'Tighten spacing on dense tables',
  'Ship keyboard shortcuts overlay',
  'Retry webhooks with backoff',
  'Replace date lib with Intl',
  'Stream search results as they land',
  'Remove legacy billing banner',
  'Add empty state to activity feed',
  'Batch analytics events on unload',
  'Upgrade image pipeline to AVIF',
  'Guard against double submit',
  'Prefetch next page on hover',
  'Localize error messages',
  'Trim cold start by 180ms',
]

// Explicit, so the demo always shows every state.
const STATUSES: Status[] = ['building', 'ready', 'failed', 'ready', 'ready', 'ready', 'canceled', 'ready',
  'ready', 'failed', 'ready', 'ready', 'ready', 'ready', 'ready', 'ready']
const BRANCHES = ['fix/hydration', 'perf/edge', 'feat/sheets', 'main', 'feat/shortcuts', 'main', 'main', 'main',
  'feat/search', 'main', 'main', 'perf/images', 'main', 'main', 'feat/i18n', 'perf/edge']
const PEOPLE = [
  { name: 'Jordan Mills', initials: 'JM', hue: 18 },
  { name: 'Ari Okafor', initials: 'AO', hue: 210 },
  { name: 'Sam Reyes', initials: 'SR', hue: 150 },
  { name: 'Noor Haddad', initials: 'NH', hue: 280 },
  { name: 'Lee Tanaka', initials: 'LT', hue: 45 },
]
const AGO = ['2m', '9m', '24m', '41m', '1h', '2h', '2h', '3h', '5h', '6h', '8h', '11h', '1d', '1d', '2d', '3d']
const ERRORS = [
  "Type error: 'user' is possibly undefined · src/app/header.tsx:42",
  'Build exceeded memory limit (3008 MB) during image optimization',
]

export function makeDeploys(): Deploy[] {
  const rand = seeded(7)
  let errorIndex = 0
  return MESSAGES.map((message, i) => {
    const status = STATUSES[i]
    const build = Math.round(28 + rand() * 90)
    const deploy: Deploy = {
      id: `d${i}`,
      message,
      branch: BRANCHES[i],
      author: PEOPLE[Math.floor(rand() * PEOPLE.length)],
      status,
      ago: AGO[i],
      hash: Math.floor(rand() * 0xfffffff)
        .toString(16)
        .padStart(7, '0'),
      adds: Math.round(4 + rand() * 260),
      dels: Math.round(rand() * 140),
      checks: status === 'failed' ? [9, 12] : status === 'building' ? [5, 12] : [12, 12],
      phases: [Math.round(6 + rand() * 18), build, Math.round(4 + rand() * 12)],
    }
    if (status === 'failed') deploy.error = ERRORS[errorIndex++ % ERRORS.length]
    return deploy
  })
}

export const fmtDuration = (sec: number) => (sec < 60 ? `${sec}s` : `${Math.floor(sec / 60)}m ${sec % 60}s`)
