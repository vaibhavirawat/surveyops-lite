import { CheckCircle2, Hourglass, MapPinned, Circle } from 'lucide-react'
import { Bar, BarChart, Cell, ResponsiveContainer, Tooltip, XAxis, YAxis } from 'recharts'
import { getDashboardStats } from '../api/dashboard'
import { ErrorState } from '../components/ErrorState'
import { PageHeader } from '../components/PageHeader'
import { Skeleton } from '../components/Skeleton'
import { StageBadge } from '../components/StageBadge'
import { StatCard } from '../components/StatCard'
import { useApi } from '../hooks/useApi'
import { timeAgo } from '../lib/format'
import { STAGE_META } from '../lib/stages'
import type { DashboardStats } from '../types'

export function DashboardPage() {
  const { data, loading, error, reload } = useApi(getDashboardStats)

  return (
    <>
      <PageHeader title="Dashboard" subtitle="Progress of village boundary digitization across all tehsils" />
      {error ? (
        <ErrorState message={error} onRetry={reload} />
      ) : loading || !data ? (
        <DashboardSkeleton />
      ) : (
        <DashboardContent stats={data} />
      )}
    </>
  )
}

function DashboardContent({ stats }: { stats: DashboardStats }) {
  const { totals, byStage, byTehsil, recentlyUpdated } = stats

  // Recharts wants plain objects with the label and colour already attached.
  const chartData = byStage.map(({ stage, count }) => ({
    name: STAGE_META[stage].label,
    count,
    color: STAGE_META[stage].color,
  }))
  const chartSummary = chartData.map((row) => `${row.name}: ${row.count}`).join(', ')

  return (
    <div className="space-y-6">
      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <StatCard label="Total villages" value={totals.villages} icon={MapPinned} iconClass="bg-teal-50 text-teal-700" />
        <StatCard label="Not started" value={totals.notStarted} icon={Circle} iconClass="bg-slate-100 text-slate-600" />
        <StatCard label="In progress" value={totals.inProgress} icon={Hourglass} iconClass="bg-amber-50 text-amber-700" />
        <StatCard
          label="Completed"
          value={totals.completed}
          hint={`${totals.completionPercent}% of all villages`}
          icon={CheckCircle2}
          iconClass="bg-emerald-50 text-emerald-700"
        />
      </div>

      <div className="grid gap-6 lg:grid-cols-5">
        <section className="rounded-xl border border-slate-200 bg-white p-5 lg:col-span-3">
          <h2 className="font-semibold text-slate-900">Villages by stage</h2>
          <p className="text-sm text-slate-500">Where each village is in the five-step workflow</p>
          <div className="mt-4 h-72" role="img" aria-label={`Bar chart of villages by stage. ${chartSummary}`}>
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={chartData} layout="vertical" margin={{ left: 8, right: 16 }}>
                <XAxis type="number" allowDecimals={false} tick={{ fontSize: 12, fill: '#64748b' }} axisLine={false} tickLine={false} />
                <YAxis type="category" dataKey="name" width={120} tick={{ fontSize: 12, fill: '#334155' }} axisLine={false} tickLine={false} />
                <Tooltip cursor={{ fill: '#f1f5f9' }} formatter={(value) => [value, 'Villages']} />
                <Bar dataKey="count" radius={[0, 6, 6, 0]} barSize={22}>
                  {chartData.map((row) => (
                    <Cell key={row.name} fill={row.color} />
                  ))}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          </div>
        </section>

        <section className="rounded-xl border border-slate-200 bg-white p-5 lg:col-span-2">
          <h2 className="font-semibold text-slate-900">Progress by tehsil</h2>
          <p className="text-sm text-slate-500">Villages merged into the tehsil boundary</p>
          <ul className="mt-4 space-y-4">
            {byTehsil.map((tehsil) => {
              const percent = tehsil.total === 0 ? 0 : Math.round((tehsil.completed / tehsil.total) * 100)
              return (
                <li key={tehsil.tehsil}>
                  <div className="flex items-baseline justify-between text-sm">
                    <span className="font-medium text-slate-800">{tehsil.tehsil}</span>
                    <span className="text-slate-500">
                      {tehsil.completed} of {tehsil.total}
                    </span>
                  </div>
                  <div
                    className="mt-1.5 h-2 overflow-hidden rounded-full bg-slate-100"
                    role="progressbar"
                    aria-label={`${tehsil.tehsil} progress`}
                    aria-valuenow={percent}
                    aria-valuemin={0}
                    aria-valuemax={100}
                  >
                    <div className="h-full rounded-full bg-teal-600" style={{ width: `${percent}%` }} />
                  </div>
                </li>
              )
            })}
          </ul>
        </section>
      </div>

      <section className="rounded-xl border border-slate-200 bg-white">
        <div className="p-5 pb-3">
          <h2 className="font-semibold text-slate-900">Recently updated</h2>
          <p className="text-sm text-slate-500">The five villages changed most recently</p>
        </div>
        {recentlyUpdated.length === 0 ? (
          <p className="px-5 pb-8 pt-4 text-center text-sm text-slate-500">No villages yet.</p>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-sm">
              <thead className="border-y border-slate-200 bg-slate-50 text-xs uppercase tracking-wide text-slate-500">
                <tr>
                  <th scope="col" className="px-5 py-2.5 font-medium">Code</th>
                  <th scope="col" className="px-5 py-2.5 font-medium">Village</th>
                  <th scope="col" className="hidden px-5 py-2.5 font-medium sm:table-cell">Tehsil</th>
                  <th scope="col" className="px-5 py-2.5 font-medium">Stage</th>
                  <th scope="col" className="px-5 py-2.5 text-right font-medium">Updated</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {recentlyUpdated.map((village) => (
                  <tr key={village.id}>
                    <td className="whitespace-nowrap px-5 py-3 font-mono text-xs text-slate-500">{village.code}</td>
                    <td className="px-5 py-3 font-medium text-slate-900">{village.name}</td>
                    <td className="hidden px-5 py-3 text-slate-600 sm:table-cell">{village.tehsil}</td>
                    <td className="px-5 py-3">
                      <StageBadge stage={village.stage} />
                    </td>
                    <td className="whitespace-nowrap px-5 py-3 text-right text-slate-500">{timeAgo(village.updatedAt)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </section>
    </div>
  )
}

function DashboardSkeleton() {
  return (
    <div className="space-y-6" aria-busy="true" aria-label="Loading dashboard">
      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        {[0, 1, 2, 3].map((i) => (
          <Skeleton key={i} className="h-28" />
        ))}
      </div>
      <div className="grid gap-6 lg:grid-cols-5">
        <Skeleton className="h-96 lg:col-span-3" />
        <Skeleton className="h-96 lg:col-span-2" />
      </div>
      <Skeleton className="h-64" />
    </div>
  )
}
