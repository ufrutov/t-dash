import type { Task } from '@/types/task'
import { createClient } from '@/lib/supabase/client'

export async function fetchTasks(projectId?: number): Promise<Task[]> {
  const supabase = createClient()

  let query = supabase.from('tasks').select('*')

  if (projectId) {
    query = query.eq('project_id', projectId)
  }

  const { data, error } = await query.order('created_at', { ascending: false })

  if (error) {
    throw error
  }

  return data || []
}

export async function createTask(
  task: Omit<Task, 'id' | 'created_at'>
): Promise<Task> {
  const supabase = createClient()
  const { data, error } = await supabase
    .from('tasks')
    .insert(task)
    .select()
    .single()

  if (error) {
    throw error
  }

  return data
}

export async function updateTask(
  id: number,
  updates: Partial<Omit<Task, 'id' | 'created_at'>>
): Promise<Task> {
  const supabase = createClient()
  const { data, error } = await supabase
    .from('tasks')
    .update(updates)
    .eq('id', id)
    .select()
    .single()

  if (error) {
    throw error
  }

  return data
}

export async function deleteTask(id: number): Promise<void> {
  const supabase = createClient()
  const { error } = await supabase.from('tasks').delete().eq('id', id)

  if (error) {
    throw error
  }
}
