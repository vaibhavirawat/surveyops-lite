import { X } from 'lucide-react'
import { useEffect, useId, useRef, type ReactNode } from 'react'

interface DialogProps {
  open: boolean
  onClose: () => void
  title: string
  variant?: 'center' | 'side'
  children: ReactNode
}

// Uses the browser's built-in <dialog> element. showModal() gives us, for free:
// a dimmed backdrop, keyboard focus kept inside the dialog, and the Esc key to close it.
export function Dialog({ open, onClose, title, variant = 'center', children }: DialogProps) {
  const ref = useRef<HTMLDialogElement>(null)
  const titleId = useId()

  useEffect(() => {
    const dialog = ref.current
    if (!dialog) return
    if (open && !dialog.open) dialog.showModal()
    if (!open && dialog.open) dialog.close()
  }, [open])

  const shape =
    variant === 'side'
      ? 'ml-auto mr-0 my-0 h-dvh max-h-none w-full max-w-md rounded-none'
      : 'm-auto w-full max-w-lg rounded-xl'

  return (
    <dialog
      ref={ref}
      aria-labelledby={titleId}
      // The "close" event also fires when WE close it because open became false; only react when it was the user.
      onClose={() => open && onClose()}
      // A click on the dimmed backdrop is reported as a click on the <dialog> itself.
      onClick={(event) => event.target === ref.current && onClose()}
      className={`${shape} border-0 bg-white p-0 text-slate-900 shadow-xl backdrop:bg-slate-900/40`}
    >
      {/* Content is only rendered while open, so forms start fresh every time. */}
      {open && (
        <div className={`flex flex-col ${variant === 'side' ? 'h-full' : 'max-h-[90dvh]'}`}>
          <div className="flex items-center justify-between border-b border-slate-200 px-5 py-4">
            <h2 id={titleId} className="font-semibold text-slate-900">
              {title}
            </h2>
            <button
              type="button"
              onClick={onClose}
              className="rounded-lg p-1.5 text-slate-500 hover:bg-slate-100"
              aria-label="Close"
            >
              <X className="size-5" />
            </button>
          </div>
          <div className="flex-1 overflow-y-auto p-5">{children}</div>
        </div>
      )}
    </dialog>
  )
}
