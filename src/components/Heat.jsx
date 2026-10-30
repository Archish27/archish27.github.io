import React, { useEffect, useRef } from 'react'
import { clickQueue, driver, pointer, probe, session } from '../session.js'
import { readPalette } from '../theme.js'

// A page-wide attention heatmap. Heat builds where the cursor dwells, fades
// over a few seconds, diffuses outward and sticks to the content as you
// scroll. Until the visitor moves, a sample visitor wanders the hero.

const VERT = `#version 300 es
in vec2 aPos;
out vec2 vUv;
void main() {
  vUv = aPos * 0.5 + 0.5;
  gl_Position = vec4(aPos, 0.0, 1.0);
}`

const UPDATE = `#version 300 es
precision highp float;
in vec2 vUv;
out vec4 outColor;
uniform sampler2D uPrev;
uniform vec2 uTexel;
uniform vec2 uShift;
uniform vec2 uA;
uniform vec2 uB;
uniform float uAspect;
uniform float uRadius;
uniform float uStrength;
uniform float uDecay;
uniform vec4 uClicks[4];
uniform int uClickCount;

float prevAt(vec2 uv) {
  if (uv.x < 0.0 || uv.y < 0.0 || uv.x > 1.0 || uv.y > 1.0) return 0.0;
  return texture(uPrev, uv).r;
}

float segDist(vec2 p, vec2 a, vec2 b) {
  vec2 pa = p - a;
  vec2 ba = b - a;
  float h = clamp(dot(pa, ba) / max(dot(ba, ba), 1e-6), 0.0, 1.0);
  return length(pa - ba * h);
}

void main() {
  vec2 uv = vUv + uShift;
  float h = prevAt(uv) * 0.6
    + (prevAt(uv + vec2(uTexel.x, 0.0)) + prevAt(uv - vec2(uTexel.x, 0.0))
     + prevAt(uv + vec2(0.0, uTexel.y)) + prevAt(uv - vec2(0.0, uTexel.y))) * 0.1;
  h = max(h - uDecay, 0.0);

  vec2 p = vec2(vUv.x * uAspect, vUv.y);
  float d = segDist(p, vec2(uA.x * uAspect, uA.y), vec2(uB.x * uAspect, uB.y));
  h += uStrength * exp(-(d * d) / (uRadius * uRadius));

  for (int i = 0; i < 4; i++) {
    if (i >= uClickCount) break;
    vec2 c = vec2(uClicks[i].x * uAspect, uClicks[i].y);
    float dc = length(p - c);
    h += uClicks[i].z * exp(-(dc * dc) / (uRadius * uRadius * 2.5));
  }

  outColor = vec4(min(h, 2.0), 0.0, 0.0, 1.0);
}`

// The visible frame: a thermal-camera image. The cold page drifts with slow
// sensor noise; heat maps through the palette toward white-hot.
const RENDER = `#version 300 es
precision highp float;
in vec2 vUv;
out vec4 outColor;
uniform sampler2D uHeat;
uniform float uTime;
uniform float uAspect;
uniform vec3 uCold;
uniform vec3 uRamp[4];
uniform vec3 uPeak;

vec3 palette(float t) {
  t = clamp(t, 0.0, 1.0);
  if (t < 0.2) return mix(uCold, uRamp[0], t / 0.2);
  if (t < 0.45) return mix(uRamp[0], uRamp[1], (t - 0.2) / 0.25);
  if (t < 0.7) return mix(uRamp[1], uRamp[2], (t - 0.45) / 0.25);
  if (t < 0.9) return mix(uRamp[2], uRamp[3], (t - 0.7) / 0.2);
  return mix(uRamp[3], uPeak, (t - 0.9) / 0.1 * 0.7);
}

float hash(vec2 p) {
  return fract(sin(dot(p, vec2(12.9898, 78.233))) * 43758.5453);
}

float noise(vec2 p) {
  vec2 i = floor(p);
  vec2 f = fract(p);
  vec2 u = f * f * (3.0 - 2.0 * f);
  return mix(mix(hash(i), hash(i + vec2(1.0, 0.0)), u.x), mix(hash(i + vec2(0.0, 1.0)), hash(i + vec2(1.0, 1.0)), u.x), u.y);
}

float fbm(vec2 p) {
  float v = 0.0;
  float a = 0.5;
  for (int i = 0; i < 4; i++) {
    v += a * noise(p);
    p = p * 2.03 + vec2(1.7, 9.2);
    a *= 0.5;
  }
  return v;
}

void main() {
  vec2 p = vec2(vUv.x * uAspect, vUv.y);
  float ambient = fbm(p * 1.6 + vec2(uTime * 0.03, -uTime * 0.02));
  ambient = smoothstep(0.35, 0.85, ambient) * 0.2;

  float h = texture(uHeat, vUv).r;
  float t = ambient + smoothstep(0.0, 1.9, h) * 0.95;

  vec3 col = palette(t);
  // Lens falloff toward the corners, like a real sensor.
  float v = smoothstep(1.25, 0.35, length((vUv - 0.5) * vec2(uAspect, 1.0) * 0.9));
  col *= mix(0.72, 1.0, v);
  col += (hash(gl_FragCoord.xy + fract(uTime * 7.0)) - 0.5) * 0.035;
  outColor = vec4(col, 1.0);
}`

const SCALE = 0.34 // heat texture resolution relative to the viewport
const RADIUS = 0.062 // splat radius, as a fraction of viewport height

function compile(gl, type, src) {
  const s = gl.createShader(type)
  gl.shaderSource(s, src)
  gl.compileShader(s)
  if (!gl.getShaderParameter(s, gl.COMPILE_STATUS)) throw new Error(gl.getShaderInfoLog(s))
  return s
}

function program(gl, fs) {
  const p = gl.createProgram()
  gl.attachShader(p, compile(gl, gl.VERTEX_SHADER, VERT))
  gl.attachShader(p, compile(gl, gl.FRAGMENT_SHADER, fs))
  gl.bindAttribLocation(p, 0, 'aPos')
  gl.linkProgram(p)
  if (!gl.getProgramParameter(p, gl.LINK_STATUS)) throw new Error(gl.getProgramInfoLog(p))
  const uniforms = {}
  const n = gl.getProgramParameter(p, gl.ACTIVE_UNIFORMS)
  for (let i = 0; i < n; i++) {
    const name = gl.getActiveUniform(p, i).name.replace(/\[0\]$/, '')
    uniforms[name] = gl.getUniformLocation(p, name)
  }
  return { p, u: uniforms }
}

// The sample visitor reads the hero the way eye-tracking studies show people
// read: fixations along each line of the headline, a skim of the copy, a long
// look at the event stream. Points are in page px with a dwell in seconds.
function textRect(el) {
  const range = document.createRange()
  range.selectNodeContents(el)
  return range.getBoundingClientRect()
}

function buildRoute() {
  const route = []
  const sy = window.scrollY
  const add = (x, y, dwell) => route.push([x, y + sy, dwell])

  document.querySelectorAll('.hero-title .word').forEach((word, i) => {
    const r = textRect(word)
    const y = r.top + r.height * 0.55
    const stops = i === 0 ? [0.06, 0.3, 0.58, 0.88] : [0.08, 0.36, 0.66, 0.95]
    const dwells = i === 0 ? [0.55, 0.35, 0.7, 0.45] : [0.4, 0.75, 0.4, 1.1]
    stops.forEach((f, j) => add(r.left + r.width * f, y + (j % 2 ? -6 : 8), dwells[j]))
  })

  const copy = document.querySelector('.hero-copy')
  if (copy) {
    const r = textRect(copy)
    add(r.left + r.width * 0.1, r.top + 14, 0.3)
    add(r.left + r.width * 0.55, r.top + 18, 0.25)
    add(r.left + r.width * 0.3, r.top + 46, 0.3)
  }

  const stream = document.querySelector('.stream')
  if (stream) {
    const r = stream.getBoundingClientRect()
    add(r.left + r.width * 0.35, r.top + r.height * 0.45, 1.4)
  }

  const rec = document.querySelector('.topbar-rec')
  if (rec) {
    const r = rec.getBoundingClientRect()
    add(r.left + r.width * 0.5, r.top + r.height * 0.5, 0.7)
  }
  return route
}

const easeInOut = (x) => (x < 0.5 ? 4 * x * x * x : 1 - Math.pow(-2 * x + 2, 3) / 2)

function makeGhost() {
  let route = []
  let i = 0
  let phase = 'dwell'
  let clock = 0
  let from = null
  let duration = 0.6

  return {
    rebuild() {
      route = buildRoute()
      i = 0
      phase = 'dwell'
      clock = 0
      from = null
    },
    // Advance by dt seconds; returns [x, y] in page px.
    step(dt) {
      if (!route.length) return null
      clock += dt
      const target = route[i]
      if (phase === 'dwell') {
        if (clock >= target[2]) {
          from = target
          i = (i + 1) % route.length
          const next = route[i]
          duration = 0.16 + Math.hypot(next[0] - from[0], next[1] - from[1]) / 1500
          phase = 'move'
          clock = 0
        }
        // A small tremor while resting, like a real hand.
        return [target[0] + Math.sin(clock * 9) * 2, target[1] + Math.cos(clock * 7) * 2]
      }
      const p = Math.min(1, clock / duration)
      const e = easeInOut(p)
      const next = route[i]
      const arc = Math.sin(p * Math.PI) * 18
      if (p >= 1) {
        phase = 'dwell'
        clock = 0
      }
      return [from[0] + (next[0] - from[0]) * e, from[1] + (next[1] - from[1]) * e - arc]
    },
  }
}

export default function Heat() {
  const canvasRef = useRef(null)
  const ghostRef = useRef(null)

  useEffect(() => {
    const canvas = canvasRef.current
    const ghostEl = ghostRef.current
    const gl = canvas.getContext('webgl2', { alpha: false, antialias: false })
    if (!gl) return

    const reduce = window.matchMedia('(prefers-reduced-motion: reduce)').matches
    const floatOk = !!gl.getExtension('EXT_color_buffer_float')
    const decay = floatOk ? 0.0042 : 1 / 255

    let update, render
    try {
      update = program(gl, UPDATE)
      render = program(gl, RENDER)
    } catch (err) {
      console.warn('heat field disabled:', err)
      return
    }

    const quad = gl.createBuffer()
    gl.bindBuffer(gl.ARRAY_BUFFER, quad)
    gl.bufferData(gl.ARRAY_BUFFER, new Float32Array([-1, -1, 1, -1, -1, 1, 1, 1]), gl.STATIC_DRAW)
    gl.enableVertexAttribArray(0)
    gl.vertexAttribPointer(0, 2, gl.FLOAT, false, 0, 0)

    let targets = []
    let tw = 0
    let th = 0
    const makeTarget = () => {
      const tex = gl.createTexture()
      gl.bindTexture(gl.TEXTURE_2D, tex)
      if (floatOk) gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGBA16F, tw, th, 0, gl.RGBA, gl.HALF_FLOAT, null)
      else gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGBA8, tw, th, 0, gl.RGBA, gl.UNSIGNED_BYTE, null)
      gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.LINEAR)
      gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MAG_FILTER, gl.LINEAR)
      gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_S, gl.CLAMP_TO_EDGE)
      gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_T, gl.CLAMP_TO_EDGE)
      const fbo = gl.createFramebuffer()
      gl.bindFramebuffer(gl.FRAMEBUFFER, fbo)
      gl.framebufferTexture2D(gl.FRAMEBUFFER, gl.COLOR_ATTACHMENT0, gl.TEXTURE_2D, tex, 0)
      gl.clearColor(0, 0, 0, 1)
      gl.clear(gl.COLOR_BUFFER_BIT)
      return { tex, fbo }
    }

    let ghost = null
    const resize = () => {
      const w = window.innerWidth
      const h = window.innerHeight
      // The thermal image is soft by nature; half resolution is plenty.
      canvas.width = Math.round(w * 0.5)
      canvas.height = Math.round(h * 0.5)
      targets.forEach(({ tex, fbo }) => {
        gl.deleteTexture(tex)
        gl.deleteFramebuffer(fbo)
      })
      tw = Math.max(64, Math.round(w * SCALE))
      th = Math.max(64, Math.round(h * SCALE))
      targets = [makeTarget(), makeTarget()]
      ghost?.rebuild()
    }
    resize()

    const palette = readPalette()
    const ramp = new Float32Array(palette.ramp.flat())
    const probePixel = new Float32Array(4)
    const probeByte = new Uint8Array(4)
    let frameCount = 0

    let raf = 0
    let lastScroll = window.scrollY
    let prev = null
    let t0 = performance.now()
    let lastNow = 0
    let rawPrev = null
    let ghostOn = !reduce
    ghost = makeGhost()
    // Fonts change the headline's metrics, so map the route once they land.
    ghost.rebuild()
    document.fonts?.ready.then(() => ghost.rebuild())

    const frame = (now) => {
      const t = (now - t0) / 1000
      // Everything below is scaled by real elapsed time, so a dropped frame
      // leaves the same heat as two smooth ones.
      const dt = lastNow ? Math.min(0.05, (now - lastNow) / 1000) : 1 / 60
      lastNow = now
      const k = dt * 60
      const w = window.innerWidth
      const h = window.innerHeight

      const dy = window.scrollY - lastScroll
      lastScroll = window.scrollY

      // Who is driving: the visitor, or the sample visitor in the hero.
      let cur = null
      const heroVisible = window.scrollY < h * 0.9
      if (session.live) {
        if (ghostOn) {
          ghostOn = false
          ghostEl.dataset.on = 'false'
          prev = null
        }
        if (pointer.active) cur = [pointer.x / w, 1 - pointer.y / h]
      } else if (ghostOn && heroVisible) {
        const g = ghost.step(dt)
        if (g) {
          const gy = g[1] - window.scrollY
          cur = [g[0] / w, 1 - gy / h]
          ghostEl.style.transform = `translate3d(${g[0]}px, ${gy}px, 0)`
          ghostEl.dataset.on = 'true'
        }
      } else if (ghostOn) {
        ghostEl.dataset.on = 'false'
      }

      // Keep the previous point glued to the content while scrolling.
      if (prev) prev = [prev[0], prev[1] + dy / h]

      const a = prev || cur
      const b = cur
      let strength = 0
      if (a && b) {
        const len = Math.hypot((b[0] - a[0]) * (w / h), b[1] - a[1])
        // Dwell builds heat; fast moves leave a light trail; a cursor that is
        // only riding along with the scroll barely marks the page.
        const handMoved = rawPrev ? Math.hypot((b[0] - rawPrev[0]) * w, (b[1] - rawPrev[1]) * h) : 0
        const riding = dy !== 0 && handMoved < 2
        strength = ((0.034 * k) / (1 + (len / RADIUS) * 2.5)) * (riding ? 0.12 : 1)
      }
      prev = cur
      rawPrev = cur

      const [read, write] = targets
      gl.bindFramebuffer(gl.FRAMEBUFFER, write.fbo)
      gl.viewport(0, 0, tw, th)
      gl.useProgram(update.p)
      gl.activeTexture(gl.TEXTURE0)
      gl.bindTexture(gl.TEXTURE_2D, read.tex)
      gl.uniform1i(update.u.uPrev, 0)
      gl.uniform2f(update.u.uTexel, 1 / tw, 1 / th)
      gl.uniform2f(update.u.uShift, 0, -dy / h)
      gl.uniform2f(update.u.uA, ...(a || [-9, -9]))
      gl.uniform2f(update.u.uB, ...(b || [-9, -9]))
      gl.uniform1f(update.u.uAspect, w / h)
      gl.uniform1f(update.u.uRadius, RADIUS)
      gl.uniform1f(update.u.uStrength, strength)
      gl.uniform1f(update.u.uDecay, floatOk ? decay * k : decay)
      const clicks = clickQueue.splice(0, 4)
      const packed = new Float32Array(16)
      clicks.forEach(([cx, cy], i) => packed.set([cx / w, 1 - cy / h, 0.7, 0], i * 4))
      gl.uniform4fv(update.u.uClicks, packed)
      gl.uniform1i(update.u.uClickCount, clicks.length)
      gl.drawArrays(gl.TRIANGLE_STRIP, 0, 4)
      targets = [write, read]

      gl.bindFramebuffer(gl.FRAMEBUFFER, null)
      gl.viewport(0, 0, canvas.width, canvas.height)
      gl.useProgram(render.p)
      gl.bindTexture(gl.TEXTURE_2D, write.tex)
      gl.uniform1i(render.u.uHeat, 0)
      gl.uniform1f(render.u.uTime, t)
      gl.uniform1f(render.u.uAspect, w / h)
      gl.uniform3f(render.u.uCold, ...palette.cold)
      gl.uniform3fv(render.u.uRamp, ramp)
      gl.uniform3f(render.u.uPeak, ...palette.peak)
      gl.drawArrays(gl.TRIANGLE_STRIP, 0, 4)

      // Share where heat is being laid, and read the heat under the visitor's
      // pointer a few times a second for the spot meter.
      driver.on = !!b
      if (b) {
        driver.x = b[0] * w
        driver.y = (1 - b[1]) * h
      }
      if (pointer.active && ++frameCount % 5 === 0) {
        const sx = Math.min(tw - 1, Math.max(0, Math.round((pointer.x / w) * tw)))
        const sy = Math.min(th - 1, Math.max(0, Math.round((1 - pointer.y / h) * th)))
        gl.bindFramebuffer(gl.FRAMEBUFFER, write.fbo)
        try {
          if (floatOk) {
            gl.readPixels(sx, sy, 1, 1, gl.RGBA, gl.FLOAT, probePixel)
            probe.heat = probePixel[0]
          } else {
            gl.readPixels(sx, sy, 1, 1, gl.RGBA, gl.UNSIGNED_BYTE, probeByte)
            probe.heat = probeByte[0] / 255
          }
        } catch {
          /* the spot meter just reads cold */
        }
        gl.bindFramebuffer(gl.FRAMEBUFFER, null)
      }

      raf = requestAnimationFrame(frame)
    }

    const start = () => {
      if (!raf) raf = requestAnimationFrame(frame)
    }
    const stop = () => {
      cancelAnimationFrame(raf)
      raf = 0
    }
    const onVisibility = () => (document.hidden ? stop() : start())

    // Let the page paint first; the field fades in once it is running.
    const kick = setTimeout(() => {
      t0 = performance.now()
      canvas.dataset.ready = 'true'
      start()
    }, 350)

    window.addEventListener('resize', resize)
    document.addEventListener('visibilitychange', onVisibility)
    return () => {
      clearTimeout(kick)
      stop()
      window.removeEventListener('resize', resize)
      document.removeEventListener('visibilitychange', onVisibility)
    }
  }, [])

  return (
    <>
      <canvas ref={canvasRef} className="heat" aria-hidden="true" />
      <div ref={ghostRef} className="ghost" data-on="false" aria-hidden="true">
        <span>demo visitor</span>
      </div>
    </>
  )
}
