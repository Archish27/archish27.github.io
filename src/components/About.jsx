import React, { useEffect, useRef } from 'react'
import { useScroll } from 'framer-motion'
import { site } from '../data/site.js'
import portrait from '../assets/portrait.webp'

// The statement inks in word by word as it scrolls through the viewport. Each
// word is marked once scroll progress reaches it, so the DOM only changes
// when a word actually flips. Without JS every word is simply black.
export default function About() {
  const ref = useRef(null)
  const portraitRef = useRef(null)
  const { scrollYProgress } = useScroll({ target: ref, offset: ['start 0.85', 'end 0.45'] })
  const words = site.about.split(' ')

  useEffect(() => {
    const spans = [...ref.current.querySelectorAll('.w')]
    let shown = 0
    const set = (p) => {
      const next = Math.round(Math.min(1, Math.max(0, p)) * spans.length)
      if (next === shown) return
      for (let i = Math.min(shown, next); i < Math.max(shown, next); i++) {
        if (next > shown) spans[i].dataset.on = ''
        else delete spans[i].dataset.on
      }
      shown = next
    }
    set(scrollYProgress.get())
    return scrollYProgress.on('change', set)
  }, [scrollYProgress])

  // Phones have no hover, so the portrait turns to colour as it scrolls in.
  useEffect(() => {
    if (!window.matchMedia('(hover: none)').matches) return
    const el = portraitRef.current
    const io = new IntersectionObserver(
      ([e]) => {
        if (e.isIntersecting) {
          el.dataset.developed = 'true'
          io.disconnect()
        }
      },
      { threshold: 0.6 },
    )
    io.observe(el)
    return () => io.disconnect()
  }, [])

  return (
    <section className="section wrap" id="about">
      <div className="about-grid">
        <h2 className="section-title">About</h2>
        <p className="about-copy" ref={ref}>
          {words.map((word, i) => (
            <span key={i} className="w">
              {word}{' '}
            </span>
          ))}
        </p>
        <figure className="about-portrait thermal-pair" ref={portraitRef}>
          <img className="thermal" src={portrait} alt="Archish Thakkar" width="880" height="880" loading="lazy" decoding="async" />
          <img className="real" src={portrait} alt="" width="880" height="880" loading="lazy" decoding="async" />
          <figcaption>{site.city}</figcaption>
        </figure>
        <dl className="skills">
          {site.skills.map(([area, list]) => (
            <React.Fragment key={area}>
              <dt>{area}</dt>
              <dd>{list}</dd>
            </React.Fragment>
          ))}
        </dl>
      </div>
    </section>
  )
}
