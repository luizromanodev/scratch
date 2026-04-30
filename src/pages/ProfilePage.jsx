import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'
import { useTheme } from '../context/ThemeContext'
import { useFinance } from '../context/FinanceContext'
import { useToast } from '../components/UI/Toast'
import { currencies } from '../utils/formatCurrency'
import Modal from '../components/UI/Modal'
import {
  User, Moon, Sun, Globe, Trash2, LogOut, ChevronRight,
  Download, Palette, Info, Tags
} from 'lucide-react'
import './ProfilePage.css'

export default function ProfilePage() {
  const navigate = useNavigate()
  const { user, logout, updateUser } = useAuth()
  const { theme, toggleTheme } = useTheme()
  const { currency, setCurrency, transactions, clearAllData } = useFinance()
  const { addToast } = useToast()

  const [showCurrency, setShowCurrency] = useState(false)
  const [showClearConfirm, setShowClearConfirm] = useState(false)
  const [editingName, setEditingName] = useState(false)
  const [newName, setNewName] = useState(user?.name || '')

  const handleExport = () => {
    const csvRows = [
      'Data,Tipo,Categoria,Descrição,Valor',
      ...transactions.map(t =>
        `${t.date},${t.type === 'income' ? 'Receita' : 'Despesa'},${t.category},${t.description || ''},${t.amount}`
      )
    ]
    const blob = new Blob([csvRows.join('\n')], { type: 'text/csv' })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = `finflow_transacoes_${new Date().toISOString().split('T')[0]}.csv`
    a.click()
    URL.revokeObjectURL(url)
    addToast('Dados exportados!', 'success')
  }

  const handleClear = () => {
    clearAllData()
    setShowClearConfirm(false)
    addToast('Todos os dados foram limpos', 'info')
  }

  const handleNameSave = () => {
    if (newName.trim()) {
      updateUser({ name: newName.trim() })
      setEditingName(false)
      addToast('Nome atualizado!', 'success')
    }
  }

  return (
    <div className="page container">
      <header className="prof-header">
        <h1 className="prof-title">Perfil</h1>
      </header>

      {/* User Card */}
      <div className="prof-user-card" id="profile-card">
        <div className="prof-avatar">
          <span>{user?.name?.charAt(0)?.toUpperCase() || 'U'}</span>
        </div>
        <div className="prof-user-info">
          {editingName ? (
            <div className="prof-edit-name">
              <input
                value={newName}
                onChange={e => setNewName(e.target.value)}
                className="prof-name-input"
                autoFocus
                onKeyDown={e => e.key === 'Enter' && handleNameSave()}
              />
              <button className="prof-name-save" onClick={handleNameSave}>Salvar</button>
            </div>
          ) : (
            <h2 className="prof-name" onClick={() => setEditingName(true)}>{user?.name}</h2>
          )}
          <p className="prof-email">{user?.email || 'Sem e-mail'}</p>
        </div>
      </div>

      {/* Settings */}
      <section className="prof-section">
        <h3 className="section-title">Configurações</h3>

        {/* Theme */}
        <button className="prof-item" onClick={toggleTheme} id="btn-toggle-theme">
          <div className="prof-item-icon" style={{ background: 'rgba(108, 92, 231, 0.12)', color: 'var(--primary-500)' }}>
            {theme === 'dark' ? <Moon size={20} /> : <Sun size={20} />}
          </div>
          <div className="prof-item-info">
            <span className="prof-item-label">Tema</span>
            <span className="prof-item-value">{theme === 'dark' ? 'Escuro' : 'Claro'}</span>
          </div>
          <div className={`toggle-switch-mini ${theme === 'dark' ? 'on' : ''}`}>
            <div className="toggle-thumb-mini" />
          </div>
        </button>

        {/* Categories */}
        <button className="prof-item" onClick={() => navigate('/categories')} id="btn-categories">
          <div className="prof-item-icon" style={{ background: 'rgba(253, 121, 168, 0.12)', color: '#FD79A8' }}>
            <Tags size={20} />
          </div>
          <div className="prof-item-info">
            <span className="prof-item-label">Categorias</span>
            <span className="prof-item-value">Gerenciar categorias</span>
          </div>
          <ChevronRight size={18} className="prof-item-arrow" />
        </button>

        {/* Currency */}
        <button className="prof-item" onClick={() => setShowCurrency(true)} id="btn-change-currency">
          <div className="prof-item-icon" style={{ background: 'rgba(0, 208, 156, 0.12)', color: 'var(--success-500)' }}>
            <Globe size={20} />
          </div>
          <div className="prof-item-info">
            <span className="prof-item-label">Moeda</span>
            <span className="prof-item-value">{currencies[currency]?.name || 'Real Brasileiro'}</span>
          </div>
          <ChevronRight size={18} className="prof-item-arrow" />
        </button>

        {/* Export */}
        <button className="prof-item" onClick={handleExport} id="btn-export">
          <div className="prof-item-icon" style={{ background: 'rgba(116, 185, 255, 0.12)', color: '#74B9FF' }}>
            <Download size={20} />
          </div>
          <div className="prof-item-info">
            <span className="prof-item-label">Exportar dados</span>
            <span className="prof-item-value">Baixar CSV com transações</span>
          </div>
          <ChevronRight size={18} className="prof-item-arrow" />
        </button>
      </section>

      {/* Danger Zone */}
      <section className="prof-section">
        <h3 className="section-title">Zona de perigo</h3>

        <button className="prof-item danger" onClick={() => setShowClearConfirm(true)} id="btn-clear-data">
          <div className="prof-item-icon" style={{ background: 'rgba(255, 107, 107, 0.12)', color: 'var(--danger-500)' }}>
            <Trash2 size={20} />
          </div>
          <div className="prof-item-info">
            <span className="prof-item-label">Limpar todos os dados</span>
            <span className="prof-item-value">{transactions.length} transações</span>
          </div>
          <ChevronRight size={18} className="prof-item-arrow" />
        </button>

        <button className="prof-item danger" onClick={logout} id="btn-logout">
          <div className="prof-item-icon" style={{ background: 'rgba(255, 107, 107, 0.12)', color: 'var(--danger-500)' }}>
            <LogOut size={20} />
          </div>
          <div className="prof-item-info">
            <span className="prof-item-label">Sair da conta</span>
          </div>
          <ChevronRight size={18} className="prof-item-arrow" />
        </button>
      </section>

      {/* App Info */}
      <div className="prof-footer">
        <p>FinFlow v1.0.0</p>
        <p>Feito com 💜</p>
      </div>

      {/* Currency Modal */}
      <Modal isOpen={showCurrency} onClose={() => setShowCurrency(false)} title="Escolher Moeda">
        <div className="currency-list">
          {Object.entries(currencies).map(([code, info]) => (
            <button
              key={code}
              className={`currency-item ${currency === code ? 'active' : ''}`}
              onClick={() => { setCurrency(code); setShowCurrency(false); addToast(`Moeda alterada para ${info.name}`, 'success') }}
            >
              <span className="currency-symbol">{info.symbol}</span>
              <div className="currency-info">
                <span className="currency-code">{code}</span>
                <span className="currency-name">{info.name}</span>
              </div>
              {currency === code && <span className="currency-check">✓</span>}
            </button>
          ))}
        </div>
      </Modal>

      {/* Clear Confirm Modal */}
      <Modal isOpen={showClearConfirm} onClose={() => setShowClearConfirm(false)} title="Limpar Dados">
        <div className="clear-confirm">
          <p className="clear-warning">⚠️ Esta ação é irreversível. Todos os seus dados serão apagados permanentemente.</p>
          <div className="clear-actions">
            <button className="clear-cancel" onClick={() => setShowClearConfirm(false)}>Cancelar</button>
            <button className="clear-delete" onClick={handleClear}>Apagar tudo</button>
          </div>
        </div>
      </Modal>
    </div>
  )
}
