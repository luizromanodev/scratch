import { useState, useMemo } from 'react'
import { createPortal } from 'react-dom'
import { useFinance } from '../../context/FinanceContext'
import { Bell, X, AlertTriangle, CheckCircle2, Info, CreditCard } from 'lucide-react'
import './NotificationCenter.css'

export default function NotificationCenter() {
  const { getNotifications } = useFinance()
  const [isOpen, setIsOpen] = useState(false)

  const notifications = useMemo(() => getNotifications(), [getNotifications])
  const count = notifications.length

  const getTypeClass = (type) => {
    switch (type) {
      case 'danger': return 'notif-danger'
      case 'warning': return 'notif-warning'
      case 'success': return 'notif-success'
      default: return 'notif-info'
    }
  }

  return (
    <>
      <button className="notif-trigger" onClick={() => setIsOpen(true)} aria-label="Notificações">
        <Bell size={20} />
        {count > 0 && <span className="notif-badge">{count > 9 ? '9+' : count}</span>}
      </button>

      {isOpen && createPortal(
        <div className="notif-overlay" onClick={() => setIsOpen(false)}>
          <div className="notif-panel animate-fade-in-down" onClick={e => e.stopPropagation()}>
            <div className="notif-header">
              <h3 className="notif-title">
                <Bell size={18} /> Notificações
              </h3>
              <button className="notif-close" onClick={() => setIsOpen(false)}>
                <X size={18} />
              </button>
            </div>

            <div className="notif-list">
              {notifications.length === 0 ? (
                <div className="notif-empty">
                  <span className="notif-empty-icon">🔔</span>
                  <p>Nenhuma notificação</p>
                  <span>Tudo certo por aqui!</span>
                </div>
              ) : (
                notifications.map(n => (
                  <div key={n.id} className={`notif-item ${getTypeClass(n.type)}`}>
                    <span className="notif-item-icon">{n.icon}</span>
                    <div className="notif-item-content">
                      <span className="notif-item-title">{n.title}</span>
                      <span className="notif-item-desc">{n.desc}</span>
                    </div>
                    <span className="notif-item-time">{n.time}</span>
                  </div>
                ))
              )}
            </div>
          </div>
        </div>,
        document.body
      )}
    </>
  )
}
