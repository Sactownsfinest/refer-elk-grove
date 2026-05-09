import { createAdminClient, createClient } from '@/lib/supabase/server'
import { FeedClient } from '@/components/FeedClient'
import type { Member, Post } from '@/lib/types'

export const dynamic = 'force-dynamic'

export default async function FeedPage() {
  const supabase = await createClient()
  const { data: { session } } = await supabase.auth.getSession()

  const admin = createAdminClient()

  const [{ data: member }, { data: members }, { data: posts }] = await Promise.all([
    admin.from('members').select('*').eq('id', session!.user.id).single(),
    admin.from('members').select('id, name, business_name, photo_url, category').eq('status', 'active').order('name'),
    admin.from('posts').select(`
      *,
      author:members!posts_author_id_fkey(id, name, business_name, photo_url, category),
      to_member:members!posts_to_member_id_fkey(id, name, business_name, photo_url)
    `).order('created_at', { ascending: false }).limit(50),
  ])

  return (
    <div className="space-y-5">
      <div>
        <h1 className="text-2xl font-bold text-gray-900">Feed</h1>
        <p className="text-muted text-sm mt-1">Chat with the group or log referrals, closes & shout-outs</p>
      </div>

      <FeedClient
        initialPosts={(posts as Post[]) || []}
        currentMember={member as Member}
        members={(members as Member[]) || []}
      />
    </div>
  )
}
