import { redirect } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'
import { Navigation } from '@/components/Navigation'
import type { Member } from '@/lib/types'

export default async function AppLayout({ children }: { children: React.ReactNode }) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  if (!user) redirect('/login')

  const { data: member } = await supabase
    .from('members')
    .select('*')
    .eq('id', user.id)
    .single()

  if (!member || member.status !== 'active') redirect('/pending')


  return (
    <div className="min-h-screen bg-background flex">
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
