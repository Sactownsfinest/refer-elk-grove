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

  const { data: authUser, error: userError } = await adminSupabase.auth.admin.getUserById(memberId)
  if (userError || !authUser?.user?.email) {
    return NextResponse.json({ error: 'Could not find user email' }, { status: 404 })
  }

  const { data, error } = await adminSupabase.auth.admin.generateLink({
    type: 'recovery',
    email: authUser.user.email,
  })

  if (error || !data?.properties?.action_link) {
    return NextResponse.json({ error: error?.message ?? 'Failed to generate link' }, { status: 500 })
  }

  // Extract the token_hash from Supabase's generated URL, then build our OWN
  // link pointing directly at our app. This bypasses Supabase's redirect_to
  // allowlist check entirely — the token is valid regardless of what URL hosts it.
  const supabaseUrl = new URL(data.properties.action_link as string)
  const tokenHash = supabaseUrl.searchParams.get('token')
  const type = supabaseUrl.searchParams.get('type') ?? 'recovery'

  const link = `https://refer-elk-grove.vercel.app/auth/verify?token_hash=${tokenHash}&type=${type}`

  return NextResponse.json({ link, email: authUser.user.email })
}
