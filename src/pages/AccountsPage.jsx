import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { useFinance } from '../context/FinanceContext'
import { useToast } from '../components/UI/Toast'
import { formatCurrency } from '../utils/formatCurrency'
import Modal from '../components/UI/Modal'
import {
  ArrowLeft, Plus, Wallet, PiggyBank, Banknote, TrendingUp,
  Trash2, Pencil, Check, ArrowRightLeft, X
} from 'lucide-react'
import './AccountsPage.css'

const accountTypes = [
  { value: 'checking', label: 'Conta Corrente', icon: 'Wallet' },
  { value: 'savings', label: 'Poupança', icon: 'PiggyBank' },
  { value: 'cash', label: 'Dinheiro', icon: 'Banknote' },
  { value: 'investment', label: 'Investimento', icon: 'TrendingUp' },
]

const accountColors = [
  '#6C5CE7', '#00D09C', '#FF6B6B', '#74B9FF', '#FD79A8',
  '#FDCB6E', '#E17055', '#00B894', '#A29BFE', '#0984E3',
]

const AccountTypeIcon = ({ type, size = 20, color }) => {
  const icons = { checking: Wallet, savings: PiggyBank, cash: Banknote, investment: TrendingUp }
  const Icon = icons[type] || Wallet
  return <Icon size={size} color={color} />
}

export default function AccountsPage() {
  const navigate = useNavigate()
  const { accounts, currency, addAccount, updateAccount, deleteAccount, transferBetweenAccounts, getAccountBalance } = useFinance()
  const { addToast } = useToast()

  const [showForm, setShowForm] = useState(false)
  const [showTransfer, setShowTransfer] = useState(false)
  const [editingId, setEditingId] = useState(null)

  // Form state
  const [name, setName] = useState('')
  const [type, setType] = useState('checking')
  const [color, setColor] = useState('#6C5CE7')
  const [initialBalance, setInitialBalance] = useState('')

  // Transfer state
  const [transferFrom, setTransferFrom] = useState('')
  const [transferTo, setTransferTo] = useState('')
  const [transferAmount, setTransferAmount] = useState('')
  const [transferDesc, setTransferDesc] = useState('')

  const openCreate = () => {
    setEditingId(null)
    setName('')
    setType('checking')
    setColor('#6C5CE7')
    setInitialBalance('')
    setShowForm(true)
  }

  const openEdit = (account) => {
    setEditingId(account.id)
    setName(account.name)
    setType(account.type)
    setColor(account.color)
    setInitialBalance(String(account.initialBalance || 0))
    setShowForm(true)
  }

  const handleSave = () => {
    if (!name.trim()) {
      addToast('Insira um nome para a conta', 'error')
      return
    }

    if (editingId) {
      updateAccount(editingId, {
        name: name.trim(),
        type,
        color,
        initialBalance: parseFloat(initialBalance) || 0,
      })
      addToast('Conta atualizada!', 'success')
    } else {
      addAccount({
        name: name.trim(),
        type,
        icon: type,
        color,
        initialBalance: parseFloat(initialBalance) || 0,
      })
      addToast('Conta criada!', 'success')
    }
    setShowForm(false)
  }

  const handleDelete = (id) => {
    if (id === 'main') {
      addToast('Não é possível excluir a conta principal', 'error')
      return
    }
    deleteAccount(id)
    addToast('Conta removida', 'info')
  }

  const handleTransfer = () => {
    const amount = parseFloat(transferAmount)
    if (!amount || amount <= 0) {
      addToast('Insira um valor válido', 'error')
      return
    }
    if (!transferFrom || !transferTo || transferFrom === transferTo) {
      addToast('Selecione contas diferentes', 'error')
      return
    }
    transferBetweenAccounts(transferFrom, transferTo, amount, transferDesc)
    addToast('Transferência realizada!', 'success')
    setShowTransfer(false)
    setTransferAmount('')
    setTransferDesc('')
  }

  const totalBalance = accounts.reduce((sum, acc) => sum + getAccountBalance(acc.id), 0)

  return (
    <div className="page container">
      <header className="acc-header">
        <button className="acc-back" onClick={() => navigate(-1)} aria-label="Voltar">
          <ArrowLeft size={22} />
        </button>
        <h1 className="acc-title">Contas</h1>
        <button className="acc-transfer-btn" onClick={() => { setShowTransfer(true); setTransferFrom(accounts[0]?.id || ''); setTransferTo(accounts[1]?.id || '') }} aria-label="Transferir">
          <ArrowRightLeft size={20} />
        </button>
      </header>

      {/* Total Balance */}
      <div className="acc-total-card">
        <span className="acc-total-label">Patrimônio total</span>
        <span className={`acc-total-value ${totalBalance >= 0 ? 'positive' : 'negative'}`}>
          {formatCurrency(totalBalance, currency)}
        </span>
      </div>

      {/* Accounts List */}
      <div className="acc-list stagger">
        {accounts.map(acc => {
          const bal = getAccountBalance(acc.id)
          const typeInfo = accountTypes.find(t => t.value === acc.type) || accountTypes[0]
          return (
            <div key={acc.id} className="acc-card" style={{ '--acc-color': acc.color }}>
              <div className="acc-card-icon" style={{ background: acc.color + '18', color: acc.color }}>
                <AccountTypeIcon type={acc.type} size={22} color={acc.color} />
              </div>
              <div className="acc-card-info">
                <span className="acc-card-name">{acc.name}</span>
                <span className="acc-card-type">{typeInfo.label}</span>
              </div>
              <div className="acc-card-right">
                <span className={`acc-card-balance ${bal >= 0 ? 'positive' : 'negative'}`}>
                  {formatCurrency(bal, currency)}
                </span>
                <div className="acc-card-actions">
                  <button className="acc-action-btn" onClick={() => openEdit(acc)} aria-label="Editar">
                    <Pencil size={14} />
                  </button>
                  {acc.id !== 'main' && (
                    <button className="acc-action-btn danger" onClick={() => handleDelete(acc.id)} aria-label="Excluir">
                      <Trash2 size={14} />
                    </button>
                  )}
                </div>
              </div>
            </div>
          )
        })}
      </div>

      {/* Add Account Button */}
      <button className="acc-add-btn" onClick={openCreate}>
        <Plus size={20} />
        <span>Nova Conta</span>
      </button>

      {/* Create/Edit Modal */}
      <Modal isOpen={showForm} onClose={() => setShowForm(false)} title={editingId ? 'Editar Conta' : 'Nova Conta'}>
        <div className="acc-form">
          <div className="form-group">
            <label>Nome da conta</label>
            <input
              type="text"
              className="add-input"
              placeholder="Ex: Nubank"
              value={name}
              onChange={e => setName(e.target.value)}
              autoFocus
            />
          </div>

          <div className="form-group">
            <label>Tipo</label>
            <div className="acc-type-grid">
              {accountTypes.map(t => (
                <button
                  key={t.value}
                  className={`acc-type-chip ${type === t.value ? 'active' : ''}`}
                  onClick={() => setType(t.value)}
                  style={type === t.value ? { borderColor: color, background: color + '15' } : {}}
                >
                  <AccountTypeIcon type={t.value} size={16} color={type === t.value ? color : undefined} />
                  <span>{t.label}</span>
                </button>
              ))}
            </div>
          </div>

          <div className="form-group">
            <label>Cor</label>
            <div className="color-grid">
              {accountColors.map(c => (
                <button
                  key={c}
                  className={`color-opt ${color === c ? 'active' : ''}`}
                  style={{ background: c }}
                  onClick={() => setColor(c)}
                />
              ))}
            </div>
          </div>

          <div className="form-group">
            <label>Saldo inicial (R$)</label>
            <input
              type="number"
              className="add-input"
              placeholder="0,00"
              value={initialBalance}
              onChange={e => setInitialBalance(e.target.value)}
            />
          </div>

          <button className="add-submit income" onClick={handleSave} disabled={!name.trim()}>
            <Check size={20} />
            <span>{editingId ? 'Salvar' : 'Criar Conta'}</span>
          </button>
        </div>
      </Modal>

      {/* Transfer Modal */}
      <Modal isOpen={showTransfer} onClose={() => setShowTransfer(false)} title="Transferência">
        <div className="acc-form">
          <div className="form-group">
            <label>De</label>
            <select className="add-input select" value={transferFrom} onChange={e => setTransferFrom(e.target.value)} style={{ padding: 'var(--space-3)', width: '100%' }}>
              {accounts.map(a => (
                <option key={a.id} value={a.id}>{a.name}</option>
              ))}
            </select>
          </div>

          <div className="acc-transfer-arrow">
            <ArrowRightLeft size={20} />
          </div>

          <div className="form-group">
            <label>Para</label>
            <select className="add-input select" value={transferTo} onChange={e => setTransferTo(e.target.value)} style={{ padding: 'var(--space-3)', width: '100%' }}>
              {accounts.map(a => (
                <option key={a.id} value={a.id}>{a.name}</option>
              ))}
            </select>
          </div>

          <div className="form-group">
            <label>Valor</label>
            <input
              type="number"
              className="add-input"
              placeholder="0,00"
              value={transferAmount}
              onChange={e => setTransferAmount(e.target.value)}
              autoFocus
            />
          </div>

          <div className="form-group">
            <label>Descrição (opcional)</label>
            <input
              type="text"
              className="add-input"
              placeholder="Ex: Transferência para poupança"
              value={transferDesc}
              onChange={e => setTransferDesc(e.target.value)}
            />
          </div>

          <button className="add-submit income" onClick={handleTransfer} disabled={!transferAmount}>
            <ArrowRightLeft size={20} />
            <span>Transferir</span>
          </button>
        </div>
      </Modal>
    </div>
  )
}
