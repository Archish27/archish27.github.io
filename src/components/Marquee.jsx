import React, { useEffect, useRef } from 'react'
import { useLenis } from 'lenis/react'

const ITEMS = ['Real User Monitoring', 'Session Replay', 'Synthetic Monitoring', 'iOS', 'Android', 'React Native', 'Go']

// Drifts on its own; scrolling throws it faster in the scroll's direction.
export default function Marquee() {
  const track = useRef(null)
  const velocity = useRef(0)
  useLenis((lenis) => {
    velocity.current = lenis.velocity
  })

  useEffect(() => {
    if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) return
    let x = 0
    let dir = -1
    let raf = 0
    let last = performance.now()
    const start = () => {
      if (raf) return
      last = performance.now()
      raf = requestAnimationFrame(tick)
    }
    const stop = () => {
      cancelAnimationFrame(raf)
      raf = 0
    }
    const io = new IntersectionObserver(([e]) => (e.isIntersecting ? start() : stop()))
    io.observe(track.current)
    const tick = (now) => {
      const dt = Math.min(0.05, (now - last) / 1000)
      last = now
      const v = velocity.current
      if (Math.abs(v) > 0.5) dir = v > 0 ? -1 : 1
      x += dir * (60 + Math.abs(v) * 28) * dt
      const half = track.current.scrollWidth / 2
      if (x <= -half) x += half
      if (x > 0) x -= half
      track.current.style.transform = `translate3d(${x}px,0,0) skewX(${Math.max(-12, Math.min(12, -v * 0.6))}deg)`
      raf = requestAnimationFrame(tick)
    }
    return () => {
      io.disconnect()
      stop()
    }
  }, [])

  const run = (key) =>
    ITEMS.map((item, i) => (
      <span key={`${key}-${i}`} className={i % 2 ? 'mq-item mq-outline' : 'mq-item'}>
        {item}
        <span className="mq-dot" />
      </span>
    ))

  return (
    <div className="marquee" role="marquee" aria-label={ITEMS.join(', ')}>
      <div className="mq-track" ref={track} aria-hidden="true">
        {run('a')}
        {run('b')}
      </div>
    </div>
  )
}
