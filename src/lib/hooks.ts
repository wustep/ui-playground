import { useEffect, useState } from 'react'

/** `#/slug` → 'slug'. Empty string is the index. */
export function useHashRoute(): string {
  const read = () => window.location.hash.replace(/^#\/?/, '')
  const [route, setRoute] = useState(read)
  useEffect(() => {
    const onChange = () => setRoute(read())
    window.addEventListener('hashchange', onChange)
    return () => window.removeEventListener('hashchange', onChange)
  }, [])
  return route
}

export function navigate(slug: string) {
  window.location.hash = slug ? `/${slug}` : '/'
}

/** Single-key shortcuts that stay out of the way of inputs and modified keys. */
export function useHotkeys(map: Record<string, () => void>) {
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.metaKey || e.ctrlKey || e.altKey || e.defaultPrevented) return
      const t = e.target as HTMLElement | null
      if (t && (t.isContentEditable || /^(INPUT|TEXTAREA|SELECT)$/.test(t.tagName))) return
      const fn = map[e.key.toLowerCase()]
      if (fn) {
        e.preventDefault()
        fn()
      }
    }
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [map])
}

export function useLocalState<T>(key: string, initial: T) {
  const [value, setValue] = useState<T>(() => {
    try {
      const raw = localStorage.getItem(key)
      return raw === null ? initial : (JSON.parse(raw) as T)
    } catch {
      return initial
    }
  })
  useEffect(() => {
    try {
      localStorage.setItem(key, JSON.stringify(value))
    } catch {
      /* storage blocked */
    }
  }, [key, value])
  return [value, setValue] as const
}

export function useMediaQuery(query: string) {
  const [matches, setMatches] = useState(() => window.matchMedia(query).matches)
  useEffect(() => {
    const mq = window.matchMedia(query)
    const onChange = () => setMatches(mq.matches)
    mq.addEventListener('change', onChange)
    return () => mq.removeEventListener('change', onChange)
  }, [query])
  return matches
}
