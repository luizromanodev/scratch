import { useState, useMemo } from 'react'
import { useNavigate, useParams } from 'react-router-dom'
import { useFinance } from '../context/FinanceContext'
import { formatCurrency } from '../utils/formatCurrency'
import { getMonthName, getCurrentMonth, getCurrentYear } from '../utils/dateUtils'
import { getCategoryById, CategoryIcon } from '../utils/categories'
import {
  ArrowLeft, CreditCard, ChevronLeft, ChevronRight,
  Calendar, AlertCircle, Pencil, Trash2
} from 'lucide-react'
import { useToast } from '../components/UI/Toast'
import Modal from '../components/UI/Modal'
import './CreditCardDetailPage.css'

export default function CreditCardDetailPage() {
  const { id } = useParams()
  const navigate = useNavigate()
  const { creditCards, transactions, categories, currency, getCardInvoice, updateCreditCard, deleteCreditCard } = useFinance()
  const { addToast } = useToast()

  const card = creditCards.find(c => c.id === id)
  const [month, setMonth] = useState(getCurrentMonth())
  const [year, setYear] = useState(getCurrentYear())
  const [showEdit, setShowEdit] = useState(false)
  const [editName, setEditName] = useState(card?.name || '')
  const [editLimit, setEditLimit] = useState(String(card?.limit || ''))
  const [editClosing, setEditClosing] = useState(String(card?.closingDay || '25'))
  const [editDue, setEditDue] = useState(String(card?.dueDay || '5'))
  const [editColor, setEditColor] = useState(card?.color || '#6C5CE7')

  const colors = ['#6C5CE7', '#00B894', '#FF7675', '#0984E3', '#FDCB6E', '#E17055', '#D63031', '#2D3436']

  const prevMonth = () => { if (month === 0) { setMonth(11); setYear(y => y - 1) } else setMonth(m => m - 1) }
  const nextMonth = () => { if (month === 11) { setMonth(0); setYear(y => y + 1) } else setMonth(m => m + 1) }

  const invoiceAmount = useMemo(() => getCardInvoice(id, month, year), [id, month, year, getCardInvoice])

  const invoiceTransactions = useMemo(() => {
    return transactions
      .filter(t => {
        if (t.creditCardId !== id) return false
        const d = new Date(t.date + 'T00:00:00')
        return d.getMonth() === month && d.getFullYear() === year
      })
      .sort((a, b) => b.date.localeCompare(a.date))
  }, [transactions, id, month, year])

  if (!card) {
    return (
      <div className="page container">
        <header className="ccd-header">
          <button className="ccd-back" onClick={() => navigate(-1)}><ArrowLeft size={22} /></button>
          <h1 className="ccd-title">Cartão não encontrado</h1>
          <div style={{ width: 40 }} />
        </header>
        <div className="empty-state">
          <div className="empty-emoji">💳</div>
          <p>Cartão não encontrado</p>
        </div>
      </div>
    )
  }

  const availableLimit = card.limit - invoiceAmount
  const usagePercent = card.limit > 0 ? (invoiceAmount / card.limit) * 100 : 0
  const isOverLimit = usagePercent > 90

  const handleSave = () => {
    updateCreditCard(id, {
      name: editName.trim(),
      limit: parseFloat(editLimit) || 0,
      closingDay: parseInt(editClosing) || 25,
      dueDay: parseInt(editDue) || 5,
      color: editColor,
    })
    setShowEdit(false)
    addToast('Cartão atualizado!', 'success')
  }

  const handleDelete = () => {
    deleteCreditCard(id)
    addToast('Cartão removido', 'info')
    navigate(-1)
  }

  return (
    <div className="page container">
      <header className="ccd-header">
        <button className="ccd-back" onClick={() => navigate(-1)} aria-label="Voltar">
          <ArrowLeft size={22} />
        </button>
        <h1 className="ccd-title">{card.name}</h1>
        <button className="ccd-back" onClick={() => setShowEdit(true)} aria-label="Editar">
          <Pencil size={18} />
        </button>
      </header>

      {/* Card Visual */}
      <div className="ccd-visual" style={{ '--cc-color': card.color }}>
        <div className="ccd-visual-bg" />
        <div className="ccd-visual-content">
          <div className="ccd-visual-top">
            <CreditCard size={24} />
            <span className="ccd-visual-name">{card.name}</span>
          </div>
          <div className="ccd-visual-limit">
            <span className="ccd-visual-label">Limite disponível</span>
            <span className="ccd-visual-value">{formatCurrency(availableLimit, currency)}</span>
          </div>
          <div className="ccd-progress-bar">
            <div
              className={`ccd-progress-fill ${isOverLimit ? 'danger' : ''}`}
              style={{ width: `${Math.min(usagePercent, 100)}%` }}
            />
          </div>
          <div className="ccd-visual-row">
            <span>Usado: {formatCurrency(invoiceAmount, currency)}</span>
            <span>Total: {formatCurrency(card.limit, currency)}</span>
          </div>
        </div>
      </div>

      {/* Info Cards */}
      <div className="ccd-info-grid">
        <div className="ccd-info-card">
          <Calendar size={16} />
          <div>
            <span className="ccd-info-label">Fechamento</span>
            <span className="ccd-info-value">Dia {card.closingDay}</span>
          </div>
        </div>
        <div className="ccd-info-card">
          <AlertCircle size={16} />
          <div>
            <span className="ccd-info-label">Vencimento</span>
            <span className="ccd-info-value">Dia {card.dueDay}</span>
          </div>
        </div>
      </div>

      {/* Invoice Month Selector */}
      <div className="ccd-invoice-header">
        <h2 className="section-title">Fatura</h2>
        <div className="ccd-month-nav">
          <button onClick={prevMonth} className="ccd-month-btn"><ChevronLeft size={16} /></button>
          <span className="ccd-month-label">{getMonthName(month)} {year}</span>
          <button onClick={nextMonth} className="ccd-month-btn"><ChevronRight size={16} /></button>
        </div>
      </div>

      {/* Invoice Total */}
      <div className="ccd-invoice-total">
        <span className="ccd-invoice-total-label">Total da fatura</span>
        <span className="ccd-invoice-total-value">{formatCurrency(invoiceAmount, currency)}</span>
      </div>

      {/* Invoice Transactions */}
      {invoiceTransactions.length === 0 ? (
        <div className="empty-state" style={{ padding: 'var(--space-6)' }}>
          <div className="empty-emoji">📋</div>
          <p>Nenhum lançamento nesta fatura</p>
        </div>
      ) : (
        <div className="ccd-tx-list stagger">
          {invoiceTransactions.map(tx => {
            const cat = getCategoryById(categories, tx.category)
            return (
              <div key={tx.id} className="ccd-tx-item">
                <div className="tx-icon" style={{ background: cat?.color + '18', color: cat?.color }}>
                  <CategoryIcon iconName={cat?.icon} size={16} color={cat?.color} />
                </div>
                <div className="ccd-tx-info">
                  <span className="ccd-tx-desc">{tx.description || cat?.name}</span>
                  <span className="ccd-tx-date">{new Date(tx.date + 'T12:00:00').toLocaleDateString('pt-BR', { day: '2-digit', month: 'short' })}</span>
                </div>
                <span className="ccd-tx-amount">-{formatCurrency(tx.amount, currency)}</span>
              </div>
            )
          })}
        </div>
      )}

      {/* Delete Button */}
      <button className="ccd-delete-btn" onClick={handleDelete}>
        <Trash2 size={16} />
        <span>Excluir cartão</span>
      </button>

      {/* Edit Modal */}
      <Modal isOpen={showEdit} onClose={() => setShowEdit(false)} title="Editar Cartão">
        <div className="acc-form">
          <div className="form-group">
            <label>Nome</label>
            <input type="text" className="add-input" value={editName} onChange={e => setEditName(e.target.value)} />
          </div>
          <div className="form-group">
            <label>Limite</label>
            <input type="number" className="add-input" value={editLimit} onChange={e => setEditLimit(e.target.value)} />
          </div>
          <div style={{ display: 'flex', gap: 'var(--space-3)' }}>
            <div className="form-group" style={{ flex: 1 }}>
              <label>Fechamento</label>
              <input type="number" className="add-input" min="1" max="31" value={editClosing} onChange={e => setEditClosing(e.target.value)} />
            </div>
            <div className="form-group" style={{ flex: 1 }}>
              <label>Vencimento</label>
              <input type="number" className="add-input" min="1" max="31" value={editDue} onChange={e => setEditDue(e.target.value)} />
            </div>
          </div>
          <div className="form-group">
            <label>Cor</label>
            <div className="color-grid">
              {colors.map(c => (
                <button key={c} className={`color-opt ${editColor === c ? 'active' : ''}`} style={{ background: c }} onClick={() => setEditColor(c)} />
              ))}
            </div>
          </div>
          <button className="add-submit income" onClick={handleSave} disabled={!editName.trim()}>
            Salvar Alterações
          </button>
        </div>
      </Modal>
    </div>
  )
}
