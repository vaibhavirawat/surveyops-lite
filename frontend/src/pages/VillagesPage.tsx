import { ArrowDownAZ, ArrowUpAZ, Plus, Search, SearchX } from 'lucide-react'
import { useEffect, useRef, useState } from 'react'
import { useSearchParams } from 'react-router-dom'
import { getFilterOptions, listVillages } from '../api/villages'
import { Dialog } from '../components/Dialog'
import { ErrorState } from '../components/ErrorState'
import { PageHeader } from '../components/PageHeader'
import { Pagination } from '../components/Pagination'
import { Skeleton } from '../components/Skeleton'
import { StageBadge } from '../components/StageBadge'
import { VillageDetailPanel } from '../components/VillageDetailPanel'
import { VillageForm } from '../components/VillageForm'
import { useApi } from '../hooks/useApi'
import { useToast } from '../hooks/useToast'
import { timeAgo } from '../lib/format'
import { STAGE_META } from '../lib/stages'
import { STAGES, type SortField, type Stage } from '../types'

const PAGE_SIZE = 10
const SORT_OPTIONS: { value: SortField; label: string }[] = [
  { value: 'updated_at', label: 'Last updated' },
  { value: 'name', label: 'Name' },
  { value: 'code', label: 'Code' },
  { value: 'stage', label: 'Stage' },
]

const selectClass =
  'rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm text-slate-900 focus:border-teal-600 focus:outline-2 focus:outline-teal-600/30'

export function VillagesPage() {
  // The URL holds the page's state: /villages?search=amra&stage=georeferenced&page=2&village=7
  // That makes a filtered view shareable and makes the browser's Back button behave.
  const [params, setParams] = useSearchParams()
  const toast = useToast()

  const search = params.get('search') ?? ''
  const tehsil = params.get('tehsil') ?? ''
  const stage = STAGES.find((s) => s === params.get('stage')) as Stage | undefined
  const sort = SORT_OPTIONS.find((o) => o.value === params.get('sort'))?.value ?? 'updated_at'
  const order = params.get('order') === 'asc' ? 'asc' : 'desc'
  const page = Math.max(1, Number(params.get('page')) || 1)
  const selectedId = Number(params.get('village')) || null

  const [searchText, setSearchText] = useState(search) // what is typed; the URL updates after a short pause
  const [formOpen, setFormOpen] = useState(false)
  const [version, setVersion] = useState(0) // bump to force the list to reload after a change

  // A timer can fire after the page has re-rendered, holding an out-of-date copy of "params".
  // Always building the new URL from this ref (the latest URL) prevents old values being written back.
  const latestParams = useRef(params)
  useEffect(() => {
    latestParams.current = params
  }, [params])

  function update(changes: Record<string, string | null>, options: { keepPage?: boolean; replace?: boolean } = {}) {
    const next = new URLSearchParams(latestParams.current)
    for (const [key, value] of Object.entries(changes)) {
      if (value) next.set(key, value)
      else next.delete(key)
    }
    if (!options.keepPage) next.delete('page') // a new filter always starts from page 1
    latestParams.current = next // so two updates in a row build on each other
    setParams(next, { replace: options.replace ?? true })
  }

  // Wait 300 ms after the last keystroke before searching, so we do not call the API on every letter.
  const searchTimer = useRef<ReturnType<typeof setTimeout>>(undefined)
  function handleSearchInput(text: string) {
    setSearchText(text)
    clearTimeout(searchTimer.current)
    searchTimer.current = setTimeout(() => update({ search: text.trim() || null }), 300)
  }

  const options = useApi(getFilterOptions, String(version))
  const tehsils = options.data?.tehsils ?? []
  const districts = options.data?.districts ?? []

  const listKey = JSON.stringify([search, tehsil, stage, sort, order, page, version])
  const { data, loading, error, reload } = useApi(
    () =>
      listVillages({ search: search || undefined, tehsil: tehsil || undefined, stage, sort, order, page, pageSize: PAGE_SIZE }),
    listKey,
  )

  // If the last village on the last page was deleted, step back to the new last page.
  useEffect(() => {
    if (data && data.data.length === 0 && page > 1) {
      update({ page: String(Math.max(1, data.meta.totalPages)) }, { keepPage: true })
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [data])

  const filtersActive = Boolean(search || tehsil || stage)
  const refreshList = () => setVersion((v) => v + 1)

  function clearFilters() {
    clearTimeout(searchTimer.current) // forget any search that was still waiting to be applied
    setSearchText('')
    update({ search: null, tehsil: null, stage: null })
  }

  return (
    <>
      <PageHeader
        title="Villages"
        subtitle="Search, filter and track every village through the digitization workflow"
        action={
          <button type="button" onClick={() => setFormOpen(true)} className="inline-flex items-center gap-1.5 rounded-lg bg-teal-700 px-4 py-2 text-sm font-medium text-white hover:bg-teal-800">
            <Plus className="size-4" aria-hidden="true" />
            Add village
          </button>
        }
      />

      <section className="rounded-xl border border-slate-200 bg-white">
        <div className="flex flex-wrap items-center gap-3 p-4">
          <div className="relative min-w-52 flex-1">
            <Search className="pointer-events-none absolute left-3 top-1/2 size-4 -translate-y-1/2 text-slate-400" aria-hidden="true" />
            <input
              type="search"
              aria-label="Search by village name or code"
              placeholder="Search by name or code"
              value={searchText}
              onChange={(e) => handleSearchInput(e.target.value)}
              className="w-full rounded-lg border border-slate-300 py-2 pl-9 pr-3 text-sm placeholder:text-slate-400 focus:border-teal-600 focus:outline-2 focus:outline-teal-600/30"
            />
          </div>
          <select aria-label="Filter by tehsil" value={tehsil} onChange={(e) => update({ tehsil: e.target.value || null })} className={selectClass}>
            <option value="">All tehsils</option>
            {tehsils.map((name) => (
              <option key={name} value={name}>{name}</option>
            ))}
          </select>
          <select aria-label="Filter by stage" value={stage ?? ''} onChange={(e) => update({ stage: e.target.value || null })} className={selectClass}>
            <option value="">All stages</option>
            {STAGES.map((s) => (
              <option key={s} value={s}>{STAGE_META[s].label}</option>
            ))}
          </select>
          <div className="flex items-center gap-1">
            <select aria-label="Sort by" value={sort} onChange={(e) => update({ sort: e.target.value === 'updated_at' ? null : e.target.value })} className={selectClass}>
              {SORT_OPTIONS.map((o) => (
                <option key={o.value} value={o.value}>Sort: {o.label}</option>
              ))}
            </select>
            <button
              type="button"
              onClick={() => update({ order: order === 'asc' ? null : 'asc' })}
              aria-label={order === 'asc' ? 'Ascending order. Switch to descending' : 'Descending order. Switch to ascending'}
              className="rounded-lg border border-slate-300 p-2 text-slate-600 hover:bg-slate-50"
            >
              {order === 'asc' ? <ArrowUpAZ className="size-4" /> : <ArrowDownAZ className="size-4" />}
            </button>
          </div>
          {filtersActive && (
            <button type="button" onClick={clearFilters} className="text-sm font-medium text-teal-700 hover:underline">
              Clear filters
            </button>
          )}
        </div>

        {error ? (
          <div className="p-5 pt-0">
            <ErrorState message={error} onRetry={reload} />
          </div>
        ) : !data ? (
          <TableSkeleton />
        ) : data.data.length === 0 ? (
          <EmptyState filtersActive={filtersActive} onClear={clearFilters} onAdd={() => setFormOpen(true)} />
        ) : (
          <>
            <div className={`overflow-x-auto transition-opacity ${loading ? 'opacity-60' : ''}`}>
              <table className="w-full text-left text-sm">
                <thead className="border-y border-slate-200 bg-slate-50 text-xs uppercase tracking-wide text-slate-500">
                  <tr>
                    <th scope="col" className="hidden px-5 py-2.5 font-medium sm:table-cell">Code</th>
                    <th scope="col" className="px-5 py-2.5 font-medium">Village</th>
                    <th scope="col" className="hidden px-5 py-2.5 font-medium md:table-cell">Tehsil</th>
                    <th scope="col" className="hidden px-5 py-2.5 text-right font-medium lg:table-cell">Area</th>
                    <th scope="col" className="px-5 py-2.5 font-medium">Stage</th>
                    <th scope="col" className="hidden px-5 py-2.5 text-right font-medium sm:table-cell">Updated</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {data.data.map((village) => (
                    <tr
                      key={village.id}
                      onClick={() => update({ village: String(village.id) }, { keepPage: true, replace: false })}
                      className={`cursor-pointer hover:bg-slate-50 ${village.id === selectedId ? 'bg-teal-50/50' : ''}`}
                    >
                      <td className="hidden whitespace-nowrap px-5 py-3 font-mono text-xs text-slate-500 sm:table-cell">{village.code}</td>
                      <td className="px-5 py-3">
                        {/* A real button inside the row, so keyboard users can open the panel too */}
                        <button
                          type="button"
                          onClick={(e) => {
                            e.stopPropagation()
                            update({ village: String(village.id) }, { keepPage: true, replace: false })
                          }}
                          className="text-left font-medium text-slate-900 hover:text-teal-700 hover:underline"
                        >
                          {village.name}
                        </button>
                        <p className="text-xs text-slate-500 md:hidden">
                          <span className="font-mono sm:hidden">{village.code} · </span>
                          {village.tehsil}
                        </p>
                      </td>
                      <td className="hidden px-5 py-3 text-slate-600 md:table-cell">{village.tehsil}</td>
                      <td className="hidden whitespace-nowrap px-5 py-3 text-right text-slate-600 lg:table-cell">
                        {village.areaSqKm === null ? '—' : `${village.areaSqKm} km²`}
                      </td>
                      <td className="px-3 py-3 sm:px-5"><StageBadge stage={village.stage} /></td>
                      <td className="hidden whitespace-nowrap px-5 py-3 text-right text-slate-500 sm:table-cell">{timeAgo(village.updatedAt)}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
            <Pagination meta={data.meta} onPage={(p) => update({ page: String(p) }, { keepPage: true })} />
          </>
        )}
      </section>

      <Dialog open={formOpen} onClose={() => setFormOpen(false)} title="Add village">
        <VillageForm
          tehsils={tehsils}
          districts={districts}
          onCancel={() => setFormOpen(false)}
          onSaved={(village) => {
            setFormOpen(false)
            toast.show(`Created ${village.code}`)
            refreshList()
            update({ village: String(village.id) }, { keepPage: true, replace: false }) // open the new village
          }}
        />
      </Dialog>

      <VillageDetailPanel
        villageId={selectedId}
        tehsils={tehsils}
        districts={districts}
        onClose={() => update({ village: null }, { keepPage: true, replace: false })}
        onChanged={refreshList}
      />
    </>
  )
}

function TableSkeleton() {
  return (
    <div className="space-y-2 p-4 pt-0" aria-busy="true" aria-label="Loading villages">
      {Array.from({ length: 6 }, (_, i) => (
        <Skeleton key={i} className="h-12" />
      ))}
    </div>
  )
}

function EmptyState({ filtersActive, onClear, onAdd }: { filtersActive: boolean; onClear: () => void; onAdd: () => void }) {
  return (
    <div className="border-t border-slate-200 px-5 py-14 text-center">
      <SearchX className="mx-auto size-8 text-slate-400" aria-hidden="true" />
      <p className="mt-3 font-medium text-slate-900">{filtersActive ? 'No villages match these filters' : 'No villages yet'}</p>
      <p className="mt-1 text-sm text-slate-500">
        {filtersActive ? 'Try a different search or clear the filters.' : 'Add the first village to start tracking.'}
      </p>
      <button type="button" onClick={filtersActive ? onClear : onAdd} className="mt-4 rounded-lg border border-slate-300 px-4 py-2 text-sm font-medium text-slate-700 hover:bg-slate-50">
        {filtersActive ? 'Clear filters' : 'Add village'}
      </button>
    </div>
  )
}
