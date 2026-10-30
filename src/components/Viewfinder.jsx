import React from 'react'

// Camera chrome around the whole page: corner brackets and the temperature scale.
export default function Viewfinder() {
  return (
    <div className="viewfinder" aria-hidden="true">
      <span className="vf-corner vf-tl" />
      <span className="vf-corner vf-tr" />
      <span className="vf-corner vf-bl" />
      <span className="vf-corner vf-br" />
      <div className="vf-scale">
        <span>38°</span>
        <span className="vf-bar" />
        <span>22°</span>
      </div>
    </div>
  )
}
