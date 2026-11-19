import { createAdminClient, createClient as createServerClient } from '@/lib/supabase/server'
import { POST_SELECT } from '@/lib/feed'
import { NextResponse } from 'next/server'

export async function POST(request: Request) {
  const supabase = await createServerClient()
  const { data: { session } } = await supabase.auth.getSession()
  if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const body = await request.json()
  const admin = createAdminClient()

  // A reply is a message attached to the post it answers. Replying to a reply
  // joins the same thread, so threads stay one level deep.
  let parentId: string | null = null
  if (body.parent_id) {
    if (!String(body.content || '').trim()) {
      return NextResponse.json({ error: 'Write a reply first.' }, { status: 400 })
    }
    const { data: parent, error: parentError } = await admin
      .from('posts').select('id, parent_id').eq('id', body.parent_id).maybeSingle()
    if (parentError) return NextResponse.json({ error: parentError.message }, { status: 500 })
    if (!parent) return NextResponse.json({ error: 'That post was deleted.' }, { status: 404 })
    parentId = parent.parent_id ?? parent.id
  }

  const { data, error } = await admin.from('posts').insert({
    author_id: session.user.id,
    type: parentId ? 'message' : body.type,
    ...(parentId ? { parent_id: parentId } : {}),
    to_member_id: body.to_member_id || null,
    content: body.content || null,
    client_name: body.client_name || null,
    amount: body.amount ? parseFloat(body.amount) : null,
  }).select(POST_SELECT).single()

  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  return NextResponse.json({ post: data })
}
