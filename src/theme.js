// The palette lives in global.css; canvases and SVG filters read it from
// there so the colors are defined once.
const hexToRgb = (hex) => {
  const h = hex.trim().replace('#', '')
  return [0, 2, 4].map((i) => parseInt(h.slice(i, i + 2), 16) / 255)
}

// As 0..1 RGB: cold (the page), the four heat stops, and the peak.
export function readPalette() {
  const css = getComputedStyle(document.documentElement)
  const get = (v) => hexToRgb(css.getPropertyValue(v))
  return {
    cold: get('--paper'),
    ramp: ['--h1', '--h2', '--h3', '--h4'].map(get),
    peak: get('--peak'),
    paper: css.getPropertyValue('--paper').trim(),
    ink: css.getPropertyValue('--ink').trim(),
    dim: css.getPropertyValue('--dim').trim(),
    rule: css.getPropertyValue('--rule-solid').trim(),
  }
}
