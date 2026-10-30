import React, { useEffect, useRef, useState } from 'react'
import { AnimatePresence, m, useMotionValue, useSpring, useTransform, useVelocity } from 'framer-motion'
import { featured, archive } from '../data/work.js'

// A list of big titles. On a fine pointer, the project's image follows the
// cursor and leans into the direction of travel; on touch it sits inline.
function Preview({ active, below, x, y }) {
  const sx = useSpring(x, { stiffness: 260, damping: 28, mass: 0.6 })
  const sy = useSpring(y, { stiffness: 260, damping: 28, mass: 0.6 })
  const vx = useVelocity(sx)
  const rotate = useTransform(vx, [-2500, 2500], [-9, 9], { clamp: true })

  return (
    <m.div className="preview" data-below={below} style={{ x: sx, y: sy, rotate }} aria-hidden="true">
      <AnimatePresence>
        {active != null && (
          <m.div
            key="frame"
            className="preview-frame"
            initial={{ scale: 0.6, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            exit={{ scale: 0.6, opacity: 0 }}
            transition={{ duration: 0.4, ease: [0.16, 1, 0.3, 1] }}
          >
            {featured.map((p, i) => (
              <div key={p.title} className="preview-shot thermal-pair" data-on={i === active}>
                <img className="thermal" src={p.image} alt="" decoding="async" />
                <img className="real" src={p.image} alt="" decoding="async" />
              </div>
            ))}
          </m.div>
        )}
      </AnimatePresence>
    </m.div>
  )
}

export default function Work() {
  const [active, setActive] = useState(null)
  // The preview floats above the cursor so it never covers the title being
  // read; near the top of the screen it flips below instead.
  const [below, setBelow] = useState(false)
  const belowRef = useRef(false)
  const x = useMotionValue(0)
  const y = useMotionValue(0)
  const listRef = useRef(null)

  // Without hover, a thumbnail develops from thermal to real as it scrolls in.
  useEffect(() => {
    if (!window.matchMedia('(hover: none), (max-width: 760px)').matches) return
    const io = new IntersectionObserver(
      (entries) => entries.forEach((e) => e.isIntersecting && (e.target.dataset.developed = 'true')),
      { threshold: 0.75 },
    )
    listRef.current.querySelectorAll('.work-thumb').forEach((el) => io.observe(el))
    return () => io.disconnect()
  }, [])

  const onMove = (e) => {
    if (e.pointerType !== 'mouse') return
    x.set(e.clientX)
    y.set(e.clientY)
    const b = e.clientY < window.innerHeight * 0.4
    if (b !== belowRef.current) {
      belowRef.current = b
      setBelow(b)
    }
  }

  return (
    <section className="section wrap" id="work">
      <h2 className="section-title">Selected work</h2>
      <ul ref={listRef} className="work-list" onPointerMove={onMove} onPointerLeave={() => setActive(null)}>
        {featured.map((project, i) => (
          <li key={project.title} className="work-row" onPointerEnter={(e) => e.pointerType === 'mouse' && setActive(i)}>
            <a className="work-main" href={project.external || project.github} target="_blank" rel="noopener noreferrer">
              <span className="work-thumb thermal-pair">
                <img className="thermal" src={project.image} alt="" loading="lazy" decoding="async" />
                <img className="real" src={project.image} alt="" loading="lazy" decoding="async" />
              </span>
              <span className="work-title">{project.title}</span>
              <span className="work-desc">{project.blurb}</span>
            </a>
            <div className="work-side">
              <p className="work-tech">{project.tech.join(', ')}</p>
              <p className="work-links">
                <a href={project.github} target="_blank" rel="noopener noreferrer">
                  GitHub
                </a>
                {project.external && (
                  <a href={project.external} target="_blank" rel="noopener noreferrer">
                    {project.externalLabel}
                  </a>
                )}
              </p>
            </div>
          </li>
        ))}
      </ul>
      <Preview active={active} below={below} x={x} y={y} />

      <div className="also">
        <h3>Also on GitHub</h3>
        <ul>
          {archive.map((item) => (
            <li key={item.title} className="also-row">
              <a href={item.github} target="_blank" rel="noopener noreferrer">
                <span className="also-title">{item.title}</span>
                <span className="also-note">{item.note}</span>
              </a>
              <span className="also-meta">{item.tech}</span>
              <span className="also-meta">{item.year}</span>
            </li>
          ))}
          <li className="also-row">
            <a href="https://github.com/archish27?tab=repositories" target="_blank" rel="noopener noreferrer">
              <span className="also-title">All repositories</span>
            </a>
          </li>
        </ul>
      </div>
    </section>
  )
}
