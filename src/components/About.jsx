import React, { useRef } from 'react'
import { motion, useScroll, useTransform } from 'framer-motion'
import { site } from '../data/site.js'
import { useMounted } from '../hooks.js'
import portrait from '../assets/portrait.jpg'

function Word({ children, progress, range, mounted }) {
  const opacity = useTransform(progress, range, [0.22, 1])
  return (
    <motion.span className="w" style={mounted ? { opacity } : undefined}>
      {children}{' '}
    </motion.span>
  )
}

export default function About() {
  const ref = useRef(null)
  const mounted = useMounted()
  const { scrollYProgress } = useScroll({ target: ref, offset: ['start 0.85', 'end 0.45'] })
  const words = site.about.split(' ')

  return (
    <section className="section wrap" id="about">
      <div className="about-grid">
        <h2 className="section-title">About</h2>
        <p className="about-copy" ref={ref}>
          {words.map((word, i) => (
            <Word key={i} progress={scrollYProgress} range={[i / words.length, (i + 1) / words.length]} mounted={mounted}>
              {word}
            </Word>
          ))}
        </p>
        <figure className="about-portrait thermal-pair">
          <img className="thermal" src={portrait} alt="Archish Thakkar" width="900" height="900" loading="lazy" decoding="async" />
          <img className="real" src={portrait} alt="" width="900" height="900" loading="lazy" decoding="async" />
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
