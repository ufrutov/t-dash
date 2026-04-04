export interface Task {
  id: number
  created_at: string
  title: string
  description: string
  project_id: number
  category: string
  tags: string[]
  status: 'todo' | 'in_progress' | 'done'
}