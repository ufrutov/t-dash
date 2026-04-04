import { z } from 'zod'

export const taskFormSchema = z.object({
  title: z.string().min(1, 'Title is required.'),
  description: z.string().default(''),
  project_id: z.number().min(1, 'Project is required.'),
  category: z.string().min(1, 'Category is required.'),
  tags: z.array(z.string()).default([]),
  status: z.enum(['todo', 'in_progress', 'done']),
})

export type TaskForm = z.infer<typeof taskFormSchema>

const userStatusSchema = z.union([
  z.literal('active'),
  z.literal('inactive'),
  z.literal('invited'),
  z.literal('suspended'),
])
export type UserStatus = z.infer<typeof userStatusSchema>

const userRoleSchema = z.union([
  z.literal('superadmin'),
  z.literal('admin'),
  z.literal('cashier'),
  z.literal('manager'),
])

const _userSchema = z.object({
  id: z.string(),
  firstName: z.string(),
  lastName: z.string(),
  username: z.string(),
  email: z.string(),
  phoneNumber: z.string(),
  status: userStatusSchema,
  role: userRoleSchema,
  createdAt: z.coerce.date(),
  updatedAt: z.coerce.date(),
})
export type User = z.infer<typeof _userSchema>
