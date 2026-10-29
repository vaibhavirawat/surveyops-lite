import axios from 'axios'

// Turns any thrown error into a sentence a person can read.
// Our API always replies with { error: { code, message, details? } }, so prefer what it says.
export function getErrorMessage(error: unknown): string {
  if (axios.isAxiosError(error)) {
    // No response at all, or a gateway/proxy error (502, 503, 504): the backend is down or unreachable.
    const status = error.response?.status
    if (!error.response || status === 502 || status === 503 || status === 504) {
      return 'Cannot reach the API. Is the backend running?'
    }

    const apiError = error.response.data?.error
    if (apiError) {
      // Validation errors list each problem; show them instead of the generic "Invalid request".
      const details = apiError.details as { field: string; message: string }[] | undefined
      if (details?.length) {
        return details.map((d) => (d.field ? `${d.field}: ${d.message}` : d.message)).join('. ')
      }
      if (typeof apiError.message === 'string') return apiError.message
    }
  }
  return error instanceof Error ? error.message : 'Something went wrong'
}
