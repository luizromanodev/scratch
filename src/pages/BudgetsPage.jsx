import { useState, useMemo } from 'react'
import { useFinance } from '../context/FinanceContext'
import { useToast } from '../components/UI/Toast'
import { formatCurrency } from '../utils/formatCurrency'
import { PieChart, Plus, Trash2, AlertTriangle, ArrowLeft } from 'lucide-react'
import { CategoryIcon } from '../utils/categories'
import { useNavigate } from 'react-router-dom'
import Modal from '../components/UI/Modal'
import './BudgetsPage.css'

export default function BudgetsPage() {
  const { budgets, categories, getExpensesByCategory, currency, addBudget, updateBudget, deleteBudget } = useFinance()
  const { addToast } = useToast()
  const navigate = useNavigate()
  
  const currentDate = new Date()
  const [month, setMonth] = useState(currentDate.getMonth())
  const [year, setYear] = useState(currentDate.getFullYear())
  
  const [isModalOpen, setIsModalOpen] = useState(false)
  const [formData, setFormData] = useState({ categoryId: '', limit: '' })

  const expensesByCategory = useMemo(() => getExpensesByCategory(month, year), [getExpensesByCategory, month, year])

  const budgetProgress = useMemo(() => {
    return budgets.map(budget => {
      const categoryInfo = categories.find(c => c.id === budget.categoryId)
      const expenseItem = expensesByCategory.find(e => e.categoryId === budget.categoryId)
      const spent = expenseItem ? expenseItem.amount : 0
      const percentage = (spent / budget.limit) * 100
      
      let status = 'good' // < 80%
      if (percentage >= 100) status = 'exceeded'
      else if (percentage >= 80) status = 'warning'

      return {
        ...budget,
        categoryName: categoryInfo?.name || 'Desconhecida',
        icon: categoryInfo?.icon || '🛒',
        color: categoryInfo?.color || '#888',
        spent,
        percentage,
        status
      }
    }).sort((a, b) => b.percentage - a.percentage)
  }, [budgets, categories, expensesByCategory])

  const handleSubmit = (e) => {
    e.preventDefault()
    if (!formData.categoryId || !formData.limit) {
      addToast('Selecione uma categoria e informe o limite', 'error')
      return
    }

    const existing = budgets.find(b => b.categoryId === formData.categoryId)
    if (existing) {
      updateBudget(existing.id, { limit: parseFloat(formData.limit) })
      addToast('Orçamento atualizado com sucesso', 'success')
    } else {
      addBudget({
        categoryId: formData.categoryId,
        limit: parseFloat(formData.limit)
      })
      addToast('Orçamento criado com sucesso', 'success')
    }

    setFormData({ categoryId: '', limit: '' })
    setIsModalOpen(false)
  }

  const unbudgetedCategories = categories.filter(c => c.id !== 'income' && !budgets.find(b => b.categoryId === c.id))

  return (
    <div className="page container">
      <header className="budgets-header">
        <button className="back-btn" onClick={() => navigate(-1)} aria-label="Voltar">
          <ArrowLeft size={24} />
        </button>
        <div>
          <h1 className="budgets-title">Orçamentos</h1>
          <p className="budgets-subtitle">Controle seus gastos por categoria</p>
        </div>
      </header>

      <div className="budgets-actions">
        <button className="add-budget-btn" onClick={() => setIsModalOpen(true)}>
          <Plus size={18} /> Novo Orçamento
        </button>
      </div>

      {budgets.length === 0 ? (
        <div className="empty-state">
          <div className="empty-icon glass">
            <PieChart size={32} />
          </div>
          <p>Nenhum orçamento definido</p>
          <span>Crie limites para suas categorias e nós avisaremos se você gastar demais.</span>
        </div>
      ) : (
        <div className="budgets-list stagger">
          {budgetProgress.map(budget => (
            <div key={budget.id} className={`budget-card status-${budget.status}`}>
              <div className="budget-header">
                <div className="budget-cat-info">
                  <div className="budget-icon" style={{ background: budget.color }}>
                    <CategoryIcon iconName={budget.icon} size={18} color="white" />
                  </div>
                  <span className="budget-cat-name">{budget.categoryName}</span>
                </div>
                <div className="budget-amounts">
                  <span className="budget-spent">{formatCurrency(budget.spent, currency)}</span>
                  <span className="budget-limit">/ {formatCurrency(budget.limit, currency)}</span>
                </div>
              </div>

              <div className="budget-progress-container">
                <div className="budget-progress-bar">
                  <div 
                    className="budget-progress-fill" 
                    style={{ 
                      width: `${Math.min(budget.percentage, 100)}%`,
                      backgroundColor: budget.status === 'exceeded' ? 'var(--danger-500)' : budget.status === 'warning' ? 'var(--warning-500)' : 'var(--success-500)'
                    }}
                  />
                </div>
                <span className="budget-percentage">{Math.round(budget.percentage)}%</span>
              </div>

              <div className="budget-footer">
                {budget.status === 'exceeded' ? (
                  <span className="budget-message danger">
                    <AlertTriangle size={14} /> Estourou {formatCurrency(budget.spent - budget.limit, currency)}
                  </span>
                ) : budget.status === 'warning' ? (
                  <span className="budget-message warning">
                    <AlertTriangle size={14} /> Faltam apenas {formatCurrency(budget.limit - budget.spent, currency)}
                  </span>
                ) : (
                  <span className="budget-message good">
                    Dentro do esperado
                  </span>
                )}
                
                <button className="budget-delete-btn" onClick={() => deleteBudget(budget.id)}>
                  <Trash2 size={16} />
                </button>
              </div>
            </div>
          ))}
        </div>
      )}

      <Modal isOpen={isModalOpen} onClose={() => setIsModalOpen(false)} title="Definir Orçamento">
        <form className="budget-form" onSubmit={handleSubmit}>
          <div className="form-group">
            <label>Categoria</label>
            <select 
              className="input select"
              value={formData.categoryId}
              onChange={e => setFormData({...formData, categoryId: e.target.value})}
            >
              <option value="">Selecione a categoria</option>
              {categories.filter(c => c.id !== 'income').map(c => (
                <option key={c.id} value={c.id}>{c.icon} {c.name}</option>
              ))}
            </select>
            {formData.categoryId && budgets.find(b => b.categoryId === formData.categoryId) && (
              <span className="help-text warning">Esta categoria já tem um orçamento. Ao salvar, ele será substituído.</span>
            )}
          </div>
          
          <div className="form-group">
            <label>Limite Mensal</label>
            <input 
              type="number" 
              className="input" 
              placeholder="Ex: 500.00"
              step="0.01"
              value={formData.limit}
              onChange={e => setFormData({...formData, limit: e.target.value})}
            />
          </div>
          
          <button type="submit" className="btn btn-primary mt-2">
            Salvar Orçamento
          </button>
        </form>
      </Modal>
    </div>
  )
}
