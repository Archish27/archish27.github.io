import React, { useEffect, useRef } from 'react'
import EventStream from './EventStream.jsx'
import { site } from '../data/site.js'
import { driver } from '../session.js'

const LINES = ['Archish', 'Thakkar']
const THIN = 300 // Satoshi's lightest weight
const HEAVY = 900
const REACH = 300 // px within which a letter feels the heat

// Each letter swells from hairline to heavy as heat is laid down near it, and
// relaxes back as it cools. Server-rendered at rest, so it reads without JS.
function useHeatWeight(ref) {
  useEffect(() => {
    if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) return
    const letters = [...ref.current.querySelectorAll('.ch')]
    const weights = letters.map(() => THIN)
    let centers = []
    const measure = () => {
      centers = letters.map((el) => {
        const r = el.getBoundingClientRect()
        return [r.left + r.width / 2, r.top + window.scrollY + r.height * 0.55]
      })
    }
    measure()
    document.fonts?.ready.then(measure)
    const ro = new ResizeObserver(measure)
    ro.observe(ref.current)

    let raf = 0
    let visible = true
    const io = new IntersectionObserver(([e]) => {
      visible = e.isIntersecting
      if (visible && !raf) raf = requestAnimationFrame(tick)
    })
    io.observe(ref.current)

    let frames = 0
    const tick = () => {
      raf = 0
      if (!visible) return
      const sy = window.scrollY
      letters.forEach((el, i) => {
        let target = THIN
        if (driver.on) {
          const d = Math.hypot(centers[i][0] - driver.x, centers[i][1] - sy - driver.y)
          const f = Math.max(0, 1 - d / REACH)
          target = THIN + (HEAVY - THIN) * f * f * (3 - 2 * f)
        }
        // Swell fast, cool slowly.
        const rate = target > weights[i] ? 0.22 : 0.035
        weights[i] += (target - weights[i]) * rate
        el.style.fontVariationSettings = `'wght' ${weights[i].toFixed(0)}`
      })
      // Re-measure now and then: swelling letters push their neighbours along.
      if (++frames % 20 === 0) measure()
      raf = requestAnimationFrame(tick)
    }
    raf = requestAnimationFrame(tick)

    return () => {
      cancelAnimationFrame(raf)
      ro.disconnect()
      io.disconnect()
    }
  }, [ref])
}

export default function Hero() {
  const titleRef = useRef(null)
  useHeatWeight(titleRef)

  return (
    <section className="hero wrap" id="top">
      <h1 className="hero-title" ref={titleRef} aria-label={LINES.join(' ')}>
        {LINES.map((line, i) => (
          <span className="line" key={line} aria-hidden="true">
            <span className="word">
              {[...line].map((ch, j) =>
                ch === ' ' ? (
                  ' '
                ) : (
                  <span className="ch" key={j} style={{ '--i': i * 12 + j }}>
                    {ch}
                  </span>
                ),
              )}
            </span>
          </span>
        ))}
      </h1>
      <div className="hero-foot">
        <p className="hero-copy">{site.intro}</p>
        <EventStream />
      </div>
    </section>
  )
}
