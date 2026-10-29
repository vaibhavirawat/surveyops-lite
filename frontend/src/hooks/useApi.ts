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
//
// "key" describes what is being fetched. When it changes (for example the user typed a new search),
// the data is fetched again. The previous data stays visible while the new data loads, so the page does not flash empty.
export function useApi<T>(fetcher: () => Promise<T>, key = '') {
  const [state, setState] = useState<ApiState<T>>({ data: null, loading: true, error: null })
  const [attempt, setAttempt] = useState(0)

  useEffect(() => {
    let cancelled = false // ignore a late answer if a newer request has started or the component left the screen
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
    // "attempt" and "key" are the triggers; the fetcher is recreated on every render, so it is left out on purpose.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [attempt, key])

  const reload = useCallback(() => setAttempt((count) => count + 1), [])
  return { ...state, reload }
}
