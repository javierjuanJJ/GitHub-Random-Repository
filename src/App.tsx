import { useState, type ReactNode } from 'react'
import { LanguageSelect } from './components/LanguageSelect'
import { RepositoryCard } from './components/RepositoryCard'
import { StateDisplay } from './components/StateDisplay'
import { getLanguageColor } from './data/languages'
import { useRandomRepository } from './hooks/useRandomRepository'
import type { FetchState } from './types/github'

function idleMessage(): string {
  return 'Choose a programming language to discover a random GitHub repository.'
}

function emptyMessage(language: string): string {
  return `No repositories found for ${language}. Try a different language.`
}

function loadingMessage(language: string): string {
  return `Loading a random ${language} repository…`
}

function renderContent(state: FetchState, handleRetry: () => void): ReactNode {
  switch (state.status) {
    case 'idle':
      return <StateDisplay type="empty" message={idleMessage()} />
    case 'loading':
      return <StateDisplay type="loading" message={loadingMessage(state.language)} />
    case 'empty':
      return <StateDisplay type="empty" message={emptyMessage(state.language)} />
    case 'error':
      return (
        <StateDisplay type="error" message={state.message} onRetry={handleRetry} />
      )
    case 'success':
      return (
        <RepositoryCard
          repository={state.repository}
          languageColor={getLanguageColor(state.repository.language ?? '')}
        />
      )
  }
}

export default function App() {
  const [selectedLanguage, setSelectedLanguage] = useState('')
  const { state, isLoading, fetchRepository } = useRandomRepository()

  const handleLanguageChange = (language: string) => {
    setSelectedLanguage(language)
    if (language.length > 0) fetchRepository(language)
  }

  const handleRefresh = () => {
    if (selectedLanguage.length > 0) fetchRepository(selectedLanguage)
  }

  return (
    <div className="app-container">
      <header className="app-header">
        <div className="logo-icon" aria-hidden="true" />
        <h1>GitHub Repository Finder</h1>
      </header>

      <LanguageSelect
        value={selectedLanguage}
        onChange={handleLanguageChange}
        disabled={isLoading}
      />

      <main className="content-area" aria-live="polite">
        {renderContent(state, handleRefresh)}
      </main>

      {state.status === 'success' && (
        <button type="button" className="refresh-button" onClick={handleRefresh}>
          Refresh
        </button>
      )}
    </div>
  )
}
