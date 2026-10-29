import { CheckCircle2 } from 'lucide-react'
import { useCallback, useEffect, useRef, useState, type ReactNode } from 'react'
import { ToastContext } from '../hooks/useToast'

interface ToastItem {
  id: number
  message: string
}

export function ToastProvider({ children }: { children: ReactNode }) {
  const [toasts, setToasts] = useState<ToastItem[]>([])
  const nextId = useRef(1)
  const container = useRef<HTMLDivElement>(null)

  const show = useCallback((message: string) => {
    const id = nextId.current++
    setToasts((current) => [...current, { id, message }])
    setTimeout(() => setToasts((current) => current.filter((toast) => toast.id !== id)), 3500)
  }, [])

  // The container is a "popover", which the browser draws in the top layer, above even an open dialog.
  // Without this, a toast shown while the side panel is open would be hidden behind the dimmed backdrop.
  useEffect(() => {
    const element = container.current
    if (!element) return
    if (toasts.length > 0) element.showPopover()
    else if (element.matches(':popover-open')) element.hidePopover()
  }, [toasts])

  return (
    <ToastContext.Provider value={{ show }}>
      {children}
      <div
        ref={container}
        popover="manual"
        role="status"
        aria-live="polite"
        className="fixed inset-auto bottom-4 right-4 m-0 flex flex-col gap-2 overflow-visible border-0 bg-transparent p-0"
      >
        {toasts.map((toast) => (
          <div
            key={toast.id}
            className="flex items-center gap-2 rounded-lg bg-slate-900 px-4 py-3 text-sm text-white shadow-lg"
          >
            <CheckCircle2 className="size-4 text-emerald-400" aria-hidden="true" />
            {toast.message}
          </div>
        ))}
      </div>
    </ToastContext.Provider>
  )
}
