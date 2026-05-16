import { useState, useEffect, useCallback, useRef } from 'react'
import { useNavigate } from 'react-router-dom'
import {
  ArrowLeft, TrendingUp, TrendingDown, ExternalLink,
  RefreshCw, Search, Star, StarOff, ChevronRight, Bitcoin,
} from 'lucide-react'
import './CryptoPage.css'

// ── Top Cryptos to track ──
const CRYPTO_IDS = [
  'bitcoin', 'ethereum', 'solana', 'binancecoin', 'ripple',
  'cardano', 'dogecoin', 'polkadot', 'avalanche-2', 'chainlink',
  'polygon', 'uniswap', 'litecoin', 'stellar', 'near',
]

const CRYPTO_META = {
  bitcoin:       { symbol: 'BTC', name: 'Bitcoin', color: '#F7931A', exchangeUrl: 'https://www.binance.com/pt-BR/trade/BTC_USDT' },
  ethereum:      { symbol: 'ETH', name: 'Ethereum', color: '#627EEA', exchangeUrl: 'https://www.binance.com/pt-BR/trade/ETH_USDT' },
  solana:        { symbol: 'SOL', name: 'Solana', color: '#9945FF', exchangeUrl: 'https://www.binance.com/pt-BR/trade/SOL_USDT' },
  binancecoin:   { symbol: 'BNB', name: 'BNB', color: '#F0B90B', exchangeUrl: 'https://www.binance.com/pt-BR/trade/BNB_USDT' },
  ripple:        { symbol: 'XRP', name: 'XRP', color: '#00AAE4', exchangeUrl: 'https://www.binance.com/pt-BR/trade/XRP_USDT' },
  cardano:       { symbol: 'ADA', name: 'Cardano', color: '#0033AD', exchangeUrl: 'https://www.binance.com/pt-BR/trade/ADA_USDT' },
  dogecoin:      { symbol: 'DOGE', name: 'Dogecoin', color: '#C2A633', exchangeUrl: 'https://www.binance.com/pt-BR/trade/DOGE_USDT' },
  polkadot:      { symbol: 'DOT', name: 'Polkadot', color: '#E6007A', exchangeUrl: 'https://www.binance.com/pt-BR/trade/DOT_USDT' },
  'avalanche-2': { symbol: 'AVAX', name: 'Avalanche', color: '#E84142', exchangeUrl: 'https://www.binance.com/pt-BR/trade/AVAX_USDT' },
  chainlink:     { symbol: 'LINK', name: 'Chainlink', color: '#2A5ADA', exchangeUrl: 'https://www.binance.com/pt-BR/trade/LINK_USDT' },
  polygon:       { symbol: 'POL', name: 'Polygon', color: '#8247E5', exchangeUrl: 'https://www.binance.com/pt-BR/trade/POL_USDT' },
  uniswap:       { symbol: 'UNI', name: 'Uniswap', color: '#FF007A', exchangeUrl: 'https://www.binance.com/pt-BR/trade/UNI_USDT' },
  litecoin:      { symbol: 'LTC', name: 'Litecoin', color: '#BFBBBB', exchangeUrl: 'https://www.binance.com/pt-BR/trade/LTC_USDT' },
  stellar:       { symbol: 'XLM', name: 'Stellar', color: '#14B6E7', exchangeUrl: 'https://www.binance.com/pt-BR/trade/XLM_USDT' },
  near:          { symbol: 'NEAR', name: 'NEAR', color: '#00C08B', exchangeUrl: 'https://www.binance.com/pt-BR/trade/NEAR_USDT' },
}

const PERIOD_OPTIONS = [
  { label: '24h', days: 1 },
  { label: '7d', days: 7 },
  { label: '30d', days: 30 },
  { label: '90d', days: 90 },
  { label: '1a', days: 365 },
]

const EXCHANGE_LINKS = [
  { name: 'Binance', url: 'https://www.binance.com/pt-BR', color: '#F0B90B' },
  { name: 'Mercado Bitcoin', url: 'https://www.mercadobitcoin.com.br', color: '#00D09C' },
  { name: 'Coinbase', url: 'https://www.coinbase.com', color: '#0052FF' },
  { name: 'Foxbit', url: 'https://foxbit.com.br', color: '#FF6B00' },
]

// ── Format BRL ──
function fmtBRL(v) {
  if (v >= 1) return v.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL', minimumFractionDigits: 2, maximumFractionDigits: 2 })
  if (v >= 0.01) return v.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL', minimumFractionDigits: 4, maximumFractionDigits: 4 })
  return v.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL', minimumFractionDigits: 6, maximumFractionDigits: 6 })
}

function fmtCompact(v) {
  if (v >= 1e12) return `R$ ${(v / 1e12).toFixed(1)}T`
  if (v >= 1e9) return `R$ ${(v / 1e9).toFixed(1)}B`
  if (v >= 1e6) return `R$ ${(v / 1e6).toFixed(1)}M`
  return fmtBRL(v)
}

// ── Mini Sparkline SVG for list ──
function MiniChart({ data, color, isPositive }) {
  if (!data || data.length < 2) return null
  const w = 80, h = 28
  const min = Math.min(...data)
  const max = Math.max(...data)
  const range = max - min || 1
  const points = data.map((v, i) => {
    const x = (i / (data.length - 1)) * w
    const y = h - ((v - min) / range) * h
    return `${x},${y}`
  }).join(' ')
  return (
    <svg width={w} height={h} viewBox={`0 0 ${w} ${h}`} className="crypto-mini-chart">
      <polyline fill="none" stroke={isPositive ? '#00D09C' : '#FF6B6B'} strokeWidth="1.5" points={points} />
    </svg>
  )
}

// ── Full Chart SVG for detail ──
function FullChart({ data, color }) {
  if (!data || data.length < 2) return <div className="crypto-chart-empty">Carregando gráfico...</div>
  const w = 400, h = 180
  const min = Math.min(...data)
  const max = Math.max(...data)
  const range = max - min || 1
  const points = data.map((v, i) => {
    const x = (i / (data.length - 1)) * w
    const y = h - ((v - min) / range) * (h - 10) - 5
    return `${x},${y}`
  }).join(' ')
  const fillPoints = `0,${h} ${points} ${w},${h}`
  return (
    <svg viewBox={`0 0 ${w} ${h}`} className="crypto-full-chart" preserveAspectRatio="none">
      <defs>
        <linearGradient id={`grad-${color.replace('#','')}`} x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor={color} stopOpacity="0.3" />
          <stop offset="100%" stopColor={color} stopOpacity="0" />
        </linearGradient>
      </defs>
      <polygon fill={`url(#grad-${color.replace('#','')})`} points={fillPoints} />
      <polyline fill="none" stroke={color} strokeWidth="2" points={points} strokeLinejoin="round" />
    </svg>
  )
}

export default function CryptoPage() {
  const navigate = useNavigate()
  const [prices, setPrices] = useState({})
  const [sparklines, setSparklines] = useState({})
  const [loading, setLoading] = useState(true)
  const [refreshing, setRefreshing] = useState(false)
  const [search, setSearch] = useState('')
  const [favorites, setFavorites] = useState(() => {
    try { return JSON.parse(localStorage.getItem('finflow_crypto_fav') || '[]') } catch { return [] }
  })
  const [selectedCrypto, setSelectedCrypto] = useState(null)
  const [chartData, setChartData] = useState(null)
  const [chartPeriod, setChartPeriod] = useState(7)
  const [chartLoading, setChartLoading] = useState(false)
  const [fetchError, setFetchError] = useState(null)
  const [lastUpdate, setLastUpdate] = useState(null)
  const intervalRef = useRef(null)

  // ── Fetch prices ──
  const fetchPrices = useCallback(async (showRefresh = false) => {
    if (showRefresh) setRefreshing(true)
    try {
      const ids = CRYPTO_IDS.join(',')
      const res = await fetch(
        `https://api.coingecko.com/api/v3/simple/price?ids=${ids}&vs_currencies=brl&include_24hr_change=true&include_market_cap=true&include_24hr_vol=true`
      )
      if (res.ok) {
        const data = await res.json()
        setPrices(data)
        setLastUpdate(new Date())
        setFetchError(null)
      }
      // Fetch sparkline data for 7 days
      const sparkRes = await fetch(
        `https://api.coingecko.com/api/v3/coins/markets?vs_currency=brl&ids=${ids}&sparkline=true&price_change_percentage=7d`
      )
      if (sparkRes.ok) {
        const sparkData = await sparkRes.json()
        const mapped = {}
        sparkData.forEach(c => { mapped[c.id] = c.sparkline_in_7d?.price || [] })
        setSparklines(mapped)
      }
    } catch (err) {
      console.error('Crypto fetch error:', err)
      setFetchError('Sem conexão com a internet. Verifique sua rede e tente novamente.')
    } finally {
      setLoading(false)
      setRefreshing(false)
    }
  }, [])

  // ── Fetch chart for selected crypto ──
  const fetchChart = useCallback(async (id, days) => {
    setChartLoading(true)
    try {
      const res = await fetch(
        `https://api.coingecko.com/api/v3/coins/${id}/market_chart?vs_currency=brl&days=${days}`
      )
      if (res.ok) {
        const data = await res.json()
        setChartData(data.prices.map(p => p[1]))
      }
    } catch (err) {
      console.error('Chart fetch error:', err)
    } finally {
      setChartLoading(false)
    }
  }, [])

  // ── Auto-refresh every 60s ──
  useEffect(() => {
    fetchPrices()
    intervalRef.current = setInterval(() => fetchPrices(), 60000)
    return () => clearInterval(intervalRef.current)
  }, [fetchPrices])

  // ── Fetch chart on crypto/period change ──
  useEffect(() => {
    if (selectedCrypto) {
      fetchChart(selectedCrypto, chartPeriod)
    }
  }, [selectedCrypto, chartPeriod, fetchChart])

  // ── Save favorites ──
  useEffect(() => {
    localStorage.setItem('finflow_crypto_fav', JSON.stringify(favorites))
  }, [favorites])

  const toggleFavorite = (id) => {
    setFavorites(prev => prev.includes(id) ? prev.filter(f => f !== id) : [...prev, id])
  }

  // ── Filter & sort ──
  const filteredCryptos = CRYPTO_IDS.filter(id => {
    const meta = CRYPTO_META[id]
    if (!search) return true
    const q = search.toLowerCase()
    return meta.name.toLowerCase().includes(q) || meta.symbol.toLowerCase().includes(q)
  }).sort((a, b) => {
    const aFav = favorites.includes(a) ? 0 : 1
    const bFav = favorites.includes(b) ? 0 : 1
    return aFav - bFav
  })

  const selectedMeta = selectedCrypto ? CRYPTO_META[selectedCrypto] : null
  const selectedPrice = selectedCrypto ? prices[selectedCrypto] : null

  return (
    <div className="page container">
      {/* Header */}
      <div className="crypto-header">
        <button className="crypto-back" onClick={() => navigate(-1)}>
          <ArrowLeft size={22} />
        </button>
        <div>
          <h1 className="crypto-title">Criptomoedas</h1>
          <p className="crypto-subtitle">Cotações em tempo real</p>
        </div>
        <button className="crypto-refresh" onClick={() => fetchPrices(true)} disabled={refreshing}>
          <RefreshCw size={18} className={refreshing ? 'crypto-spin' : ''} />
        </button>
      </div>

      {/* Search */}
      <div className="crypto-search">
        <Search size={16} />
        <input
          type="text"
          placeholder="Buscar criptomoeda..."
          value={search}
          onChange={e => setSearch(e.target.value)}
        />
      </div>

      {/* Last update */}
      {lastUpdate && (
        <p className="crypto-updated">
          Atualizado {lastUpdate.toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit', second: '2-digit' })}
          {' • '}Atualiza a cada 60s
        </p>
      )}

      {/* Offline/Error Banner */}
      {fetchError && !loading && Object.keys(prices).length === 0 && (
        <div style={{
          background: 'var(--card-bg)',
          border: '1px solid var(--card-border)',
          borderRadius: 'var(--radius-lg)',
          padding: 'var(--space-6)',
          textAlign: 'center',
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          gap: 'var(--space-3)',
          marginBottom: 'var(--space-4)',
        }}>
          <span style={{ fontSize: '2.5rem' }}>📡</span>
          <p style={{ fontWeight: 600, fontSize: 'var(--font-md)' }}>Sem conexão</p>
          <p style={{ color: 'var(--text-secondary)', fontSize: 'var(--font-sm)' }}>{fetchError}</p>
          <button
            onClick={() => fetchPrices(true)}
            style={{
              padding: '10px 24px',
              background: 'linear-gradient(135deg, var(--primary-500), var(--primary-700))',
              color: 'white',
              border: 'none',
              borderRadius: 'var(--radius-md)',
              fontSize: 'var(--font-sm)',
              fontWeight: 600,
              cursor: 'pointer',
              fontFamily: 'inherit',
            }}
          >
            Tentar novamente
          </button>
        </div>
      )}

      {/* Crypto List */}
      <div className="crypto-list stagger">
        {loading ? (
          Array.from({ length: 6 }).map((_, i) => (
            <div key={i} className="crypto-card-skeleton">
              <div className="skeleton-circle" />
              <div className="skeleton-lines">
                <div className="skeleton-line" style={{ width: '60%' }} />
                <div className="skeleton-line" style={{ width: '40%' }} />
              </div>
              <div className="skeleton-line" style={{ width: '80px', height: '28px' }} />
            </div>
          ))
        ) : (
          filteredCryptos.map(id => {
            const meta = CRYPTO_META[id]
            const data = prices[id]
            if (!data) return null
            const change = data.brl_24h_change || 0
            const isUp = change >= 0
            const isFav = favorites.includes(id)
            return (
              <button
                key={id}
                className={`crypto-card ${selectedCrypto === id ? 'selected' : ''}`}
                onClick={() => setSelectedCrypto(selectedCrypto === id ? null : id)}
              >
                <div className="crypto-card-left">
                  <div className="crypto-icon" style={{ background: `${meta.color}20`, color: meta.color }}>
                    {meta.symbol.substring(0, 2)}
                  </div>
                  <div className="crypto-info">
                    <span className="crypto-name">{meta.name}</span>
                    <span className="crypto-symbol">{meta.symbol}</span>
                  </div>
                </div>
                <MiniChart data={sparklines[id]?.slice(-24)} isPositive={isUp} />
                <div className="crypto-card-right">
                  <span className="crypto-price">{fmtBRL(data.brl)}</span>
                  <span className={`crypto-change ${isUp ? 'up' : 'down'}`}>
                    {isUp ? <TrendingUp size={12} /> : <TrendingDown size={12} />}
                    {Math.abs(change).toFixed(2)}%
                  </span>
                </div>
                <button
                  className={`crypto-fav ${isFav ? 'active' : ''}`}
                  onClick={(e) => { e.stopPropagation(); toggleFavorite(id) }}
                >
                  {isFav ? <Star size={14} /> : <StarOff size={14} />}
                </button>
              </button>
            )
          })
        )}
      </div>

      {/* Detail Panel */}
      {selectedCrypto && selectedMeta && selectedPrice && (
        <div className="crypto-detail">
          <div className="crypto-detail-header">
            <div className="crypto-detail-icon" style={{ background: `${selectedMeta.color}20`, color: selectedMeta.color }}>
              {selectedMeta.symbol.substring(0, 2)}
            </div>
            <div>
              <h2 className="crypto-detail-name">{selectedMeta.name}</h2>
              <span className="crypto-detail-symbol">{selectedMeta.symbol}/BRL</span>
            </div>
            <span className="crypto-detail-price">{fmtBRL(selectedPrice.brl)}</span>
          </div>

          {/* Period selector */}
          <div className="crypto-periods">
            {PERIOD_OPTIONS.map(p => (
              <button
                key={p.days}
                className={`crypto-period ${chartPeriod === p.days ? 'active' : ''}`}
                onClick={() => setChartPeriod(p.days)}
              >
                {p.label}
              </button>
            ))}
          </div>

          {/* Chart */}
          <div className="crypto-chart-container">
            {chartLoading ? (
              <div className="crypto-chart-loading">
                <RefreshCw size={20} className="crypto-spin" />
                <span>Carregando gráfico...</span>
              </div>
            ) : (
              <FullChart data={chartData} color={selectedMeta.color} />
            )}
          </div>

          {/* Stats */}
          <div className="crypto-stats">
            <div className="crypto-stat">
              <span className="crypto-stat-label">Market Cap</span>
              <span className="crypto-stat-value">{fmtCompact(selectedPrice.brl_market_cap || 0)}</span>
            </div>
            <div className="crypto-stat">
              <span className="crypto-stat-label">Vol. 24h</span>
              <span className="crypto-stat-value">{fmtCompact(selectedPrice.brl_24h_vol || 0)}</span>
            </div>
            <div className="crypto-stat">
              <span className="crypto-stat-label">Variação 24h</span>
              <span className={`crypto-stat-value ${(selectedPrice.brl_24h_change || 0) >= 0 ? 'up' : 'down'}`}>
                {(selectedPrice.brl_24h_change || 0) >= 0 ? '+' : ''}{(selectedPrice.brl_24h_change || 0).toFixed(2)}%
              </span>
            </div>
          </div>

          {/* Action Links */}
          <div className="crypto-actions">
            <a
              href={`https://www.coingecko.com/pt/moedas/${selectedCrypto}`}
              target="_blank"
              rel="noopener noreferrer"
              className="crypto-action-link info"
            >
              <ExternalLink size={14} />
              <span>Mais informações</span>
            </a>
            <a
              href={selectedMeta.exchangeUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="crypto-action-link invest"
            >
              <TrendingUp size={14} />
              <span>Investir em {selectedMeta.symbol}</span>
            </a>
          </div>
        </div>
      )}

      {/* Where to Invest */}
      <section className="crypto-exchanges">
        <h3 className="crypto-section-title">Onde investir em criptomoedas</h3>
        <div className="crypto-exchange-grid">
          {EXCHANGE_LINKS.map(ex => (
            <a
              key={ex.name}
              href={ex.url}
              target="_blank"
              rel="noopener noreferrer"
              className="crypto-exchange-card"
            >
              <div className="crypto-exchange-dot" style={{ background: ex.color }} />
              <span className="crypto-exchange-name">{ex.name}</span>
              <ChevronRight size={14} className="crypto-exchange-arrow" />
            </a>
          ))}
        </div>
      </section>

      {/* Disclaimer */}
      <p className="crypto-disclaimer">
        ⚠️ Investir em criptomoedas envolve riscos. Dados fornecidos por CoinGecko.
        Faça sua própria pesquisa antes de investir.
      </p>
    </div>
  )
}
