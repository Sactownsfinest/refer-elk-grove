import { createClient } from '@/lib/supabase/server'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { AnnouncementCard } from '@/components/AnnouncementCard'
import { AnnouncementForm } from '@/components/admin/AnnouncementForm'
import type { Announcement } from '@/lib/types'

export default async function AdminAnnouncementsPage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  const { data: announcements } = await supabase
    .from('announcements')
    .select('*, author:members!announcements_author_id_fkey(id, name)')
    .order('is_pinned', { ascending: false })
    .order('created_at', { ascending: false })

  return (
    <div className="space-y-5">
      <h1 className="text-2xl font-bold text-gray-900">Announcements</h1>

      <Card>
        <CardHeader><CardTitle>Post New Announcement</CardTitle></CardHeader>
        <CardContent>
          <AnnouncementForm authorId={user!.id} />
        </CardContent>
      </Card>

      <div>
        <h2 className="font-semibold text-gray-900 mb-3">Posted Announcements</h2>
        {!announcements || announcements.length === 0 ? (
          <p className="text-sm text-muted">No announcements yet.</p>
        ) : (
          <div className="space-y-3">
            {announcements.map(a => (
              <div key={a.id} className="relative">
                <AnnouncementCard announcement={a as Announcement} />
                <AnnouncementDeleteButton announcementId={a.id} isPinned={a.is_pinned} />
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  )
}

// Server component can't handle client interactions inline — delegate to client component
import { AnnouncementDeleteButton } from '@/components/admin/AnnouncementDeleteButton'
