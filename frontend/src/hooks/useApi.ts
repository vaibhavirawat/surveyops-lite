import { useCallback, useEffect, useState } from 'react'
import { getErrorMessage } from '../lib/errors'

interface ApiState<T> {
  data: T | null
  loading: boolean
  error: string | null
}

// A React hook is a function that lets a component use state and side effects.
// This one runs an async fetcher when the component appears and tracks its three possible situations:
// still loading, finished with data, or failed with an error. Calling reload() runs it again.
export function useApi<T>(fetcher: () => Promise<T>) {
  const [state, setState] = useState<ApiState<T>>({ data: null, loading: true, error: null })
  const [attempt, setAttempt] = useState(0)

  useEffect(() => {
    let cancelled = false // ignore the result if the component left the screen meanwhile
    setState((previous) => ({ ...previous, loading: true, error: null }))
    fetcher()
      .then((data) => {
        if (!cancelled) setState({ data, loading: false, error: null })
      })
      .catch((error: unknown) => {
        if (!cancelled) setState({ data: null, loading: false, error: getErrorMessage(error) })
      })
    return () => {
      cancelled = true
    }
    // "attempt" is the trigger: changing it re-runs the fetch. The fetcher itself is a stable module-level function.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [attempt])

  const reload = useCallback(() => setAttempt((count) => count + 1), [])
  return { ...state, reload }
}
