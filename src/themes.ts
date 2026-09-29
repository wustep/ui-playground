import { useCallback, useEffect, useState } from 'react'

export const THEMES = [
  { id: 'paper', label: 'Paper', note: 'Editorial print', ground: '#efebe2', mark: '#2f3fe0' },
  { id: 'ink', label: 'Ink', note: 'Night instrument', ground: '#0a0b0d', mark: '#ffab3d' },
  { id: 'volt', label: 'Volt', note: 'Poster', ground: '#2233ee', mark: '#d8ff3a' },
] as const

export type ThemeId = (typeof THEMES)[number]['id']

const KEY = 'uip:theme'

function initialTheme(): ThemeId {
  try {
    const saved = localStorage.getItem(KEY)
    if (THEMES.some((t) => t.id === saved)) return saved as ThemeId
  } catch {
    /* storage blocked */
  }
  return window.matchMedia?.('(prefers-color-scheme: dark)').matches ? 'ink' : 'paper'
}

export function useTheme() {
  const [theme, setTheme] = useState<ThemeId>(initialTheme)

  useEffect(() => {
    document.documentElement.dataset.theme = theme
    const meta = document.querySelector('meta[name="theme-color"]')
    meta?.setAttribute('content', THEMES.find((t) => t.id === theme)!.ground)
    try {
      localStorage.setItem(KEY, theme)
    } catch {
      /* storage blocked */
    }
  }, [theme])

  const cycle = useCallback(() => {
    setTheme((t) => THEMES[(THEMES.findIndex((x) => x.id === t) + 1) % THEMES.length].id)
  }, [])

  return { theme, setTheme, cycle }
}
