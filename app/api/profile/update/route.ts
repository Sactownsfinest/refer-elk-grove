import { createAdminClient, createClient as createServerClient } from '@/lib/supabase/server'
import { NextResponse } from 'next/server'

export async function POST(request: Request) {
  const supabase = await createServerClient()
  const { data: { session } } = await supabase.auth.getSession()
  if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const body = await request.json()

  const admin = createAdminClient()
  const { error } = await admin.from('members').update({
    name: body.name ?? null,
    business_name: body.business_name ?? null,
    category: body.category ?? null,
    phone: body.phone ?? null,
    address: body.address ?? null,
    bio: body.bio ?? null,
    photo_url: body.photo_url ?? null,
    facebook_url: body.facebook_url ?? null,
    instagram_url: body.instagram_url ?? null,
    linkedin_url: body.linkedin_url ?? null,
    nextdoor_url: body.nextdoor_url ?? null,
    google_review_url: body.google_review_url ?? null,
    website_url: body.website_url ?? null,
  }).eq('id', session.user.id)

  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  return NextResponse.json({ ok: true })
}
