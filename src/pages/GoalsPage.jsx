import { useState } from 'react'
import { useFinance } from '../context/FinanceContext'
import { useToast } from '../components/UI/Toast'
import { formatCurrency } from '../utils/formatCurrency'
import { Target, Plus, Trash2, ArrowLeft, Trophy, DollarSign } from 'lucide-react'
import { useNavigate } from 'react-router-dom'
import Modal from '../components/UI/Modal'
import Confetti from '../components/UI/Confetti'
import './GoalsPage.css'

export default function GoalsPage() {
  const { goals, currency, addGoal, updateGoal, deleteGoal, addTransaction } = useFinance()
  const { addToast } = useToast()
  const navigate = useNavigate()
  
  const [isModalOpen, setIsModalOpen] = useState(false)
  const [isDepositModalOpen, setIsDepositModalOpen] = useState(false)
  const [activeGoal, setActiveGoal] = useState(null)
  
  const [formData, setFormData] = useState({ name: '', targetAmount: '', deadline: '', color: '#6C5CE7' })
  const [depositAmount, setDepositAmount] = useState('')
  const [showConfetti, setShowConfetti] = useState(false)

  const colors = ['#6C5CE7', '#00B894', '#FF7675', '#0984E3', '#FDCB6E', '#E17055', '#D63031', '#2D3436']

  const handleSubmit = (e) => {
    e.preventDefault()
    if (!formData.name || !formData.targetAmount) {
      addToast('Preencha os campos obrigatórios', 'error')
      return
    }

    addGoal({
      name: formData.name,
      targetAmount: parseFloat(formData.targetAmount),
      deadline: formData.deadline,
      color: formData.color,
      currentAmount: 0
    })

    setFormData({ name: '', targetAmount: '', deadline: '', color: '#6C5CE7' })
    setIsModalOpen(false)
    addToast('Meta criada com sucesso', 'success')
  }

  const openDepositModal = (goal) => {
    setActiveGoal(goal)
    setDepositAmount('')
    setIsDepositModalOpen(true)
  }

  const handleDeposit = (e) => {
    e.preventDefault()
    const amount = parseFloat(depositAmount)
    if (!amount || amount <= 0) {
      addToast('Valor inválido', 'error')
      return
    }

    const newAmount = (activeGoal.currentAmount || 0) + amount
    updateGoal(activeGoal.id, { currentAmount: newAmount })
    
    // Opcional: Criar uma transação de despesa para descontar do saldo
    addTransaction({
      type: 'expense',
      amount: amount,
      category: 'savings', // Você pode ter uma categoria "Investimentos"
      description: `Guarda para: ${activeGoal.name}`,
      date: new Date().toISOString().split('T')[0],
      isRecurring: false
    })

    setIsDepositModalOpen(false)

    if (newAmount >= activeGoal.targetAmount) {
      setShowConfetti(true)
      addToast('🎉 Meta atingida! Parabéns!', 'success')
      setTimeout(() => setShowConfetti(false), 3500)
    } else {
      addToast('Valor guardado com sucesso!', 'success')
    }
  }

  return (
    <>
    <Confetti active={showConfetti} />
    <div className="page container">
      <header className="goals-header">
        <button className="back-btn" onClick={() => navigate(-1)} aria-label="Voltar">
          <ArrowLeft size={24} />
        </button>
        <div>
          <h1 className="goals-title">Metas e Cofres</h1>
          <p className="goals-subtitle">Guarde dinheiro para os seus sonhos</p>
        </div>
      </header>

      <div className="goals-actions">
        <button className="add-goal-btn" onClick={() => setIsModalOpen(true)}>
          <Plus size={18} /> Nova Meta
        </button>
      </div>

      {goals.length === 0 ? (
        <div className="empty-state">
          <div className="empty-icon glass">
            <Target size={32} />
          </div>
          <p>Nenhuma meta criada</p>
          <span>Crie um cofre para a sua próxima viagem, carro ou fundo de emergência.</span>
        </div>
      ) : (
        <div className="goals-grid stagger">
          {goals.map(goal => {
            const percentage = Math.min(((goal.currentAmount || 0) / goal.targetAmount) * 100, 100)
            const isCompleted = percentage >= 100

            return (
              <div key={goal.id} className="goal-card" style={{ '--goal-color': goal.color }}>
                <div className="goal-card-bg"></div>
                <div className="goal-header">
                  <div className="goal-icon glass">
                    {isCompleted ? <Trophy size={20} className="text-warning-500" /> : <Target size={20} />}
                  </div>
                  <button className="goal-delete-btn" onClick={() => deleteGoal(goal.id)}>
                    <Trash2 size={16} />
                  </button>
                </div>
                
                <h3 className="goal-name">{goal.name}</h3>
                
                <div className="goal-amounts">
                  <span className="goal-current">{formatCurrency(goal.currentAmount || 0, currency)}</span>
                  <span className="goal-target">de {formatCurrency(goal.targetAmount, currency)}</span>
                </div>

                <div className="goal-progress-container">
                  <div className="goal-progress-bar">
                    <div className="goal-progress-fill" style={{ width: `${percentage}%` }}></div>
                  </div>
                  <span className="goal-percentage">{Math.round(percentage)}%</span>
                </div>

                {goal.deadline && (
                  <div className="goal-deadline">
                    Objetivo: {new Date(goal.deadline).toLocaleDateString()}
                  </div>
                )}

                <div className="goal-footer">
                  <button 
                    className="btn-deposit" 
                    onClick={() => openDepositModal(goal)}
                    disabled={isCompleted}
                  >
                    <DollarSign size={16} />
                    {isCompleted ? 'Concluída' : 'Guardar Dinheiro'}
                  </button>
                </div>
              </div>
            )
          })}
        </div>
      )}

      {/* Modal Nova Meta */}
      <Modal isOpen={isModalOpen} onClose={() => setIsModalOpen(false)} title="Nova Meta">
        <form className="goal-form" onSubmit={handleSubmit}>
          <div className="form-group">
            <label>Nome do Objetivo (ex: Viagem Paris)</label>
            <input 
              type="text" 
              className="input" 
              placeholder="Nome"
              value={formData.name}
              onChange={e => setFormData({...formData, name: e.target.value})}
            />
          </div>
          
          <div className="form-group">
            <label>Valor Desejado</label>
            <input 
              type="number" 
              className="input" 
              placeholder="0.00"
              step="0.01"
              value={formData.targetAmount}
              onChange={e => setFormData({...formData, targetAmount: e.target.value})}
            />
          </div>

          <div className="form-group">
            <label>Data Alvo (Opcional)</label>
            <input 
              type="date" 
              className="input" 
              value={formData.deadline}
              onChange={e => setFormData({...formData, deadline: e.target.value})}
            />
          </div>
          
          <div className="form-group">
            <label>Cor do Cofre</label>
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
          
          <button type="submit" className="btn btn-primary mt-2">
            Criar Meta
          </button>
        </form>
      </Modal>

      {/* Modal Guardar Dinheiro */}
      <Modal isOpen={isDepositModalOpen} onClose={() => setIsDepositModalOpen(false)} title="Guardar Dinheiro">
        {activeGoal && (
          <form className="goal-form" onSubmit={handleDeposit}>
            <div className="deposit-info glass">
              <span>Falta guardar:</span>
              <span className="font-bold">{formatCurrency(activeGoal.targetAmount - (activeGoal.currentAmount || 0), currency)}</span>
            </div>

            <div className="form-group mt-4">
              <label>Valor a guardar agora</label>
              <input 
                type="number" 
                className="input" 
                placeholder="0.00"
                step="0.01"
                autoFocus
                value={depositAmount}
                onChange={e => setDepositAmount(e.target.value)}
              />
              <span className="help-text">Esse valor será descontado do seu saldo atual como uma despesa.</span>
            </div>
            
            <button type="submit" className="btn btn-primary mt-2">
              Confirmar
            </button>
          </form>
        )}
      </Modal>
    </div>
    </>
  )
}
