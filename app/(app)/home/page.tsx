import { createAdminClient, createClient } from '@/lib/supabase/server'
import { AnnouncementCard } from '@/components/AnnouncementCard'
import { PostFeed } from '@/components/PostFeed'
import { Card, CardContent } from '@/components/ui/card'
import Link from 'next/link'
import type { Announcement, Event, Member, Post } from '@/lib/types'
import { formatDate, formatTime } from '@/lib/utils'
import { CalendarDays, MapPin } from 'lucide-react'

export default async function HomePage() {
  const supabase = await createClient()
  const admin = createAdminClient()

  const { data: { session } } = await supabase.auth.getSession()
  const { data: member } = await admin
    .from('members')
    .select('*')
    .eq('id', session!.user.id)
    .single()

  const nextWeek = new Date()
  nextWeek.setDate(nextWeek.getDate() + 7)

  const [{ data: announcements }, { data: posts }, { data: weekPosts }, { data: upcomingEvents }] = await Promise.all([
    admin
      .from('announcements')
      .select('*, author:members!announcements_author_id_fkey(id, name)')
      .order('is_pinned', { ascending: false })
      .order('created_at', { ascending: false })
      .limit(5),
    admin
      .from('posts')
      .select(`
        *,
        author:members!posts_author_id_fkey(id, name, business_name, photo_url, category),
        to_member:members!posts_to_member_id_fkey(id, name, business_name, photo_url)
      `)
      .order('created_at', { ascending: false })
      .limit(10),
    admin
      .from('posts')
      .select('type')
      .gte('created_at', getMonday())
      .in('type', ['referral', 'close']),
    admin
      .from('events')
      .select('*')
      .gte('start_time', new Date().toISOString())
      .lte('start_time', nextWeek.toISOString())
      .order('start_time', { ascending: true })
      .limit(5),
  ])

  const weekReferrals = weekPosts?.filter(p => p.type === 'referral').length ?? 0
  const weekCloses = weekPosts?.filter(p => p.type === 'close').length ?? 0

  return (
    <div className="space-y-6">
      {/* Hero banner */}
      <div
        className="relative rounded-2xl overflow-hidden"
        style={{ minHeight: 220 }}
      >
        <img
          src="https://images.unsplash.com/photo-1556761175-b413da4baf72?auto=format&fit=crop&w=1400&q=80"
          alt="Refer Elk Grove networking"
          className="absolute inset-0 w-full h-full object-cover"
        />
        {/* Dark branded overlay */}
        <div
          className="absolute inset-0"
          style={{ background: 'linear-gradient(135deg, rgba(30,58,95,0.82) 0%, rgba(45,106,79,0.70) 100%)' }}
        />
        {/* Content */}
        <div className="relative z-10 px-6 py-8 flex flex-col justify-end" style={{ minHeight: 220 }}>
          <h1 className="text-3xl font-bold text-white drop-shadow">
            Good {getGreeting()}, {member?.name?.split(' ')[0] || 'there'}! 👋
          </h1>
          <p className="text-white/80 text-sm mt-1">Here's what's happening in your network</p>
          <div className="flex gap-4 mt-4">
            <div className="bg-white/15 backdrop-blur-sm rounded-xl px-4 py-2 text-center">
              <p className="text-2xl font-bold text-white">{weekReferrals}</p>
              <p className="text-white/80 text-xs">🤝 Referrals</p>
            </div>
            <div className="bg-white/15 backdrop-blur-sm rounded-xl px-4 py-2 text-center">
              <p className="text-2xl font-bold text-white">{weekCloses}</p>
              <p className="text-white/80 text-xs">💰 Closes</p>
            </div>
            <div className="bg-white/15 backdrop-blur-sm rounded-xl px-4 py-2 text-center flex flex-col justify-center">
              <p className="text-white/80 text-xs">This week</p>
            </div>
          </div>
        </div>
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

      {/* Upcoming events */}
      {upcomingEvents && upcomingEvents.length > 0 && (
        <div>
          <div className="flex items-center justify-between mb-3">
            <h2 className="font-semibold text-gray-900 flex items-center gap-1.5">
              <CalendarDays size={16} className="text-primary" />
              Upcoming This Week
            </h2>
            <Link href="/events" className="text-sm text-primary hover:underline font-medium">
              View all →
            </Link>
          </div>
          <Card>
            <div className="divide-y divide-border">
              {(upcomingEvents as Event[]).map(event => (
                <div key={event.id} className="px-4 py-3 flex items-start gap-3">
                  <div className="shrink-0 text-center min-w-[36px]">
                    <p className="text-xs font-bold text-primary uppercase">
                      {new Date(event.start_time).toLocaleDateString('en-US', { month: 'short' })}
                    </p>
                    <p className="text-lg font-bold text-gray-900 leading-none">
                      {new Date(event.start_time).getDate()}
                    </p>
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-1.5 mb-0.5">
                      <span className={`text-[10px] font-medium px-1.5 py-0.5 rounded-full ${event.source === 'chamber' ? 'bg-amber-100 text-amber-700' : 'bg-primary/10 text-primary'}`}>
                        {event.source === 'chamber' ? '🏛️ Chamber' : '🏠 Refer EG'}
                      </span>
                    </div>
                    <p className="text-sm font-medium text-gray-900 truncate">{event.title}</p>
                    <div className="flex items-center gap-2 mt-0.5 flex-wrap">
                      {!event.all_day && (
                        <p className="text-xs text-muted">{formatTime(event.start_time)}</p>
                      )}
                      {event.location && (
                        <p className="text-xs text-muted flex items-center gap-0.5">
                          <MapPin size={10} /> {event.location}
                        </p>
                      )}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </Card>
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
