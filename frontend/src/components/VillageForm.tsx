import { useState, type FormEvent } from 'react'
import { createVillage, updateVillage } from '../api/villages'
import { getErrorMessage } from '../lib/errors'
import type { Village } from '../types'

interface VillageFormProps {
  initial?: Village // present when editing, absent when creating
  tehsils: string[]
  districts: string[]
  onSaved: (village: Village) => void
  onCancel: () => void
}

const inputClass =
  'mt-1 block w-full rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm text-slate-900 placeholder:text-slate-400 focus:border-teal-600 focus:outline-2 focus:outline-offset-0 focus:outline-teal-600/30'

export function VillageForm({ initial, tehsils, districts, onSaved, onCancel }: VillageFormProps) {
  // Form fields are "controlled": React state is the single source of truth for what each input shows.
  const [name, setName] = useState(initial?.name ?? '')
  const [tehsil, setTehsil] = useState(initial?.tehsil ?? '')
  const [district, setDistrict] = useState(initial?.district ?? '')
  const [area, setArea] = useState(initial?.areaSqKm?.toString() ?? '')
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState<string | null>(null)

  async function handleSubmit(event: FormEvent) {
    event.preventDefault() // stop the browser from reloading the page
    setSaving(true)
    setError(null)
    try {
      const areaSqKm = area.trim() === '' ? null : Number(area)
      const input = { name: name.trim(), tehsil: tehsil.trim(), district: district.trim(), areaSqKm }
      const saved = initial ? await updateVillage(initial.id, input) : await createVillage(input)
      onSaved(saved)
    } catch (caught) {
      setError(getErrorMessage(caught))
    } finally {
      setSaving(false)
    }
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div>
        <label htmlFor="village-name" className="text-sm font-medium text-slate-700">
          Village name
        </label>
        <input id="village-name" required maxLength={100} value={name} onChange={(e) => setName(e.target.value)} className={inputClass} />
      </div>

      <div className="grid gap-4 sm:grid-cols-2">
        <div>
          <label htmlFor="village-tehsil" className="text-sm font-medium text-slate-700">
            Tehsil
          </label>
          {/* A datalist suggests existing names but still allows typing a new one. */}
          <input id="village-tehsil" required maxLength={100} list="tehsil-options" value={tehsil} onChange={(e) => setTehsil(e.target.value)} className={inputClass} />
          <datalist id="tehsil-options">
            {tehsils.map((option) => (
              <option key={option} value={option} />
            ))}
          </datalist>
        </div>
        <div>
          <label htmlFor="village-district" className="text-sm font-medium text-slate-700">
            District
          </label>
          <input id="village-district" required maxLength={100} list="district-options" value={district} onChange={(e) => setDistrict(e.target.value)} className={inputClass} />
          <datalist id="district-options">
            {districts.map((option) => (
              <option key={option} value={option} />
            ))}
          </datalist>
        </div>
      </div>

      <div>
        <label htmlFor="village-area" className="text-sm font-medium text-slate-700">
          Area (sq km) <span className="font-normal text-slate-400">optional</span>
        </label>
        <input id="village-area" type="number" min="0.01" step="0.01" value={area} onChange={(e) => setArea(e.target.value)} className={inputClass} />
      </div>

      {error && (
        <p role="alert" className="rounded-lg bg-red-50 px-3 py-2 text-sm text-red-700">
          {error}
        </p>
      )}

      <div className="flex justify-end gap-2 pt-2">
        <button type="button" onClick={onCancel} className="rounded-lg border border-slate-300 px-4 py-2 text-sm font-medium text-slate-700 hover:bg-slate-50">
          Cancel
        </button>
        <button type="submit" disabled={saving} className="rounded-lg bg-teal-700 px-4 py-2 text-sm font-medium text-white hover:bg-teal-800 disabled:opacity-60">
          {saving ? 'Saving…' : initial ? 'Save changes' : 'Create village'}
        </button>
      </div>
    </form>
  )
}
