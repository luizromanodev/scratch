import { useState, useMemo } from 'react'
import { useNavigate } from 'react-router-dom'
import { useFinance } from '../context/FinanceContext'
import { formatCurrency } from '../utils/formatCurrency'
import { getShortMonthName } from '../utils/dateUtils'
import { Bar } from 'react-chartjs-2'
import { ArrowLeft, ChevronLeft, ChevronRight, TrendingUp, TrendingDown, Wallet, Award } from 'lucide-react'
import './AnnualSummaryPage.css'

export default function AnnualSummaryPage() {
  const navigate = useNavigate()
  const { getAnnualSummary, currency } = useFinance()
  const [year, setYear] = useState(new Date().getFullYear())

  const summary = useMemo(() => getAnnualSummary(year), [year, getAnnualSummary])

  const barData = {
    labels: summary.months.map(m => getShortMonthName(m.month)),
    datasets: [
      { label: 'Receitas', data: summary.months.map(m => m.income), backgroundColor: 'rgba(0, 208, 156, 0.7)', borderRadius: 4, barPercentage: 0.5 },
      { label: 'Despesas', data: summary.months.map(m => m.expense), backgroundColor: 'rgba(255, 107, 107, 0.7)', borderRadius: 4, barPercentage: 0.5 },
    ]
  }

  const barOptions = {
    responsive: true, maintainAspectRatio: false,
    plugins: { legend: { display: false }, tooltip: { backgroundColor: 'rgba(0,0,0,0.85)', padding: 12, cornerRadius: 10, callbacks: { label: (ctx) => ` ${ctx.dataset.label}: ${formatCurrency(ctx.raw, currency)}` } } },
    scales: {
      x: { grid: { display: false }, ticks: { color: 'var(--text-tertiary)', font: { size: 10 } }, border: { display: false } },
      y: { grid: { color: 'var(--border-color)', lineWidth: 0.5 }, ticks: { color: 'var(--text-tertiary)', font: { size: 10 }, callback: v => formatCurrency(v, currency).replace(/,\d+/, '') }, border: { display: false } }
    }
  }

  // Balance accumulation
  const accumulated = useMemo(() => {
    let acc = 0
    return summary.months.map(m => { acc += m.balance; return acc })
  }, [summary])

  return (
    <div className="page container">
      <header className="ann-header">
        <button className="back-btn" onClick={() => navigate(-1)}><ArrowLeft size={24} /></button>
        <h1 className="ann-title">Resumo Anual</h1>
      </header>

      <div className="ann-year-sel glass">
        <button onClick={() => setYear(y => y - 1)}><ChevronLeft size={18} /></button>
        <span className="ann-year-label">{year}</span>
        <button onClick={() => setYear(y => y + 1)}><ChevronRight size={18} /></button>
      </div>

      {/* KPI Cards */}
      <div className="ann-kpi-grid">
        <div className="ann-kpi income"><TrendingUp size={18} /><div><span className="ann-kpi-label">Receitas</span><span className="ann-kpi-value">{formatCurrency(summary.totalIncome, currency)}</span></div></div>
        <div className="ann-kpi expense"><TrendingDown size={18} /><div><span className="ann-kpi-label">Despesas</span><span className="ann-kpi-value">{formatCurrency(summary.totalExpense, currency)}</span></div></div>
        <div className="ann-kpi balance"><Wallet size={18} /><div><span className="ann-kpi-label">Saldo</span><span className={`ann-kpi-value ${summary.totalBalance >= 0 ? 'positive' : 'negative'}`}>{formatCurrency(summary.totalBalance, currency)}</span></div></div>
        <div className="ann-kpi best"><Award size={18} /><div><span className="ann-kpi-label">Melhor mês</span><span className="ann-kpi-value">{summary.bestMonth ? getShortMonthName(summary.bestMonth.month) : '-'}</span></div></div>
      </div>

      {/* Chart */}
      <section className="ann-chart-section glass">
        <h3 className="ann-chart-title">Receitas vs Despesas — {year}</h3>
        <div className="ann-chart-wrapper"><Bar data={barData} options={barOptions} /></div>
        <div className="ann-chart-legend">
          <span className="ann-legend"><span className="ann-dot income" /> Receitas</span>
          <span className="ann-legend"><span className="ann-dot expense" /> Despesas</span>
        </div>
      </section>

      {/* Month-by-month table */}
      <section className="ann-table-section">
        <h3 className="section-title">Mês a mês</h3>
        <div className="ann-table">
          <div className="ann-table-header">
            <span>Mês</span><span>Receitas</span><span>Despesas</span><span>Saldo</span>
          </div>
          {summary.months.map((m, i) => (
            <div key={m.month} className={`ann-table-row ${m.balance > 0 ? 'pos' : m.balance < 0 ? 'neg' : ''}`}>
              <span className="ann-month-name">{getShortMonthName(m.month)}</span>
              <span className="ann-income">{formatCurrency(m.income, currency)}</span>
              <span className="ann-expense">{formatCurrency(m.expense, currency)}</span>
              <span className={`ann-balance ${m.balance >= 0 ? 'positive' : 'negative'}`}>{formatCurrency(m.balance, currency)}</span>
            </div>
          ))}
        </div>
      </section>
    </div>
  )
}
