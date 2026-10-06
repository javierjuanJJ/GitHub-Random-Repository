import { useCallback, useEffect, useRef, useState } from 'react'
import {
  GitHubApiError,
  fetchRandomRepository,
  isAbortError,
} from '../api/githubSearch'
import type { FetchState, RequestErrorKind } from '../types/github'

const UNKNOWN_MESSAGE = 'Something went wrong while fetching a repository.'

function toMessage(error: unknown): string {
  if (error instanceof Error && error.message.length > 0) return error.message
  return UNKNOWN_MESSAGE
}

function toKind(error: unknown): RequestErrorKind {
  return error instanceof GitHubApiError ? error.kind : 'unknown'
}

export interface RandomRepositoryController {
  state: FetchState
  isLoading: boolean
  fetchRepository: (language: string) => void
}

export function useRandomRepository(): RandomRepositoryController {
  const [state, setState] = useState<FetchState>({ status: 'idle' })
  const requestIdRef = useRef(0)
  const controllerRef = useRef<AbortController | null>(null)
  const previousIdRef = useRef<number | null>(null)

  const fetchRepository = useCallback((language: string) => {
    controllerRef.current?.abort()
    const controller = new AbortController()
    controllerRef.current = controller

    const requestId = requestIdRef.current + 1
    requestIdRef.current = requestId

    setState({ status: 'loading', language })

    void (async () => {
      try {
        const repository = await fetchRandomRepository(language, {
          signal: controller.signal,
          excludeId: previousIdRef.current,
        })

        if (requestId !== requestIdRef.current) return

        if (repository === null) {
          setState({ status: 'empty', language })
          return
        }

        previousIdRef.current = repository.id
        setState({ status: 'success', repository })
      } catch (error) {
        if (requestId !== requestIdRef.current || isAbortError(error)) return
        setState({ status: 'error', message: toMessage(error), kind: toKind(error) })
      }
    })()
  }, [])

  useEffect(() => {
    return () => {
      controllerRef.current?.abort()
    }
  }, [])

  return {
    state,
    isLoading: state.status === 'loading',
    fetchRepository,
  }
}
