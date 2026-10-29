import { Pencil, Trash2 } from 'lucide-react'
import { useState } from 'react'
import { deleteVillage, getVillage } from '../api/villages'
import { useApi } from '../hooks/useApi'
import { useToast } from '../hooks/useToast'
import { getErrorMessage } from '../lib/errors'
import { timeAgo } from '../lib/format'
import { Dialog } from './Dialog'
import { ErrorState } from './ErrorState'
import { MoveStageForm } from './MoveStageForm'
import { Skeleton } from './Skeleton'
import { StageBadge } from './StageBadge'
import { VillageForm } from './VillageForm'

interface PanelProps {
  villageId: number | null
  tehsils: string[]
  districts: string[]
  onClose: () => void
  onChanged: () => void // tell the list to refresh
}

// The side panel. It is open whenever a village id is selected.
export function VillageDetailPanel({ villageId, tehsils, districts, onClose, onChanged }: PanelProps) {
  return (
    <Dialog open={villageId !== null} onClose={onClose} title="Village details" variant="side">
      {villageId !== null && (
        <PanelBody key={villageId} villageId={villageId} tehsils={tehsils} districts={districts} onClose={onClose} onChanged={onChanged} />
      )}
    </Dialog>
  )
}

function PanelBody({ villageId, tehsils, districts, onClose, onChanged }: PanelProps & { villageId: number }) {
  const toast = useToast()
  const { data: village, loading, error, reload } = useApi(() => getVillage(villageId), String(villageId))
  const [editing, setEditing] = useState(false)
  const [confirmingDelete, setConfirmingDelete] = useState(false)
  const [deleteError, setDeleteError] = useState<string | null>(null)
  const [deleting, setDeleting] = useState(false)

  function refresh() {
    reload()
    onChanged()
  }

  async function handleDelete() {
    setDeleting(true)
    setDeleteError(null)
    try {
      await deleteVillage(villageId)
      toast.show('Village deleted')
      onChanged()
      onClose()
    } catch (caught) {
      setDeleteError(getErrorMessage(caught))
      setDeleting(false)
    }
  }

  if (error) return <ErrorState message={error} onRetry={reload} />
  if (!village) {
    return (
      <div className="space-y-4" aria-busy="true" aria-label="Loading village">
        <Skeleton className="h-8 w-2/3" />
        <Skeleton className="h-32" />
        <Skeleton className="h-48" />
      </div>
    )
  }

  return (
    <div className={`space-y-6 ${loading ? 'opacity-70' : ''}`}>
      {editing ? (
        <section aria-label="Edit village">
          <h3 className="mb-3 font-semibold text-slate-900">Edit details</h3>
          <VillageForm
            initial={village}
            tehsils={tehsils}
            districts={districts}
            onCancel={() => setEditing(false)}
            onSaved={() => {
              setEditing(false)
              toast.show('Changes saved')
              refresh()
            }}
          />
        </section>
      ) : (
        <section>
          <p className="font-mono text-xs text-slate-500">{village.code}</p>
          <div className="mt-1 flex flex-wrap items-center gap-3">
            <h3 className="text-xl font-semibold text-slate-900">{village.name}</h3>
            <StageBadge stage={village.stage} />
          </div>

          <dl className="mt-4 grid grid-cols-2 gap-x-4 gap-y-3 text-sm">
            <Detail label="Tehsil" value={village.tehsil} />
            <Detail label="District" value={village.district} />
            <Detail label="Area" value={village.areaSqKm === null ? 'Not recorded' : `${village.areaSqKm} sq km`} />
            <Detail label="Last updated" value={timeAgo(village.updatedAt)} />
          </dl>

          <div className="mt-4 flex gap-2">
            <button type="button" onClick={() => setEditing(true)} className="inline-flex items-center gap-1.5 rounded-lg border border-slate-300 px-3 py-1.5 text-sm font-medium text-slate-700 hover:bg-slate-50">
              <Pencil className="size-4" aria-hidden="true" />
              Edit
            </button>
            <button type="button" onClick={() => setConfirmingDelete(true)} className="inline-flex items-center gap-1.5 rounded-lg border border-red-200 px-3 py-1.5 text-sm font-medium text-red-700 hover:bg-red-50">
              <Trash2 className="size-4" aria-hidden="true" />
              Delete
            </button>
          </div>

          {confirmingDelete && (
            <div role="alertdialog" aria-label="Confirm delete" className="mt-3 rounded-lg border border-red-200 bg-red-50 p-3 text-sm">
              <p className="text-red-900">
                Delete <strong>{village.name}</strong> and its {village.history.length} history{' '}
                {village.history.length === 1 ? 'entry' : 'entries'}? This cannot be undone.
              </p>
              {deleteError && <p role="alert" className="mt-2 text-red-700">{deleteError}</p>}
              <div className="mt-3 flex gap-2">
                <button type="button" disabled={deleting} onClick={handleDelete} className="rounded-lg bg-red-600 px-3 py-1.5 font-medium text-white hover:bg-red-700 disabled:opacity-60">
                  {deleting ? 'Deleting…' : 'Yes, delete'}
                </button>
                <button type="button" onClick={() => setConfirmingDelete(false)} className="rounded-lg border border-slate-300 bg-white px-3 py-1.5 font-medium text-slate-700 hover:bg-slate-50">
                  Cancel
                </button>
              </div>
            </div>
          )}
        </section>
      )}

      <section className="border-t border-slate-200 pt-5">
        <h3 className="font-semibold text-slate-900">Move to another stage</h3>
        <p className="mb-3 mt-1 text-sm text-slate-500">
          Villages move forward one stage at a time. Sending one back is allowed, with a note.
        </p>
        {/* key: when the stage changes, the form starts over with fresh options */}
        <MoveStageForm key={village.stage} village={village} onMoved={refresh} />
      </section>

      <section className="border-t border-slate-200 pt-5">
        <h3 className="font-semibold text-slate-900">History</h3>
        {village.history.length === 0 ? (
          <p className="mt-2 text-sm text-slate-500">No stage changes yet.</p>
        ) : (
          <ol className="mt-3 space-y-4 border-l border-slate-200 pl-4">
            {village.history.map((entry) => (
              <li key={entry.id} className="relative">
                <span className="absolute -left-[21px] top-1.5 size-2.5 rounded-full bg-teal-600 ring-4 ring-white" aria-hidden="true" />
                <div className="flex flex-wrap items-center gap-1.5">
                  <StageBadge stage={entry.fromStage} />
                  <span className="text-slate-400" aria-label="moved to">→</span>
                  <StageBadge stage={entry.toStage} />
                </div>
                {entry.note && <p className="mt-1.5 text-sm text-slate-700">“{entry.note}”</p>}
                <p className="mt-1 text-xs text-slate-500" title={new Date(entry.createdAt).toLocaleString()}>
                  {timeAgo(entry.createdAt)}
                </p>
              </li>
            ))}
          </ol>
        )}
      </section>
    </div>
  )
}

function Detail({ label, value }: { label: string; value: string }) {
  return (
    <div>
      <dt className="text-slate-500">{label}</dt>
      <dd className="font-medium text-slate-900">{value}</dd>
    </div>
  )
}
