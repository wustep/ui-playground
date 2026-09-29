import { useEffect, useMemo } from 'react'
import { AnimatePresence, MotionConfig, motion } from 'motion/react'
import { DialPanel } from './lib/dials/DialPanel'
import { navigate, useHashRoute, useHotkeys, useLocalState } from './lib/hooks'
import { PATTERNS, findPattern } from './patterns'
import { useTheme } from './themes'
import { Topbar } from './gallery/Topbar'
import { Sidebar } from './gallery/Sidebar'
import { PatternPage } from './gallery/PatternPage'
import { Home } from './gallery/Home'
import s from './gallery/Shell.module.css'

const PAGE = {
  offsetY: 10, // px pages rise from
  spring: { type: 'spring' as const, visualDuration: 0.32, bounce: 0 },
  exit: { duration: 0.12 },
}

export function App() {
  const route = useHashRoute()
  const pattern = findPattern(route)
  const { theme, setTheme, cycle } = useTheme()
  const [compare, setCompare] = useLocalState('uip:compare', false)
  const [dialsOpen, setDialsOpen] = useLocalState('uip:dials', false)

  useEffect(() => {
    window.scrollTo({ top: 0 })
  }, [route])

  const hotkeys = useMemo(() => {
    const step = (dir: number) => {
      const i = pattern ? PATTERNS.indexOf(pattern) : -1
      const next = PATTERNS[(i + dir + PATTERNS.length) % PATTERNS.length]
      navigate(next.slug)
    }
    return {
      t: cycle,
      c: () => setCompare((v) => !v),
      d: () => setDialsOpen((v) => !v),
      ']': () => step(1),
      '[': () => step(-1),
    }
  }, [cycle, pattern, setCompare, setDialsOpen])
  useHotkeys(hotkeys)

  return (
    <MotionConfig reducedMotion="user">
      <div className={s.shell}>
        <Topbar
          theme={theme}
          onTheme={setTheme}
          compare={compare}
          onCompare={() => setCompare((v) => !v)}
          dialsOpen={dialsOpen}
          onDials={() => setDialsOpen((v) => !v)}
        />
        <Sidebar active={pattern?.slug ?? ''} />
        <main className={s.main}>
          <AnimatePresence mode="wait" initial={false}>
            <motion.div
              key={pattern?.slug ?? 'home'}
              initial={{ opacity: 0, y: PAGE.offsetY }}
              animate={{ opacity: 1, y: 0, transition: PAGE.spring }}
              exit={{ opacity: 0, transition: PAGE.exit }}
            >
              {pattern ? <PatternPage pattern={pattern} compare={compare} /> : <Home />}
            </motion.div>
          </AnimatePresence>
        </main>
      </div>
      <DialPanel open={dialsOpen} onClose={() => setDialsOpen(false)} />
    </MotionConfig>
  )
}
