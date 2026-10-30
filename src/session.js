// The visitor's session, recorded in memory only. Nothing here is ever sent
// anywhere: it feeds the heat field, the event stream and the replay poster.

const listeners = new Set()

export const session = {
  path: [], // [x, y, t] with x, y as fractions of the viewport
  clicks: [], // [x, y, t]
  counts: { moves: 0, clicks: 0, scrolls: 0 },
  depth: 0, // deepest scroll reached, 0..1
  scrolls: [], // [depth 0..1, t], sampled, for visitors without a cursor
  scrollTravel: 0, // total distance scrolled in CSS px
  travel: 0, // cursor distance in CSS px
  vitals: {},
  live: false, // true once the visitor has moved a pointer or touched
}

// Latest pointer and pending clicks, read by the heat field every frame.
export const pointer = { x: 0, y: 0, active: false }
export const clickQueue = []

// Written by the heat field each frame: where heat is being laid down right
// now (the visitor, or the sample visitor) in viewport px, and the heat
// reading under the visitor's pointer for the spot meter.
export const driver = { x: -1e4, y: -1e4, on: false }
export const probe = { heat: 0 }

export function subscribe(fn) {
  listeners.add(fn)
  return () => listeners.delete(fn)
}

export function emit(type, detail = '') {
  const event = { t: performance.now(), type, detail }
  listeners.forEach((fn) => fn(event))
}

const MAX_PATH = 30000

function describe(el) {
  const target = el instanceof Element ? el.closest('a, button, h1, h2, h3, img, p') : null
  if (!target) return ''
  const tag = target.tagName.toLowerCase()
  const text = (target.getAttribute('aria-label') || target.textContent || target.alt || '').trim().replace(/\s+/g, ' ')
  return text ? `${tag} "${text.length > 22 ? `${text.slice(0, 21)}…` : text}"` : tag
}

export function startRecording() {
  let last = null
  let lastMoveEmit = 0
  let lastScrollEmit = 0
  let lastScrollSample = 0
  let lastY = window.scrollY
  const recent = []

  const onMove = (e) => {
    const { clientX: x, clientY: y } = e
    pointer.x = x
    pointer.y = y
    pointer.active = true
    if (!session.live) {
      session.live = true
      emit('takeover', 'you have the cursor')
    }
    session.counts.moves++
    if (last) {
      const d = Math.hypot(x - last[0], y - last[1])
      if (d < 3) return
      session.travel += d
    }
    last = [x, y]
    if (session.path.length < MAX_PATH) {
      session.path.push([x / window.innerWidth, y / window.innerHeight, performance.now()])
    }
    const now = performance.now()
    if (now - lastMoveEmit > 180) {
      lastMoveEmit = now
      emit('move', `${Math.round(x)}, ${Math.round(y)}`)
    }
  }

  const onLeave = () => {
    pointer.active = false
  }

  const onDown = (e) => {
    const { clientX: x, clientY: y } = e
    const now = performance.now()
    session.counts.clicks++
    session.clicks.push([x / window.innerWidth, y / window.innerHeight, now])
    clickQueue.push([x, y])
    emit('click', describe(e.target) || `${Math.round(x)}, ${Math.round(y)}`)

    recent.push([x, y, now])
    while (recent.length && now - recent[0][2] > 700) recent.shift()
    const near = recent.filter(([rx, ry]) => Math.hypot(rx - x, ry - y) < 48)
    if (near.length === 3) emit('rage click', 'easy, it’s only a website')
  }

  const onScroll = () => {
    const max = document.documentElement.scrollHeight - window.innerHeight
    const depth = max > 0 ? window.scrollY / max : 0
    session.depth = Math.max(session.depth, depth)
    session.counts.scrolls++
    session.scrollTravel += Math.abs(window.scrollY - lastY)
    lastY = window.scrollY
    const now = performance.now()
    if (now - lastScrollSample > 80 && session.scrolls.length < MAX_PATH) {
      lastScrollSample = now
      session.scrolls.push([depth, now])
    }
    if (now - lastScrollEmit > 400) {
      lastScrollEmit = now
      emit('scroll', `${Math.round(depth * 100)}%`)
    }
  }

  window.addEventListener('pointermove', onMove, { passive: true })
  window.addEventListener('pointerdown', onDown, { passive: true })
  window.addEventListener('scroll', onScroll, { passive: true })
  document.documentElement.addEventListener('pointerleave', onLeave)

  const stopVitals = observeVitals()

  return () => {
    window.removeEventListener('pointermove', onMove)
    window.removeEventListener('pointerdown', onDown)
    window.removeEventListener('scroll', onScroll)
    document.documentElement.removeEventListener('pointerleave', onLeave)
    stopVitals()
  }
}

// The same PerformanceObserver signals a RUM SDK collects.
function observeVitals() {
  const observers = []
  const observe = (type, cb, extra = {}) => {
    try {
      if (!PerformanceObserver.supportedEntryTypes.includes(type)) return
      const po = new PerformanceObserver((list) => cb(list.getEntries()))
      po.observe({ type, buffered: true, ...extra })
      observers.push(po)
    } catch {
      /* not supported here */
    }
  }

  const nav = performance.getEntriesByType('navigation')[0]
  if (nav) {
    session.vitals.ttfb = nav.responseStart
    emit('ttfb', `${Math.round(nav.responseStart)} ms`)
  }
  observe('paint', (entries) => {
    const fcp = entries.find((e) => e.name === 'first-contentful-paint')
    if (fcp) {
      session.vitals.fcp = fcp.startTime
      emit('fcp', `${Math.round(fcp.startTime)} ms`)
    }
  })
  let lcpTimer = 0
  observe('largest-contentful-paint', (entries) => {
    const last = entries[entries.length - 1]
    if (!last) return
    session.vitals.lcp = last.startTime
    clearTimeout(lcpTimer)
    lcpTimer = setTimeout(() => emit('lcp', `${Math.round(session.vitals.lcp)} ms`), 300)
  })
  let cls = 0
  observe('layout-shift', (entries) => {
    for (const e of entries) if (!e.hadRecentInput) cls += e.value
    session.vitals.cls = cls
  })
  observe(
    'event',
    (entries) => {
      for (const e of entries) {
        if (e.interactionId && e.duration > (session.vitals.inp || 0)) {
          session.vitals.inp = e.duration
          emit('inp', `${Math.round(e.duration)} ms`)
        }
      }
    },
    { durationThreshold: 16 },
  )

  return () => {
    clearTimeout(lcpTimer)
    observers.forEach((po) => po.disconnect())
  }
}
