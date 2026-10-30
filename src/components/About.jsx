import React, { useEffect, useRef } from 'react'
import { useScroll } from 'framer-motion'
import { site } from '../data/site.js'
import portrait from '../assets/portrait.webp'

// The statement inks in word by word as it scrolls through the viewport.
// One scroll value drives it: --p on the paragraph, and each word works out
// its own colour from its position (--i) in CSS. Without JS, --p stays at 1
// and the whole paragraph is simply black.
export default function About() {
  const ref = useRef(null)
  const { scrollYProgress } = useScroll({ target: ref, offset: ['start 0.85', 'end 0.45'] })
  const words = site.about.split(' ')

  useEffect(() => {
    const el = ref.current
    const set = (p) => el.style.setProperty('--p', p.toFixed(3))
    set(scrollYProgress.get())
    return scrollYProgress.on('change', set)
  }, [scrollYProgress])

  return (
    <section className="section wrap" id="about">
      <div className="about-grid">
        <h2 className="section-title">About</h2>
        <p className="about-copy" ref={ref} style={{ '--n': words.length }}>
          {words.map((word, i) => (
            <span key={i} className="w" style={{ '--i': i }}>
              {word}{' '}
            </span>
          ))}
        </p>
        <figure className="about-portrait thermal-pair">
          <img className="thermal" src={portrait} alt="Archish Thakkar" width="880" height="880" loading="lazy" decoding="async" />
          <img className="real" src={portrait} alt="" width="880" height="880" loading="lazy" decoding="async" />
          <figcaption>{site.city}. Hover to see me at room temperature.</figcaption>
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
