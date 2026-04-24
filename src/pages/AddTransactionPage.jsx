import { useState } from 'react'
import { useNavigate, useSearchParams } from 'react-router-dom'
import { useFinance } from '../context/FinanceContext'
import { useToast } from '../components/UI/Toast'
import { getCategoriesByType, CategoryIcon, iconMap } from '../utils/categories'
import { getToday } from '../utils/dateUtils'
import { formatCurrency } from '../utils/formatCurrency'
import { ArrowLeft, Check, Plus } from 'lucide-react'
import Modal from '../components/UI/Modal'
import './AddTransactionPage.css'

export default function AddTransactionPage() {
  const navigate = useNavigate()
  const [searchParams] = useSearchParams()
  const { addTransaction, categories, addCategory, creditCards } = useFinance()
  const { addToast } = useToast()

  const [type, setType] = useState(searchParams.get('type') || 'expense')
  const [amount, setAmount] = useState('')
  const [category, setCategory] = useState('')
  const [description, setDescription] = useState('')
  const [date, setDate] = useState(getToday())
  const [isRecurring, setIsRecurring] = useState(false)
  const [installments, setInstallments] = useState(1)
  const [creditCardId, setCreditCardId] = useState('')

  // New category modal
  const [showNewCat, setShowNewCat] = useState(false)
  const [newCatName, setNewCatName] = useState('')
  const [newCatColor, setNewCatColor] = useState('#6C5CE7')
  const [newCatIcon, setNewCatIcon] = useState('MoreHorizontal')

  const filteredCategories = getCategoriesByType(categories, type)

  const colorOptions = [
    '#FF6B6B', '#4ECDC4', '#6C5CE7', '#FD79A8', '#E17055',
    '#00B894', '#A29BFE', '#FDCB6E', '#74B9FF', '#55EFC4',
    '#E84393', '#0984E3', '#F39C12', '#636E72', '#00D09C',
  ]

  const iconOptions = Object.keys(iconMap)

  const handleAmountChange = (e) => {
    const val = e.target.value.replace(/[^0-9.,]/g, '').replace(',', '.')
    setAmount(val)
  }

  const handleSubmit = () => {
    const numAmount = parseFloat(amount)
    if (!numAmount || numAmount <= 0) {
      addToast('Insira um valor válido', 'error')
      return
    }
    if (!category) {
      addToast('Selecione uma categoria', 'error')
      return
    }

    addTransaction({
      type,
      amount: numAmount,
      category,
      description: description.trim(),
      date,
      isRecurring,
      installments: type === 'expense' ? parseInt(installments) : 1,
      creditCardId: type === 'expense' ? (creditCardId || null) : null,
      bankId: null,
    })

    addToast(
      type === 'income' ? 'Receita adicionada!' : 'Despesa adicionada!',
      'success'
    )
    navigate('/')
  }

  const handleAddCategory = () => {
    if (!newCatName.trim()) return
    const newCat = addCategory({
      name: newCatName.trim(),
      icon: newCatIcon,
      color: newCatColor,
      type,
    })
    setCategory(newCat.id)
    setShowNewCat(false)
    setNewCatName('')
    addToast('Categoria criada!', 'success')
  }

  return (
    <div className="page container">
      {/* Header */}
      <header className="add-header">
        <button className="add-back" onClick={() => navigate(-1)} aria-label="Voltar">
          <ArrowLeft size={22} />
        </button>
        <h1 className="add-title">Nova transação</h1>
        <div style={{ width: 40 }} />
      </header>

      {/* Type Toggle */}
      <div className="type-toggle">
        <button
          className={`type-btn ${type === 'income' ? 'active income' : ''}`}
          onClick={() => { setType('income'); setCategory('') }}
          id="btn-type-income"
        >
          Receita
        </button>
        <button
          className={`type-btn ${type === 'expense' ? 'active expense' : ''}`}
          onClick={() => { setType('expense'); setCategory('') }}
          id="btn-type-expense"
        >
          Despesa
        </button>
        <div className={`type-slider ${type}`} />
      </div>

      {/* Amount Input */}
      <div className="amount-section">
        <span className="amount-currency">R$</span>
        <input
          className="amount-input"
          type="text"
          inputMode="decimal"
          placeholder="0,00"
          value={amount}
          onChange={handleAmountChange}
          autoFocus
          id="input-amount"
        />
      </div>

      {/* Categories */}
      <section className="add-section">
        <div className="section-header">
          <h2 className="section-title">Categoria</h2>
          <button className="add-cat-btn" onClick={() => setShowNewCat(true)} id="btn-new-category">
            <Plus size={14} /> Nova
          </button>
        </div>
        <div className="category-grid">
          {filteredCategories.map(cat => (
            <button
              key={cat.id}
              className={`cat-chip ${category === cat.id ? 'active' : ''}`}
              onClick={() => setCategory(cat.id)}
              style={category === cat.id ? { background: cat.color + '20', borderColor: cat.color, color: cat.color } : {}}
            >
              <CategoryIcon iconName={cat.icon} size={16} color={category === cat.id ? cat.color : undefined} />
              <span>{cat.name}</span>
            </button>
          ))}
        </div>
      </section>

      {/* Description */}
      <section className="add-section">
        <label className="input-label" htmlFor="input-desc">Descrição (opcional)</label>
        <input
          id="input-desc"
          type="text"
          className="add-input"
          placeholder="Ex: Almoço no restaurante"
          value={description}
          onChange={e => setDescription(e.target.value)}
        />
      </section>

      {/* Date */}
      <section className="add-section">
        <label className="input-label" htmlFor="input-date">Data</label>
        <input
          id="input-date"
          type="date"
          className="add-input"
          value={date}
          onChange={e => setDate(e.target.value)}
        />
      </section>

      {/* Recurring Toggle */}
      <section className="add-section">
        <div className="toggle-row">
          <span className="toggle-label">Transação recorrente</span>
          <button
            className={`toggle-switch ${isRecurring ? 'on' : ''}`}
            onClick={() => setIsRecurring(!isRecurring)}
            id="toggle-recurring"
            role="switch"
            aria-checked={isRecurring}
          >
            <div className="toggle-thumb" />
          </button>
        </div>
      </section>

      {/* Credit Card and Installments */}
      {type === 'expense' && (
        <>
          {creditCards.length > 0 && (
            <section className="add-section">
              <label className="input-label" htmlFor="input-cc">Forma de pagamento</label>
              <select 
                id="input-cc"
                className="add-input select"
                value={creditCardId}
                onChange={e => setCreditCardId(e.target.value)}
                style={{ padding: 'var(--space-3)', width: '100%' }}
              >
                <option value="">Saldo da conta (Débito)</option>
                {creditCards.map(cc => (
                  <option key={cc.id} value={cc.id}>💳 Cartão - {cc.name}</option>
                ))}
              </select>
            </section>
          )}

          <section className="add-section">
            <label className="input-label" htmlFor="input-installments">Parcelamento</label>
            <select 
              id="input-installments"
              className="add-input select"
              value={installments}
              onChange={e => setInstallments(e.target.value)}
              style={{ padding: 'var(--space-3)', width: '100%' }}
            >
              <option value="1">À vista</option>
              <option value="2">2 vezes de {formatCurrency(amount ? parseFloat(amount) / 2 : 0, 'BRL')}</option>
              <option value="3">3 vezes de {formatCurrency(amount ? parseFloat(amount) / 3 : 0, 'BRL')}</option>
              <option value="4">4 vezes de {formatCurrency(amount ? parseFloat(amount) / 4 : 0, 'BRL')}</option>
              <option value="5">5 vezes de {formatCurrency(amount ? parseFloat(amount) / 5 : 0, 'BRL')}</option>
              <option value="6">6 vezes de {formatCurrency(amount ? parseFloat(amount) / 6 : 0, 'BRL')}</option>
              <option value="10">10 vezes de {formatCurrency(amount ? parseFloat(amount) / 10 : 0, 'BRL')}</option>
              <option value="12">12 vezes de {formatCurrency(amount ? parseFloat(amount) / 12 : 0, 'BRL')}</option>
            </select>
          </section>
        </>
      )}

      {/* Submit */}
      <button
        className={`add-submit ${type}`}
        onClick={handleSubmit}
        disabled={!amount || !category}
        id="btn-submit-transaction"
      >
        <Check size={20} />
        <span>{type === 'income' ? 'Adicionar Receita' : 'Adicionar Despesa'}</span>
      </button>

      {/* New Category Modal */}
      <Modal isOpen={showNewCat} onClose={() => setShowNewCat(false)} title="Nova Categoria">
        <div className="new-cat-form">
          <div className="form-group">
            <label>Nome da categoria</label>
            <input
              type="text"
              className="add-input"
              placeholder="Ex: Assinaturas"
              value={newCatName}
              onChange={e => setNewCatName(e.target.value)}
              autoFocus
            />
          </div>
          <div className="form-group">
            <label>Cor</label>
            <div className="color-grid">
              {colorOptions.map(c => (
                <button
                  key={c}
                  className={`color-opt ${newCatColor === c ? 'active' : ''}`}
                  style={{ background: c }}
                  onClick={() => setNewCatColor(c)}
                />
              ))}
            </div>
          </div>
          <div className="form-group">
            <label>Ícone</label>
            <div className="icon-grid">
              {iconOptions.map(name => (
                <button
                  key={name}
                  className={`icon-opt ${newCatIcon === name ? 'active' : ''}`}
                  onClick={() => setNewCatIcon(name)}
                  style={newCatIcon === name ? { borderColor: newCatColor, background: newCatColor + '15' } : {}}
                >
                  <CategoryIcon iconName={name} size={18} color={newCatIcon === name ? newCatColor : undefined} />
                </button>
              ))}
            </div>
          </div>
          <button className="add-submit income" onClick={handleAddCategory} disabled={!newCatName.trim()}>
            <Check size={20} />
            <span>Criar Categoria</span>
          </button>
        </div>
      </Modal>
    </div>
  )
}
