import { Table2 } from 'lucide-react'
import { PageHeader } from '../components/PageHeader'

// Placeholder: the real table, filters and detail panel are built in Milestone 8.
export function VillagesPage() {
  return (
    <>
      <PageHeader title="Villages" subtitle="Search, filter and manage villages" />
      <div className="rounded-xl border border-dashed border-slate-300 bg-white p-12 text-center">
        <Table2 className="mx-auto size-8 text-slate-400" aria-hidden="true" />
        <p className="mt-3 font-medium text-slate-900">The villages table is coming next</p>
        <p className="mt-1 text-sm text-slate-500">The API behind it already works: see the API docs link above.</p>
      </div>
    </>
  )
}
