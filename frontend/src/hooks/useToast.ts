import { createContext, useContext } from 'react'

export const ToastContext = createContext<{ show: (message: string) => void }>({ show: () => {} })

// Any component can call useToast().show("Saved") to show a short success message.
export function useToast() {
  return useContext(ToastContext)
}
