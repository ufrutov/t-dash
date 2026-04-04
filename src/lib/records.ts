import type { Record } from '@/types/record'
import { createClient } from '@/lib/supabase/client'

export async function fetchRecords(projectId?: number): Promise<Record[]> {
  const supabase = createClient()

  let query = supabase.from('records').select('*')

  if (projectId) {
    query = query.eq('project_id', projectId)
  }

  const { data, error } = await query.order('date', { ascending: false })

  if (error) {
    throw error
  }

  return data || []
}

export async function createRecord(
  record: Omit<Record, 'id' | 'created_at'>
): Promise<Record> {
  const supabase = createClient()
  const { data, error } = await supabase
    .from('records')
    .insert(record)
    .select()
    .single()

  if (error) {
    throw error
  }

  return data
}

export async function updateRecord(
  id: number,
  updates: Partial<Omit<Record, 'id' | 'created_at'>>
): Promise<Record> {
  const supabase = createClient()
  const { data, error } = await supabase
    .from('records')
    .update(updates)
    .eq('id', id)
    .select()
    .single()

  if (error) {
    throw error
  }

  return data
}

export async function deleteRecord(id: number): Promise<void> {
  const supabase = createClient()
  const { error } = await supabase.from('records').delete().eq('id', id)

  if (error) {
    throw error
  }
}
