import { ChevronLeft, ChevronRight } from 'lucide-react'
import type { PageMeta } from '../types'

export function Pagination({ meta, onPage }: { meta: PageMeta; onPage: (page: number) => void }) {
  const first = meta.total === 0 ? 0 : (meta.page - 1) * meta.pageSize + 1
  const last = Math.min(meta.page * meta.pageSize, meta.total)
  const buttonClass =
    'inline-flex items-center gap-1 rounded-lg border border-slate-200 px-3 py-1.5 text-sm font-medium text-slate-700 hover:bg-slate-50 disabled:cursor-not-allowed disabled:opacity-40 disabled:hover:bg-white'

  return (
    <nav aria-label="Pagination" className="flex flex-wrap items-center justify-between gap-3 border-t border-slate-200 px-5 py-3">
      <p className="text-sm text-slate-500">
        Showing <span className="font-medium text-slate-900">{first}</span> to{' '}
        <span className="font-medium text-slate-900">{last}</span> of{' '}
        <span className="font-medium text-slate-900">{meta.total}</span>
      </p>
      <div className="flex items-center gap-2">
        <span className="text-sm text-slate-500">
          Page {meta.page} of {Math.max(meta.totalPages, 1)}
        </span>
        <button type="button" className={buttonClass} disabled={meta.page <= 1} onClick={() => onPage(meta.page - 1)}>
          <ChevronLeft className="size-4" aria-hidden="true" />
          Previous
        </button>
        <button
          type="button"
          className={buttonClass}
          disabled={meta.page >= meta.totalPages}
          onClick={() => onPage(meta.page + 1)}
        >
          Next
          <ChevronRight className="size-4" aria-hidden="true" />
        </button>
      </div>
    </nav>
  )
}
