import { useState, useRef } from 'react'
import { useNavigate } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'
import { useTheme, ACCENT_COLORS } from '../context/ThemeContext'
import { useFinance } from '../context/FinanceContext'
import { useToast } from '../components/UI/Toast'
import { currencies } from '../utils/formatCurrency'
import Modal from '../components/UI/Modal'
import {
  User, Moon, Sun, Globe, Trash2, LogOut, ChevronRight,
  Download, Upload, Palette, Info, Tags, Wallet, Save, FolderUp, Trophy, Repeat, Calendar, Bell, Sparkles
} from 'lucide-react'
import './ProfilePage.css'

export default function ProfilePage() {
  const navigate = useNavigate()
  const { user, logout, updateUser } = useAuth()
  const { theme, toggleTheme, accent, setAccent } = useTheme()
  const { currency, setCurrency, transactions, clearAllData, exportData, importData } = useFinance()
  const { addToast } = useToast()
  const restoreInputRef = useRef(null)

  const [showCurrency, setShowCurrency] = useState(false)
  const [showClearConfirm, setShowClearConfirm] = useState(false)
  const [showLogoutConfirm, setShowLogoutConfirm] = useState(false)
  const [editingName, setEditingName] = useState(false)
  const [newName, setNewName] = useState(user?.name || '')

  const handleExportCSV = () => {
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
    addToast('CSV exportado!', 'success')
  }

  const handleBackup = () => {
    const backup = exportData()
    const blob = new Blob([JSON.stringify(backup, null, 2)], { type: 'application/json' })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = `finflow_backup_${new Date().toISOString().split('T')[0]}.json`
    a.click()
    URL.revokeObjectURL(url)
    addToast('Backup completo salvo!', 'success')
  }

  const handleRestore = async (e) => {
    const file = e.target.files?.[0]
    if (!file) return
    try {
      const text = await file.text()
      const jsonData = JSON.parse(text)
      importData(jsonData)
      addToast(`Backup restaurado! ${jsonData.data?.transactions?.length || 0} transações carregadas`, 'success')
    } catch (err) {
      addToast(err.message || 'Erro ao restaurar backup', 'error')
    } finally {
      if (restoreInputRef.current) restoreInputRef.current.value = ''
    }
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

        {/* Accent Color */}
        <div className="prof-item" style={{ flexDirection: 'column', alignItems: 'flex-start', gap: '12px' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '12px', width: '100%' }}>
            <div className="prof-item-icon" style={{ background: 'rgba(108, 92, 231, 0.12)', color: 'var(--primary-500)' }}>
              <Palette size={20} />
            </div>
            <div className="prof-item-info">
              <span className="prof-item-label">Cor do App</span>
              <span className="prof-item-value">{ACCENT_COLORS[accent]?.name || 'Índigo'}</span>
            </div>
          </div>
          <div className="prof-accent-picker">
            {Object.entries(ACCENT_COLORS).map(([key, color]) => (
              <button
                key={key}
                className={`prof-accent-btn ${accent === key ? 'active' : ''}`}
                style={{ background: color.primary }}
                onClick={() => { setAccent(key); addToast(`Cor alterada para ${color.name}`, 'success') }}
                aria-label={color.name}
              />
            ))}
          </div>
        </div>

        {/* Notifications */}
        <button className="prof-item" onClick={() => navigate('/notifications')} id="btn-notifications">
          <div className="prof-item-icon" style={{ background: 'rgba(108, 92, 231, 0.12)', color: 'var(--primary-500)' }}>
            <Bell size={20} />
          </div>
          <div className="prof-item-info">
            <span className="prof-item-label">Notificações</span>
            <span className="prof-item-value">Push notifications no celular</span>
          </div>
          <ChevronRight size={18} className="prof-item-arrow" />
        </button>

        {/* AI Assistant */}
        <button className="prof-item" onClick={() => navigate('/ai')} id="btn-ai-assistant">
          <div className="prof-item-icon" style={{ background: 'linear-gradient(135deg, rgba(108, 92, 231, 0.15), rgba(162, 155, 254, 0.15))', color: '#A29BFE' }}>
            <Sparkles size={20} />
          </div>
          <div className="prof-item-info">
            <span className="prof-item-label">FinBot IA</span>
            <span className="prof-item-value">Assistente financeiro inteligente</span>
          </div>
          <ChevronRight size={18} className="prof-item-arrow" />
        </button>

        {/* Accounts */}
        <button className="prof-item" onClick={() => navigate('/accounts')} id="btn-accounts">
          <div className="prof-item-icon" style={{ background: 'rgba(0, 208, 156, 0.12)', color: 'var(--success-500)' }}>
            <Wallet size={20} />
          </div>
          <div className="prof-item-info">
            <span className="prof-item-label">Contas</span>
            <span className="prof-item-value">Gerenciar carteiras</span>
          </div>
          <ChevronRight size={18} className="prof-item-arrow" />
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

        {/* Recurring */}
        <button className="prof-item" onClick={() => navigate('/recurring')} id="btn-recurring">
          <div className="prof-item-icon" style={{ background: 'rgba(116, 185, 255, 0.12)', color: '#74B9FF' }}>
            <Repeat size={20} />
          </div>
          <div className="prof-item-info">
            <span className="prof-item-label">Recorrentes</span>
            <span className="prof-item-value">Assinaturas e contas fixas</span>
          </div>
          <ChevronRight size={18} className="prof-item-arrow" />
        </button>

        {/* Annual Summary */}
        <button className="prof-item" onClick={() => navigate('/annual')} id="btn-annual">
          <div className="prof-item-icon" style={{ background: 'rgba(253, 203, 110, 0.12)', color: '#FDCB6E' }}>
            <Calendar size={20} />
          </div>
          <div className="prof-item-info">
            <span className="prof-item-label">Resumo Anual</span>
            <span className="prof-item-value">Visão completa do ano</span>
          </div>
          <ChevronRight size={18} className="prof-item-arrow" />
        </button>

        {/* Achievements */}
        <button className="prof-item" onClick={() => navigate('/achievements')} id="btn-achievements">
          <div className="prof-item-icon" style={{ background: 'rgba(225, 112, 85, 0.12)', color: '#E17055' }}>
            <Trophy size={20} />
          </div>
          <div className="prof-item-info">
            <span className="prof-item-label">Conquistas</span>
            <span className="prof-item-value">Desbloqueie badges</span>
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
      </section>

      {/* Backup & Export */}
      <section className="prof-section">
        <h3 className="section-title">Backup & Dados</h3>

        {/* Full Backup */}
        <button className="prof-item" onClick={handleBackup} id="btn-backup">
          <div className="prof-item-icon" style={{ background: 'rgba(108, 92, 231, 0.12)', color: 'var(--primary-500)' }}>
            <Save size={20} />
          </div>
          <div className="prof-item-info">
            <span className="prof-item-label">Backup Completo</span>
            <span className="prof-item-value">Exportar todos os dados (JSON)</span>
          </div>
          <ChevronRight size={18} className="prof-item-arrow" />
        </button>

        {/* Restore */}
        <button className="prof-item" onClick={() => restoreInputRef.current?.click()} id="btn-restore">
          <div className="prof-item-icon" style={{ background: 'rgba(253, 203, 110, 0.12)', color: '#FDCB6E' }}>
            <FolderUp size={20} />
          </div>
          <div className="prof-item-info">
            <span className="prof-item-label">Restaurar Backup</span>
            <span className="prof-item-value">Importar arquivo JSON</span>
          </div>
          <ChevronRight size={18} className="prof-item-arrow" />
        </button>
        <input type="file" ref={restoreInputRef} onChange={handleRestore} accept=".json" style={{ display: 'none' }} />

        {/* Export CSV */}
        <button className="prof-item" onClick={handleExportCSV} id="btn-export">
          <div className="prof-item-icon" style={{ background: 'rgba(116, 185, 255, 0.12)', color: '#74B9FF' }}>
            <Download size={20} />
          </div>
          <div className="prof-item-info">
            <span className="prof-item-label">Exportar CSV</span>
            <span className="prof-item-value">Baixar transações em planilha</span>
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

        <button className="prof-item danger" onClick={() => setShowLogoutConfirm(true)} id="btn-logout">
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
        <p>FinFlow v{__APP_VERSION__}</p>
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

      {/* Logout Confirm Modal */}
      <Modal isOpen={showLogoutConfirm} onClose={() => setShowLogoutConfirm(false)} title="Sair da Conta">
        <div className="clear-confirm">
          <p className="clear-warning">Tem certeza que deseja sair? Seus dados continuarão salvos neste dispositivo.</p>
          <div className="clear-actions">
            <button className="clear-cancel" onClick={() => setShowLogoutConfirm(false)}>Cancelar</button>
            <button className="clear-delete" onClick={logout}>Sair</button>
          </div>
        </div>
      </Modal>
    </div>
  )
}
