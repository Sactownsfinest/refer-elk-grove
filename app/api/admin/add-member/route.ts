import { createAdminClient, createClient as createServerClient } from '@/lib/supabase/server'
import { NextResponse } from 'next/server'

const APP_URL = 'https://refer-elk-grove.vercel.app'

// Admin adds a member in one step: creates the login (or reuses an existing one),
// writes the member row as ACTIVE, and returns a ready-to-send invite link.
// Safe to call again for the same email: it updates the row instead of duplicating.
export async function POST(request: Request) {
  const supabase = await createServerClient()
  const { data: { session } } = await supabase.auth.getSession()
  if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const admin = createAdminClient()
  const { data: caller } = await admin.from('members').select('role').eq('id', session.user.id).single()
  if (caller?.role !== 'admin') return NextResponse.json({ error: 'Forbidden' }, { status: 403 })

  const body = await request.json().catch(() => ({}))
  const name = String(body.name ?? '').trim()
  const email = String(body.email ?? '').trim().toLowerCase()
  const phone = String(body.phone ?? '').trim()
  const businessName = String(body.businessName ?? '').trim()

  if (!name) return NextResponse.json({ error: 'Name is required' }, { status: 400 })
  if (!email || !email.includes('@')) return NextResponse.json({ error: 'A valid email is required' }, { status: 400 })

  // Find an existing login for this email, or create one.
  const { data: listData, error: listError } = await admin.auth.admin.listUsers({ perPage: 1000 })
  if (listError) return NextResponse.json({ error: listError.message }, { status: 500 })
  let userId = listData.users.find(u => u.email?.toLowerCase() === email)?.id
  let createdUser = false

  if (!userId) {
    const password = Math.random().toString(36).slice(2) + Math.random().toString(36).slice(2) + 'A1!'
    const { data: created, error: createError } = await admin.auth.admin.createUser({
      email,
      password,
      email_confirm: true,
    })
    if (createError || !created?.user) {
      return NextResponse.json({ error: createError?.message ?? 'Could not create login' }, { status: 500 })
    }
    userId = created.user.id
    createdUser = true
  }

  // Write the member row as active. Never blank out fields the member already filled in.
  const { data: existing } = await admin.from('members').select('id').eq('id', userId).maybeSingle()
  const fields: Record<string, string> = { name }
  if (phone) fields.phone = phone
  if (businessName) fields.business_name = businessName

  if (existing) {
    const { error } = await admin.from('members').update({ ...fields, status: 'active' }).eq('id', userId)
    if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  } else {
    const { error } = await admin.from('members').insert({ id: userId, ...fields, status: 'active', role: 'member' })
    if (error) {
      if (createdUser) await admin.auth.admin.deleteUser(userId)
      return NextResponse.json({ error: error.message }, { status: 500 })
    }
  }

  // Invite link: lets the member set their own password and land in the app.
  const { data: linkData, error: linkError } = await admin.auth.admin.generateLink({ type: 'recovery', email })
  let link = `${APP_URL}/invite?email=${encodeURIComponent(email)}`
  if (!linkError && linkData?.properties?.hashed_token) {
    link = `${APP_URL}/auth/verify?token_hash=${linkData.properties.hashed_token}&type=recovery`
  }

  return NextResponse.json({ ok: true, memberId: userId, existed: Boolean(existing), link })
}
