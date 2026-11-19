import type { SupabaseClient } from '@supabase/supabase-js'
import type { Post, Reaction } from '@/lib/types'

export const POST_SELECT = `*, author:members!posts_author_id_fkey(id, name, business_name, photo_url, category), to_member:members!posts_to_member_id_fkey(id, name, business_name, photo_url)`

export const REACTION_EMOJIS = ['👍', '❤️', '😂', '🎉', '🙌', '🔥']

function chunk<T>(items: T[], size: number) {
  const out: T[][] = []
  for (let i = 0; i < items.length; i += size) out.push(items.slice(i, i + size))
  return out
}

// Newest top-level posts, plus every reply and reaction that belongs to them.
// Falls back to the plain post list if the reactions/replies migration
// (supabase/migrations/003_reactions_replies.sql) has not been run yet.
export async function loadFeed(admin: SupabaseClient, limit: number) {
  const top = await admin
    .from('posts')
    .select(POST_SELECT)
    .is('parent_id', null)
    .order('created_at', { ascending: false })
    .limit(limit)

  if (top.error) {
    const { data } = await admin
      .from('posts')
      .select(POST_SELECT)
      .order('created_at', { ascending: false })
      .limit(limit)
    return { posts: (data as Post[]) || [], replies: [] as Post[], reactions: [] as Reaction[] }
  }

  const posts = (top.data as Post[]) || []
  const replies: Post[] = []
  for (const ids of chunk(posts.map(p => p.id), 100)) {
    const { data } = await admin
      .from('posts')
      .select(POST_SELECT)
      .in('parent_id', ids)
      .order('created_at', { ascending: true })
    if (data) replies.push(...(data as Post[]))
  }

  const reactions: Reaction[] = []
  for (const ids of chunk([...posts, ...replies].map(p => p.id), 100)) {
    const { data } = await admin
      .from('post_reactions')
      .select('post_id, member_id, emoji')
      .in('post_id', ids)
    if (data) reactions.push(...(data as Reaction[]))
  }

  return { posts, replies, reactions }
}
