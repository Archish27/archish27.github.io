import React from 'react'
import Smooth from './components/Smooth.jsx'
import Recorder from './components/Recorder.jsx'
import Heat from './components/Heat.jsx'
import Viewfinder from './components/Viewfinder.jsx'
import ThermalFilter from './components/ThermalFilter.jsx'
import Marquee from './components/Marquee.jsx'
import Cursor from './components/Cursor.jsx'
import TopBar from './components/TopBar.jsx'
import Hero from './components/Hero.jsx'
import About from './components/About.jsx'
import Experience from './components/Experience.jsx'
import Work from './components/Work.jsx'
import Replay from './components/Replay.jsx'
import Contact from './components/Contact.jsx'
import Footer from './components/Footer.jsx'

export default function App() {
  return (
    <Smooth>
      <Recorder />
      <Heat />
      <ThermalFilter />
      <div className="boot" aria-hidden="true">
        <p className="boot-text">Calibrating sensor</p>
        <p className="boot-count" />
      </div>
      <a className="skip" href="#about">
        Skip to content
      </a>
      <TopBar />
      <main>
        <Hero />
        <Marquee />
        <About />
        <Experience />
        <Work />
        <Replay />
        <Contact />
      </main>
      <Footer />
      <Viewfinder />
      <Cursor />
    </Smooth>
  )
}
