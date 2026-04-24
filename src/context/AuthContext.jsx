import { createContext, useContext, useState, useEffect } from 'react'

const AuthContext = createContext()

export function AuthProvider({ children }) {
  const [user, setUser] = useState(() => {
    const saved = localStorage.getItem('finflow_user')
    return saved ? JSON.parse(saved) : null
  })

  useEffect(() => {
    if (user) {
      localStorage.setItem('finflow_user', JSON.stringify(user))
    } else {
      localStorage.removeItem('finflow_user')
    }
  }, [user])

  const login = (name, email) => {
    const newUser = {
      id: crypto.randomUUID(),
      name,
      email,
      createdAt: new Date().toISOString()
    }
    setUser(newUser)
    return newUser
  }

  const logout = () => {
    setUser(null)
  }

  const updateUser = (updates) => {
    setUser(prev => ({ ...prev, ...updates }))
  }

  return (
    <AuthContext.Provider value={{ user, login, logout, updateUser, isAuthenticated: !!user }}>
      {children}
    </AuthContext.Provider>
  )
}

export function useAuth() {
  const context = useContext(AuthContext)
  if (!context) throw new Error('useAuth must be used within AuthProvider')
  return context
}
