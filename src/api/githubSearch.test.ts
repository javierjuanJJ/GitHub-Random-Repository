import { beforeEach, describe, expect, it, vi } from 'vitest'
import {
  GitHubApiError,
  buildSearchUrl,
  fetchRandomRepository,
  isAbortError,
} from './githubSearch'
import type { GitHubRepository } from '../types/github'

const SIGNAL: AbortSignal = new AbortController().signal

function repository(id: number): GitHubRepository {
  return {
    id,
    name: `repo-${id}`,
    full_name: `owner/repo-${id}`,
    description: `Description ${id}`,
    html_url: `https://github.com/owner/repo-${id}`,
    stargazers_count: id * 10,
    forks_count: id,
    open_issues_count: id,
    language: 'Go',
    owner: { login: 'owner' },
  }
}

function searchPayload(items: GitHubRepository[], totalCount = items.length) {
  return { total_count: totalCount, incomplete_results: false, items }
}

function jsonResponse(payload: unknown, status = 200, headers: Record<string, string> = {}) {
  return new Response(JSON.stringify(payload), {
    status,
    headers: { 'content-type': 'application/json', ...headers },
  })
}

const fetchMock = vi.fn()

function pageOf(call: unknown[]): string | null {
  return new URL(String(call[0])).searchParams.get('page')
}

beforeEach(() => {
  vi.stubGlobal('fetch', fetchMock)
})

describe('buildSearchUrl', () => {
  it('targets the repository search endpoint with the documented parameters', () => {
    const url = new URL(buildSearchUrl('Go', 4))

    expect(`${url.origin}${url.pathname}`).toBe(
      'https://api.github.com/search/repositories',
    )
    expect(url.searchParams.get('q')).toBe('language:Go')
    expect(url.searchParams.get('sort')).toBe('stars')
    expect(url.searchParams.get('order')).toBe('desc')
    expect(url.searchParams.get('per_page')).toBe('100')
    expect(url.searchParams.get('page')).toBe('4')
  })

  it('escapes languages with special characters', () => {
    expect(new URL(buildSearchUrl('C++', 1)).searchParams.get('q')).toBe('language:C++')
    expect(new URL(buildSearchUrl('C#', 1)).searchParams.get('q')).toBe('language:C#')
  })

  it('quotes language qualifiers that contain spaces', () => {
    const query = new URL(buildSearchUrl('Vim script', 1)).searchParams.get('q')
    expect(query).toBe('language:"Vim script"')
  })
})

describe('fetchRandomRepository', () => {
  it('returns a repository and sends the GitHub media type header', async () => {
    fetchMock.mockResolvedValue(jsonResponse(searchPayload([repository(1), repository(2)])))

    const result = await fetchRandomRepository('Go', { signal: SIGNAL, excludeId: null })

    expect(result).not.toBeNull()
    expect([1, 2]).toContain(result?.id)

    const init = fetchMock.mock.calls[0]?.[1] as RequestInit
    expect(init.headers).toMatchObject({ Accept: 'application/vnd.github+json' })
  })

  it('never returns the repository that was shown previously', async () => {
    fetchMock.mockImplementation(async () =>
      jsonResponse(searchPayload([repository(1), repository(2)])),
    )
    vi.spyOn(Math, 'random').mockReturnValue(0)

    const first = await fetchRandomRepository('Go', { signal: SIGNAL, excludeId: null })
    const second = await fetchRandomRepository('Go', {
      signal: SIGNAL,
      excludeId: first?.id ?? null,
    })

    expect(first?.id).toBe(1)
    expect(second?.id).toBe(2)
  })

  it('returns null when the language has no repositories', async () => {
    fetchMock.mockResolvedValue(jsonResponse(searchPayload([])))

    const result = await fetchRandomRepository('Nemerle', { signal: SIGNAL, excludeId: null })

    expect(result).toBeNull()
    expect(fetchMock).toHaveBeenCalledTimes(1)
  })

  it('retries on the first page when the random page is out of range', async () => {
    vi.spyOn(Math, 'random').mockReturnValue(0.99)
    fetchMock
      .mockResolvedValueOnce(jsonResponse(searchPayload([], 500)))
      .mockResolvedValueOnce(jsonResponse(searchPayload([repository(9)], 500)))

    const result = await fetchRandomRepository('Go', { signal: SIGNAL, excludeId: null })

    expect(result?.id).toBe(9)
    expect(fetchMock).toHaveBeenCalledTimes(2)
    expect(pageOf(fetchMock.mock.calls[0] ?? [])).not.toBe('1')
    expect(pageOf(fetchMock.mock.calls[1] ?? [])).toBe('1')
  })

  it('falls back to the first page when GitHub answers with a validation error', async () => {
    fetchMock
      .mockResolvedValueOnce(
        jsonResponse(
          { message: 'Only the first 1000 search results are available', status: '422' },
          422,
        ),
      )
      .mockResolvedValueOnce(jsonResponse(searchPayload([repository(7)])))

    const result = await fetchRandomRepository('Go', { signal: SIGNAL, excludeId: null })

    expect(result?.id).toBe(7)
    expect(fetchMock).toHaveBeenCalledTimes(2)
  })

  it('reports the rate limit with the time to wait', async () => {
    const reset = Math.floor(Date.now() / 1000) + 120
    fetchMock.mockResolvedValue(
      jsonResponse({ message: 'API rate limit exceeded' }, 403, {
        'x-ratelimit-remaining': '0',
        'x-ratelimit-reset': String(reset),
      }),
    )

    const attempt = fetchRandomRepository('Go', { signal: SIGNAL, excludeId: null })

    await expect(attempt).rejects.toBeInstanceOf(GitHubApiError)
    await expect(attempt).rejects.toMatchObject({ kind: 'rate-limit', status: 403 })
    await expect(attempt).rejects.toThrow(/rate limit has been reached/i)
  })

  it('maps transport failures to a network error', async () => {
    fetchMock.mockRejectedValue(new TypeError('Failed to fetch'))

    const attempt = fetchRandomRepository('Go', { signal: SIGNAL, excludeId: null })

    await expect(attempt).rejects.toMatchObject({ kind: 'network' })
    await expect(attempt).rejects.toThrow(/could not reach github/i)
  })

  it('surfaces unexpected server errors', async () => {
    fetchMock.mockResolvedValue(jsonResponse({ message: 'Server Error' }, 500))

    const attempt = fetchRandomRepository('Go', { signal: SIGNAL, excludeId: null })

    await expect(attempt).rejects.toMatchObject({ kind: 'http', status: 500 })
    await expect(attempt).rejects.toThrow(/500/)
  })

  it('propagates abort errors so stale requests can be discarded', async () => {
    fetchMock.mockRejectedValue(new DOMException('Aborted', 'AbortError'))

    const attempt = fetchRandomRepository('Go', { signal: SIGNAL, excludeId: null })

    await expect(attempt).rejects.toSatisfy(isAbortError)
  })
})
