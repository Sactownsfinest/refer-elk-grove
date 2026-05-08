import { createClient } from '@/lib/supabase/server'
import { AnnouncementCard } from '@/components/AnnouncementCard'
import { PostFeed } from '@/components/PostFeed'
import { Card, CardContent } from '@/components/ui/card'
import Link from 'next/link'
import type { Announcement, Member, Post } from '@/lib/types'

export default async function HomePage() {
  const supabase = await createClient()

  const { data: { user } } = await supabase.auth.getUser()
  const { data: member } = await supabase
    .from('members')
    .select('*')
    .eq('id', user!.id)
    .single()

  const [{ data: announcements }, { data: posts }, { data: weekPosts }] = await Promise.all([
    supabase
      .from('announcements')
      .select('*, author:members!announcements_author_id_fkey(id, name)')
      .order('is_pinned', { ascending: false })
      .order('created_at', { ascending: false })
      .limit(5),
    supabase
      .from('posts')
      .select(`
        *,
        author:members!posts_author_id_fkey(id, name, business_name, photo_url, category),
        to_member:members!posts_to_member_id_fkey(id, name, business_name, photo_url)
      `)
      .order('created_at', { ascending: false })
      .limit(10),
    supabase
      .from('posts')
      .select('type')
      .gte('created_at', getMonday())
      .in('type', ['referral', 'close']),
  ])

  const weekReferrals = weekPosts?.filter(p => p.type === 'referral').length ?? 0
  const weekCloses = weekPosts?.filter(p => p.type === 'close').length ?? 0

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-bold text-gray-900">
          Good {getGreeting()}, {member?.name?.split(' ')[0] || 'there'}! 👋
        </h1>
        <p className="text-muted text-sm mt-1">Here's what's happening in Refer Elk Grove</p>
      </div>

      {/* Quick stats */}
      <div className="grid grid-cols-2 gap-4">
        <Card>
          <CardContent className="p-4 text-center">
            <p className="text-3xl font-bold text-secondary">{weekReferrals}</p>
            <p className="text-xs text-muted mt-1">🤝 Referrals this week</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4 text-center">
            <p className="text-3xl font-bold text-accent-dark">{weekCloses}</p>
            <p className="text-xs text-muted mt-1">💰 Closes this week</p>
          </CardContent>
        </Card>
      </div>

      {/* Announcements */}
      {announcements && announcements.length > 0 && (
        <div>
          <div className="flex items-center justify-between mb-3">
            <h2 className="font-semibold text-gray-900">Announcements</h2>
          </div>
          <div className="space-y-3">
            {announcements.map(a => (
              <AnnouncementCard key={a.id} announcement={a as Announcement} />
            ))}
          </div>
        </div>
      )}

      {/* Recent activity */}
      <div>
        <div className="flex items-center justify-between mb-3">
          <h2 className="font-semibold text-gray-900">Recent Activity</h2>
          <Link href="/feed" className="text-sm text-primary hover:underline font-medium">
            View all →
          </Link>
        </div>
        <Card>
          <PostFeed
            initialPosts={(posts as Post[]) || []}
            currentMember={member as Member}
            limit={5}
          />
        </Card>
      </div>
    </div>
  )
}

function getMonday() {
  const now = new Date()
  const day = now.getDay()
  const diff = day === 0 ? -6 : 1 - day
  const monday = new Date(now)
  monday.setDate(now.getDate() + diff)
  monday.setHours(0, 0, 0, 0)
  return monday.toISOString()
}

function getGreeting() {
  const h = new Date().getHours()
  if (h < 12) return 'morning'
  if (h < 17) return 'afternoon'
  return 'evening'
}
