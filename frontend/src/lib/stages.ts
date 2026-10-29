import type { Stage } from '../types'

// One place that defines how each stage looks, so badges and charts always agree.
// Tailwind only generates classes it can find as complete strings in the source, so they are written out in full here.
export const STAGE_META: Record<Stage, { label: string; badge: string; color: string }> = {
  not_started: { label: 'Not started', badge: 'bg-slate-100 text-slate-700 ring-slate-200', color: '#94a3b8' },
  georeferenced: { label: 'Georeferenced', badge: 'bg-sky-50 text-sky-700 ring-sky-200', color: '#38bdf8' },
  parcels_matched: { label: 'Parcels matched', badge: 'bg-indigo-50 text-indigo-700 ring-indigo-200', color: '#818cf8' },
  boundary_digitized: { label: 'Boundary digitized', badge: 'bg-amber-50 text-amber-800 ring-amber-200', color: '#fbbf24' },
  stored_in_geodatabase: { label: 'In geodatabase', badge: 'bg-violet-50 text-violet-700 ring-violet-200', color: '#a78bfa' },
  tehsil_merged: { label: 'Tehsil merged', badge: 'bg-emerald-50 text-emerald-700 ring-emerald-200', color: '#34d399' },
}
