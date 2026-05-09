import { createAdminClient } from '@/lib/supabase/server'
import { DirectoryClient } from '@/components/DirectoryClient'
import type { Member } from '@/lib/types'

export const dynamic = 'force-dynamic'

export default async function DirectoryPage() {
  const admin = createAdminClient()
  const { data: members } = await admin
    .from('members')
    .select('*')
    .eq('status', 'active')
    .order('name')

  return <DirectoryClient initialMembers={(members as Member[]) || []} />
}
