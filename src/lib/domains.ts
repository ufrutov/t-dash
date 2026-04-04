import type { Domain } from '@/types/domain'
import { createClient } from '@/lib/supabase/client'

export async function fetchDomains(userId: string): Promise<Domain[]> {
  const supabase = createClient()
  const { data, error } = await supabase
    .from('domains')
    .select('*')
    .eq('user_id', userId)
    .order('title', { ascending: false })

  if (error) {
    throw error
  }

  return data || []
}
