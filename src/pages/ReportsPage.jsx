import { useState, useMemo } from 'react'
import { useNavigate } from 'react-router-dom'
import { useFinance } from '../context/FinanceContext'
import { formatCurrency } from '../utils/formatCurrency'
import { getMonthName, getShortMonthName, getCurrentMonth, getCurrentYear } from '../utils/dateUtils'
import { getCategoryById, CategoryIcon } from '../utils/categories'
import { Bar, Doughnut } from 'react-chartjs-2'
import {
  Chart as ChartJS, ArcElement, Tooltip, Legend,
  CategoryScale, LinearScale, BarElement
} from 'chart.js'
import {
  ArrowLeft, TrendingUp, TrendingDown, Wallet,
  ChevronLeft, ChevronRight, BarChart3, PieChart, ArrowUpRight, ArrowDownRight
} from 'lucide-react'
import './ReportsPage.css'

ChartJS.register(ArcElement, Tooltip, Legend, CategoryScale, LinearScale, BarElement)

export default function ReportsPage() {
  const navigate = useNavigate()
  const { transactions, categories, currency, getBalance, getExpensesByCategory } = useFinance()
  const [month, setMonth] = useState(getCurrentMonth())
  const [year, setYear] = useState(getCurrentYear())
  const [chartTab, setChartTab] = useState('bar') // 'bar' | 'category'

  const balance = useMemo(() => getBalance(month, year), [month, year, getBalance])
  const expensesByCategory = useMemo(() => getExpensesByCategory(month, year), [month, year, getExpensesByCategory])

  // Last 6 months data for bar chart
  const last6Months = useMemo(() => {
    const months = []
    let m = month, y = year
    for (let i = 0; i < 6; i++) {
      const bal = getBalance(m, y)
      months.unshift({
        month: m,
        year: y,
        label: getShortMonthName(m),
        income: bal.income,
        expense: bal.expense,
        balance: bal.balance,
      })
      m--
      if (m < 0) { m = 11; y-- }
    }
    return months
  }, [month, year, getBalance])

  // Top 5 biggest expenses this month
  const topExpenses = useMemo(() => {
    return transactions
      .filter(t => {
        const d = new Date(t.date + 'T00:00:00')
        return t.type === 'expense' && d.getMonth() === month && d.getFullYear() === year
      })
      .sort((a, b) => b.amount - a.amount)
      .slice(0, 5)
  }, [transactions, month, year])

  // Month comparison (current vs previous)
  const comparison = useMemo(() => {
    let prevM = month - 1, prevY = year
    if (prevM < 0) { prevM = 11; prevY-- }
    const prevBal = getBalance(prevM, prevY)
    const incomeChange = prevBal.income > 0 ? ((balance.income - prevBal.income) / prevBal.income * 100) : 0
    const expenseChange = prevBal.expense > 0 ? ((balance.expense - prevBal.expense) / prevBal.expense * 100) : 0
    return { incomeChange, expenseChange, prevMonth: getShortMonthName(prevM) }
  }, [month, year, balance, getBalance])

  // Average daily expense
  const avgDailyExpense = useMemo(() => {
    const today = new Date()
    const isCurrentMonth = today.getMonth() === month && today.getFullYear() === year
    const daysInMonth = new Date(year, month + 1, 0).getDate()
    const daysSoFar = isCurrentMonth ? today.getDate() : daysInMonth
    return daysSoFar > 0 ? balance.expense / daysSoFar : 0
  }, [balance, month, year])

  const prevMonth = () => { if (month === 0) { setMonth(11); setYear(y => y - 1) } else setMonth(m => m - 1) }
  const nextMonth = () => { if (month === 11) { setMonth(0); setYear(y => y + 1) } else setMonth(m => m + 1) }

  // Bar chart data
  const barData = {
    labels: last6Months.map(m => m.label),
    datasets: [
      {
        label: 'Receitas',
        data: last6Months.map(m => m.income),
        backgroundColor: 'rgba(0, 208, 156, 0.8)',
        borderRadius: 6,
        borderSkipped: false,
        barPercentage: 0.6,
        categoryPercentage: 0.7,
      },
      {
        label: 'Despesas',
        data: last6Months.map(m => m.expense),
        backgroundColor: 'rgba(255, 107, 107, 0.8)',
        borderRadius: 6,
        borderSkipped: false,
        barPercentage: 0.6,
        categoryPercentage: 0.7,
      }
    ]
  }

  const barOptions = {
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
      legend: { display: false },
      tooltip: {
        backgroundColor: 'rgba(0,0,0,0.85)',
        padding: 12,
        cornerRadius: 10,
        titleFont: { family: 'Inter', size: 13 },
        bodyFont: { family: 'Inter', size: 12 },
        callbacks: { label: (ctx) => ` ${ctx.dataset.label}: ${formatCurrency(ctx.raw, currency)}` }
      }
    },
    scales: {
      x: {
        grid: { display: false },
        ticks: { color: 'var(--text-tertiary)', font: { family: 'Inter', size: 11 } },
        border: { display: false }
      },
      y: {
        grid: { color: 'var(--border-color)', lineWidth: 0.5 },
        ticks: {
          color: 'var(--text-tertiary)',
          font: { family: 'Inter', size: 10 },
          callback: (val) => formatCurrency(val, currency).replace(/,\d+/, '')
        },
        border: { display: false }
      }
    }
  }

  // Doughnut chart
  const doughnutData = {
    labels: expensesByCategory.map(e => e.name),
    datasets: [{
      data: expensesByCategory.map(e => e.amount),
      backgroundColor: expensesByCategory.map(e => e.color),
      borderWidth: 0,
      hoverOffset: 6,
      borderRadius: 4,
    }]
  }

  const doughnutOptions = {
    responsive: true,
    maintainAspectRatio: false,
    cutout: '70%',
    plugins: {
      legend: { display: false },
      tooltip: {
        backgroundColor: 'rgba(0,0,0,0.85)',
        padding: 12,
        cornerRadius: 10,
        callbacks: { label: (ctx) => ` ${formatCurrency(ctx.raw, currency)}` }
      }
    },
  }

  return (
    <div className="page container">
      <header className="rpt-header">
        <button className="rpt-back" onClick={() => navigate(-1)} aria-label="Voltar">
          <ArrowLeft size={22} />
        </button>
        <h1 className="rpt-title">Relatórios</h1>
        <div style={{ width: 40 }} />
      </header>

      {/* Month Selector */}
      <div className="rpt-month-selector glass">
        <button onClick={prevMonth} className="rpt-month-btn" aria-label="Mês anterior">
          <ChevronLeft size={18} />
        </button>
        <span className="rpt-month-label">{getMonthName(month)} {year}</span>
        <button onClick={nextMonth} className="rpt-month-btn" aria-label="Próximo mês">
          <ChevronRight size={18} />
        </button>
      </div>

      {/* Summary Cards */}
      <div className="rpt-summary-grid">
        <div className="rpt-summary-card income">
          <div className="rpt-summary-icon"><TrendingUp size={18} /></div>
          <div>
            <span className="rpt-summary-label">Receitas</span>
            <span className="rpt-summary-value">{formatCurrency(balance.income, currency)}</span>
            {comparison.incomeChange !== 0 && (
              <span className={`rpt-change ${comparison.incomeChange >= 0 ? 'positive' : 'negative'}`}>
                {comparison.incomeChange >= 0 ? <ArrowUpRight size={12} /> : <ArrowDownRight size={12} />}
                {Math.abs(comparison.incomeChange).toFixed(0)}% vs {comparison.prevMonth}
              </span>
            )}
          </div>
        </div>
        <div className="rpt-summary-card expense">
          <div className="rpt-summary-icon"><TrendingDown size={18} /></div>
          <div>
            <span className="rpt-summary-label">Despesas</span>
            <span className="rpt-summary-value">{formatCurrency(balance.expense, currency)}</span>
            {comparison.expenseChange !== 0 && (
              <span className={`rpt-change ${comparison.expenseChange <= 0 ? 'positive' : 'negative'}`}>
                {comparison.expenseChange <= 0 ? <ArrowDownRight size={12} /> : <ArrowUpRight size={12} />}
                {Math.abs(comparison.expenseChange).toFixed(0)}% vs {comparison.prevMonth}
              </span>
            )}
          </div>
        </div>
        <div className="rpt-summary-card balance">
          <div className="rpt-summary-icon"><Wallet size={18} /></div>
          <div>
            <span className="rpt-summary-label">Saldo</span>
            <span className={`rpt-summary-value ${balance.balance >= 0 ? 'positive' : 'negative'}`}>
              {formatCurrency(balance.balance, currency)}
            </span>
          </div>
        </div>
        <div className="rpt-summary-card avg">
          <div className="rpt-summary-icon"><BarChart3 size={18} /></div>
          <div>
            <span className="rpt-summary-label">Média / dia</span>
            <span className="rpt-summary-value">{formatCurrency(avgDailyExpense, currency)}</span>
          </div>
        </div>
      </div>

      {/* Chart Tabs */}
      <div className="rpt-chart-tabs">
        <button
          className={`rpt-chart-tab ${chartTab === 'bar' ? 'active' : ''}`}
          onClick={() => setChartTab('bar')}
        >
          <BarChart3 size={14} /> Evolução
        </button>
        <button
          className={`rpt-chart-tab ${chartTab === 'category' ? 'active' : ''}`}
          onClick={() => setChartTab('category')}
        >
          <PieChart size={14} /> Categorias
        </button>
      </div>

      {/* Charts */}
      {chartTab === 'bar' ? (
        <section className="rpt-chart-section animate-fade-in">
          <div className="rpt-chart-card glass">
            <h3 className="rpt-chart-title">Receitas vs Despesas</h3>
            <p className="rpt-chart-subtitle">Últimos 6 meses</p>
            <div className="rpt-chart-wrapper">
              <Bar data={barData} options={barOptions} />
            </div>
            <div className="rpt-chart-legend">
              <span className="rpt-legend-item"><span className="rpt-dot income" /> Receitas</span>
              <span className="rpt-legend-item"><span className="rpt-dot expense" /> Despesas</span>
            </div>
          </div>
        </section>
      ) : (
        <section className="rpt-chart-section animate-fade-in">
          <div className="rpt-chart-card glass">
            <h3 className="rpt-chart-title">Gastos por Categoria</h3>
            <p className="rpt-chart-subtitle">{getMonthName(month)} {year}</p>
            {expensesByCategory.length > 0 ? (
              <>
                <div className="rpt-doughnut-wrapper">
                  <Doughnut data={doughnutData} options={doughnutOptions} />
                  <div className="rpt-doughnut-center">
                    <span className="rpt-doughnut-label">Total</span>
                    <span className="rpt-doughnut-value">{formatCurrency(balance.expense, currency)}</span>
                  </div>
                </div>
                <div className="rpt-cat-list stagger">
                  {expensesByCategory.map(cat => {
                    const percent = balance.expense > 0 ? (cat.amount / balance.expense * 100).toFixed(0) : 0
                    return (
                      <div key={cat.categoryId} className="rpt-cat-item">
                        <span className="rpt-cat-dot" style={{ background: cat.color }} />
                        <span className="rpt-cat-name">{cat.name}</span>
                        <span className="rpt-cat-pct">{percent}%</span>
                        <span className="rpt-cat-amount">{formatCurrency(cat.amount, currency)}</span>
                      </div>
                    )
                  })}
                </div>
              </>
            ) : (
              <div className="empty-state" style={{ padding: 'var(--space-8) 0' }}>
                <div className="empty-emoji">📊</div>
                <p>Sem despesas neste mês</p>
              </div>
            )}
          </div>
        </section>
      )}

      {/* Top Expenses */}
      {topExpenses.length > 0 && (
        <section className="rpt-section animate-fade-in-up">
          <h2 className="section-title">🔥 Top 5 maiores gastos</h2>
          <div className="rpt-top-list stagger">
            {topExpenses.map((tx, i) => {
              const cat = getCategoryById(categories, tx.category)
              return (
                <div key={tx.id} className="rpt-top-item">
                  <span className="rpt-top-rank">#{i + 1}</span>
                  <div className="rpt-top-icon" style={{ background: cat?.color + '18', color: cat?.color }}>
                    <CategoryIcon iconName={cat?.icon} size={16} color={cat?.color} />
                  </div>
                  <div className="rpt-top-info">
                    <span className="rpt-top-desc">{tx.description || cat?.name}</span>
                    <span className="rpt-top-cat">{cat?.name}</span>
                  </div>
                  <span className="rpt-top-amount">-{formatCurrency(tx.amount, currency)}</span>
                </div>
              )
            })}
          </div>
        </section>
      )}
    </div>
  )
}
