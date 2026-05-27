import { redirect } from 'next/navigation'
import { createAdminClient } from '@/lib/supabase/server'

export default async function InvitePage({
  searchParams,
}: {
  searchParams: Promise<{ email?: string }>
}) {
  const { email } = await searchParams

  if (!email) {
    redirect('/login')
  }

  const admin = createAdminClient()
  const { data, error } = await admin.auth.admin.generateLink({
    type: 'recovery',
    email,
  })

  if (error || !data?.properties?.hashed_token) {
    redirect('/login?error=invite_failed')
  }

  redirect(
    `/auth/verify?token_hash=${data.properties.hashed_token}&type=recovery`
  )
}
