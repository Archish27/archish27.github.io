import React, { useRef } from 'react'
import { useInView } from 'framer-motion'
import { roles } from '../data/experience.js'

// Experience drawn as a trace waterfall: every role is a span on one shared
// time axis, so the shape of the career is readable before a word of it is.
const AXIS_START = 2014
const AXIS_END = 2027 // exclusive; 13 whole years so the year grid is uniform
const TOTAL_MONTHS = (AXIS_END - AXIS_START) * 12
const MONTHS = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec']
const TICKS = [2014, 2016, 2018, 2020, 2022, 2024, 2026]

const now = new Date()
const nowIndex = (now.getFullYear() - AXIS_START) * 12 + now.getMonth()
// A year tick that would sit under the "now" label is dropped rather than overlapped.
const visibleTicks = TICKS.filter((year) => Math.abs((year - AXIS_START) * 12 - nowIndex) > TOTAL_MONTHS * 0.07)

const toIndex = (ym) => {
  const [y, m] = ym.split('-').map(Number)
  return (y - AXIS_START) * 12 + (m - 1)
}
const pct = (index) => `${((index / TOTAL_MONTHS) * 100).toFixed(3)}%`
const label = (ym) => {
  const [y, m] = ym.split('-').map(Number)
  return `${MONTHS[m - 1]} ${y}`
}
const duration = (months) => {
  const y = Math.floor(months / 12)
  const m = months % 12
  return [y && `${y}y`, m && `${m}m`].filter(Boolean).join(' ') || '0m'
}

function Role({ role, index }) {
  const start = toIndex(role.start)
  const end = role.end ? toIndex(role.end) : nowIndex

  return (
    <li className="role">
      <div className="role-head">
        <span className="role-company">{role.company}</span>
        <span className="role-title">{role.title}</span>
        <span className="role-track" aria-hidden="true">
          <span
            className="role-bar"
            style={{ left: pct(start), width: pct(end - start), '--d': `${index * 0.12}s` }}
          />
          <span className="role-duration" style={{ left: pct(end) }}>
            {duration(end - start)}
          </span>
        </span>
        <span className="role-range">
          {label(role.start)} – {role.end ? label(role.end) : 'now'}
        </span>
      </div>
      <div className="role-body">
        <ul>
          {role.points.map((point) => (
            <li key={point}>{point}</li>
          ))}
          <li className="role-link">
            <a href={role.url} target="_blank" rel="noopener noreferrer">
              {role.url.replace(/^https?:\/\/(www\.)?/, '').replace(/\/$/, '')}
            </a>
          </li>
        </ul>
      </div>
    </li>
  )
}

export default function Experience() {
  const ref = useRef(null)
  const inView = useInView(ref, { once: true, margin: '0px 0px -12% 0px' })

  return (
    <section className="section wrap" id="experience">
      <h2 className="section-title">Experience</h2>
      <div className="axis" aria-hidden="true">
        <span className="axis-spacer" />
        <span className="axis-spacer" />
        <span className="axis-track">
          {visibleTicks.map((year) => (
            <span key={year} className="axis-tick" style={{ left: pct((year - AXIS_START) * 12) }}>
              {year}
            </span>
          ))}
          <span className="axis-now" style={{ left: pct(nowIndex) }}>
            now
          </span>
        </span>
        <span className="axis-spacer" />
      </div>
      <ol ref={ref} className={`roles${inView ? ' is-in' : ''}`} style={{ '--now': pct(nowIndex) }}>
        {roles.map((role, i) => (
          <Role key={role.company} role={role} index={i} />
        ))}
      </ol>
    </section>
  )
}
