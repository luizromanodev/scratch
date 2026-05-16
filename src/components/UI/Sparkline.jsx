import { useMemo } from 'react'
import './Sparkline.css'

export default function Sparkline({ data = [], color = 'currentColor', width = 100, height = 30, filled = false }) {
  const points = useMemo(() => {
    if (data.length < 2) return ''
    const max = Math.max(...data)
    const min = Math.min(...data)
    const range = max - min || 1

    return data.map((val, i) => {
      const x = (i / (data.length - 1)) * width
      const y = height - ((val - min) / range) * (height * 0.8) - height * 0.1
      return `${x},${y}`
    }).join(' ')
  }, [data, width, height])

  const fillPoints = useMemo(() => {
    if (!filled || data.length < 2) return ''
    return `0,${height} ${points} ${width},${height}`
  }, [filled, points, data, width, height])

  if (data.length < 2) return null

  return (
    <svg className="sparkline" viewBox={`0 0 ${width} ${height}`} preserveAspectRatio="none" width={width} height={height}>
      {filled && (
        <polygon points={fillPoints} fill={`${color}15`} />
      )}
      <polyline
        points={points}
        fill="none"
        stroke={color}
        strokeWidth="1.5"
        strokeLinecap="round"
        strokeLinejoin="round"
        vectorEffect="non-scaling-stroke"
      />
    </svg>
  )
}
