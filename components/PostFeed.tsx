'use client'
import { useEffect, useState } from 'react'
import { createClient } from '@/lib/supabase/client'
import { PostCard } from '@/components/PostCard'
import type { Post, Member } from '@/lib/types'

interface PostFeedProps {
  initialPosts: Post[]
  currentMember: Member
  limit?: number
  showComposer?: boolean
}

export function PostFeed({ initialPosts, currentMember, limit }: PostFeedProps) {
  const [posts, setPosts] = useState<Post[]>(initialPosts)

  useEffect(() => {
    const supabase = createClient()
    const channel = supabase
      .channel('posts-feed')
      .on(
        'postgres_changes',
        { event: 'INSERT', schema: 'public', table: 'posts' },
        async (payload) => {
          // Fetch the full post with author and to_member
          const { data } = await supabase
            .from('posts')
            .select(`
              *,
              author:members!posts_author_id_fkey(id, name, business_name, photo_url, category),
              to_member:members!posts_to_member_id_fkey(id, name, business_name, photo_url)
            `)
            .eq('id', payload.new.id)
            .single()

          if (data) {
            setPosts(prev => [data as Post, ...prev])
          }
        }
      )
      .subscribe()

    return () => { supabase.removeChannel(channel) }
  }, [])

  function handleDelete(id: string) {
    setPosts(prev => prev.filter(p => p.id !== id))
  }

  const displayPosts = limit ? posts.slice(0, limit) : posts

  if (displayPosts.length === 0) {
    return (
      <div className="text-center py-12 text-muted">
        <p className="text-sm">No activity yet. Be the first to post!</p>
      </div>
    )
  }

  return (
    <div className="divide-y divide-border">
      {displayPosts.map(post => (
        <PostCard
          key={post.id}
          post={post}
          currentUserId={currentMember.id}
          currentUserRole={currentMember.role}
          onDelete={handleDelete}
        />
      ))}
    </div>
  )
}
