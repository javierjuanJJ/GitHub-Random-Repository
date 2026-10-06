export interface GitHubRepositoryOwner {
  login: string
}

export interface GitHubRepository {
  id: number
  name: string
  full_name: string
  description: string | null
  html_url: string
  stargazers_count: number
  forks_count: number
  open_issues_count: number
  language: string | null
  owner: GitHubRepositoryOwner
}

export interface GitHubSearchResponse {
  total_count: number
  incomplete_results: boolean
  items: GitHubRepository[]
}

export interface GitHubErrorBody {
  message: string
  documentation_url?: string
}

export type RequestErrorKind = 'network' | 'rate-limit' | 'validation' | 'http' | 'unknown'

export type FetchState =
  | { status: 'idle' }
  | { status: 'loading'; language: string }
  | { status: 'success'; repository: GitHubRepository }
  | { status: 'empty'; language: string }
  | { status: 'error'; message: string; kind: RequestErrorKind }
