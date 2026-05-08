import { createClient } from '@supabase/supabase-js'
import { NextResponse } from 'next/server'

const adminSupabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
)

export async function POST(request: Request) {
  const { name, email, password, businessName } = await request.json()

  // Create the auth user
  const { data: authData, error: authError } = await adminSupabase.auth.admin.createUser({
    email,
    password,
    email_confirm: true,
  })

  if (authError || !authData.user) {
    return NextResponse.json({ error: authError?.message || 'Registration failed' }, { status: 400 })
  }

  // Check if any members exist yet — first registrant becomes admin
  const { count } = await adminSupabase
    .from('members')
    .select('*', { count: 'exact', head: true })

  const isFirst = count === 0
  const status = isFirst ? 'active' : 'pending'
  const role = isFirst ? 'admin' : 'member'

  const { error: memberError } = await adminSupabase.from('members').insert({
    id: authData.user.id,
    name: name.trim(),
    business_name: businessName.trim(),
    status,
    role,
  })

  if (memberError) {
    // Roll back the auth user so they can retry
    await adminSupabase.auth.admin.deleteUser(authData.user.id)
    return NextResponse.json({ error: 'Profile setup failed. Please try again.' }, { status: 500 })
  }

  return NextResponse.json({ isFirst })
}
