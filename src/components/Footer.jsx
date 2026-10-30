import React, { useEffect, useState } from 'react'
import { site } from '../data/site.js'

function useStars() {
  const [stars, setStars] = useState(null)
  useEffect(() => {
    fetch(`https://api.github.com/repos/${site.repo}`)
      .then((r) => (r.ok ? r.json() : null))
      .then((json) => json && setStars(json.stargazers_count))
      .catch(() => {})
  }, [])
  return stars
}

export default function Footer() {
  const stars = useStars()
  return (
    <footer className="footer wrap">
      <ul className="footer-socials">
        {site.socials.map((s) => (
          <li key={s.label}>
            <a href={s.href} target="_blank" rel="noopener noreferrer">
              {s.label}
            </a>
          </li>
        ))}
      </ul>
      <div className="footer-col">
        <p>
          <a href={`https://github.com/${site.repo}`} target="_blank" rel="noopener noreferrer">
            Source on GitHub{stars > 0 && ` (${stars} ${stars === 1 ? 'star' : 'stars'})`}
          </a>
        </p>
        <p>A thermal camera pointed at your visit. Built with React, WebGL, Lenis and Framer Motion.</p>
        <p>Set in Cabinet Grotesk and JetBrains Mono.</p>
      </div>
      <p className="footer-col">
        {site.city}, India
        <br />© {new Date().getFullYear()} {site.name}
      </p>
    </footer>
  )
}
