import { useEffect } from 'react'
import { startRecording } from '../session.js'

export default function Recorder() {
  useEffect(() => startRecording(), [])
  return null
}
