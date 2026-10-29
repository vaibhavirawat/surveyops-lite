import { useState, type FormEvent } from 'react'
import { changeStage } from '../api/villages'
import { getErrorMessage } from '../lib/errors'
import { STAGE_META } from '../lib/stages'
import { STAGES, type Stage, type Village } from '../types'
import { useToast } from '../hooks/useToast'

// The workflow rules, as the user sees them:
//   forward: only the next stage          backward: any earlier stage, with a note explaining the rework
// The server enforces these too. The form just avoids offering moves that would be rejected.
export function MoveStageForm({ village, onMoved }: { village: Village; onMoved: () => void }) {
  const toast = useToast()
  const currentIndex = STAGES.indexOf(village.stage)
  const next = STAGES[currentIndex + 1] as Stage | undefined
  const earlier = STAGES.slice(0, currentIndex).reverse()
  const options = next ? [next, ...earlier] : earlier

  const [toStage, setToStage] = useState<Stage>(options[0])
  const [note, setNote] = useState('')
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const isBackward = STAGES.indexOf(toStage) < currentIndex

  async function handleSubmit(event: FormEvent) {
    event.preventDefault()
    if (isBackward && note.trim() === '') {
      setError('Add a note explaining why this village is going back.')
      return
    }
    setSaving(true)
    setError(null)
    try {
      await changeStage(village.id, { toStage, note: note.trim() || undefined })
      toast.show(`${village.code} moved to ${STAGE_META[toStage].label}`)
      onMoved()
    } catch (caught) {
      setError(getErrorMessage(caught))
    } finally {
      setSaving(false)
    }
  }

  if (options.length === 0) return null

  return (
    <form onSubmit={handleSubmit} className="space-y-3">
      <div>
        <label htmlFor="move-stage" className="text-sm font-medium text-slate-700">
          Move to
        </label>
        <select
          id="move-stage"
          value={toStage}
          onChange={(e) => {
            setToStage(e.target.value as Stage)
            setError(null)
          }}
          className="mt-1 block w-full rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm focus:border-teal-600 focus:outline-2 focus:outline-teal-600/30"
        >
          {options.map((stage) => (
            <option key={stage} value={stage}>
              {STAGE_META[stage].label} {STAGES.indexOf(stage) > currentIndex ? '(next step)' : '(send back)'}
            </option>
          ))}
        </select>
      </div>

      <div>
        <label htmlFor="move-note" className="text-sm font-medium text-slate-700">
          Note{' '}
          <span className="font-normal text-slate-400">{isBackward ? 'required when sending back' : 'optional'}</span>
        </label>
        <textarea
          id="move-note"
          rows={3}
          maxLength={1000}
          value={note}
          onChange={(e) => setNote(e.target.value)}
          placeholder={isBackward ? 'Why does this need rework?' : 'Anything the next person should know'}
          className="mt-1 block w-full rounded-lg border border-slate-300 px-3 py-2 text-sm placeholder:text-slate-400 focus:border-teal-600 focus:outline-2 focus:outline-teal-600/30"
        />
      </div>

      {error && (
        <p role="alert" className="rounded-lg bg-red-50 px-3 py-2 text-sm text-red-700">
          {error}
        </p>
      )}

      <button type="submit" disabled={saving} className="w-full rounded-lg bg-teal-700 px-4 py-2 text-sm font-medium text-white hover:bg-teal-800 disabled:opacity-60">
        {saving ? 'Moving…' : 'Move village'}
      </button>
    </form>
  )
}
