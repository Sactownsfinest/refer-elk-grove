import { createAdminClient, createClient } from '@/lib/supabase/server'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Avatar } from '@/components/ui/avatar'
import { Button } from '@/components/ui/button'
import type { Member } from '@/lib/types'
import { FileText, Download } from 'lucide-react'
import { formatDate } from '@/lib/utils'
import Link from 'next/link'

export default async function ReportPage() {
  const admin = createAdminClient()

  const monday = getMonday()
  const sunday = getSunday(monday)

  const { data: members } = await admin
    .from('members')
    .select('id, name, business_name, photo_url, category')
    .eq('status', 'active')

  const { data: posts } = await admin
    .from('posts')
    .select('author_id, to_member_id, type, amount, client_name, created_at')
    .gte('created_at', monday.toISOString())
    .lte('created_at', sunday.toISOString())

  const { data: allPosts } = await admin
    .from('posts')
    .select('author_id, to_member_id, type, amount')

  const weekPosts = posts || []
  const allPostsArr = allPosts || []

  const board = (members || []).map(member => {
    const referralsGiven = weekPosts.filter(p => p.author_id === member.id && p.type === 'referral').length
    const closesLogged = weekPosts.filter(p => p.to_member_id === member.id && p.type === 'close').length
    const shoutoutsReceived = weekPosts.filter(p => p.to_member_id === member.id && p.type === 'shoutout').length
    const totalRefs = allPostsArr.filter(p => p.author_id === member.id && p.type === 'referral').length
    const totalCloses = allPostsArr.filter(p => p.to_member_id === member.id && p.type === 'close').length
    return { member: member as Member, referralsGiven, closesLogged, shoutoutsReceived, totalRefs, totalCloses }
  }).filter(e => e.referralsGiven + e.closesLogged + e.shoutoutsReceived > 0)
    .sort((a, b) => (b.referralsGiven + b.closesLogged) - (a.referralsGiven + a.closesLogged))

  const totalReferrals = weekPosts.filter(p => p.type === 'referral').length
  const totalCloses = weekPosts.filter(p => p.type === 'close').length
  const totalShoutouts = weekPosts.filter(p => p.type === 'shoutout').length

  return (
    <div className="space-y-5" id="weekly-report">
      <div className="flex items-center justify-between flex-wrap gap-3">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Weekly Report</h1>
          <p className="text-muted text-sm mt-1">
            {formatDate(monday.toISOString())} — {formatDate(sunday.toISOString())}
          </p>
        </div>
        <Link href="/api/report/csv">
          <Button variant="outline" size="sm">
            <Download size={16} />
            Export CSV
          </Button>
        </Link>
      </div>

      {/* Summary stats */}
      <div className="grid grid-cols-3 gap-4">
        <Card>
          <CardContent className="p-4 text-center">
            <p className="text-3xl font-bold text-secondary">{totalReferrals}</p>
            <p className="text-xs text-muted mt-1">🤝 Referrals</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4 text-center">
            <p className="text-3xl font-bold text-accent-dark">{totalCloses}</p>
            <p className="text-xs text-muted mt-1">💰 Closes</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4 text-center">
            <p className="text-3xl font-bold text-primary">{totalShoutouts}</p>
            <p className="text-xs text-muted mt-1">🎉 Shout-Outs</p>
          </CardContent>
        </Card>
      </div>

      {/* Per-member breakdown */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <FileText size={18} />
            Member Activity
          </CardTitle>
        </CardHeader>
        {board.length === 0 ? (
          <CardContent>
            <p className="text-sm text-muted text-center py-6">No activity logged this week yet.</p>
          </CardContent>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-border text-left">
                  <th className="px-4 py-3 text-xs text-muted font-medium">Member</th>
                  <th className="px-4 py-3 text-xs text-muted font-medium text-center">Refs Given</th>
                  <th className="px-4 py-3 text-xs text-muted font-medium text-center">Closes</th>
                  <th className="px-4 py-3 text-xs text-muted font-medium text-center">Props</th>
                  <th className="px-4 py-3 text-xs text-muted font-medium text-right">Total (All Time)</th>
                </tr>
              </thead>
              <tbody>
                {board.map(entry => (
                  <tr key={entry.member.id} className="border-b border-border/50 last:border-0">
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
                    <td className="px-4 py-3 text-right text-muted text-xs">{entry.totalRefs} refs / {entry.totalCloses} closes</td>
                  </tr>
                ))}
              </tbody>
            </table>
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

function getSunday(monday: Date) {
  const sunday = new Date(monday)
  sunday.setDate(monday.getDate() + 6)
  sunday.setHours(23, 59, 59, 999)
  return sunday
}
