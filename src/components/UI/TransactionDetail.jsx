import { createPortal } from 'react-dom'
import { useNavigate } from 'react-router-dom'
import { useFinance } from '../../context/FinanceContext'
import { formatCurrency } from '../../utils/formatCurrency'
import { getRelativeDate } from '../../utils/dateUtils'
import { getCategoryById, CategoryIcon } from '../../utils/categories'
import { X, Pencil, Trash2, Calendar, CreditCard, Wallet, Tag, Repeat } from 'lucide-react'
import './TransactionDetail.css'

export default function TransactionDetail({ transaction, onClose, onDelete }) {
  const navigate = useNavigate()
  const { categories, creditCards, accounts, tags, currency } = useFinance()

  if (!transaction) return null

  const cat = getCategoryById(categories, transaction.category)
  const card = creditCards.find(c => c.id === transaction.creditCardId)
  const account = accounts.find(a => a.id === transaction.accountId)
  const txTags = (transaction.tags || []).map(tid => tags.find(t => t.id === tid)).filter(Boolean)

  return createPortal(
    <div className="txd-overlay" onClick={onClose}>
      <div className="txd-panel animate-fade-in-up" onClick={e => e.stopPropagation()}>
        {/* Header */}
        <div className="txd-header">
          <button className="txd-close" onClick={onClose}><X size={18} /></button>
        </div>

        {/* Amount */}
        <div className="txd-amount-section">
          <div className="txd-icon" style={{ background: cat?.color + '18', color: cat?.color }}>
            <CategoryIcon iconName={cat?.icon} size={28} color={cat?.color} />
          </div>
          <span className={`txd-amount ${transaction.type}`}>
            {transaction.type === 'income' ? '+' : '-'}{formatCurrency(transaction.amount, currency)}
          </span>
          <span className="txd-desc">{transaction.description || cat?.name}</span>
        </div>

        {/* Details */}
        <div className="txd-details">
          <div className="txd-detail-row">
            <Calendar size={14} />
            <span className="txd-detail-label">Data</span>
            <span className="txd-detail-value">{new Date(transaction.date + 'T00:00:00').toLocaleDateString('pt-BR', { day: '2-digit', month: 'long', year: 'numeric' })}</span>
          </div>

          <div className="txd-detail-row">
            <span className="txd-detail-dot" style={{ background: cat?.color }} />
            <span className="txd-detail-label">Categoria</span>
            <span className="txd-detail-value">{cat?.name || 'Desconhecida'}</span>
          </div>

          {account && (
            <div className="txd-detail-row">
              <Wallet size={14} />
              <span className="txd-detail-label">Conta</span>
              <span className="txd-detail-value">{account.name}</span>
            </div>
          )}

          {card && (
            <div className="txd-detail-row">
              <CreditCard size={14} />
              <span className="txd-detail-label">Cartão</span>
              <span className="txd-detail-value">{card.name}</span>
            </div>
          )}

          {transaction.isRecurring && (
            <div className="txd-detail-row">
              <Repeat size={14} />
              <span className="txd-detail-label">Tipo</span>
              <span className="txd-detail-value">Recorrente</span>
            </div>
          )}

          {transaction.totalInstallments && (
            <div className="txd-detail-row">
              <Tag size={14} />
              <span className="txd-detail-label">Parcela</span>
              <span className="txd-detail-value">{transaction.installmentIndex}/{transaction.totalInstallments}</span>
            </div>
          )}

          {txTags.length > 0 && (
            <div className="txd-tags-row">
              <Tag size={14} />
              <span className="txd-detail-label">Tags</span>
              <div className="txd-tags">
                {txTags.map(t => (
                  <span key={t.id} className="txd-tag" style={{ background: t.color + '20', color: t.color }}>{t.name}</span>
                ))}
              </div>
            </div>
          )}
        </div>

        {/* Actions */}
        <div className="txd-actions">
          <button className="txd-action-btn edit" onClick={() => { onClose(); navigate(`/add?edit=${transaction.id}`) }}>
            <Pencil size={16} /> Editar
          </button>
          <button className="txd-action-btn delete" onClick={() => { onDelete(transaction.id); onClose() }}>
            <Trash2 size={16} /> Excluir
          </button>
        </div>
      </div>
    </div>,
    document.body
  )
}
