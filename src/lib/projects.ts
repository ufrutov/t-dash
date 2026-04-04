import type { Project } from '@/types/project'
import { createClient } from '@/lib/supabase/client'

export async function fetchProjects(domainId?: number): Promise<Project[]> {
  const supabase = createClient()

  let query = supabase.from('projects').select('*')

  if (domainId) {
    query = query.eq('domain_id', domainId)
  }

  const { data, error } = await query.order('title', { ascending: true })

  if (error) {
    throw error
  }

  return data || []
}
