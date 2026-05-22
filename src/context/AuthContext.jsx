import { createContext, useContext, useState, useEffect, useCallback } from 'react'
import { isSupabaseEnabled } from '../lib/supabase'
import { signUp as dbSignUp, signIn as dbSignIn, signOut as dbSignOut, getSession, onAuthStateChange, loadProfile } from '../lib/dataService'

const AuthContext = createContext()

// Index of all registered users (for local data isolation)
const USERS_INDEX_KEY = 'finflow_users_index'

function getUsersIndex() {
  try {
    const saved = localStorage.getItem(USERS_INDEX_KEY)
    return saved ? JSON.parse(saved) : []
  } catch { return [] }
}

function saveUsersIndex(index) {
  localStorage.setItem(USERS_INDEX_KEY, JSON.stringify(index))
}

export function AuthProvider({ children }) {
  const [user, setUser] = useState(() => {
    const saved = localStorage.getItem('finflow_user')
    return saved ? JSON.parse(saved) : null
  })
  const [loading, setLoading] = useState(true)
  const [authMode, setAuthMode] = useState(() => isSupabaseEnabled() ? 'supabase' : 'local')

  // ── Supabase Auth Listener ──
  useEffect(() => {
    if (authMode !== 'supabase') {
      setLoading(false)
      return
    }

    // Check existing session
    getSession().then(async (session) => {
      if (session?.user) {
        const profile = await loadProfile(session.user.id)
        setUser({
          id: session.user.id,
          name: profile?.display_name || session.user.user_metadata?.display_name || 'Usuário',
          email: session.user.email,
          createdAt: session.user.created_at,
          lastLoginAt: new Date().toISOString(),
          authMode: 'supabase',
        })
      }
      setLoading(false)
    })

    // Listen for changes
    const { data: { subscription } } = onAuthStateChange(async (event, session) => {
      if (event === 'SIGNED_IN' && session?.user) {
        const profile = await loadProfile(session.user.id)
        setUser({
          id: session.user.id,
          name: profile?.display_name || session.user.user_metadata?.display_name || 'Usuário',
          email: session.user.email,
          createdAt: session.user.created_at,
          lastLoginAt: new Date().toISOString(),
          authMode: 'supabase',
        })
      } else if (event === 'SIGNED_OUT') {
        setUser(null)
      }
    })

    return () => subscription.unsubscribe()
  }, [authMode])

  // ── Persist user state to localStorage ──
  useEffect(() => {
    if (user) {
      localStorage.setItem('finflow_user', JSON.stringify(user))
    } else {
      localStorage.removeItem('finflow_user')
    }
  }, [user])

  // ── Local Login (no Supabase) ──
  const loginLocal = useCallback((name, email) => {
    // Check if user already exists by email (if provided) or name
    const index = getUsersIndex()
    let existingUser = null

    if (email) {
      existingUser = index.find(u => u.email?.toLowerCase() === email.toLowerCase())
    }
    if (!existingUser) {
      existingUser = index.find(u => u.name.toLowerCase() === name.toLowerCase() && (!email || !u.email))
    }

    if (existingUser) {
      // Returning user — restore their session
      const returning = { ...existingUser, lastLoginAt: new Date().toISOString(), authMode: 'local' }
      setUser(returning)
      return returning
    }

    // New user
    const newUser = {
      id: crypto.randomUUID(),
      name,
      email,
      createdAt: new Date().toISOString(),
      lastLoginAt: new Date().toISOString(),
      authMode: 'local',
    }
    // Add to index
    saveUsersIndex([...index, { id: newUser.id, name: newUser.name, email: newUser.email }])
    setUser(newUser)
    return newUser
  }, [])

  // ── Supabase Sign Up ──
  const signUp = useCallback(async (name, email, password) => {
    if (authMode !== 'supabase') {
      return { error: 'Supabase auth not available' }
    }
    const { user: dbUser, error } = await dbSignUp(email, password, name)
    if (error) return { error }
    // User state will be set by the auth listener
    return { error: null }
  }, [authMode])

  // ── Supabase Sign In ──
  const signIn = useCallback(async (email, password) => {
    if (authMode !== 'supabase') {
      return { error: 'Supabase auth not available' }
    }
    const { user: dbUser, error } = await dbSignIn(email, password)
    if (error) return { error }
    return { error: null }
  }, [authMode])

  // ── Universal Login (detects mode) ──
  const login = useCallback((name, email) => {
    // For now, always use local login (simple name-based)
    // When user enables Supabase auth, use signUp/signIn instead
    return loginLocal(name, email)
  }, [loginLocal])

  // ── Logout ──
  const logout = useCallback(async () => {
    if (authMode === 'supabase') {
      await dbSignOut()
    }
    setUser(null)
  }, [authMode])

  // ── Update User ──
  const updateUser = useCallback((updates) => {
    setUser(prev => {
      const updated = { ...prev, ...updates }
      // Also update the local users index
      const index = getUsersIndex()
      const newIndex = index.map(u => u.id === updated.id ? { id: updated.id, name: updated.name, email: updated.email } : u)
      saveUsersIndex(newIndex)
      return updated
    })
  }, [])

  return (
    <AuthContext.Provider value={{
      user,
      login,
      loginLocal,
      signUp,
      signIn,
      logout,
      updateUser,
      isAuthenticated: !!user,
      loading,
      authMode,
      isSupabase: authMode === 'supabase',
    }}>
      {children}
    </AuthContext.Provider>
  )
}

export function useAuth() {
  const context = useContext(AuthContext)
  if (!context) throw new Error('useAuth must be used within AuthProvider')
  return context
}
