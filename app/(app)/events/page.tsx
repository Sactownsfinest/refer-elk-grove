import { createAdminClient, createClient } from '@/lib/supabase/server'
import { EventsClient } from '@/components/EventsClient'
import type { Event, Member } from '@/lib/types'

export default async function EventsPage() {
  const supabase = await createClient()
  const admin = createAdminClient()

  const { data: { session } } = await supabase.auth.getSession()

  const [{ data: member }, { data: events }] = await Promise.all([
    admin.from('members').select('*').eq('id', session!.user.id).single(),
    admin
      .from('events')
      .select('*, author:members!events_author_id_fkey(id, name, business_name)')
      .order('start_time', { ascending: true }),
  ])

  return (
    <EventsClient
      initialEvents={(events as Event[]) ?? []}
      currentMember={member as Member}
    />
  )
}
