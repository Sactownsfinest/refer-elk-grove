import { createAdminClient } from '@/lib/supabase/server'
import { DirectoryClient } from '@/components/DirectoryClient'
import type { Member } from '@/lib/types'

export const dynamic = 'force-dynamic'

export default async function DirectoryPage() {
  const admin = createAdminClient()

  const [{ data: members }, { data: authData }] = await Promise.all([
    admin.from('members').select('*').eq('status', 'active').order('name'),
    admin.auth.admin.listUsers({ perPage: 1000 }),
  ])

  const emailMap = new Map((authData?.users ?? []).map(u => [u.id, u.email ?? '']))
  const withEmails = (members ?? []).map(m => ({ ...m, email: emailMap.get(m.id) ?? '' }))

  return <DirectoryClient initialMembers={withEmails as Member[]} />
}
