import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { 
  Wallet, ArrowRight, BarChart3, Shield, Smartphone, 
  TrendingUp, PieChart, Target, CreditCard, Sparkles,
  Star, ChevronDown, Zap, Globe, Bell, Lock
} from 'lucide-react'
import './LandingPage.css'

const FEATURES = [
  {
    icon: BarChart3,
    title: 'Dashboard Inteligente',
    desc: 'Visualize receitas, despesas e saldo em tempo real com gráficos interativos.',
    color: '#6C5CE7',
  },
  {
    icon: PieChart,
    title: 'Orçamentos por Categoria',
    desc: 'Defina limites mensais e receba alertas antes de estourar o orçamento.',
    color: '#00D09C',
  },
  {
    icon: Target,
    title: 'Metas & Cofres',
    desc: 'Crie cofres para viagens, emergências ou qualquer objetivo financeiro.',
    color: '#FDCB6E',
  },
  {
    icon: CreditCard,
    title: 'Cartões de Crédito',
    desc: 'Controle faturas, limites e vencimentos de todos os seus cartões.',
    color: '#FD79A8',
  },
  {
    icon: Sparkles,
    title: 'FinBot IA',
    desc: 'Assistente inteligente que analisa suas finanças e dá dicas personalizadas.',
    color: '#A29BFE',
  },
  {
    icon: Bell,
    title: 'Notificações Inteligentes',
    desc: 'Alertas de vencimentos, orçamentos e metas direto no celular.',
    color: '#74B9FF',
  },
]

const STATS = [
  { value: '100%', label: 'Gratuito' },
  { value: '0', label: 'Anúncios' },
  { value: '∞', label: 'Transações' },
  { value: 'PWA', label: 'Instalável' },
]

const TESTIMONIALS = [
  { name: 'Maria S.', text: 'Finalmente consegui organizar minhas finanças de um jeito simples!', stars: 5 },
  { name: 'João P.', text: 'O FinBot é incrível. Me ajuda a entender pra onde meu dinheiro vai.', stars: 5 },
  { name: 'Ana L.', text: 'Uso no celular como app. Rápido, bonito e funcional.', stars: 5 },
]

export default function LandingPage() {
  const navigate = useNavigate()
  const [scrolled, setScrolled] = useState(false)
  const [visibleSections, setVisibleSections] = useState(new Set())

  useEffect(() => {
    const handleScroll = () => {
      setScrolled(window.scrollY > 50)
    }
    window.addEventListener('scroll', handleScroll, { passive: true })
    return () => window.removeEventListener('scroll', handleScroll)
  }, [])

  // Intersection Observer for scroll animations
  useEffect(() => {
    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach(entry => {
          if (entry.isIntersecting) {
            setVisibleSections(prev => new Set([...prev, entry.target.id]))
          }
        })
      },
      { threshold: 0.15, rootMargin: '0px 0px -50px 0px' }
    )

    document.querySelectorAll('[data-animate]').forEach(el => observer.observe(el))
    return () => observer.disconnect()
  }, [])

  const isVisible = (id) => visibleSections.has(id)

  return (
    <div className="landing">
      {/* Floating Nav */}
      <nav className={`landing-nav ${scrolled ? 'scrolled' : ''}`}>
        <div className="landing-nav-inner">
          <div className="landing-nav-brand">
            <div className="landing-nav-logo">
              <Wallet size={20} strokeWidth={1.5} />
            </div>
            <span className="landing-nav-name">FinFlow</span>
          </div>
          <div className="landing-nav-actions">
            <button className="landing-nav-login" onClick={() => navigate('/login')}>
              Entrar
            </button>
            <button className="landing-nav-cta" onClick={() => navigate('/login')}>
              Começar grátis
              <ArrowRight size={16} />
            </button>
          </div>
        </div>
      </nav>

      {/* Hero */}
      <section className="landing-hero">
        <div className="landing-hero-bg">
          <div className="hero-gradient-1" />
          <div className="hero-gradient-2" />
          <div className="hero-gradient-3" />
          <div className="hero-grid" />
        </div>

        <div className="landing-hero-content">
          <div className="hero-badge">
            <Zap size={14} />
            <span>100% gratuito · Sem anúncios · Open source</span>
          </div>

          <h1 className="hero-title">
            Suas finanças sob
            <span className="hero-title-accent"> controle total</span>
          </h1>

          <p className="hero-subtitle">
            O FinFlow é o app financeiro pessoal que simplifica seu dia a dia. 
            Controle gastos, defina metas, gerencie cartões e receba insights 
            inteligentes — tudo em um só lugar.
          </p>

          <div className="hero-actions">
            <button className="hero-cta-primary" onClick={() => navigate('/login')}>
              <span>Começar agora — é grátis</span>
              <ArrowRight size={20} />
            </button>
            <a href="#features" className="hero-cta-secondary">
              <span>Ver funcionalidades</span>
              <ChevronDown size={18} />
            </a>
          </div>

          {/* Stats */}
          <div className="hero-stats">
            {STATS.map((stat, i) => (
              <div key={i} className="hero-stat">
                <span className="hero-stat-value">{stat.value}</span>
                <span className="hero-stat-label">{stat.label}</span>
              </div>
            ))}
          </div>
        </div>

        {/* Floating mock */}
        <div className="hero-mockup">
          <div className="mockup-phone">
            <div className="mockup-screen">
              <div className="mockup-header">
                <span className="mockup-greeting">Olá, Luiz! 👋</span>
                <span className="mockup-month">Maio 2026</span>
              </div>
              <div className="mockup-balance-card">
                <span className="mockup-balance-label">Saldo do Mês</span>
                <span className="mockup-balance-value">R$ 3.450,00</span>
                <div className="mockup-balance-row">
                  <div className="mockup-income">
                    <span className="mockup-dot income" />
                    <span>R$ 5.200</span>
                  </div>
                  <div className="mockup-expense">
                    <span className="mockup-dot expense" />
                    <span>R$ 1.750</span>
                  </div>
                </div>
              </div>
              <div className="mockup-transactions">
                <div className="mockup-tx">
                  <div className="mockup-tx-icon" style={{ background: '#6C5CE720', color: '#6C5CE7' }}>🛒</div>
                  <div className="mockup-tx-info">
                    <span>Mercado</span>
                    <span className="mockup-tx-date">Hoje</span>
                  </div>
                  <span className="mockup-tx-amount expense">-R$ 185,00</span>
                </div>
                <div className="mockup-tx">
                  <div className="mockup-tx-icon" style={{ background: '#00D09C20', color: '#00D09C' }}>💰</div>
                  <div className="mockup-tx-info">
                    <span>Salário</span>
                    <span className="mockup-tx-date">05/05</span>
                  </div>
                  <span className="mockup-tx-amount income">+R$ 5.200,00</span>
                </div>
                <div className="mockup-tx">
                  <div className="mockup-tx-icon" style={{ background: '#FD79A820', color: '#FD79A8' }}>🍔</div>
                  <div className="mockup-tx-info">
                    <span>Restaurante</span>
                    <span className="mockup-tx-date">Ontem</span>
                  </div>
                  <span className="mockup-tx-amount expense">-R$ 62,00</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Features */}
      <section className="landing-features" id="features">
        <div className="landing-section-inner" id="sec-features" data-animate>
          <div className={`section-header ${isVisible('sec-features') ? 'animate-in' : ''}`}>
            <span className="section-badge">Funcionalidades</span>
            <h2 className="section-title">Tudo que você precisa para organizar suas finanças</h2>
            <p className="section-subtitle">Ferramentas poderosas em uma interface simples e intuitiva</p>
          </div>

          <div className="features-grid">
            {FEATURES.map((feature, i) => (
              <div
                key={i}
                className={`feature-card ${isVisible('sec-features') ? 'animate-in' : ''}`}
                style={{ animationDelay: `${i * 100}ms` }}
              >
                <div className="feature-icon" style={{ background: feature.color + '15', color: feature.color }}>
                  <feature.icon size={24} />
                </div>
                <h3 className="feature-title">{feature.title}</h3>
                <p className="feature-desc">{feature.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Security / Trust */}
      <section className="landing-trust" id="sec-trust" data-animate>
        <div className="landing-section-inner">
          <div className={`trust-content ${isVisible('sec-trust') ? 'animate-in' : ''}`}>
            <div className="trust-text">
              <span className="section-badge">Segurança</span>
              <h2 className="section-title">Seus dados, seu controle</h2>
              <p className="section-subtitle">
                Seus dados ficam armazenados no seu navegador. Sem servidores externos, 
                sem coleta de dados, sem tracking. Total privacidade.
              </p>
              <div className="trust-points">
                <div className="trust-point">
                  <Lock size={18} />
                  <span>Dados armazenados localmente no seu dispositivo</span>
                </div>
                <div className="trust-point">
                  <Shield size={18} />
                  <span>Sem cadastro obrigatório de e-mail</span>
                </div>
                <div className="trust-point">
                  <Globe size={18} />
                  <span>Funciona 100% offline após instalação</span>
                </div>
                <div className="trust-point">
                  <Smartphone size={18} />
                  <span>Instale como app no celular (PWA)</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Testimonials */}
      <section className="landing-testimonials" id="sec-testimonials" data-animate>
        <div className="landing-section-inner">
          <div className={`section-header ${isVisible('sec-testimonials') ? 'animate-in' : ''}`}>
            <span className="section-badge">Depoimentos</span>
            <h2 className="section-title">O que os usuários dizem</h2>
          </div>

          <div className="testimonials-grid">
            {TESTIMONIALS.map((t, i) => (
              <div
                key={i}
                className={`testimonial-card ${isVisible('sec-testimonials') ? 'animate-in' : ''}`}
                style={{ animationDelay: `${i * 120}ms` }}
              >
                <div className="testimonial-stars">
                  {Array.from({ length: t.stars }).map((_, j) => (
                    <Star key={j} size={14} fill="#FDCB6E" color="#FDCB6E" />
                  ))}
                </div>
                <p className="testimonial-text">"{t.text}"</p>
                <span className="testimonial-name">{t.name}</span>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Final CTA */}
      <section className="landing-cta-section" id="sec-cta" data-animate>
        <div className="landing-section-inner">
          <div className={`cta-box ${isVisible('sec-cta') ? 'animate-in' : ''}`}>
            <div className="cta-bg-glow" />
            <h2 className="cta-title">Pronto para transformar suas finanças?</h2>
            <p className="cta-subtitle">
              Comece agora mesmo — gratuito, sem cadastro de cartão, sem compromisso.
            </p>
            <button className="cta-button" onClick={() => navigate('/login')}>
              <span>Criar minha conta grátis</span>
              <ArrowRight size={20} />
            </button>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="landing-footer">
        <div className="landing-footer-inner">
          <div className="footer-brand">
            <div className="landing-nav-logo">
              <Wallet size={18} strokeWidth={1.5} />
            </div>
            <span>FinFlow</span>
          </div>
          <p className="footer-copy">
            © {new Date().getFullYear()} FinFlow. Feito com 💜 · v{__APP_VERSION__}
          </p>
        </div>
      </footer>
    </div>
  )
}
