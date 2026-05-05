import { useState, useEffect } from 'react'
import { WifiOff, Wifi } from 'lucide-react'
import './OfflineIndicator.css'

export default function OfflineIndicator() {
  const [isOffline, setIsOffline] = useState(!navigator.onLine)
  const [showReconnected, setShowReconnected] = useState(false)

  useEffect(() => {
    const handleOffline = () => setIsOffline(true)
    const handleOnline = () => {
      setIsOffline(false)
      setShowReconnected(true)
      setTimeout(() => setShowReconnected(false), 3000)
    }
    window.addEventListener('offline', handleOffline)
    window.addEventListener('online', handleOnline)
    return () => {
      window.removeEventListener('offline', handleOffline)
      window.removeEventListener('online', handleOnline)
    }
  }, [])

  if (!isOffline && !showReconnected) return null

  return (
    <div className={`offline-banner ${isOffline ? 'offline' : 'online'}`}>
      {isOffline ? (
        <><WifiOff size={16} /><span>Sem conexão — dados salvos localmente</span></>
      ) : (
        <><Wifi size={16} /><span>Conexão restaurada!</span></>
      )}
    </div>
  )
}
