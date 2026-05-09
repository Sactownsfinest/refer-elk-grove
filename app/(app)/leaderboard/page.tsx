import { createAdminClient } from '@/lib/supabase/server'
import { Card, CardHeader, CardTitle } from '@/components/ui/card'
import { Avatar } from '@/components/ui/avatar'
import type { Member } from '@/lib/types'
import { Trophy } from 'lucide-react'

type DateRange = 'week' | 'month' | 'all'

interface PageProps {
  searchParams: Promise<{ range?: string }>
}

export default async function LeaderboardPage({ searchParams }: PageProps) {
  const { range = 'week' } = await searchParams
  const dateRange = (range as DateRange) === 'month' ? 'month' : range === 'all' ? 'all' : 'week'

  const admin = createAdminClient()

  const { data: members } = await admin
    .from('members')
    .select('id, name, business_name, photo_url, category')
    .eq('status', 'active')

  let dateFilter = ''
  if (dateRange === 'week') {
    const monday = getMonday()
    dateFilter = monday.toISOString()
  } else if (dateRange === 'month') {
    const start = new Date()
    start.setDate(1)
    start.setHours(0, 0, 0, 0)
    dateFilter = start.toISOString()
  }

  let query = admin.from('posts').select('author_id, to_member_id, type')
  if (dateFilter) query = query.gte('created_at', dateFilter)
  const { data: posts } = await query

  const board = (members || []).map(member => {
    const referralsGiven    = posts?.filter(p => p.author_id   === member.id && p.type === 'referral').length ?? 0
    const closesLogged      = posts?.filter(p => p.to_member_id === member.id && p.type === 'close').length ?? 0
    const shoutoutsReceived = posts?.filter(p => p.to_member_id === member.id && p.type === 'shoutout').length ?? 0
    const total = referralsGiven + closesLogged + shoutoutsReceived
    return { member: member as Member, referralsGiven, closesLogged, shoutoutsReceived, total }
  }).sort((a, b) => b.total - a.total)

  const rangeLabel = dateRange === 'week' ? 'This Week' : dateRange === 'month' ? 'This Month' : 'All Time'
  const medal = (idx: number) => idx === 0 ? '🥇' : idx === 1 ? '🥈' : idx === 2 ? '🥉' : null

  return (
    <div className="space-y-5">
      <div>
        <h1 className="text-2xl font-bold text-gray-900">Leaderboard</h1>
        <p className="text-muted text-sm mt-1">Who's bringing the most value to the group?</p>
      </div>

      {/* Range tabs */}
      <div className="flex gap-2">
        {(['week', 'month', 'all'] as const).map(r => (
          <a
            key={r}
            href={`/leaderboard?range=${r}`}
            className={`flex-1 text-center px-3 py-2 rounded-lg text-sm font-medium transition-colors ${
              dateRange === r
                ? 'bg-primary text-white'
                : 'bg-white border border-border text-muted hover:text-gray-900'
            }`}
          >
            {r === 'week' ? 'This Week' : r === 'month' ? 'This Month' : 'All Time'}
          </a>
        ))}
      </div>

      {/* Top 3 podium — only when there's activity */}
      {board.length >= 3 && board[0].total > 0 && (
        <div className="grid grid-cols-3 gap-2">
          {[board[1], board[0], board[2]].map((entry, idx) => {
            const rank = idx === 1 ? 1 : idx === 0 ? 2 : 3
            const heights = ['h-28', 'h-36', 'h-24']
            const colors  = ['bg-gray-100', 'bg-accent/25', 'bg-orange-50']
            return (
              <div key={entry.member.id} className={`${colors[idx]} rounded-xl p-2 text-center flex flex-col items-center justify-end ${heights[idx]}`}>
                <Avatar src={entry.member.photo_url} name={entry.member.name} size="md" className="mb-1" />
                <p className="text-xs font-bold text-gray-900 leading-tight truncate w-full px-1">
                  {entry.member.name?.split(' ')[0]}
                </p>
                <p className="text-xs text-muted">{entry.total} pts</p>
                <span className="text-base mt-0.5">{rank === 1 ? '🥇' : rank === 2 ? '🥈' : '🥉'}</span>
              </div>
            )
          })}
        </div>
      )}

      {/* Rankings list */}
      <Card>
        <CardHeader className="pb-2">
          <CardTitle className="flex items-center gap-2 text-base">
            <Trophy size={16} className="text-accent-dark" />
            {rangeLabel} Rankings
          </CardTitle>
        </CardHeader>

        {board.length === 0 ? (
          <div className="text-center py-10 text-muted text-sm">No activity yet this period.</div>
        ) : (
          <div className="divide-y divide-border">
            {board.map((entry, idx) => (
              <div key={entry.member.id} className="flex items-center gap-3 px-4 py-3">
                {/* Rank */}
                <div className="w-7 text-center shrink-0">
                  {medal(idx)
                    ? <span className="text-lg">{medal(idx)}</span>
                    : <span className="text-sm font-semibold text-muted">{idx + 1}</span>
                  }
                </div>

                {/* Avatar */}
                <Avatar src={entry.member.photo_url} name={entry.member.name} size="sm" className="shrink-0" />

                {/* Name + stats */}
                <div className="flex-1 min-w-0">
                  <p className="font-semibold text-gray-900 text-sm truncate">{entry.member.name}</p>
                  <p className="text-xs text-muted truncate">{entry.member.business_name}</p>
                  {/* Stat chips */}
                  <div className="flex gap-2 mt-1 flex-wrap">
                    <span className="text-xs text-secondary font-medium">🤝 {entry.referralsGiven}</span>
                    <span className="text-xs text-accent-dark font-medium">💰 {entry.closesLogged}</span>
                    <span className="text-xs text-primary font-medium">🎉 {entry.shoutoutsReceived}</span>
                  </div>
                </div>

                {/* Total */}
                <div className="shrink-0 text-right">
                  <p className="text-lg font-bold text-gray-900">{entry.total}</p>
                  <p className="text-[10px] text-muted">pts</p>
                </div>
              </div>
            ))}
          </div>
        )}
      </Card>
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
  return monday
}
