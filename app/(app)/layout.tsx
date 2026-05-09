import { redirect } from 'next/navigation'
import { createClient, createAdminClient } from '@/lib/supabase/server'
import { Navigation } from '@/components/Navigation'
import { PushSetup } from '@/components/PushSetup'
import type { Member } from '@/lib/types'

export default async function AppLayout({ children }: { children: React.ReactNode }) {
  const supabase = await createClient()
  const { data: { session } } = await supabase.auth.getSession()

  if (!session) redirect('/login')

  const admin = createAdminClient()
  const { data: member } = await admin
    .from('members')
    .select('*')
    .eq('id', session.user.id)
    .single()

  if (!member || member.status !== 'active') redirect('/pending')


  return (
    <div className="min-h-screen bg-background flex">
      <PushSetup memberId={member.id} />
      <Navigation member={member as Member} />
      {/* Main content - offset for sidebar on desktop */}
      <main className="flex-1 md:ml-60 pb-20 md:pb-0 min-h-screen">
        <div className="max-w-4xl mx-auto px-4 py-6">
          {children}
        </div>
      </main>
    </div>
  )
}
