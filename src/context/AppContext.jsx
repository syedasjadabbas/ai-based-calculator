import { createContext, useContext, useEffect, useMemo, useState } from 'react'
import { useLocalStorage } from '../hooks/useLocalStorage'

const AppContext = createContext(null)

const defaultSettings = {
  theme: 'system',
  aiProvider: 'local',
  apiEndpoint: 'https://api.openai.com/v1/chat/completions',
  apiKey: '',
  aiModel: 'gpt-4o-mini',
  autoRunAi: true,
  speakAnswers: false,
}

export function AppProvider({ children }) {
  const [settings, setSettings] = useLocalStorage('calculator.settings', defaultSettings)
  const [history, setHistory] = useLocalStorage('calculator.history', [])
  const [memory, setMemory] = useLocalStorage('calculator.memory', 0)
  const [systemTheme, setSystemTheme] = useState(() => (
    window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light'
  ))

  useEffect(() => {
    const media = window.matchMedia('(prefers-color-scheme: dark)')

    const handleChange = (event) => {
      setSystemTheme(event.matches ? 'dark' : 'light')
    }

    media.addEventListener('change', handleChange)

    return () => media.removeEventListener('change', handleChange)
  }, [])

  const resolvedTheme = settings.theme === 'system' ? systemTheme : settings.theme

  useEffect(() => {
    document.documentElement.dataset.theme = resolvedTheme
  }, [resolvedTheme])

  const addHistory = (entry) => {
    const nextEntry = {
      id: crypto.randomUUID(),
      createdAt: new Date().toISOString(),
      pinned: false,
      ...entry,
    }

    setHistory((current) => [nextEntry, ...current])
    return nextEntry
  }

  const updateHistory = (entryId, updater) => {
    setHistory((current) => current.map((entry) => (entry.id === entryId ? updater(entry) : entry)))
  }

  const pinHistory = (entryId) => {
    updateHistory(entryId, (entry) => ({ ...entry, pinned: !entry.pinned }))
  }

  const deleteHistory = (entryId) => {
    setHistory((current) => current.filter((entry) => entry.id !== entryId))
  }

  const clearHistory = () => setHistory([])

  const value = useMemo(() => ({
    settings,
    setSettings,
    history,
    setHistory,
    addHistory,
    pinHistory,
    deleteHistory,
    clearHistory,
    memory,
    setMemory,
    resolvedTheme,
    systemTheme,
  }), [history, memory, resolvedTheme, setHistory, setMemory, settings, systemTheme])

  return <AppContext.Provider value={value}>{children}</AppContext.Provider>
}

export function useAppContext() {
  const context = useContext(AppContext)

  if (!context) {
    throw new Error('useAppContext must be used within AppProvider')
  }

  return context
}