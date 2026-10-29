import axios from 'axios'

// Turns any thrown error into a sentence a person can read.
// Our API always replies with { error: { code, message } }, so prefer that message when it exists.
export function getErrorMessage(error: unknown): string {
  if (axios.isAxiosError(error)) {
    const apiMessage = error.response?.data?.error?.message
    if (typeof apiMessage === 'string') return apiMessage
    // No response at all, or a gateway/proxy error (502, 503, 504): the backend is down or unreachable.
    const status = error.response?.status
    if (!error.response || status === 502 || status === 503 || status === 504) {
      return 'Cannot reach the API. Is the backend running?'
    }
  }
  return error instanceof Error ? error.message : 'Something went wrong'
}
