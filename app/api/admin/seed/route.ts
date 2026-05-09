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

  const members: { name: string; email: string; businessName: string; category: string; phone: string }[] = await request.json()

  const results: { name: string; success: boolean; error?: string }[] = []

  const { data: listData } = await adminSupabase.auth.admin.listUsers()
  const allUsers = listData?.users ?? []

  for (const m of members) {
    if (!m.email?.trim()) continue

    const email = m.email.trim().toLowerCase()
    const existingUser = allUsers.find(u => u.email?.toLowerCase() === email)
    let userId = existingUser?.id

    if (!userId) {
      const { data: createData, error: createError } = await adminSupabase.auth.admin.createUser({
        email,
        email_confirm: true,
        password: Math.random().toString(36).slice(2) + Math.random().toString(36).slice(2) + 'A1!',
      })
      if (createError || !createData?.user) {
        results.push({ name: m.name, success: false, error: createError?.message ?? 'Failed to create user' })
        continue
      }
      userId = createData.user.id
    }

    const { data: existingMember } = await adminSupabase
      .from('members')
      .select('id, role')
      .eq('id', userId)
      .maybeSingle()

    if (existingMember) {
      // Update info but preserve role/status so admins don't get demoted
      const { error } = await adminSupabase.from('members').update({
        name: m.name.trim(),
        business_name: m.businessName.trim(),
        category: m.category.trim(),
        phone: m.phone.trim(),
      }).eq('id', userId)
      results.push({ name: m.name, success: !error, error: error?.message })
    } else {
      const { error } = await adminSupabase.from('members').insert({
        id: userId,
        name: m.name.trim(),
        business_name: m.businessName.trim(),
        category: m.category.trim(),
        phone: m.phone.trim(),
        status: 'active',
        role: 'member',
      })
      if (error) {
        if (!existingUser) await adminSupabase.auth.admin.deleteUser(userId)
        results.push({ name: m.name, success: false, error: error.message })
      } else {
        results.push({ name: m.name, success: true })
      }
    }
  }

  return NextResponse.json({ results })
}
