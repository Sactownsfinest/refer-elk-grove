import { createAdminClient, createClient as createServerClient } from '@/lib/supabase/server'
import { NextResponse } from 'next/server'

export const runtime = 'nodejs'

export async function POST(request: Request) {
  try {
    const supabase = await createServerClient()
    const { data: { session } } = await supabase.auth.getSession()
    if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

    const formData = await request.formData()
    const file = formData.get('file') as File | null
    if (!file) return NextResponse.json({ error: 'No file provided' }, { status: 400 })

    const admin = createAdminClient()

    // Ensure bucket exists
    const { data: buckets } = await admin.storage.listBuckets()
    if (!buckets?.find(b => b.id === 'avatars')) {
      const { error: bucketErr } = await admin.storage.createBucket('avatars', { public: true })
      if (bucketErr && !bucketErr.message.includes('already exists')) {
        return NextResponse.json({ error: `Bucket error: ${bucketErr.message}` }, { status: 500 })
      }
    }

    const ext = (file.name.split('.').pop() ?? 'jpg').toLowerCase()
    const path = `${session.user.id}/avatar.${ext}`
    const buffer = Buffer.from(await file.arrayBuffer())

    const { error: uploadErr } = await admin.storage
      .from('avatars')
      .upload(path, buffer, { contentType: file.type || 'image/jpeg', upsert: true })

    if (uploadErr) {
      return NextResponse.json({ error: `Upload failed: ${uploadErr.message}` }, { status: 500 })
    }

    const { data: { publicUrl } } = admin.storage.from('avatars').getPublicUrl(path)

    await admin.from('members').update({ photo_url: publicUrl }).eq('id', session.user.id)

    return NextResponse.json({ url: publicUrl })
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : String(err)
    return NextResponse.json({ error: message }, { status: 500 })
  }
}
