import React from 'react'
import { createRoot, hydrateRoot } from 'react-dom/client'
import App from './App.jsx'
import 'lenis/dist/lenis.css'
import './styles/global.css'

// Scroll reveals are gated on this class: without JS everything is simply visible.
document.documentElement.classList.add('js')

const root = document.getElementById('root')
if (root.children.length) {
  hydrateRoot(root, <App />)
} else {
  createRoot(root).render(<App />)
}
