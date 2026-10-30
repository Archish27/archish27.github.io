import React from 'react'
import { ReactLenis } from 'lenis/react'
import { useReducedMotion } from 'framer-motion'

// Lenis drives the window scroll, so framer-motion's useScroll keeps working.
// `anchors` makes the in-page nav links glide instead of jump.
export default function Smooth({ children }) {
  const reduce = useReducedMotion()
  if (reduce) return <>{children}</>
  return (
    <ReactLenis root options={{ lerp: 0.09, wheelMultiplier: 0.9, anchors: true }}>
      {children}
    </ReactLenis>
  )
}
