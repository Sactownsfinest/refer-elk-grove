import { createClient } from '@supabase/supabase-js'
import { createClient as createServerClient } from '@/lib/supabase/server'
import { NextResponse } from 'next/server'

const adminSupabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
)

export async function POST(request: Request) {
  const supabase = await createServerClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const { data: caller } = await supabase.from('members').select('role').eq('id', user.id).single()
  if (caller?.role !== 'admin') return NextResponse.json({ error: 'Forbidden' }, { status: 403 })

  const members: { name: string; email: string; businessName: string; category: string; phone: string }[] = await request.json()

  const results: { name: string; success: boolean; error?: string }[] = []

  for (const m of members) {
    if (!m.email?.trim()) {
      results.push({ name: m.name, success: false, error: 'Email is required' })
      continue
    }

    // Check if already seeded
    const { data: existing } = await adminSupabase
      .from('members')
      .select('id')
      .eq('id', (await adminSupabase.auth.admin.listUsers()).data.users.find(u => u.email === m.email.trim())?.id ?? '')
      .maybeSingle()

    if (existing) {
      results.push({ name: m.name, success: false, error: 'Already exists' })
      continue
    }

    const { data: inviteData, error: inviteError } = await adminSupabase.auth.admin.inviteUserByEmail(
      m.email.trim(),
      { redirectTo: `${process.env.NEXT_PUBLIC_SITE_URL ?? 'https://refer-elk-grove.vercel.app'}/api/auth/callback?next=/profile` }
    )

    if (inviteError || !inviteData?.user) {
      results.push({ name: m.name, success: false, error: inviteError?.message ?? 'Invite failed' })
      continue
    }

    const { error: memberError } = await adminSupabase.from('members').insert({
      id: inviteData.user.id,
      name: m.name.trim(),
      business_name: m.businessName.trim(),
      category: m.category.trim(),
      phone: m.phone.trim(),
      status: 'active',
      role: 'member',
    })

    if (memberError) {
      await adminSupabase.auth.admin.deleteUser(inviteData.user.id)
      results.push({ name: m.name, success: false, error: memberError.message })
    } else {
      results.push({ name: m.name, success: true })
    }
  }

  return NextResponse.json({ results })
}
