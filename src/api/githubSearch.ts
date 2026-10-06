import type {
  GitHubErrorBody,
  GitHubRepository,
  GitHubSearchResponse,
  RequestErrorKind,
} from '../types/github'

const SEARCH_ENDPOINT = 'https://api.github.com/search/repositories'
const API_VERSION = '2022-11-28'
const PER_PAGE = 100
const MAX_RESULTS = 1000
const MAX_PAGES = Math.floor(MAX_RESULTS / PER_PAGE)

export class GitHubApiError extends Error {
  readonly kind: RequestErrorKind
  readonly status: number | null

  constructor(message: string, kind: RequestErrorKind, status: number | null = null) {
    super(message)
    this.name = 'GitHubApiError'
    this.kind = kind
    this.status = status
  }
}

export interface SearchOptions {
  signal: AbortSignal
  excludeId: number | null
}

function toQualifier(language: string): string {
  const value = language.trim()
  return /\s/.test(value) ? `"${value}"` : value
}

export function buildSearchUrl(language: string, page: number): string {
  const query = new URLSearchParams({
    q: `language:${toQualifier(language)}`,
    sort: 'stars',
    order: 'desc',
    per_page: String(PER_PAGE),
    page: String(page),
  })
  return `${SEARCH_ENDPOINT}?${query.toString()}`
}

export function isAbortError(error: unknown): boolean {
  return error instanceof DOMException && error.name === 'AbortError'
}

function randomIndex(length: number): number {
  return Math.floor(Math.random() * length)
}

function pickRandom(
  items: GitHubRepository[],
  excludeId: number | null,
): GitHubRepository | null {
  if (items.length === 0) return null
  const pool =
    excludeId === null ? items : items.filter((item) => item.id !== excludeId)
  const candidates = pool.length > 0 ? pool : items
  return candidates[randomIndex(candidates.length)] ?? null
}

async function readBody(response: Response): Promise<GitHubErrorBody | null> {
  try {
    const text = await response.text()
    if (text.length === 0) return null
    return JSON.parse(text) as GitHubErrorBody
  } catch {
    return null
  }
}

function secondsUntilReset(response: Response): number | null {
  const retryAfter = response.headers.get('retry-after')
  if (retryAfter !== null) {
    const seconds = Number.parseInt(retryAfter, 10)
    if (Number.isFinite(seconds)) return Math.max(0, seconds)
  }

  const reset = response.headers.get('x-ratelimit-reset')
  if (reset !== null) {
    const resetMs = Number.parseInt(reset, 10) * 1000
    if (Number.isFinite(resetMs)) {
      return Math.max(0, Math.ceil((resetMs - Date.now()) / 1000))
    }
  }

  return null
}

function formatWait(seconds: number): string {
  if (seconds < 60) return `in about ${seconds} second${seconds === 1 ? '' : 's'}`
  const minutes = Math.ceil(seconds / 60)
  return `in about ${minutes} minute${minutes === 1 ? '' : 's'}`
}

function isRateLimited(response: Response): boolean {
  if (response.status !== 403 && response.status !== 429) return false
  return response.headers.get('x-ratelimit-remaining') === '0'
}

async function toApiError(response: Response): Promise<GitHubApiError> {
  const body = await readBody(response)

  if (isRateLimited(response)) {
    const wait = secondsUntilReset(response)
    const detail = wait === null ? 'Try again later.' : `Try again ${formatWait(wait)}.`
    return new GitHubApiError(
      `GitHub's search rate limit has been reached. ${detail}`,
      'rate-limit',
      response.status,
    )
  }

  if (response.status === 422) {
    return new GitHubApiError(
      body?.message ?? 'GitHub rejected the search query.',
      'validation',
      response.status,
    )
  }

  const detail = body?.message ?? response.statusText ?? 'Unexpected response'
  return new GitHubApiError(
    `GitHub API error ${response.status}: ${detail}`,
    'http',
    response.status,
  )
}

async function requestPage(
  language: string,
  page: number,
  signal: AbortSignal,
): Promise<GitHubSearchResponse> {
  let response: Response

  try {
    response = await fetch(buildSearchUrl(language, page), {
      headers: {
        Accept: 'application/vnd.github+json',
        'X-GitHub-Api-Version': API_VERSION,
      },
      signal,
    })
  } catch (error) {
    if (isAbortError(error)) throw error
    throw new GitHubApiError(
      'Could not reach GitHub. Check your internet connection and try again.',
      'network',
    )
  }

  if (!response.ok) throw await toApiError(response)

  return (await response.json()) as GitHubSearchResponse
}

async function searchWithFallback(
  language: string,
  signal: AbortSignal,
): Promise<GitHubSearchResponse> {
  const page = 1 + randomIndex(MAX_PAGES)
  const pages = page === 1 ? [1] : [page, 1]
  let emptyResult: GitHubSearchResponse | null = null

  for (const [index, target] of pages.entries()) {
    const isLastAttempt = index === pages.length - 1

    try {
      const data = await requestPage(language, target, signal)
      if (data.items.length > 0 || data.total_count === 0) return data
      emptyResult = data
    } catch (error) {
      if (isAbortError(error)) throw error
      const retryable =
        error instanceof GitHubApiError && error.kind === 'validation'
      if (!retryable || isLastAttempt) {
        if (emptyResult === null) throw error
        return emptyResult
      }
    }
  }

  if (emptyResult === null) {
    throw new GitHubApiError('GitHub returned an empty response.', 'http')
  }

  return emptyResult
}

export async function fetchRandomRepository(
  language: string,
  options: SearchOptions,
): Promise<GitHubRepository | null> {
  const data = await searchWithFallback(language, options.signal)
  return pickRandom(data.items, options.excludeId)
}
