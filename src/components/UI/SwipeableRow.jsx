import { useRef, useState, useCallback } from 'react'
import './SwipeableRow.css'

const THRESHOLD = 80 // px to trigger action
const MAX_SLIDE = 100

export default function SwipeableRow({ children, onSwipeLeft, onSwipeRight, leftLabel = 'Editar', rightLabel = 'Excluir', leftColor, rightColor }) {
  const rowRef = useRef(null)
  const touchState = useRef({ startX: 0, startY: 0, moved: false })
  const [translateX, setTranslateX] = useState(0)
  const [transitioning, setTransitioning] = useState(false)
  const [swiped, setSwiped] = useState(null) // 'left' | 'right' | null

  const handleTouchStart = useCallback((e) => {
    touchState.current = {
      startX: e.touches[0].clientX,
      startY: e.touches[0].clientY,
      moved: false,
      locked: false,
    }
    setTransitioning(false)
  }, [])

  const handleTouchMove = useCallback((e) => {
    const dx = e.touches[0].clientX - touchState.current.startX
    const dy = e.touches[0].clientY - touchState.current.startY

    // If vertical scroll is dominant, don't intercept
    if (!touchState.current.locked) {
      if (Math.abs(dy) > Math.abs(dx) && Math.abs(dy) > 10) {
        touchState.current.locked = true
        touchState.current.vertical = true
        return
      }
      if (Math.abs(dx) > 10) {
        touchState.current.locked = true
        touchState.current.vertical = false
      }
    }

    if (touchState.current.vertical) return

    touchState.current.moved = true

    // Clamp the translation
    const clamped = Math.max(-MAX_SLIDE, Math.min(MAX_SLIDE, dx))
    setTranslateX(clamped)

    // Prevent scroll when swiping horizontally
    if (Math.abs(dx) > 10) {
      e.preventDefault()
    }
  }, [])

  const handleTouchEnd = useCallback(() => {
    if (!touchState.current.moved) {
      setTranslateX(0)
      return
    }

    setTransitioning(true)

    if (translateX > THRESHOLD && onSwipeRight) {
      // Swipe right → edit
      setSwiped('right')
      setTranslateX(MAX_SLIDE)
      setTimeout(() => {
        onSwipeRight()
        setTranslateX(0)
        setSwiped(null)
        setTransitioning(false)
      }, 300)
    } else if (translateX < -THRESHOLD && onSwipeLeft) {
      // Swipe left → delete
      setSwiped('left')
      setTranslateX(-MAX_SLIDE)
      setTimeout(() => {
        onSwipeLeft()
        setTranslateX(0)
        setSwiped(null)
        setTransitioning(false)
      }, 300)
    } else {
      // Snap back
      setTranslateX(0)
      setTimeout(() => setTransitioning(false), 200)
    }
  }, [translateX, onSwipeLeft, onSwipeRight])

  const leftProgress = Math.min(1, Math.max(0, translateX / THRESHOLD))
  const rightProgress = Math.min(1, Math.max(0, -translateX / THRESHOLD))

  return (
    <div className="swipeable-row" ref={rowRef}>
      {/* Background — Edit (right swipe) */}
      <div
        className={`swipe-bg swipe-bg-right ${swiped === 'right' ? 'triggered' : ''}`}
        style={{
          background: leftColor || 'var(--primary-500)',
          opacity: leftProgress * 0.15 + 0.05,
        }}
      >
        <div className="swipe-bg-content" style={{ opacity: leftProgress, transform: `scale(${0.6 + leftProgress * 0.4})` }}>
          <span className="swipe-label">{leftLabel}</span>
        </div>
      </div>

      {/* Background — Delete (left swipe) */}
      <div
        className={`swipe-bg swipe-bg-left ${swiped === 'left' ? 'triggered' : ''}`}
        style={{
          background: rightColor || 'var(--danger-500)',
          opacity: rightProgress * 0.15 + 0.05,
        }}
      >
        <div className="swipe-bg-content" style={{ opacity: rightProgress, transform: `scale(${0.6 + rightProgress * 0.4})` }}>
          <span className="swipe-label">{rightLabel}</span>
        </div>
      </div>

      {/* Foreground */}
      <div
        className={`swipe-content ${transitioning ? 'transitioning' : ''}`}
        style={{ transform: `translateX(${translateX}px)` }}
        onTouchStart={handleTouchStart}
        onTouchMove={handleTouchMove}
        onTouchEnd={handleTouchEnd}
      >
        {children}
      </div>
    </div>
  )
}
