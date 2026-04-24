import { useState } from 'react'
import { useFinance } from '../../context/FinanceContext'
import { useToast } from '../UI/Toast'
import { formatCurrency } from '../../utils/formatCurrency'
import { CreditCard, Plus, Trash2 } from 'lucide-react'
import Modal from '../UI/Modal'
import './CreditCardsSection.css'

export default function CreditCardsSection() {
  const { creditCards, currency, addCreditCard, deleteCreditCard } = useFinance()
  const { addToast } = useToast()
  
  const [isModalOpen, setIsModalOpen] = useState(false)
  const [formData, setFormData] = useState({
    name: '',
    limit: '',
    closingDay: '25',
    dueDay: '5',
    color: '#6C5CE7'
  })

  const colors = ['#6C5CE7', '#00B894', '#FF7675', '#0984E3', '#FDCB6E', '#E17055', '#D63031', '#2D3436']

  const handleSubmit = (e) => {
    e.preventDefault()
    if (!formData.name || !formData.limit) {
      addToast('Preencha os campos obrigatórios', 'error')
      return
    }
    
    addCreditCard({
      name: formData.name,
      limit: parseFloat(formData.limit),
      closingDay: parseInt(formData.closingDay),
      dueDay: parseInt(formData.dueDay),
      color: formData.color,
      currentInvoice: 0 // Mock initial invoice
    })
    
    setFormData({ name: '', limit: '', closingDay: '25', dueDay: '5', color: '#6C5CE7' })
    setIsModalOpen(false)
    addToast('Cartão adicionado com sucesso!', 'success')
  }

  return (
    <div className="credit-cards-section animate-fade-in">
      <div className="cc-header-actions">
        <h2 className="section-title">Meus Cartões</h2>
        <button className="add-cc-btn" onClick={() => setIsModalOpen(true)}>
          <Plus size={16} /> Adicionar
        </button>
      </div>

      {creditCards.length === 0 ? (
        <div className="empty-state">
          <div className="empty-icon glass">
            <CreditCard size={32} />
          </div>
          <p>Nenhum cartão cadastrado</p>
          <span>Adicione seus cartões para controlar as faturas</span>
        </div>
      ) : (
        <div className="cc-list stagger">
          {creditCards.map(card => {
            const availableLimit = card.limit - (card.currentInvoice || 0)
            const usagePercent = ((card.currentInvoice || 0) / card.limit) * 100

            return (
              <div key={card.id} className="cc-card" style={{ '--cc-color': card.color }}>
                <div className="cc-card-bg"></div>
                <div className="cc-header">
                  <div className="cc-name-wrapper">
                    <CreditCard size={20} />
                    <span className="cc-name">{card.name}</span>
                  </div>
                  <button className="cc-delete-btn" onClick={() => deleteCreditCard(card.id)}>
                    <Trash2 size={16} />
                  </button>
                </div>
                
                <div className="cc-body">
                  <div className="cc-limit-row">
                    <span>Limite Disponível</span>
                    <span className="cc-available">{formatCurrency(availableLimit, currency)}</span>
                  </div>
                  <div className="cc-progress-bg">
                    <div className="cc-progress-fill" style={{ width: `${Math.min(usagePercent, 100)}%` }}></div>
                  </div>
                  <div className="cc-limit-row cc-limit-details">
                    <span>Usado: {formatCurrency(card.currentInvoice || 0, currency)}</span>
                    <span>Total: {formatCurrency(card.limit, currency)}</span>
                  </div>
                </div>

                <div className="cc-footer">
                  <div className="cc-dates">
                    <div className="cc-date-item">
                      <span className="cc-date-label">Fechamento</span>
                      <span className="cc-date-val">Dia {card.closingDay}</span>
                    </div>
                    <div className="cc-date-item">
                      <span className="cc-date-label">Vencimento</span>
                      <span className="cc-date-val">Dia {card.dueDay}</span>
                    </div>
                  </div>
                  <div className="cc-invoice">
                    <span className="cc-invoice-label">Fatura Atual</span>
                    <span className="cc-invoice-val">{formatCurrency(card.currentInvoice || 0, currency)}</span>
                  </div>
                </div>
              </div>
            )
          })}
        </div>
      )}

      <Modal isOpen={isModalOpen} onClose={() => setIsModalOpen(false)} title="Novo Cartão de Crédito">
        <form className="cc-form" onSubmit={handleSubmit}>
          <div className="form-group">
            <label>Nome do Cartão (ex: Nubank, Itaú)</label>
            <input 
              type="text" 
              className="input" 
              placeholder="Nome do cartão"
              value={formData.name}
              onChange={e => setFormData({...formData, name: e.target.value})}
            />
          </div>
          
          <div className="form-group">
            <label>Limite Total</label>
            <input 
              type="number" 
              className="input" 
              placeholder="0.00"
              step="0.01"
              value={formData.limit}
              onChange={e => setFormData({...formData, limit: e.target.value})}
            />
          </div>
          
          <div className="form-row">
            <div className="form-group">
              <label>Dia Fechamento</label>
              <input 
                type="number" 
                className="input" 
                min="1" max="31"
                value={formData.closingDay}
                onChange={e => setFormData({...formData, closingDay: e.target.value})}
              />
            </div>
            <div className="form-group">
              <label>Dia Vencimento</label>
              <input 
                type="number" 
                className="input" 
                min="1" max="31"
                value={formData.dueDay}
                onChange={e => setFormData({...formData, dueDay: e.target.value})}
              />
            </div>
          </div>
          
          <div className="form-group">
            <label>Cor do Cartão</label>
            <div className="color-picker">
              {colors.map(c => (
                <button
                  key={c}
                  type="button"
                  className={`color-btn ${formData.color === c ? 'selected' : ''}`}
                  style={{ background: c }}
                  onClick={() => setFormData({...formData, color: c})}
                />
              ))}
            </div>
          </div>
          
          <button type="submit" className="btn btn-primary cc-submit">
            Adicionar Cartão
          </button>
        </form>
      </Modal>
    </div>
  )
}
