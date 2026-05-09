import webPush from 'web-push'
import { createAdminClient } from '@/lib/supabase/server'
import { NextResponse } from 'next/server'

webPush.setVapidDetails(
  'mailto:admin@referelkgrove.com',
  process.env.NEXT_PUBLIC_VAPID_PUBLIC_KEY!,
  process.env.VAPID_PRIVATE_KEY!
)

export async function POST(request: Request) {
  const { title, body, url = '/home', excludeMemberId } = await request.json()

  const admin = createAdminClient()
  let query = admin.from('push_subscriptions').select('endpoint, p256dh, auth')
  if (excludeMemberId) query = query.neq('member_id', excludeMemberId)

  const { data: subs } = await query
  if (!subs?.length) return NextResponse.json({ sent: 0 })

  const payload = JSON.stringify({ title, body, url })
  let sent = 0

  await Promise.all(
    subs.map(async sub => {
      try {
        await webPush.sendNotification({ endpoint: sub.endpoint, keys: { p256dh: sub.p256dh, auth: sub.auth } }, payload)
        sent++
      } catch (err: any) {
        if (err.statusCode === 410 || err.statusCode === 404) {
          await admin.from('push_subscriptions').delete().eq('endpoint', sub.endpoint)
        }
      }
    })
  )

  return NextResponse.json({ sent })
}
