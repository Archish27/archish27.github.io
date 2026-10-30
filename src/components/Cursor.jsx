import React, { useEffect, useRef, useState } from 'react'
import { m, useMotionValue, useSpring } from 'framer-motion'
import { probe } from '../session.js'

// A thermal camera's spot meter: crosshair plus the temperature under it.
// The longer you rest somewhere, the hotter it reads. Fine pointers only.
const toCelsius = (heat) => 22 + Math.min(heat, 2) * 8

export default function Cursor() {
  const [enabled, setEnabled] = useState(false)
  const [mode, setMode] = useState('idle')
  const label = useRef(null)
  const x = useMotionValue(-100)
  const y = useMotionValue(-100)
  const sx = useSpring(x, { stiffness: 900, damping: 60, mass: 0.35 })
  const sy = useSpring(y, { stiffness: 900, damping: 60, mass: 0.35 })

  useEffect(() => {
    if (!window.matchMedia('(pointer: fine)').matches) return
    if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) return

    setEnabled(true)
    document.documentElement.classList.add('has-cursor')

    const move = (e) => {
      x.set(e.clientX)
      y.set(e.clientY)
    }
    const over = (e) => {
      const target = e.target instanceof Element ? e.target.closest('a, button') : null
      setMode(target ? 'link' : 'idle')
    }
    const leave = () => setMode('hidden')
    const enter = () => setMode('idle')

    let raf = 0
    let shown = 22
    const tick = () => {
      shown += (toCelsius(probe.heat) - shown) * 0.12
      if (label.current) label.current.textContent = `${shown.toFixed(1)}°`
      raf = requestAnimationFrame(tick)
    }
    raf = requestAnimationFrame(tick)

    window.addEventListener('pointermove', move, { passive: true })
    document.addEventListener('pointerover', over)
    document.documentElement.addEventListener('mouseleave', leave)
    document.documentElement.addEventListener('mouseenter', enter)
    return () => {
      cancelAnimationFrame(raf)
      document.documentElement.classList.remove('has-cursor')
      window.removeEventListener('pointermove', move)
      document.removeEventListener('pointerover', over)
      document.documentElement.removeEventListener('mouseleave', leave)
      document.documentElement.removeEventListener('mouseenter', enter)
    }
  }, [x, y])

  if (!enabled) return null

  return (
    <m.div className="cursor" data-mode={mode} style={{ x: sx, y: sy }} aria-hidden="true">
      <span className="cursor-box" />
      <span className="cursor-h" />
      <span className="cursor-v" />
      <span className="cursor-label" ref={label}>
        22.0°
      </span>
    </m.div>
  )
}
