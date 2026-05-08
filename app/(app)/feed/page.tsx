import { createClient } from '@/lib/supabase/server'
import { PostComposer } from '@/components/PostComposer'
import { PostFeed } from '@/components/PostFeed'
import { Card } from '@/components/ui/card'
import type { Member, Post } from '@/lib/types'

export default async function FeedPage() {
  const supabase = await createClient()
  const { data: { session } } = await supabase.auth.getSession()

  const [{ data: member }, { data: members }, { data: posts }] = await Promise.all([
    supabase.from('members').select('*').eq('id', session!.user.id).single(),
    supabase.from('members').select('id, name, business_name, photo_url, category').eq('status', 'active').order('name'),
    supabase
      .from('posts')
      .select(`
        *,
        author:members!posts_author_id_fkey(id, name, business_name, photo_url, category),
        to_member:members!posts_to_member_id_fkey(id, name, business_name, photo_url)
      `)
      .order('created_at', { ascending: false })
      .limit(50),
  ])

  return (
    <div className="space-y-5">
      <div>
        <h1 className="text-2xl font-bold text-gray-900">Activity Feed</h1>
        <p className="text-muted text-sm mt-1">Log referrals, closes, shout-outs, and messages</p>
      </div>

      <PostComposer
        currentMember={member as Member}
        members={(members as Member[]) || []}
      />

      <Card>
        <PostFeed
          initialPosts={(posts as Post[]) || []}
          currentMember={member as Member}
        />
      </Card>
    </div>
  )
}
