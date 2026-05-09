'use client'
import { useState, useEffect } from 'react'
import { createClient } from '@/lib/supabase/client'
import { PostCard } from '@/components/PostCard'
import { Card, CardContent } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Textarea } from '@/components/ui/input'
import { Input } from '@/components/ui/input'
import type { Member, Post, PostType } from '@/lib/types'
import { MessageSquare, Star, Handshake, DollarSign } from 'lucide-react'
import { cn } from '@/lib/utils'

const types: { type: PostType; label: string; icon: React.ReactNode; color: string }[] = [
  { type: 'message',  label: 'Message',   icon: <MessageSquare size={16} />, color: 'bg-gray-100 text-gray-700 hover:bg-gray-200' },
  { type: 'shoutout', label: 'Shout-Out', icon: <Star size={16} />,          color: 'bg-blue-100 text-blue-700 hover:bg-blue-200' },
  { type: 'referral', label: 'Referral',  icon: <Handshake size={16} />,     color: 'bg-green-100 text-green-700 hover:bg-green-200' },
  { type: 'close',    label: 'Close',     icon: <DollarSign size={16} />,    color: 'bg-yellow-100 text-yellow-700 hover:bg-yellow-200' },
]

interface FeedClientProps {
  initialPosts: Post[]
  currentMember: Member
  members: Member[]
}

export function FeedClient({ initialPosts, currentMember, members }: FeedClientProps) {
  const [posts, setPosts] = useState<Post[]>(initialPosts)

  // Realtime subscription for OTHER users' posts
  useEffect(() => {
    const supabase = createClient()
    const channel = supabase
      .channel('posts-realtime')
      .on('postgres_changes', { event: 'INSERT', schema: 'public', table: 'posts' }, async (payload) => {
        // Only handle posts from other users (ours are added immediately via onNewPost)
        if (payload.new.author_id === currentMember.id) return
        const { data } = await supabase
          .from('posts')
          .select(`*, author:members!posts_author_id_fkey(id, name, business_name, photo_url, category), to_member:members!posts_to_member_id_fkey(id, name, business_name, photo_url)`)
          .eq('id', payload.new.id)
          .single()
        if (data) setPosts(prev => [data as Post, ...prev])
      })
      .subscribe()
    return () => { supabase.removeChannel(channel) }
  }, [currentMember.id])

  function handleNewPost(post: Post) {
    setPosts(prev => [post, ...prev])
  }

  function handleDelete(id: string) {
    setPosts(prev => prev.filter(p => p.id !== id))
  }

  return (
    <div className="space-y-5">
      <Composer currentMember={currentMember} members={members} onNewPost={handleNewPost} />
      <Card>
        {posts.length === 0 ? (
          <div className="text-center py-12 text-muted">
            <p className="text-sm">No activity yet. Be the first to post!</p>
          </div>
        ) : (
          <div className="divide-y divide-border">
            {posts.map(post => (
              <PostCard
                key={post.id}
                post={post}
                currentUserId={currentMember.id}
                currentUserRole={currentMember.role}
                onDelete={handleDelete}
              />
            ))}
          </div>
        )}
      </Card>
    </div>
  )
}

// Inline composer so it can call onNewPost with the full post
function Composer({ currentMember, members, onNewPost }: {
  currentMember: Member
  members: Member[]
  onNewPost: (post: Post) => void
}) {
  const [type, setType] = useState<PostType>('message')
  const [content, setContent] = useState('')
  const [toMemberId, setToMemberId] = useState('')
  const [clientName, setClientName] = useState('')
  const [amount, setAmount] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')

  const otherMembers = members.filter(m => m.id !== currentMember.id)
  const needsToMember = type !== 'message'
  const isValid = content.trim() || (needsToMember && toMemberId)

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    if (!isValid) return
    setLoading(true)
    setError('')

    const res = await fetch('/api/posts/create', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ type, to_member_id: toMemberId, content, client_name: clientName, amount }),
    })

    if (!res.ok) {
      const json = await res.json().catch(() => ({}))
      setError(json.error ?? 'Failed to post. Please try again.')
    } else {
      const json = await res.json()
      // Immediately add the post to the feed — don't wait for realtime
      if (json.post) onNewPost(json.post as Post)

      const typeLabels: Record<string, string> = { message: 'Message', shoutout: 'Shout-Out', referral: 'Referral', close: 'Close' }
      const typeEmojis: Record<string, string> = { message: '💬', shoutout: '🎉', referral: '🤝', close: '💰' }
      fetch('/api/push/send', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          title: `${typeEmojis[type]} New ${typeLabels[type]} from ${currentMember.name}`,
          body: content.trim() || `${currentMember.name} posted a ${typeLabels[type].toLowerCase()}`,
          url: '/feed',
          excludeMemberId: currentMember.id,
        }),
      }).catch(() => {})

      setContent('')
      setToMemberId('')
      setClientName('')
      setAmount('')
    }
    setLoading(false)
  }

  return (
    <Card>
      <CardContent className="p-4">
        <form onSubmit={handleSubmit}>
          <div className="flex gap-2 mb-3 flex-wrap">
            {types.map(t => (
              <button
                key={t.type}
                type="button"
                onClick={() => { setType(t.type); setToMemberId('') }}
                className={cn(
                  'flex items-center gap-1.5 px-3 py-1.5 rounded-full text-sm font-medium transition-all',
                  type === t.type
                    ? t.color + ' ring-2 ring-offset-1 ring-current'
                    : 'bg-gray-50 text-gray-500 hover:bg-gray-100'
                )}
              >
                {t.icon}
                {t.label}
              </button>
            ))}
          </div>

          {needsToMember && (
            <div className="mb-3">
              <label className="text-sm font-medium text-gray-700 block mb-1">
                {type === 'close' ? 'Who closed the deal?' : type === 'shoutout' ? 'Shout out to...' : 'Referred to...'}
              </label>
              {otherMembers.length === 0 ? (
                <p className="text-sm text-destructive">No other members found. Try refreshing.</p>
              ) : (
                <select
                  value={toMemberId}
                  onChange={e => setToMemberId(e.target.value)}
                  className="w-full rounded-lg border border-border bg-white px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary"
                  required={needsToMember}
                >
                  <option value="">Select a member...</option>
                  {otherMembers.map(m => (
                    <option key={m.id} value={m.id}>
                      {m.name} — {m.business_name}
                    </option>
                  ))}
                </select>
              )}
            </div>
          )}

          {(type === 'referral' || type === 'close') && (
            <div className="mb-3">
              <Input label="Client name (optional)" placeholder="e.g. John Smith" value={clientName} onChange={e => setClientName(e.target.value)} />
            </div>
          )}

          {type === 'close' && (
            <div className="mb-3">
              <Input label="Deal value (optional)" type="number" placeholder="e.g. 5000" value={amount} onChange={e => setAmount(e.target.value)} min="0" step="100" />
            </div>
          )}

          <div className="mb-3">
            <Textarea
              placeholder={
                type === 'message'   ? 'Share something with the group...'
                : type === 'shoutout' ? 'Say something nice...'
                : type === 'referral' ? 'Any details about the referral? (optional)'
                : 'Any details about the close? (optional)'
              }
              value={content}
              onChange={e => setContent(e.target.value)}
              rows={3}
            />
          </div>

          {error && <p className="text-sm text-destructive mb-3">{error}</p>}

          <div className="flex justify-end">
            <Button type="submit" loading={loading} disabled={!isValid}>
              Post
            </Button>
          </div>
        </form>
      </CardContent>
    </Card>
  )
}
