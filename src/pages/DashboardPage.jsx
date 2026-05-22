import { useState, useMemo } from 'react'
import { useNavigate, Link } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'
import { useFinance } from '../context/FinanceContext'
import { formatCurrency } from '../utils/formatCurrency'
import { getMonthName, getCurrentMonth, getCurrentYear, getRelativeDate } from '../utils/dateUtils'
import { getCategoryById, CategoryIcon } from '../utils/categories'
import { Doughnut } from 'react-chartjs-2'
import { Chart as ChartJS, ArcElement, Tooltip, Legend } from 'chart.js'
import {
  TrendingUp, TrendingDown, Eye, EyeOff, ChevronLeft, ChevronRight,
  Plus, Minus, ArrowRight, PieChart, Target, BarChart3, Search, Settings,
  Wallet, PiggyBank, Banknote, ArrowRightLeft, CreditCard, X,
  Repeat, Calendar, Trophy, Sparkles, Bitcoin
} from 'lucide-react'
import './DashboardPage.css'
import Onboarding, { isOnboardingDone } from '../components/UI/Onboarding'
import GlobalSearch from '../components/UI/GlobalSearch'
import BudgetAlerts from '../components/UI/BudgetAlerts'
import NotificationCenter from '../components/UI/NotificationCenter'
import SpendingInsights from '../components/UI/SpendingInsights'
import HealthScore from '../components/UI/HealthScore'
import TransactionDetail from '../components/UI/TransactionDetail'
import QuickTransactions from '../components/UI/QuickTransactions'
import MonthComparison from '../components/UI/MonthComparison'
import DailyTip from '../components/UI/DailyTip'


ChartJS.register(ArcElement, Tooltip, Legend)

export default function DashboardPage() {
  const { user } = useAuth()
  const { currency, categories, accounts, tags, creditCards, getBalance, getTransactionsByMonth, getExpensesByCategory, getAccountBalance, deleteTransaction } = useFinance()
  const navigate = useNavigate()

  const [showBalance, setShowBalance] = useState(true)
  const [selectedTx, setSelectedTx] = useState(null)
  const [month, setMonth] = useState(getCurrentMonth())
  const [year, setYear] = useState(getCurrentYear())
  const [showOnboarding, setShowOnboarding] = useState(
    () => !isOnboardingDone(user?.id)
  )
  const [showSearch, setShowSearch] = useState(false)
  const [showWidgetSettings, setShowWidgetSettings] = useState(false)

  // Widget visibility preferences
  const [widgets, setWidgets] = useState(() => {
    try {
      const saved = localStorage.getItem('finflow_widgets')
      return saved ? JSON.parse(saved) : { planning: true, chart: true, transactions: true, health: true, insights: true, comparison: true }
    } catch { return { planning: true, chart: true, transactions: true, health: true, insights: true, comparison: true } }
  })

  const toggleWidget = (key) => {
    setWidgets(prev => {
      const updated = { ...prev, [key]: !prev[key] }
      localStorage.setItem('finflow_widgets', JSON.stringify(updated))
      return updated
    })
  }

  const balance = useMemo(() => getBalance(month, year), [month, year, getBalance])
  const transactions = useMemo(() => getTransactionsByMonth(month, year).slice(0, 5), [month, year, getTransactionsByMonth])
  const expensesByCategory = useMemo(() => getExpensesByCategory(month, year), [month, year, getExpensesByCategory])



  const firstName = user?.name?.split(' ')[0] || 'Usuário'

  const prevMonth = () => {
    if (month === 0) { setMonth(11); setYear(y => y - 1) }
    else setMonth(m => m - 1)
  }
  const nextMonth = () => {
    if (month === 11) { setMonth(0); setYear(y => y + 1) }
    else setMonth(m => m + 1)
  }

  const getGreeting = () => {
    const hour = new Date().getHours()
    if (hour < 12) return 'Bom dia'
    if (hour < 18) return 'Boa tarde'
    return 'Boa noite'
  }

  // Chart data
  const chartData = {
    labels: expensesByCategory.map(e => e.name),
    datasets: [{
      data: expensesByCategory.map(e => e.amount),
      backgroundColor: expensesByCategory.map(e => e.color),
      borderWidth: 0,
      hoverOffset: 6,
      borderRadius: 4,
    }]
  }

  const chartOptions = {
    responsive: true,
    maintainAspectRatio: false,
    cutout: '72%',
    plugins: {
      legend: { display: false },
      tooltip: {
        backgroundColor: 'rgba(0,0,0,0.8)',
        padding: 12,
        cornerRadius: 8,
        titleFont: { family: 'Inter', size: 13 },
        bodyFont: { family: 'Inter', size: 12 },
        callbacks: {
          label: (ctx) => ` ${formatCurrency(ctx.raw, currency)}`
        }
      }
    },
  }

  return (
    <>
      {showOnboarding && <Onboarding onComplete={() => setShowOnboarding(false)} userId={user?.id} />}
      <GlobalSearch isOpen={showSearch} onClose={() => setShowSearch(false)} />
      <div className="page container">
      {/* Header */}
      <header className="dash-header">
        <div className="dash-greeting">
          <p className="dash-hello">{getGreeting()},</p>
          <h1 className="dash-name">{firstName} 👋</h1>
        </div>
        <div className="dash-header-actions">
          <button className="dash-search-btn" onClick={() => setShowSearch(true)} aria-label="Buscar">
            <Search size={20} />
          </button>
          <NotificationCenter />
          <button className="dash-search-btn" onClick={() => setShowWidgetSettings(s => !s)} aria-label="Widgets">
            <Settings size={18} />
          </button>
        </div>
      </header>
      <div className="dash-month-selector">
        <button onClick={prevMonth} className="dash-month-btn" aria-label="Mês anterior">
          <ChevronLeft size={18} />
        </button>
        <span className="dash-month-label">{getMonthName(month)} {year}</span>
        <button onClick={nextMonth} className="dash-month-btn" aria-label="Próximo mês">
          <ChevronRight size={18} />
        </button>
      </div>

      {/* Balance Card */}
      <section className="balance-card" id="balance-card">
        <div className="balance-header">
          <span className="balance-label">Saldo do mês</span>
          <button className="balance-toggle" onClick={() => setShowBalance(!showBalance)} aria-label="Mostrar/esconder saldo">
            {showBalance ? <Eye size={18} /> : <EyeOff size={18} />}
          </button>
        </div>
        <div className="balance-amount">
          {showBalance ? (
            <span className={balance.balance >= 0 ? 'positive' : 'negative'}>
              {formatCurrency(balance.balance, currency)}
            </span>
          ) : (
            <span className="balance-hidden">••••••</span>
          )}
        </div>
        <div className="balance-details">
          <div className="balance-detail income">
            <div className="balance-detail-icon">
              <TrendingUp size={16} />
            </div>
            <div>
              <span className="balance-detail-label">Receitas</span>
              <span className="balance-detail-value">
                {showBalance ? formatCurrency(balance.income, currency) : '•••'}
              </span>
            </div>
          </div>
          <div className="balance-separator" />
          <div className="balance-detail expense">
            <div className="balance-detail-icon">
              <TrendingDown size={16} />
            </div>
            <div>
              <span className="balance-detail-label">Despesas</span>
              <span className="balance-detail-value">
                {showBalance ? formatCurrency(balance.expense, currency) : '•••'}
              </span>
            </div>
          </div>
        </div>
      </section>

      {/* Quick Actions */}
      <section className="quick-actions">
        <button className="quick-btn income-btn" onClick={() => navigate('/add?type=income')} id="btn-quick-income">
          <div className="quick-btn-icon"><Plus size={20} /></div>
          <span>Receita</span>
        </button>
        <button className="quick-btn expense-btn" onClick={() => navigate('/add?type=expense')} id="btn-quick-expense">
          <div className="quick-btn-icon"><Minus size={20} /></div>
          <span>Despesa</span>
        </button>
      </section>

      {/* Budget Alerts */}
      <BudgetAlerts />

      {/* Daily Tip */}
      <DailyTip />

      {/* Spending Insights */}
      {(widgets.insights !== false) && <SpendingInsights month={month} year={year} />}

      {/* Quick Transaction Shortcuts */}
      <QuickTransactions />

      {/* Widget Settings Popup */}
      {showWidgetSettings && (
        <>
        <div className="dash-widget-overlay" onClick={() => setShowWidgetSettings(false)} />
        <div className="dash-widget-panel animate-fade-in-up">
          <div className="dash-widget-header">
            <h4 className="dash-widget-title">Seções visíveis</h4>
            <button className="dash-widget-close" onClick={() => setShowWidgetSettings(false)}><X size={18} /></button>
          </div>
          {[
            { key: 'planning', label: 'Planejamento', desc: 'Orçamentos, metas, relatórios' },
            { key: 'health', label: 'Saúde Financeira', desc: 'Score de saúde' },
            { key: 'insights', label: 'Insights', desc: 'Dicas inteligentes' },
            { key: 'comparison', label: 'Comparativo', desc: 'Mês anterior vs atual' },
            { key: 'chart', label: 'Gráfico de categorias', desc: 'Distribuição de gastos' },
            { key: 'transactions', label: 'Últimas transações', desc: 'Transações recentes' },
          ].map(w => (
            <button key={w.key} className="dash-widget-item" onClick={() => toggleWidget(w.key)}>
              <div className="dash-widget-info">
                <span className="dash-widget-label">{w.label}</span>
                <span className="dash-widget-desc">{w.desc}</span>
              </div>
              <div className={`toggle-switch-mini ${widgets[w.key] ? 'on' : ''}`}>
                <div className="toggle-thumb-mini" />
              </div>
            </button>
          ))}
        </div>
        </>
      )}

      {/* Planejamento */}
      {widgets.planning && (
        <section className="dash-section animate-fade-in-up" style={{ animationDelay: '50ms' }}>
        <h2 className="section-title">Planejamento</h2>
        <div className="planning-grid">
          <button className="planning-card glass" onClick={() => navigate('/budgets')}>
             <div className="planning-icon budgets-icon"><PieChart size={22}/></div>
             <div className="planning-info">
               <h3>Orçamentos</h3>
               <p>Limites de gastos</p>
             </div>
          </button>
          <button className="planning-card glass" onClick={() => navigate('/goals')}>
             <div className="planning-icon goals-icon"><Target size={22}/></div>
             <div className="planning-info">
               <h3>Metas e Cofres</h3>
               <p>Guarde dinheiro</p>
             </div>
          </button>
          <button className="planning-card glass" onClick={() => navigate('/reports')}>
             <div className="planning-icon reports-icon"><BarChart3 size={22}/></div>
             <div className="planning-info">
               <h3>Relatórios</h3>
               <p>Insights financeiros</p>
             </div>
          </button>
          <button className="planning-card glass" onClick={() => navigate('/recurring')}>
             <div className="planning-icon" style={{ background: 'rgba(116,185,255,0.12)', color: '#74B9FF' }}><Repeat size={22}/></div>
             <div className="planning-info">
               <h3>Recorrentes</h3>
               <p>Contas fixas</p>
             </div>
          </button>
          <button className="planning-card glass" onClick={() => navigate('/annual')}>
             <div className="planning-icon" style={{ background: 'rgba(253,203,110,0.12)', color: '#FDCB6E' }}><Calendar size={22}/></div>
             <div className="planning-info">
               <h3>Resumo Anual</h3>
               <p>Visão do ano</p>
             </div>
          </button>
          <button className="planning-card glass" onClick={() => navigate('/achievements')}>
             <div className="planning-icon" style={{ background: 'rgba(225,112,85,0.12)', color: '#E17055' }}><Trophy size={22}/></div>
             <div className="planning-info">
               <h3>Conquistas</h3>
               <p>Desbloqueie badges</p>
             </div>
          </button>
          <button className="planning-card glass" onClick={() => navigate('/ai')}>
             <div className="planning-icon" style={{ background: 'linear-gradient(135deg, rgba(108,92,231,0.15), rgba(162,155,254,0.15))', color: '#A29BFE' }}><Sparkles size={22}/></div>
             <div className="planning-info">
               <h3>FinBot IA</h3>
               <p>Assistente inteligente</p>
             </div>
          </button>
          <button className="planning-card glass" onClick={() => navigate('/crypto')}>
             <div className="planning-icon" style={{ background: 'linear-gradient(135deg, rgba(247,147,26,0.15), rgba(255,193,7,0.15))', color: '#F7931A' }}><Bitcoin size={22}/></div>
             <div className="planning-info">
               <h3>Criptomoedas</h3>
               <p>Cotações em tempo real</p>
             </div>
          </button>
        </div>
      </section>
      )}

      {/* Accounts */}
      {accounts.length > 0 && (
        <section className="dash-section animate-fade-in-up" style={{ animationDelay: '80ms' }}>
          <div className="section-header">
            <h2 className="section-title">Suas Contas</h2>
            <button className="section-link" onClick={() => navigate('/accounts')}>
              Gerenciar <ArrowRight size={14} />
            </button>
          </div>
          <div className="dash-accounts-scroll">
            {accounts.map(acc => {
              const bal = getAccountBalance(acc.id)
              return (
                <div key={acc.id} className="dash-account-card" style={{ borderLeft: `3px solid ${acc.color}` }} onClick={() => navigate('/accounts')}>
                  <div className="dash-acc-icon" style={{ background: acc.color + '18', color: acc.color }}>
                    <Wallet size={18} />
                  </div>
                  <div className="dash-acc-info">
                    <span className="dash-acc-name">{acc.name}</span>
                    <span className={`dash-acc-bal ${bal >= 0 ? 'positive' : 'negative'}`}>
                      {showBalance ? formatCurrency(bal, currency) : '•••'}
                    </span>
                  </div>
                </div>
              )
            })}
          </div>
        </section>
      )}

      {/* Credit Cards */}
      {creditCards.length > 0 && (
        <section className="dash-section animate-fade-in-up" style={{ animationDelay: '100ms' }}>
          <div className="section-header">
            <h2 className="section-title">Seus Cartões</h2>
            <button className="section-link" onClick={() => navigate('/profile')}>
              Gerenciar <ArrowRight size={14} />
            </button>
          </div>
          <div className="dash-accounts-scroll">
            {creditCards.map(card => (
              <Link key={card.id} to={`/card/${card.id}`} className="dash-cc-card" style={{ borderTop: `3px solid ${card.color || 'var(--primary-500)'}`, textDecoration: 'none', color: 'inherit' }}>
                <div className="dash-cc-icon">
                  <CreditCard size={20} />
                </div>
                <div className="dash-cc-info">
                  <span className="dash-cc-name">{card.name}</span>
                  <span className="dash-cc-label">Fatura atual</span>
                  <span className="dash-cc-invoice">
                    {showBalance ? formatCurrency(card.currentInvoice || 0, currency) : '•••'}
                  </span>
                </div>
                <div className="dash-cc-limit">
                  <span className="dash-cc-limit-label">Limite</span>
                  <span className="dash-cc-limit-value">{formatCurrency(card.limit || 0, currency)}</span>
                </div>
              </Link>
            ))}
          </div>
        </section>
      )}

      {/* Financial Health Score */}
      {(widgets.health !== false) && (
      <section className="dash-section animate-fade-in-up">
        <h2 className="section-title">Saúde Financeira</h2>
        <HealthScore month={month} year={year} />
      </section>
      )}

      {/* Month Comparison */}
      {(widgets.comparison !== false) && <MonthComparison month={month} year={year} />}

      {/* Chart */}
      {widgets.chart && expensesByCategory.length > 0 && (
        <section className="dash-section animate-fade-in-up">
          <h2 className="section-title">Gastos por categoria</h2>
          <div className="chart-card">
            <div className="chart-wrapper">
              <Doughnut data={chartData} options={chartOptions} />
              <div className="chart-center">
                <span className="chart-center-label">Total</span>
                <span className="chart-center-value">
                  {showBalance ? formatCurrency(balance.expense, currency) : '•••'}
                </span>
              </div>
            </div>
            <div className="chart-legend">
              {expensesByCategory.slice(0, 5).map(cat => (
                <div key={cat.categoryId} className="chart-legend-item">
                  <span className="chart-legend-dot" style={{ background: cat.color }} />
                  <span className="chart-legend-name">{cat.name}</span>
                  <span className="chart-legend-value">{formatCurrency(cat.amount, currency)}</span>
                </div>
              ))}
            </div>
          </div>
        </section>
      )}

      {/* Recent Transactions */}
      {widgets.transactions && (
      <section className="dash-section animate-fade-in-up" style={{ animationDelay: '200ms' }}>
        <div className="section-header">
          <h2 className="section-title">Últimas transações</h2>
          {transactions.length > 0 && (
            <button className="section-link" onClick={() => navigate('/transactions')}>
              Ver todas <ArrowRight size={14} />
            </button>
          )}
        </div>

        {transactions.length === 0 ? (
          <div className="empty-state">
            <div className="empty-emoji">📝</div>
            <p>Nenhuma transação este mês</p>
            <button className="empty-cta" onClick={() => navigate('/add')}>
              Adicionar transação
            </button>
          </div>
        ) : (
          <div className="transaction-list stagger">
            {transactions.map(tx => {
              const cat = getCategoryById(categories, tx.category)
              return (
                <div key={tx.id} className="transaction-item" id={`tx-${tx.id}`} onClick={() => setSelectedTx(tx)} style={{ cursor: 'pointer' }}>
                  <div className="tx-icon" style={{ background: cat?.color + '18', color: cat?.color }}>
                    <CategoryIcon iconName={cat?.icon} size={18} color={cat?.color} />
                  </div>
                  <div className="tx-info">
                    <span className="tx-desc">{tx.description || cat?.name}</span>
                    <span className="tx-date">{getRelativeDate(tx.date)}</span>
                    {(tx.tags || []).length > 0 && (
                      <div className="tx-tags">
                        {(tx.tags || []).map(tid => {
                          const tag = tags.find(t => t.id === tid)
                          return tag ? (
                            <span key={tag.id} className="tx-tag-badge" style={{ background: tag.color + '20', color: tag.color }}>{tag.name}</span>
                          ) : null
                        })}
                      </div>
                    )}
                  </div>
                  <span className={`tx-amount ${tx.type}`}>
                    {tx.type === 'income' ? '+' : '-'}{formatCurrency(tx.amount, currency)}
                  </span>
                </div>
              )
            })}
          </div>
        )}
      </section>
      )}
    </div>
    {/* Floating AI Button */}
    <button className="dash-ai-fab" onClick={() => navigate('/ai')} aria-label="FinBot IA">
      <Sparkles size={20} />
    </button>
    <TransactionDetail transaction={selectedTx} onClose={() => setSelectedTx(null)} onDelete={(id) => deleteTransaction(id)} />
    </>  )
}
