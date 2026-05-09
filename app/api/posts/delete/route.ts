import { createAdminClient, createClient as createServerClient } from '@/lib/supabase/server'
import { NextResponse } from 'next/server'

export async function DELETE(request: Request) {
  const supabase = await createServerClient()
  const { data: { session } } = await supabase.auth.getSession()
  if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const { id } = await request.json()
  if (!id) return NextResponse.json({ error: 'Missing post id' }, { status: 400 })

  const admin = createAdminClient()

  // Verify the caller owns the post or is admin
  const { data: post } = await admin.from('posts').select('author_id').eq('id', id).single()
  if (!post) return NextResponse.json({ error: 'Post not found' }, { status: 404 })

  const { data: caller } = await admin.from('members').select('role').eq('id', session.user.id).single()
  const isOwner = post.author_id === session.user.id
  const isAdmin = caller?.role === 'admin'
  if (!isOwner && !isAdmin) return NextResponse.json({ error: 'Forbidden' }, { status: 403 })

  await admin.from('posts').delete().eq('id', id)
  return NextResponse.json({ ok: true })
}
