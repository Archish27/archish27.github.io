import React, { useEffect, useState } from 'react'
import { session, subscribe } from '../session.js'

const MAX = 6

const stamp = (ms) => {
  const s = Math.floor(ms / 1000)
  return `${String(Math.floor(s / 60)).padStart(2, '0')}:${String(s % 60).padStart(2, '0')}.${String(Math.floor(ms % 1000)).padStart(3, '0')}`
}

export default function EventStream() {
  const [events, setEvents] = useState([])
  const [live, setLive] = useState(false)

  useEffect(() => {
    setLive(session.live)
    let id = 0
    return subscribe((e) => {
      if (e.type === 'takeover') setLive(true)
      setEvents((list) => [{ ...e, id: id++ }, ...list].slice(0, MAX))
    })
  }, [])

  return (
    <div className="stream">
      <p className="stream-head">
        <span className="rec-dot" aria-hidden="true" />
        {live ? 'Live view of your visit' : 'Demo visitor. Move to take over.'}
      </p>
      <ol className="stream-list">
        {events.map((e) => (
          <li key={e.id} data-type={e.type.replace(' ', '-')}>
            <span className="stream-t">{stamp(e.t)}</span>
            <span className="stream-type">{e.type}</span>
            <span className="stream-detail">{e.detail}</span>
          </li>
        ))}
      </ol>
    </div>
  )
}
