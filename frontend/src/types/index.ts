// TypeScript interfaces describing the JSON the API returns.
// They mirror backend/openapi.yaml, so a typo in a field name becomes a compile error instead of a blank screen.

export const STAGES = [
  'not_started',
  'georeferenced',
  'parcels_matched',
  'boundary_digitized',
  'stored_in_geodatabase',
  'tehsil_merged',
] as const

export type Stage = (typeof STAGES)[number]

export interface Village {
  id: number
  code: string
  name: string
  tehsil: string
  district: string
  areaSqKm: number | null
  stage: Stage
  createdAt: string // ISO date text, for example "2026-10-29T21:22:31.000Z"
  updatedAt: string
}

export interface DashboardStats {
  totals: {
    villages: number
    notStarted: number
    inProgress: number
    completed: number
    completionPercent: number
  }
  byStage: { stage: Stage; count: number }[]
  byTehsil: { tehsil: string; total: number; completed: number }[]
  recentlyUpdated: Village[]
}
