import { useEffect, useState } from 'react'
import { createPortal } from 'react-dom'
import './Confetti.css'

const COLORS = ['#6C5CE7', '#00D09C', '#FF6B6B', '#FDCB6E', '#74B9FF', '#FD79A8', '#00B894', '#E17055']

function ConfettiPiece({ index }) {
  const style = {
    '--x': `${Math.random() * 100}vw`,
    '--delay': `${Math.random() * 0.5}s`,
    '--duration': `${1.5 + Math.random() * 2}s`,
    '--rotate': `${Math.random() * 720 - 360}deg`,
    '--color': COLORS[index % COLORS.length],
    '--size': `${6 + Math.random() * 6}px`,
    left: `${Math.random() * 100}%`,
  }
  return <div className="confetti-piece" style={style} />
}

export default function Confetti({ active = false, duration = 3000 }) {
  const [show, setShow] = useState(false)

  useEffect(() => {
    if (active) {
      setShow(true)
      const timer = setTimeout(() => setShow(false), duration)
      return () => clearTimeout(timer)
    }
  }, [active, duration])

  if (!show) return null

  return createPortal(
    <div className="confetti-container" aria-hidden="true">
      {Array.from({ length: 60 }).map((_, i) => (
        <ConfettiPiece key={i} index={i} />
      ))}
    </div>,
    document.body
  )
}
