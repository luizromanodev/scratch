import { useMemo } from 'react'
import { useNavigate } from 'react-router-dom'
import { useFinance } from '../context/FinanceContext'
import { ArrowLeft, Trophy, Lock } from 'lucide-react'
import './AchievementsPage.css'

export default function AchievementsPage() {
  const navigate = useNavigate()
  const { achievements } = useFinance()

  const unlockedCount = useMemo(() => achievements.filter(a => a.unlocked).length, [achievements])
  const totalCount = achievements.length
  const progressPct = totalCount > 0 ? (unlockedCount / totalCount) * 100 : 0

  return (
    <div className="page container">
      <header className="ach-header">
        <button className="back-btn" onClick={() => navigate(-1)} aria-label="Voltar">
          <ArrowLeft size={24} />
        </button>
        <div>
          <h1 className="ach-title">Conquistas</h1>
          <p className="ach-subtitle">Desbloqueie todas!</p>
        </div>
      </header>

      {/* Progress Overview */}
      <div className="ach-overview glass">
        <div className="ach-trophy-container">
          <Trophy size={36} className="ach-trophy-icon" />
        </div>
        <div className="ach-overview-info">
          <span className="ach-overview-count">{unlockedCount} de {totalCount}</span>
          <span className="ach-overview-label">conquistas desbloqueadas</span>
        </div>
        <div className="ach-overview-bar">
          <div className="ach-overview-fill" style={{ width: `${progressPct}%` }} />
        </div>
      </div>

      {/* Achievements Grid */}
      <div className="ach-grid stagger">
        {achievements.map(ach => (
          <div key={ach.id} className={`ach-card ${ach.unlocked ? 'unlocked' : 'locked'}`}>
            <div className="ach-card-icon-wrapper">
              {ach.unlocked ? (
                <span className="ach-card-emoji">{ach.icon}</span>
              ) : (
                <div className="ach-card-lock">
                  <Lock size={20} />
                </div>
              )}
            </div>
            <h3 className="ach-card-name">{ach.name}</h3>
            <p className="ach-card-desc">{ach.desc}</p>
            {!ach.unlocked && ach.progress !== undefined && (
              <div className="ach-card-progress">
                <div className="ach-card-progress-bar">
                  <div className="ach-card-progress-fill" style={{ width: `${Math.min(ach.progress * 100, 100)}%` }} />
                </div>
                <span className="ach-card-progress-pct">{Math.round(ach.progress * 100)}%</span>
              </div>
            )}
            {ach.unlocked && (
              <div className="ach-card-unlocked-badge">✓ Desbloqueada</div>
            )}
          </div>
        ))}
      </div>
    </div>
  )
}
