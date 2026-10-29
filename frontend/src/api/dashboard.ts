import type { DashboardStats } from '../types'
import { client } from './client'

// The API wraps its payload as { data: ... }, so unwrap it here and callers just get the stats.
export async function getDashboardStats(): Promise<DashboardStats> {
  const response = await client.get<{ data: DashboardStats }>('/dashboard/stats')
  return response.data.data
}
