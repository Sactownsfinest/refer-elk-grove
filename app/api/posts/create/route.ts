import { createAdminClient, createClient as createServerClient } from '@/lib/supabase/server'
import { NextResponse } from 'next/server'

export async function POST(request: Request) {
  const supabase = await createServerClient()
  const { data: { session } } = await supabase.auth.getSession()
  if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const body = await request.json()
  const admin = createAdminClient()

  const { data, error } = await admin.from('posts').insert({
    author_id: session.user.id,
    type: body.type,
    to_member_id: body.to_member_id || null,
    content: body.content || null,
    client_name: body.client_name || null,
    amount: body.amount ? parseFloat(body.amount) : null,
  }).select(`
    *,
    author:members!posts_author_id_fkey(id, name, business_name, photo_url, category),
    to_member:members!posts_to_member_id_fkey(id, name, business_name, photo_url)
  `).single()

  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  return NextResponse.json({ post: data })
}
