import type { PageMeta, SortField, SortOrder, Stage, Village, VillageDetail } from '../types'
import { client } from './client'

export interface ListParams {
  search?: string
  tehsil?: string
  stage?: Stage
  sort: SortField
  order: SortOrder
  page: number
  pageSize: number
}

export interface VillageInput {
  name: string
  tehsil: string
  district: string
  areaSqKm?: number | null
}

export async function listVillages(params: ListParams): Promise<{ data: Village[]; meta: PageMeta }> {
  // Axios turns the object into ?search=...&page=2 and skips values that are undefined.
  const response = await client.get<{ data: Village[]; meta: PageMeta }>('/villages', { params })
  return response.data
}

export async function getVillage(id: number): Promise<VillageDetail> {
  const response = await client.get<{ data: VillageDetail }>(`/villages/${id}`)
  return response.data.data
}

export async function getFilterOptions(): Promise<{ tehsils: string[]; districts: string[] }> {
  const response = await client.get<{ data: { tehsils: string[]; districts: string[] } }>('/villages/filter-options')
  return response.data.data
}

export async function createVillage(input: VillageInput): Promise<Village> {
  const response = await client.post<{ data: Village }>('/villages', input)
  return response.data.data
}

export async function updateVillage(id: number, input: Partial<VillageInput>): Promise<Village> {
  const response = await client.patch<{ data: Village }>(`/villages/${id}`, input)
  return response.data.data
}

export async function deleteVillage(id: number): Promise<void> {
  await client.delete(`/villages/${id}`)
}

export async function changeStage(id: number, body: { toStage: Stage; note?: string }): Promise<Village> {
  const response = await client.patch<{ data: Village }>(`/villages/${id}/stage`, body)
  return response.data.data
}
