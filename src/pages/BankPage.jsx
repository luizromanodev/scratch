import { useState } from 'react'
import { useFinance } from '../context/FinanceContext'
import { useToast } from '../components/UI/Toast'
import { mockBankData, mockBankTransactions } from '../utils/mockBankData'
import { formatCurrency } from '../utils/formatCurrency'
import { Link2, Unlink, RefreshCw, Shield, ArrowRight } from 'lucide-react'
import CreditCardsSection from '../components/Bank/CreditCardsSection'
import './BankPage.css'

export default function BankPage() {
  const { banks, currency, connectBank, disconnectBank, addTransaction } = useFinance()
  const { addToast } = useToast()
  const [connecting, setConnecting] = useState(null)
  const [syncing, setSyncing] = useState(null)
  const [activeTab, setActiveTab] = useState('banks') // 'banks' or 'cards'

  const handleConnect = async (bank) => {
    setConnecting(bank.id)
    // Simulate connection delay
    await new Promise(r => setTimeout(r, 2000))
    connectBank({ ...bank, balance: Math.random() * 10000 + 500 })
    setConnecting(null)
    addToast(`${bank.bankName} conectado com sucesso!`, 'success')
  }

  const handleDisconnect = (bankId) => {
    disconnectBank(bankId)
    addToast('Banco desconectado', 'info')
  }

  const handleSync = async (bankId) => {
    setSyncing(bankId)
    await new Promise(r => setTimeout(r, 1500))
    // Import mock transactions
    mockBankTransactions.forEach(tx => {
      addTransaction({
        type: tx.type,
        amount: tx.amount,
        category: tx.category,
        description: tx.description,
        date: tx.date,
        bankId,
        isRecurring: false,
      })
    })
    setSyncing(null)
    addToast('Transações sincronizadas!', 'success')
  }

  const connectedIds = banks.map(b => b.id)

  return (
    <div className="page container">
      <header className="bank-header">
        <h1 className="bank-title">Contas e Cartões</h1>
        <p className="bank-subtitle">Gerencie suas conexões bancárias e cartões de crédito</p>
      </header>

      <div className="bank-tabs glass">
        <button 
          className={`bank-tab-btn ${activeTab === 'banks' ? 'active' : ''}`} 
          onClick={() => setActiveTab('banks')}
        >
          Contas Bancárias
        </button>
        <button 
          className={`bank-tab-btn ${activeTab === 'cards' ? 'active' : ''}`} 
          onClick={() => setActiveTab('cards')}
        >
          Cartões de Crédito
        </button>
      </div>

      {activeTab === 'banks' ? (
        <div className="animate-fade-in">
          {/* Security Badge */}
          <div className="bank-security">
            <Shield size={16} />
            <span>Conexão segura e criptografada</span>
          </div>

      {/* Connected Banks */}
      {banks.length > 0 && (
        <section className="bank-section">
          <h2 className="section-title">Conectados</h2>
          <div className="bank-list stagger">
            {banks.map(bank => (
              <div key={bank.id} className="bank-card connected">
                <div className="bank-avatar" style={{ background: bank.bankColor }}>
                  <span>{bank.bankName.charAt(0)}</span>
                </div>
                <div className="bank-info">
                  <span className="bank-name">{bank.bankName}</span>
                  <span className="bank-balance">{formatCurrency(bank.balance, currency)}</span>
                </div>
                <div className="bank-actions">
                  <button
                    className="bank-sync-btn"
                    onClick={() => handleSync(bank.id)}
                    disabled={syncing === bank.id}
                    aria-label="Sincronizar"
                  >
                    <RefreshCw size={16} className={syncing === bank.id ? 'spinning' : ''} />
                  </button>
                  <button className="bank-unlink-btn" onClick={() => handleDisconnect(bank.id)} aria-label="Desconectar">
                    <Unlink size={16} />
                  </button>
                </div>
              </div>
            ))}
          </div>
        </section>
      )}

      {/* Available Banks */}
      <section className="bank-section">
        <h2 className="section-title">Disponíveis</h2>
        <div className="bank-list stagger">
          {mockBankData.filter(b => !connectedIds.includes(b.id)).map(bank => (
            <div key={bank.id} className="bank-card">
              <div className="bank-avatar" style={{ background: bank.bankColor }}>
                <span style={{ color: bank.id === 'bb' ? '#003399' : 'white' }}>{bank.bankName.charAt(0)}</span>
              </div>
              <div className="bank-info">
                <span className="bank-name">{bank.bankName}</span>
                <span className="bank-type">Conta corrente</span>
              </div>
              <button
                className="bank-connect-btn"
                onClick={() => handleConnect(bank)}
                disabled={connecting === bank.id}
              >
                {connecting === bank.id ? (
                  <RefreshCw size={16} className="spinning" />
                ) : (
                  <>
                    <Link2 size={16} />
                    <span>Conectar</span>
                  </>
                )}
              </button>
            </div>
          ))}
        </div>
      </section>

      {/* Info Card */}
      <div className="bank-info-card">
        <h3>🔒 Como funciona?</h3>
        <p>Ao conectar seu banco, importamos automaticamente suas transações para que você tenha controle total sem precisar digitar cada gasto manualmente.</p>
        <div className="bank-info-steps">
          <div className="bank-step">
            <span className="bank-step-num">1</span>
            <span>Selecione seu banco</span>
          </div>
          <div className="bank-step">
            <span className="bank-step-num">2</span>
            <span>Autorize a conexão</span>
          </div>
          <div className="bank-step">
            <span className="bank-step-num">3</span>
            <span>Transações importadas!</span>
          </div>
        </div>
      </div>
    </div>
      ) : (
        <CreditCardsSection />
      )}
    </div>
  )
}
