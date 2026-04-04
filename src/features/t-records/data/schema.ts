import { z } from 'zod'

// Full record schema (database row)
export const recordSchema = z.object({
  id: z.number(),
  created_at: z.string(),
  date: z.string(),
  project_id: z.number(),
  time_spent: z.number(),
  title: z.string(),
  description: z.string(),
  category: z.string(),
  tags: z.array(z.string()),
  link: z.string(),
})

// Form schema for create/update (no id/created_at, with validation)
export const recordFormSchema = z.object({
  title: z.string().min(1, 'Title is required.'),
  description: z.string().default(''),
  project_id: z.number().min(1, 'Project is required.'),
  category: z.string().min(1, 'Category is required.'),
  tags: z.array(z.string()).default([]),
  date: z.string().min(1, 'Date is required.'),
  time_spent: z.number().min(0, 'Time spent must be 0 or more.'),
  link: z.string().optional().default(''),
})

export type RecordType = z.infer<typeof recordSchema>
export type RecordForm = z.infer<typeof recordFormSchema>
