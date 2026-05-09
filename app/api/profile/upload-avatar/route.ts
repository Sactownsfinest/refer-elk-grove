import { createAdminClient, createClient as createServerClient } from '@/lib/supabase/server'
import { NextResponse } from 'next/server'

export async function POST(request: Request) {
  const supabase = await createServerClient()
  const { data: { session } } = await supabase.auth.getSession()
  if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const formData = await request.formData()
  const file = formData.get('file') as File | null
  if (!file) return NextResponse.json({ error: 'No file' }, { status: 400 })

  const admin = createAdminClient()

  // Ensure bucket exists
  const { data: buckets } = await admin.storage.listBuckets()
  if (!buckets?.find(b => b.id === 'avatars')) {
    await admin.storage.createBucket('avatars', { public: true })
  }

  const ext = file.name.split('.').pop() ?? 'jpg'
  const path = `${session.user.id}/avatar.${ext}`
  const bytes = await file.arrayBuffer()

  const { error: uploadErr } = await admin.storage
    .from('avatars')
    .upload(path, bytes, { contentType: file.type, upsert: true })

  if (uploadErr) return NextResponse.json({ error: uploadErr.message }, { status: 500 })

  const { data: { publicUrl } } = admin.storage.from('avatars').getPublicUrl(path)

  // Save to member record
  await admin.from('members').update({ photo_url: publicUrl }).eq('id', session.user.id)

  return NextResponse.json({ url: publicUrl })
}
