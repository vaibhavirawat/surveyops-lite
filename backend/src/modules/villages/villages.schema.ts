import { z } from 'zod';

// The six workflow stages, in order. Must match the ENUM in the database.
export const STAGES = [
  'not_started',
  'georeferenced',
  'parcels_matched',
  'boundary_digitized',
  'stored_in_geodatabase',
  'tehsil_merged',
] as const;

export type Stage = (typeof STAGES)[number];

// Describes the allowed query string for GET /api/villages.
// Query strings always arrive as text, so numbers use z.coerce to convert "2" into 2.
export const listVillagesQuery = z.object({
  search: z.string().trim().min(1).max(100).optional(),
  tehsil: z.string().trim().min(1).max(100).optional(),
  district: z.string().trim().min(1).max(100).optional(),
  stage: z.enum(STAGES).optional(),
  sort: z.enum(['name', 'code', 'stage', 'updated_at']).default('updated_at'),
  order: z.enum(['asc', 'desc']).default('desc'),
  page: z.coerce.number().int().min(1).default(1),
  pageSize: z.coerce.number().int().min(1).max(100).default(10),
});

// TypeScript type generated from the schema, so the two can never drift apart.
export type ListVillagesQuery = z.infer<typeof listVillagesQuery>;

// The :id in /api/villages/:id
export const idParams = z.object({
  id: z.coerce.number().int().positive(),
});

// strictObject rejects unknown fields, so a client cannot sneak in "stage" or "code" here.
export const createVillageBody = z.strictObject({
  name: z.string().trim().min(1).max(100),
  tehsil: z.string().trim().min(1).max(100),
  district: z.string().trim().min(1).max(100),
  areaSqKm: z.number().positive().max(999999.99).nullable().optional(),
});
export type CreateVillageBody = z.infer<typeof createVillageBody>;

export const updateVillageBody = createVillageBody
  .partial()
  .refine((body) => Object.keys(body).length > 0, { message: 'Provide at least one field to update' });
export type UpdateVillageBody = z.infer<typeof updateVillageBody>;

export const changeStageBody = z.strictObject({
  toStage: z.enum(STAGES),
  note: z.string().trim().min(1).max(1000).optional(),
});
export type ChangeStageBody = z.infer<typeof changeStageBody>;
