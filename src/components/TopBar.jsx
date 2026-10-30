import React, { useEffect, useState } from 'react'
import { site } from '../data/site.js'

function useElapsed() {
  const [ms, setMs] = useState(null)
  useEffect(() => {
    const tick = () => setMs(performance.now())
    tick()
    const id = setInterval(tick, 1000)
    return () => clearInterval(id)
  }, [])
  return ms
}

const clock = (ms) => {
  const s = Math.floor(ms / 1000)
  return `${String(Math.floor(s / 60)).padStart(2, '0')}:${String(s % 60).padStart(2, '0')}`
}

export default function TopBar() {
  const ms = useElapsed()
  return (
    <header className="topbar">
      <a className="topbar-name" href="#top">
        {site.name}
      </a>
      <p className="topbar-rec" aria-label="Time on this page">
        <span className="rec-dot" aria-hidden="true" />
        Rec <time suppressHydrationWarning>{ms == null ? '00:00' : clock(ms)}</time>
      </p>
      <nav className="topbar-nav" aria-label="Sections">
        {site.nav.map((item) => (
          <a key={item.href} href={item.href}>
            {item.label}
          </a>
        ))}
      </nav>
    </header>
  )
}
