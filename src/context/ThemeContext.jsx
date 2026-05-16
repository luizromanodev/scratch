import { createContext, useContext, useState, useEffect } from 'react'

const ThemeContext = createContext()

const ACCENT_COLORS = {
  indigo: { name: 'Índigo', primary: '#6C5CE7', primaryLight: '#9B8FEF', primaryDark: '#4A3DB5' },
  emerald: { name: 'Esmeralda', primary: '#00B894', primaryLight: '#55E6C1', primaryDark: '#009970' },
  rose: { name: 'Rosa', primary: '#FD79A8', primaryLight: '#FDABCB', primaryDark: '#E84393' },
  ocean: { name: 'Oceano', primary: '#0984E3', primaryLight: '#74B9FF', primaryDark: '#0652DD' },
  amber: { name: 'Âmbar', primary: '#FDCB6E', primaryLight: '#FFEAA7', primaryDark: '#E17055' },
  crimson: { name: 'Carmesim', primary: '#E74C3C', primaryLight: '#FC8181', primaryDark: '#C0392B' },
}

export { ACCENT_COLORS }

export function ThemeProvider({ children }) {
  const [theme, setTheme] = useState(() => {
    const saved = localStorage.getItem('finflow_theme')
    if (saved) return saved
    return window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light'
  })

  const [accent, setAccent] = useState(() => {
    return localStorage.getItem('finflow_accent') || 'indigo'
  })

  useEffect(() => {
    document.documentElement.setAttribute('data-theme', theme)
    localStorage.setItem('finflow_theme', theme)
    document.querySelector('meta[name="theme-color"]')?.setAttribute(
      'content', theme === 'dark' ? '#0F0F14' : (ACCENT_COLORS[accent]?.primary || '#6C5CE7')
    )
  }, [theme, accent])

  useEffect(() => {
    const colors = ACCENT_COLORS[accent]
    if (!colors) return
    const root = document.documentElement
    root.style.setProperty('--primary-500', colors.primary)
    root.style.setProperty('--primary-400', colors.primaryLight)
    root.style.setProperty('--primary-300', colors.primaryLight)
    root.style.setProperty('--primary-600', colors.primary)
    root.style.setProperty('--primary-700', colors.primaryDark)
    root.style.setProperty('--primary-800', colors.primaryDark)
    root.style.setProperty('--shadow-glow', `0 0 20px ${colors.primary}30`)
    localStorage.setItem('finflow_accent', accent)
  }, [accent])

  const toggleTheme = () => setTheme(prev => prev === 'light' ? 'dark' : 'light')

  return (
    <ThemeContext.Provider value={{ theme, setTheme, toggleTheme, accent, setAccent }}>
      {children}
    </ThemeContext.Provider>
  )
}

export function useTheme() {
  const context = useContext(ThemeContext)
  if (!context) throw new Error('useTheme must be used within ThemeProvider')
  return context
}
