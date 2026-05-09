import { createAdminClient } from '@/lib/supabase/server'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Avatar } from '@/components/ui/avatar'
import type { Member } from '@/lib/types'
import { Trophy, Medal } from 'lucide-react'

type DateRange = 'week' | 'month' | 'all'

interface PageProps {
  searchParams: Promise<{ range?: string }>
}

export default async function LeaderboardPage({ searchParams }: PageProps) {
  const { range = 'week' } = await searchParams
  const dateRange = (range as DateRange) === 'month' ? 'month' : range === 'all' ? 'all' : 'week'

  const admin = createAdminClient()

  // Get active members
  const { data: members } = await admin
    .from('members')
    .select('id, name, business_name, photo_url, category')
    .eq('status', 'active')

  // Date filter
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

  // Get posts in range
  let query = admin.from('posts').select('author_id, to_member_id, type')
  if (dateFilter) query = query.gte('created_at', dateFilter)
  const { data: posts } = await query

  // Build leaderboard
  const board = (members || []).map(member => {
    const referralsGiven = posts?.filter(p => p.author_id === member.id && p.type === 'referral').length ?? 0
    const closesLogged = posts?.filter(p => p.to_member_id === member.id && p.type === 'close').length ?? 0
    const shoutoutsReceived = posts?.filter(p => p.to_member_id === member.id && p.type === 'shoutout').length ?? 0
    const total = referralsGiven + closesLogged + shoutoutsReceived
    return { member: member as Member, referralsGiven, closesLogged, shoutoutsReceived, total }
  }).sort((a, b) => b.total - a.total)

  const rangeLabel = dateRange === 'week' ? 'This Week' : dateRange === 'month' ? 'This Month' : 'All Time'

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
            className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
              dateRange === r
                ? 'bg-primary text-white'
                : 'bg-white border border-border text-muted hover:text-gray-900'
            }`}
          >
            {r === 'week' ? 'This Week' : r === 'month' ? 'This Month' : 'All Time'}
          </a>
        ))}
      </div>

      {/* Top 3 podium */}
      {board.length >= 3 && board[0].total > 0 && (
        <div className="grid grid-cols-3 gap-3">
          {[board[1], board[0], board[2]].map((entry, idx) => {
            const rank = idx === 1 ? 1 : idx === 0 ? 2 : 3
            const heights = ['h-24', 'h-32', 'h-20']
            const colors = ['bg-gray-100', 'bg-accent/30', 'bg-orange-100']
            return (
              <div key={entry.member.id} className={`${colors[idx]} rounded-xl p-3 text-center flex flex-col items-center justify-end ${heights[idx]}`}>
                <Avatar src={entry.member.photo_url} name={entry.member.name} size="md" className="mb-1" />
                <p className="text-xs font-bold text-gray-900 leading-tight truncate w-full">{entry.member.name?.split(' ')[0]}</p>
                <p className="text-xs text-muted">{entry.total} pts</p>
                <span className="text-lg">{rank === 1 ? '🥇' : rank === 2 ? '🥈' : '🥉'}</span>
              </div>
            )
          })}
        </div>
      )}

      {/* Full table */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Trophy size={18} className="text-accent-dark" />
            {rangeLabel} Rankings
          </CardTitle>
        </CardHeader>
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-border text-left">
                <th className="px-4 py-3 text-xs text-muted font-medium w-10">#</th>
                <th className="px-4 py-3 text-xs text-muted font-medium">Member</th>
                <th className="px-4 py-3 text-xs text-muted font-medium text-center">🤝 Refs</th>
                <th className="px-4 py-3 text-xs text-muted font-medium text-center">💰 Closes</th>
                <th className="px-4 py-3 text-xs text-muted font-medium text-center">🎉 Props</th>
                <th className="px-4 py-3 text-xs text-muted font-medium text-right">Total</th>
              </tr>
            </thead>
            <tbody>
              {board.map((entry, idx) => (
                <tr key={entry.member.id} className="border-b border-border/50 last:border-0 hover:bg-gray-50 transition-colors">
                  <td className="px-4 py-3 text-muted font-medium">
                    {idx === 0 ? '🥇' : idx === 1 ? '🥈' : idx === 2 ? '🥉' : idx + 1}
                  </td>
                  <td className="px-4 py-3">
                    <div className="flex items-center gap-2">
                      <Avatar src={entry.member.photo_url} name={entry.member.name} size="sm" />
                      <div>
                        <p className="font-medium text-gray-900">{entry.member.name}</p>
                        <p className="text-xs text-muted">{entry.member.business_name}</p>
                      </div>
                    </div>
                  </td>
                  <td className="px-4 py-3 text-center font-semibold text-secondary">{entry.referralsGiven}</td>
                  <td className="px-4 py-3 text-center font-semibold text-accent-dark">{entry.closesLogged}</td>
                  <td className="px-4 py-3 text-center font-semibold text-primary">{entry.shoutoutsReceived}</td>
                  <td className="px-4 py-3 text-right font-bold text-gray-900">{entry.total}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
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
