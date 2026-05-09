import { createAdminClient, createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import { ProfileClient } from '@/components/ProfileClient'
import type { Member } from '@/lib/types'

export const dynamic = 'force-dynamic'

export default async function ProfilePage() {
  const supabase = await createClient()
  const { data: { session } } = await supabase.auth.getSession()
  if (!session) redirect('/login')

  const admin = createAdminClient()
  const { data: member } = await admin
    .from('members')
    .select('*')
    .eq('id', session.user.id)
    .single()

  if (!member) redirect('/login')

  return <ProfileClient member={member as Member} email={session.user.email ?? ''} />
}
