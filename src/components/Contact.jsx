import React, { useRef } from 'react'
import { useInView } from 'framer-motion'
import Magnetic from './Magnetic.jsx'
import { site } from '../data/site.js'

export default function Contact() {
  const ref = useRef(null)
  const inView = useInView(ref, { once: true, margin: '0px 0px -20% 0px' })

  return (
    <section ref={ref} className={`contact wrap${inView ? ' is-in' : ''}`} id="contact">
      <h2 className="contact-title">
        <span className="line">
          <span className="word">Say</span>
        </span>
        <span className="line">
          <span className="word">hello.</span>
        </span>
      </h2>
      <p className="contact-copy">
        Not looking for freelance work, but my inbox is open: a project, a question, or just hi.
      </p>
      <Magnetic>
        <a className="contact-email" href={`mailto:${site.email}`}>
          {site.email}
        </a>
      </Magnetic>
    </section>
  )
}
