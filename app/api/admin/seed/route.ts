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

  for (const m of members) {
    if (!m.email?.trim()) {
      results.push({ name: m.name, success: false, error: 'Email is required' })
      continue
    }

    // Check if auth user already exists for this email
    const { data: listData } = await adminSupabase.auth.admin.listUsers()
    const existingUser = listData?.users.find(u => u.email === m.email.trim().toLowerCase())

    if (existingUser) {
      // Check if member record already exists
      const { data: existingMember } = await adminSupabase.from('members').select('id').eq('id', existingUser.id).maybeSingle()
      if (existingMember) {
        results.push({ name: m.name, success: false, error: 'Already in directory' })
        continue
      }
    }

    // Create auth user without sending any email
    const userId = existingUser?.id
    let newUserId = userId

    if (!userId) {
      const { data: createData, error: createError } = await adminSupabase.auth.admin.createUser({
        email: m.email.trim().toLowerCase(),
        email_confirm: true,
        password: Math.random().toString(36).slice(2) + Math.random().toString(36).slice(2) + 'A1!',
      })

      if (createError || !createData?.user) {
        results.push({ name: m.name, success: false, error: createError?.message ?? 'Failed to create user' })
        continue
      }
      newUserId = createData.user.id
    }

    const { error: memberError } = await adminSupabase.from('members').insert({
      id: newUserId,
      name: m.name.trim(),
      business_name: m.businessName.trim(),
      category: m.category.trim(),
      phone: m.phone.trim(),
      status: 'active',
      role: 'member',
    })

    if (memberError) {
      if (!userId) await adminSupabase.auth.admin.deleteUser(newUserId!)
      results.push({ name: m.name, success: false, error: memberError.message })
    } else {
      results.push({ name: m.name, success: true })
    }
  }

  return NextResponse.json({ results })
}
