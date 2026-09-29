import { useEffect, useSyncExternalStore } from 'react'

/* ─────────────────────────────────────────────────────────
 * DIALS
 *
 * Live tuning for any pattern. Declare a schema next to your
 * config constants, read values back, and the gallery's Dials
 * panel renders controls for every mounted schema.
 *
 *   const dials = useDials('Fuse', {
 *     holdMs:  [1100, 400, 3000, 50],             // slider: default, min, max, step?
 *     spark:   true,                              // toggle
 *     spring:  { type: 'spring', visualDuration: 0.4, bounce: 0.2 },
 *     shape:   { type: 'select', options: ['pill', 'block'], default: 'pill' },
 *     replay:  { type: 'action' },                // counter: bumps on click
 *   })
 *
 * Instances with the same name share values, so tuning one
 * copy tunes every copy (all compare columns move together).
 * ───────────────────────────────────────────────────────── */

export type SliderDef = readonly [number, number, number] | readonly [number, number, number, number]
export type SpringDef = { readonly type: 'spring'; readonly visualDuration: number; readonly bounce: number }
export type SelectDef = {
  readonly type: 'select'
  readonly options: readonly string[]
  readonly default: string
}
export type ActionDef = { readonly type: 'action'; readonly label?: string }
export type DialDef = SliderDef | boolean | SpringDef | SelectDef | ActionDef
export type DialSchema = Record<string, DialDef>

export type Spring = { type: 'spring'; visualDuration: number; bounce: number }

export type DialValue<D> = D extends readonly number[]
  ? number
  : D extends boolean
    ? boolean
    : D extends { type: 'spring' }
      ? Spring
      : D extends { type: 'select'; options: readonly (infer O)[] }
        ? O
        : D extends { type: 'action' }
          ? number
          : never

export type DialValues<S extends DialSchema> = { -readonly [K in keyof S]: DialValue<S[K]> }

type Values = Record<string, unknown>

export interface Panel {
  name: string
  schema: DialSchema
  values: Values
  mounts: number
  order: number
}

/* ── Schema helpers ─────────────────────────────────────── */

export const isSlider = (d: DialDef): d is SliderDef => Array.isArray(d)
const typeOf = (d: DialDef) => (typeof d === 'object' && 'type' in d ? d.type : undefined)
export const isSpring = (d: DialDef): d is SpringDef => typeOf(d) === 'spring'
export const isSelect = (d: DialDef): d is SelectDef => typeOf(d) === 'select'
export const isAction = (d: DialDef): d is ActionDef => typeOf(d) === 'action'

function defaultFor(def: DialDef): unknown {
  if (isSlider(def)) return def[0]
  if (typeof def === 'boolean') return def
  if (isSpring(def)) return { type: 'spring', visualDuration: def.visualDuration, bounce: def.bounce }
  if (isSelect(def)) return def.default
  return 0 // action counter
}

export function defaultsOf(schema: DialSchema): Values {
  const out: Values = {}
  for (const key of Object.keys(schema)) out[key] = defaultFor(schema[key])
  return out
}

/* ── Store ──────────────────────────────────────────────── */

const panels = new Map<string, Panel>()
const listeners = new Set<() => void>()
let mountedSnapshot: Panel[] = []
let orderSeq = 0

function emit() {
  mountedSnapshot = [...panels.values()].filter((p) => p.mounts > 0).sort((a, b) => a.order - b.order)
  listeners.forEach((l) => l())
}

function subscribe(listener: () => void) {
  listeners.add(listener)
  return () => listeners.delete(listener)
}

function ensure(name: string, schema: DialSchema): Panel {
  let panel = panels.get(name)
  if (!panel) {
    panel = { name, schema, values: defaultsOf(schema), mounts: 0, order: orderSeq++ }
    panels.set(name, panel)
  } else if (panel.schema !== schema) {
    // Schema edited (HMR) or declared inline: keep tuned values, add new keys.
    const defaults = defaultsOf(schema)
    const merged: Values = {}
    for (const key of Object.keys(schema)) merged[key] = key in panel.values ? panel.values[key] : defaults[key]
    panel.schema = schema
    const prevKeys = Object.keys(panel.values)
    const nextKeys = Object.keys(merged)
    if (prevKeys.length !== nextKeys.length || nextKeys.some((k) => !(k in panel!.values))) {
      panel.values = merged
    }
  }
  return panel
}

export const dials = {
  set(name: string, key: string, value: unknown) {
    const panel = panels.get(name)
    if (!panel) return
    panel.values = { ...panel.values, [key]: value }
    emit()
  },
  trigger(name: string, key: string) {
    const panel = panels.get(name)
    if (!panel) return
    panel.values = { ...panel.values, [key]: ((panel.values[key] as number) ?? 0) + 1 }
    emit()
  },
  reset(name: string) {
    const panel = panels.get(name)
    if (!panel) return
    const defaults = defaultsOf(panel.schema)
    // Actions keep counting so a reset never re-fires a replay.
    for (const key of Object.keys(panel.schema)) {
      if (isAction(panel.schema[key])) defaults[key] = panel.values[key]
    }
    panel.values = defaults
    emit()
  },
  /** Serialize current values as a paste-ready config literal. */
  serialize(name: string): string {
    const panel = panels.get(name)
    if (!panel) return ''
    const lines = Object.keys(panel.schema)
      .filter((key) => !isAction(panel.schema[key]))
      .map((key) => {
        const v = panel.values[key]
        if (isSpring(panel.schema[key])) {
          const s = v as Spring
          return `  ${key}: { type: 'spring', visualDuration: ${round(s.visualDuration)}, bounce: ${round(s.bounce)} },`
        }
        return `  ${key}: ${typeof v === 'string' ? `'${v}'` : typeof v === 'number' ? round(v) : String(v)},`
      })
    return `const ${constName(name)} = {\n${lines.join('\n')}\n}`
  },
}

const round = (n: number) => Math.round(n * 1000) / 1000
const constName = (name: string) =>
  name
    .replace(/[^a-z0-9]+/gi, '_')
    .replace(/^_|_$/g, '')
    .toUpperCase()

/* ── Hooks ──────────────────────────────────────────────── */

export function useDials<const S extends DialSchema>(name: string, schema: S): DialValues<S> {
  ensure(name, schema)

  useEffect(() => {
    const panel = ensure(name, schema)
    panel.mounts++
    emit()
    return () => {
      panel.mounts--
      emit()
    }
    // The schema is a module constant in practice; keying on name is enough.
  }, [name])

  return useSyncExternalStore(
    subscribe,
    () => panels.get(name)!.values,
    () => panels.get(name)!.values,
  ) as DialValues<S>
}

export function useMountedPanels(): Panel[] {
  return useSyncExternalStore(
    subscribe,
    () => mountedSnapshot,
    () => mountedSnapshot,
  )
}
