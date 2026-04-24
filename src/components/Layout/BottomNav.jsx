import { useLocation, useNavigate } from 'react-router-dom'
import { Home, ArrowLeftRight, Plus, Landmark, User } from 'lucide-react'
import './BottomNav.css'

const navItems = [
  { path: '/', icon: Home, label: 'Início' },
  { path: '/transactions', icon: ArrowLeftRight, label: 'Transações' },
  { path: '/add', icon: Plus, label: 'Adicionar', isMain: true },
  { path: '/banks', icon: Landmark, label: 'Bancos' },
  { path: '/profile', icon: User, label: 'Perfil' },
]

export default function BottomNav() {
  const location = useLocation()
  const navigate = useNavigate()

  return (
    <nav className="bottom-nav glass" id="bottom-nav">
      {navItems.map(item => {
        const isActive = location.pathname === item.path
        const Icon = item.icon
        return (
          <button
            key={item.path}
            className={`nav-item ${isActive ? 'active' : ''} ${item.isMain ? 'nav-main' : ''}`}
            onClick={() => navigate(item.path)}
            id={`nav-${item.label.toLowerCase()}`}
            aria-label={item.label}
          >
            {item.isMain ? (
              <div className="nav-main-btn">
                <Icon size={24} strokeWidth={2.5} />
              </div>
            ) : (
              <>
                <div className="nav-icon-wrapper">
                  {isActive && <div className="nav-indicator" />}
                  <Icon size={22} strokeWidth={isActive ? 2.5 : 1.8} />
                </div>
                <span className="nav-label">{item.label}</span>
              </>
            )}
          </button>
        )
      })}
    </nav>
  )
}
