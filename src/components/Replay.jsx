import React, { useCallback, useEffect, useRef, useState } from 'react'
import { useInView } from 'framer-motion'
import { session } from '../session.js'
import { readPalette } from '../theme.js'

// "Your session": the visitor's own cursor path from this visit, drawn back
// as a poster, colored by time along the heat ramp. Saveable as a PNG.
const W = 1600
const H = 1000
const DURATION = 2600

const POS = [0, 0.4, 0.75, 1]
let STOPS = [
  [0, 0, 0],
  [0, 0, 0],
  [0, 0, 0],
  [0, 0, 0],
]
function rampAt(t) {
  t = Math.min(1, Math.max(0, t))
  let i = 0
  while (i < POS.length - 2 && t > POS[i + 1]) i++
  const k = (t - POS[i]) / (POS[i + 1] - POS[i])
  const [a, b] = [STOPS[i], STOPS[i + 1]]
  return `rgb(${a.map((v, j) => Math.round((v + (b[j] - v) * k) * 255)).join(',')})`
}

const toLength = (px) => {
  const metres = (px / 96) * 0.0254
  return metres < 1 ? `${Math.round(metres * 100)} cm` : `${metres.toFixed(1)} m`
}

// Visitors without a cursor (phones, tablets) get their scroll path instead.
const hasCursorTrail = () => session.path.length >= 20

function stats() {
  const seconds = performance.now() / 1000
  return [
    ['Time here', seconds < 60 ? `${Math.round(seconds)} s` : `${Math.floor(seconds / 60)} min ${Math.round(seconds % 60)} s`],
    hasCursorTrail() ? ['Cursor travel', toLength(session.travel)] : ['Scrolled', toLength(session.scrollTravel)],
    [hasCursorTrail() ? 'Clicks' : 'Taps', String(session.counts.clicks)],
    ['Deepest scroll', `${Math.round(session.depth * 100)}%`],
    ['LCP', session.vitals.lcp ? `${Math.round(session.vitals.lcp)} ms` : '—'],
  ]
}

const PAD = 70
const px = (x) => PAD + x * (W - PAD * 2)
const py = (y) => PAD + y * (H - PAD * 2)

function stroke(ctx, points, progress, t0, span) {
  const end = Math.max(2, Math.floor(points.length * progress))
  ctx.lineCap = 'round'
  ctx.lineJoin = 'round'
  ctx.lineWidth = 3
  ctx.globalAlpha = 0.9
  for (let i = 1; i < end; i++) {
    const [x0, y0] = points[i - 1]
    const [x1, y1, t] = points[i]
    if (Math.hypot(x1 - x0, y1 - y0) > 0.35) continue // pointer left and re-entered
    ctx.strokeStyle = rampAt((t - t0) / span)
    ctx.beginPath()
    ctx.moveTo(px(x0), py(y0))
    ctx.lineTo(px(x1), py(y1))
    ctx.stroke()
  }
  ctx.globalAlpha = 1
  return points[end - 1][2]
}

let INK = '#fff'
let DIM = '#999'
let RULE = '#333'

function caption(ctx, left) {
  ctx.fillStyle = INK
  ctx.font = '500 30px "Cabinet Grotesk", sans-serif'
  ctx.textAlign = 'left'
  ctx.fillText(left, PAD, H - 26)
  ctx.textAlign = 'right'
  ctx.fillText(new Date().toLocaleDateString('en-GB', { day: 'numeric', month: 'long', year: 'numeric' }), W - PAD, H - 26)
}

function draw(ctx, progress, paper) {
  ctx.fillStyle = paper
  ctx.fillRect(0, 0, W, H)

  if (hasCursorTrail()) {
    const path = session.path
    const t0 = path[0][2]
    const span = Math.max(1, path[path.length - 1][2] - t0)
    const shownUntil = stroke(ctx, path, progress, t0, span)
    ctx.strokeStyle = INK
    ctx.lineWidth = 2
    for (const [x, y, t] of session.clicks) {
      if (t > shownUntil) continue
      ctx.beginPath()
      ctx.arc(px(x), py(y), 16, 0, Math.PI * 2)
      ctx.stroke()
    }
    if (progress >= 1) caption(ctx, 'A visit to archish27.github.io')
    return
  }

  const scrolls = session.scrolls
  if (scrolls.length < 2) {
    ctx.fillStyle = DIM
    ctx.font = '600 56px "Cabinet Grotesk", sans-serif'
    ctx.textAlign = 'center'
    ctx.fillText('Not much to replay yet.', W / 2, H / 2 - 10)
    ctx.font = '500 40px "Cabinet Grotesk", sans-serif'
    ctx.fillText('Wander around the page, then come back.', W / 2, H / 2 + 50)
    return
  }

  // Time runs left to right, depth top to bottom: how you moved through the page.
  const t0 = scrolls[0][1]
  const span = Math.max(1, scrolls[scrolls.length - 1][1] - t0)
  const points = scrolls.map(([depth, t]) => [(t - t0) / span, depth, t])
  ctx.strokeStyle = RULE
  ctx.lineWidth = 2
  ;[0, 0.25, 0.5, 0.75, 1].forEach((d) => {
    ctx.beginPath()
    ctx.moveTo(PAD, py(d))
    ctx.lineTo(W - PAD, py(d))
    ctx.stroke()
  })
  ctx.save()
  ctx.lineWidth = 6
  stroke(ctx, points, progress, t0, span)
  ctx.restore()
  if (progress >= 1) caption(ctx, 'Your scroll through archish27.github.io')
}

export default function Replay() {
  const sectionRef = useRef(null)
  const canvasRef = useRef(null)
  const inView = useInView(sectionRef, { margin: '0px 0px -25% 0px' })
  const [rows, setRows] = useState(null)
  const raf = useRef(0)

  const play = useCallback(() => {
    const canvas = canvasRef.current
    if (!canvas) return
    const ctx = canvas.getContext('2d')
    const { ramp, paper, ink, dim, rule } = readPalette()
    STOPS = ramp
    INK = ink
    DIM = dim
    RULE = rule
    const reduce = window.matchMedia('(prefers-reduced-motion: reduce)').matches
    cancelAnimationFrame(raf.current)
    const start = performance.now()
    const step = (now) => {
      const p = reduce ? 1 : Math.min(1, (now - start) / DURATION)
      draw(ctx, 1 - Math.pow(1 - p, 3), paper)
      if (p < 1) raf.current = requestAnimationFrame(step)
    }
    raf.current = requestAnimationFrame(step)
  }, [])

  useEffect(() => {
    if (!inView) return
    setRows(stats())
    play()
    const id = setInterval(() => setRows(stats()), 1000)
    return () => clearInterval(id)
  }, [inView, play])

  useEffect(() => () => cancelAnimationFrame(raf.current), [])

  const save = () => {
    canvasRef.current.toBlob((blob) => {
      if (!blob) return
      const a = document.createElement('a')
      a.href = URL.createObjectURL(blob)
      a.download = 'my-visit-archish27.png'
      a.click()
      setTimeout(() => URL.revokeObjectURL(a.href), 1000)
    })
  }

  return (
    <section ref={sectionRef} className="section wrap replay" id="session">
      <h2 className="replay-title">Your session</h2>
      <p className="replay-copy">
        Everything your cursor did on this page, played back. One visit, one browser. The product I lead does this for
        millions of them, so teams can see where people struggle.
      </p>
      <div className="replay-grid">
        <canvas ref={canvasRef} className="replay-canvas" width={W} height={H} aria-label="Drawing of your cursor path on this page" />
        <div className="replay-side">
          <dl className="replay-stats">
            {(rows || stats.placeholder).map(([k, v]) => (
              <div key={k}>
                <dt>{k}</dt>
                <dd>{v}</dd>
              </div>
            ))}
          </dl>
          <div className="replay-actions">
            <button type="button" className="btn" onClick={play}>
              Replay
            </button>
            <button type="button" className="btn btn-ghost" onClick={save}>
              Save as image
            </button>
          </div>
          <p className="replay-note">Kept in this tab only. Nothing is sent anywhere.</p>
        </div>
      </div>
    </section>
  )
}

stats.placeholder = [
  ['Time here', '—'],
  ['Cursor travel', '—'],
  ['Clicks', '—'],
  ['Deepest scroll', '—'],
  ['LCP', '—'],
]
