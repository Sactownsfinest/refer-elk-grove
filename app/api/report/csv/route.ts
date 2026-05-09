import { createAdminClient, createClient } from '@/lib/supabase/server'
import { NextResponse } from 'next/server'

export async function GET() {
  const supabase = await createClient()
  const { data: { session } } = await supabase.auth.getSession()
  if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const admin = createAdminClient()
  const { data: caller } = await admin.from('members').select('role').eq('id', session.user.id).single()
  if (!caller || caller.role !== 'admin') {
    return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
  }

  const now = new Date()
  const day = now.getDay()
  const diff = day === 0 ? -6 : 1 - day
  const monday = new Date(now)
  monday.setDate(now.getDate() + diff)
  monday.setHours(0, 0, 0, 0)

  const [{ data: members }, { data: posts }] = await Promise.all([
    admin.from('members').select('id, name, business_name, category').eq('status', 'active'),
    admin.from('posts')
      .select('author_id, to_member_id, type, amount, client_name, created_at')
      .gte('created_at', monday.toISOString()),
  ])

  const weekPosts = posts || []

  const rows = (members || []).map(m => {
    const referralsGiven = weekPosts.filter(p => p.author_id === m.id && p.type === 'referral').length
    const closesLogged = weekPosts.filter(p => p.to_member_id === m.id && p.type === 'close').length
    const shoutoutsReceived = weekPosts.filter(p => p.to_member_id === m.id && p.type === 'shoutout').length
    return [m.name, m.business_name, m.category, referralsGiven, closesLogged, shoutoutsReceived].join(',')
  })

  const weekStr = monday.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })
  const csv = [
    `Refer Elk Grove — Weekly Report (Week of ${weekStr})`,
    'Member,Business,Category,Referrals Given,Closes,Shout-Outs Received',
    ...rows,
  ].join('\n')

  return new NextResponse(csv, {
    headers: {
      'Content-Type': 'text/csv',
      'Content-Disposition': `attachment; filename="refer-elk-grove-week-${monday.toISOString().split('T')[0]}.csv"`,
    },
  })
}
