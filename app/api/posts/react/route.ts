import { createAdminClient, createClient as createServerClient } from '@/lib/supabase/server'
import { REACTION_EMOJIS } from '@/lib/feed'
import { NextResponse } from 'next/server'

// Toggle the caller's reaction on a post.
export async function POST(request: Request) {
  const supabase = await createServerClient()
  const { data: { session } } = await supabase.auth.getSession()
  if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const { post_id, emoji } = await request.json().catch(() => ({}))
  if (!post_id || !REACTION_EMOJIS.includes(emoji)) {
    return NextResponse.json({ error: 'Invalid reaction' }, { status: 400 })
  }

  const admin = createAdminClient()
  const { data: caller } = await admin.from('members').select('status').eq('id', session.user.id).single()
  if (caller?.status !== 'active') return NextResponse.json({ error: 'Forbidden' }, { status: 403 })

  const key = { post_id, member_id: session.user.id, emoji }
  const { data: existing, error: lookupError } = await admin
    .from('post_reactions').select('post_id').match(key).maybeSingle()
  if (lookupError) return NextResponse.json({ error: lookupError.message }, { status: 500 })

  if (existing) {
    const { error } = await admin.from('post_reactions').delete().match(key)
    if (error) return NextResponse.json({ error: error.message }, { status: 500 })
    return NextResponse.json({ reacted: false })
  }

  const { error } = await admin.from('post_reactions').insert(key)
  // 23505 = the same reaction landed twice (double tap); it is already there.
  if (error && error.code !== '23505') {
    const status = error.code === '23503' ? 404 : 500
    return NextResponse.json({ error: error.message }, { status })
  }
  return NextResponse.json({ reacted: true })
}
