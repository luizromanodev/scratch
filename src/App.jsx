import { lazy, Suspense } from 'react'
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom'
import { ThemeProvider } from './context/ThemeContext'
import { AuthProvider, useAuth } from './context/AuthContext'
import { FinanceProvider } from './context/FinanceContext'
import { ToastProvider } from './components/UI/Toast'
import Layout from './components/Layout/Layout'
import ErrorBoundary from './components/ErrorBoundary'

// Eager load login & landing (needed immediately)
import LoginPage from './pages/LoginPage'
import LandingPage from './pages/LandingPage'

// Lazy load all other pages for code splitting
const DashboardPage = lazy(() => import('./pages/DashboardPage'))
const TransactionsPage = lazy(() => import('./pages/TransactionsPage'))
const AddTransactionPage = lazy(() => import('./pages/AddTransactionPage'))
const BankPage = lazy(() => import('./pages/BankPage'))
const ProfilePage = lazy(() => import('./pages/ProfilePage'))
const BudgetsPage = lazy(() => import('./pages/BudgetsPage'))
const GoalsPage = lazy(() => import('./pages/GoalsPage'))
const ReportsPage = lazy(() => import('./pages/ReportsPage'))
const CategoriesPage = lazy(() => import('./pages/CategoriesPage'))
const AccountsPage = lazy(() => import('./pages/AccountsPage'))
const CreditCardDetailPage = lazy(() => import('./pages/CreditCardDetailPage'))
const AchievementsPage = lazy(() => import('./pages/AchievementsPage'))
const RecurringPage = lazy(() => import('./pages/RecurringPage'))
const AnnualSummaryPage = lazy(() => import('./pages/AnnualSummaryPage'))
const NotificationsPage = lazy(() => import('./pages/NotificationsPage'))
const AIAssistantPage = lazy(() => import('./pages/AIAssistantPage'))
const CryptoPage = lazy(() => import('./pages/CryptoPage'))
const NotFoundPage = lazy(() => import('./pages/NotFoundPage'))

// Minimal loading fallback
function PageLoader() {
  return (
    <div style={{
      display: 'flex', alignItems: 'center', justifyContent: 'center',
      minHeight: '60vh', color: 'var(--text-tertiary)', fontSize: 'var(--font-sm)'
    }}>
      <div style={{
        width: 28, height: 28, border: '3px solid var(--card-border)',
        borderTopColor: 'var(--primary-500)', borderRadius: '50%',
        animation: 'spin 0.7s linear infinite'
      }} />
    </div>
  )
}

function ProtectedRoutes() {
  const { isAuthenticated } = useAuth()
  if (!isAuthenticated) return <Navigate to="/login" replace />

  return (
    <FinanceProvider>
      <Suspense fallback={<PageLoader />}>
        <Routes>
          <Route element={<Layout />}>
            <Route path="/" element={<DashboardPage />} />
            <Route path="/transactions" element={<TransactionsPage />} />
            <Route path="/add" element={<AddTransactionPage />} />
            <Route path="/banks" element={<BankPage />} />
            <Route path="/profile" element={<ProfilePage />} />
            <Route path="/budgets" element={<BudgetsPage />} />
            <Route path="/goals" element={<GoalsPage />} />
            <Route path="/reports" element={<ReportsPage />} />
            <Route path="/categories" element={<CategoriesPage />} />
            <Route path="/accounts" element={<AccountsPage />} />
            <Route path="/card/:id" element={<CreditCardDetailPage />} />
            <Route path="/achievements" element={<AchievementsPage />} />
            <Route path="/recurring" element={<RecurringPage />} />
            <Route path="/annual" element={<AnnualSummaryPage />} />
            <Route path="/notifications" element={<NotificationsPage />} />
            <Route path="/ai" element={<AIAssistantPage />} />
            <Route path="/crypto" element={<CryptoPage />} />
          </Route>
          <Route path="*" element={<NotFoundPage />} />
        </Routes>
      </Suspense>
    </FinanceProvider>
  )
}

function AppRoutes() {
  const { isAuthenticated } = useAuth()

  return (
    <Routes>
      {/* Public landing page */}
      <Route path="/welcome" element={
        isAuthenticated ? <Navigate to="/" replace /> : <LandingPage />
      } />
      {/* Login page */}
      <Route path="/login" element={
        isAuthenticated ? <Navigate to="/" replace /> : <LoginPage />
      } />
      {/* Redirect root to landing if not authenticated */}
      <Route path="/app/*" element={<ProtectedRoutes />} />
      {/* Default routes: authenticated go to app, guests go to landing */}
      <Route path="/*" element={
        isAuthenticated ? <ProtectedRoutes /> : <Navigate to="/welcome" replace />
      } />
    </Routes>
  )
}

export default function App() {
  return (
    <ErrorBoundary>
      <BrowserRouter>
        <ThemeProvider>
          <AuthProvider>
            <ToastProvider>
              <AppRoutes />
            </ToastProvider>
          </AuthProvider>
        </ThemeProvider>
      </BrowserRouter>
    </ErrorBoundary>
  )
}
