import { createAdminClient, createClient as createServerClient } from '@/lib/supabase/server'
import { NextResponse } from 'next/server'

export async function POST(request: Request) {
  const supabase = await createServerClient()
  const { data: { session } } = await supabase.auth.getSession()
  if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const body = await request.json()
  const { title, description, start_time, all_day, location, url, source } = body

  if (!title?.trim() || !start_time) {
    return NextResponse.json({ error: 'Title and date are required' }, { status: 400 })
  }

  const admin = createAdminClient()

  const { data, error } = await admin.from('events').insert({
    author_id: session.user.id,
    title: title.trim(),
    description: description || null,
    start_time,
    all_day: all_day ?? false,
    location: location || null,
    url: url || null,
    source: source ?? 'group',
  }).select(`
    *,
    author:members!events_author_id_fkey(id, name, business_name)
  `).single()

  if (error) return NextResponse.json({ error: error.message }, { status: 500 })

  const { data: author } = await admin.from('members').select('name').eq('id', session.user.id).single()
  const sourceLabel = (source ?? 'group') === 'chamber' ? '🏛️ Chamber' : '🏠 Refer EG'

  fetch(`${process.env.NEXT_PUBLIC_SITE_URL ?? ''}/api/push/send`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      title: `📅 New Event: ${title.trim()}`,
      body: `${sourceLabel} event added by ${author?.name ?? 'a member'}`,
      url: '/events',
      excludeMemberId: session.user.id,
    }),
  }).catch(() => {})

  return NextResponse.json({ event: data })
}
