import { createServerClient } from '@supabase/ssr'
import { cookies } from 'next/headers'
import { NextResponse } from 'next/server'

export async function GET() {
  const cookieStore = await cookies()
  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll() { return cookieStore.getAll() },
        setAll(cookiesToSet) {
          cookiesToSet.forEach(({ name, value, options }) => cookieStore.set(name, value, options))
        },
      },
    }
  )

  const { data: { session } } = await supabase.auth.getSession()
  if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const { data: member } = await supabase.from('members').select('role').eq('id', session.user.id).single()
  if (!member || member.role !== 'admin') {
    return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
  }

  // This week
  const now = new Date()
  const day = now.getDay()
  const diff = day === 0 ? -6 : 1 - day
  const monday = new Date(now)
  monday.setDate(now.getDate() + diff)
  monday.setHours(0, 0, 0, 0)

  const { data: members } = await supabase
    .from('members')
    .select('id, name, business_name, category')
    .eq('status', 'active')

  const { data: posts } = await supabase
    .from('posts')
    .select('author_id, to_member_id, type, amount, client_name, created_at')
    .gte('created_at', monday.toISOString())

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
