import React, { useEffect, useRef } from 'react'
import { readPalette } from '../theme.js'

// An SVG gradient map that turns any photo into a monochrome thermal image
// in the page's palette.
const DEFAULT = {
  r: '0.416 0.541 0.639 0.784 0.925 1',
  g: '0.416 0.541 0.639 0.784 0.925 1',
  b: '0.404 0.529 0.627 0.776 0.918 1',
}

export default function ThermalFilter() {
  const r = useRef(null)
  const g = useRef(null)
  const b = useRef(null)

  useEffect(() => {
    const { cold, ramp, peak } = readPalette()
    // Always map dark to dark: the heat ramp runs light to dark (black hot),
    // which would otherwise turn photos into negatives.
    const lum = ([r, g, b]) => 0.2126 * r + 0.7152 * g + 0.0722 * b
    const stops = [cold, ...ramp, peak].sort((a, b) => lum(a) - lum(b))
    ;[r, g, b].forEach((ref, ch) => {
      ref.current.setAttribute('tableValues', stops.map((c) => c[ch].toFixed(3)).join(' '))
    })
  }, [])

  return (
    <svg className="sr-only" width="0" height="0" aria-hidden="true" focusable="false">
      <filter id="thermal" colorInterpolationFilters="sRGB">
        <feColorMatrix type="saturate" values="0" />
        <feComponentTransfer>
          <feFuncR ref={r} type="table" tableValues={DEFAULT.r} />
          <feFuncG ref={g} type="table" tableValues={DEFAULT.g} />
          <feFuncB ref={b} type="table" tableValues={DEFAULT.b} />
        </feComponentTransfer>
      </filter>
    </svg>
  )
}
