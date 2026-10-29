import type { LucideIcon } from 'lucide-react'

interface StatCardProps {
  label: string
  value: number | string
  hint?: string
  icon: LucideIcon
  iconClass: string // Tailwind colour classes for the icon tile
}

export function StatCard({ label, value, hint, icon: Icon, iconClass }: StatCardProps) {
  return (
    <div className="rounded-xl border border-slate-200 bg-white p-5">
      <div className="flex items-start justify-between">
        <p className="text-sm font-medium text-slate-500">{label}</p>
        <span className={`flex size-9 items-center justify-center rounded-lg ${iconClass}`}>
          <Icon className="size-5" aria-hidden="true" />
        </span>
      </div>
      <p className="mt-3 text-3xl font-semibold tracking-tight text-slate-900">{value}</p>
      {hint && <p className="mt-1 text-sm text-slate-500">{hint}</p>}
    </div>
  )
}
