import type { GitHubRepository } from '../types/github'

interface RepositoryCardProps {
  repository: GitHubRepository
  languageColor: string
}

function formatCount(count: number): string {
  if (count < 1000) return count.toLocaleString('en-US')
  const units = [
    { limit: 1_000_000_000, suffix: 'B' },
    { limit: 1_000_000, suffix: 'M' },
    { limit: 1000, suffix: 'k' },
  ]
  for (const unit of units) {
    if (count >= unit.limit) {
      const value = count / unit.limit
      const rounded = value >= 100 ? Math.round(value) : Math.round(value * 10) / 10
      return `${rounded}${unit.suffix}`
    }
  }
  return count.toLocaleString('en-US')
}

export function RepositoryCard({ repository, languageColor }: RepositoryCardProps) {
  const language = repository.language ?? 'Unknown'

  return (
    <article className="repo-card">
      <h2 className="repo-title">
        <a
          href={repository.html_url}
          target="_blank"
          rel="noopener noreferrer"
          className="repo-link"
        >
          <span className="repo-owner">{repository.owner.login}/</span>
          <span className="repo-name">{repository.name}</span>
          <span className="external-icon" aria-hidden="true">
            &#8599;
          </span>
          <span className="sr-only">(opens in a new tab)</span>
        </a>
      </h2>

      <p className="repo-description">
        {repository.description ?? 'No description provided.'}
      </p>

      <ul className="repo-stats">
        <li className="stat">
          <span className="language-dot" style={{ backgroundColor: languageColor }} aria-hidden="true" />
          <span className="sr-only">Primary language: </span>
          {language}
        </li>
        <li className="stat">
          <span className="stat-icon" aria-hidden="true">
            &#9733;
          </span>
          <span aria-hidden="true">{formatCount(repository.stargazers_count)}</span>
          <span className="sr-only">{formatCount(repository.stargazers_count)} stars</span>
        </li>
        <li className="stat">
          <span className="stat-icon" aria-hidden="true">
            &#9802;
          </span>
          <span aria-hidden="true">{formatCount(repository.forks_count)}</span>
          <span className="sr-only">{formatCount(repository.forks_count)} forks</span>
        </li>
        <li className="stat">
          <span className="stat-icon" aria-hidden="true">
            &#9888;
          </span>
          <span aria-hidden="true">{formatCount(repository.open_issues_count)}</span>
          <span className="sr-only">{formatCount(repository.open_issues_count)} open issues</span>
        </li>
      </ul>
    </article>
  )
}
