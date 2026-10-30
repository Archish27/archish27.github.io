import React, { startTransition } from 'react'
import { createRoot, hydrateRoot } from 'react-dom/client'
import App from './App.jsx'
import 'lenis/dist/lenis.css'
import './styles/global.css'

// Scroll reveals are gated on this class: without JS everything is simply visible.
document.documentElement.classList.add('js')

const root = document.getElementById('root')
if (root.children.length) {
  // A transition lets React hydrate in slices and yield to the browser,
  // instead of one long task while the visitor is already reading.
  startTransition(() => {
    hydrateRoot(root, <App />)
  })
} else {
  createRoot(root).render(<App />)
}
