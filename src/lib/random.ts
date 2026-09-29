/** Deterministic PRNG so demo data is stable across reloads and themes. */
export function seeded(seed: number) {
  let t = seed >>> 0
  return () => {
    t += 0x6d2b79f5
    let r = Math.imul(t ^ (t >>> 15), 1 | t)
    r ^= r + Math.imul(r ^ (r >>> 7), 61 | r)
    return ((r ^ (r >>> 14)) >>> 0) / 4294967296
  }
}

export const clamp = (min: number, max: number, v: number) => Math.min(max, Math.max(min, v))
export const lerp = (a: number, b: number, t: number) => a + (b - a) * t
