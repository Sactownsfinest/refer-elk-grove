import { createClient } from '@supabase/supabase-js'
import { createAdminClient, createClient as createServerClient } from '@/lib/supabase/server'
import { NextResponse } from 'next/server'

const adminSupabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
)

export async function POST(request: Request) {
  const supabase = await createServerClient()
  const { data: { session } } = await supabase.auth.getSession()
  if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const admin = createAdminClient()
  const { data: caller } = await admin.from('members').select('role').eq('id', session.user.id).single()
  if (caller?.role !== 'admin') return NextResponse.json({ error: 'Forbidden' }, { status: 403 })

  const { memberId } = await request.json()

  // Get their email from auth.users
  const { data: authUser, error: userError } = await adminSupabase.auth.admin.getUserById(memberId)
  if (userError || !authUser?.user?.email) {
    return NextResponse.json({ error: 'Could not find user email' }, { status: 404 })
  }

  const email = authUser.user.email
  const redirectTo = `${process.env.NEXT_PUBLIC_SITE_URL || 'https://refer-elk-grove.vercel.app'}/login`

  // Generate a password recovery link — they click it, set their password, log in
  const { data, error } = await adminSupabase.auth.admin.generateLink({
    type: 'recovery',
    email,
    options: { redirectTo },
  })

  if (error || !data?.properties?.action_link) {
    return NextResponse.json({ error: error?.message ?? 'Failed to generate link' }, { status: 500 })
  }

  return NextResponse.json({ link: data.properties.action_link, email })
}
