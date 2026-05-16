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

type Tab = 'chat' | 'activity'

const activityTypes: { type: PostType; label: string; icon: React.ReactNode; color: string }[] = [
  { type: 'shoutout', label: 'Shout-Out', icon: <Star size={16} />,       color: 'bg-blue-100 text-blue-700 hover:bg-blue-200' },
  { type: 'referral', label: 'Referral',  icon: <Handshake size={16} />,  color: 'bg-green-100 text-green-700 hover:bg-green-200' },
  { type: 'close',    label: 'Close',     icon: <DollarSign size={16} />, color: 'bg-yellow-100 text-yellow-700 hover:bg-yellow-200' },
]

interface FeedClientProps {
  initialPosts: Post[]
  currentMember: Member
  members: Member[]
}

export function FeedClient({ initialPosts, currentMember, members }: FeedClientProps) {
  const [posts, setPosts] = useState<Post[]>(initialPosts)
  const [tab, setTab] = useState<Tab>('chat')

  // Realtime for other users' posts
  useEffect(() => {
    const supabase = createClient()
    const channel = supabase
      .channel('posts-realtime')
      .on('postgres_changes', { event: 'INSERT', schema: 'public', table: 'posts' }, async (payload) => {
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

  const chatPosts     = posts.filter(p => p.type === 'message')
  const activityPosts = posts.filter(p => p.type !== 'message')
  const visiblePosts  = tab === 'chat' ? chatPosts : activityPosts

  return (
    <div className="space-y-4">
      {/* Tab bar */}
      <div className="flex rounded-xl border border-border overflow-hidden">
        <button
          onClick={() => setTab('chat')}
          className={cn(
            'flex-1 flex items-center justify-center gap-2 py-2.5 text-sm font-semibold transition-colors',
            tab === 'chat'
              ? 'bg-primary text-white'
              : 'bg-white text-muted hover:text-gray-900'
          )}
        >
          <MessageSquare size={16} />
          Chat
          {chatPosts.length > 0 && (
            <span className={cn('text-xs rounded-full px-1.5 py-0.5 font-bold', tab === 'chat' ? 'bg-white/20 text-white' : 'bg-gray-100 text-gray-600')}>
              {chatPosts.length}
            </span>
          )}
        </button>
        <div className="w-px bg-border" />
        <button
          onClick={() => setTab('activity')}
          className={cn(
            'flex-1 flex items-center justify-center gap-2 py-2.5 text-sm font-semibold transition-colors',
            tab === 'activity'
              ? 'bg-primary text-white'
              : 'bg-white text-muted hover:text-gray-900'
          )}
        >
          <Handshake size={16} />
          Activity
          {activityPosts.length > 0 && (
            <span className={cn('text-xs rounded-full px-1.5 py-0.5 font-bold', tab === 'activity' ? 'bg-white/20 text-white' : 'bg-gray-100 text-gray-600')}>
              {activityPosts.length}
            </span>
          )}
        </button>
      </div>

      {/* Composer */}
      {tab === 'chat' ? (
        <ChatComposer currentMember={currentMember} onNewPost={handleNewPost} />
      ) : (
        <ActivityComposer currentMember={currentMember} members={members} onNewPost={handleNewPost} />
      )}

      {/* Feed */}
      <Card>
        {visiblePosts.length === 0 ? (
          <div className="text-center py-12 text-muted">
            <p className="text-sm">
              {tab === 'chat'
                ? 'No messages yet. Say hello!'
                : 'No activity logged yet. Log a referral, close, or shout-out!'}
            </p>
          </div>
        ) : (
          <div className="divide-y divide-border">
            {visiblePosts.map(post => (
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

// ── Chat composer — message type only, simple textarea ──────────────────────
function ChatComposer({ currentMember, onNewPost }: {
  currentMember: Member
  onNewPost: (post: Post) => void
}) {
  const [content, setContent] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    if (!content.trim()) return
    setLoading(true)
    setError('')

    const res = await fetch('/api/posts/create', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ type: 'message', content }),
    })

    if (!res.ok) {
      const json = await res.json().catch(() => ({}))
      setError(json.error ?? 'Failed to post.')
    } else {
      const json = await res.json()
      if (json.post) onNewPost(json.post as Post)
      fetch('/api/push/send', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          title: `💬 Message from ${currentMember.name}`,
          body: content.trim(),
          url: '/feed',
          excludeMemberId: currentMember.id,
        }),
      }).catch(() => {})
      setContent('')
    }
    setLoading(false)
  }

  return (
    <Card>
      <CardContent className="p-4">
        <form onSubmit={handleSubmit} className="space-y-3">
          <Textarea
            placeholder="Send a message to the group..."
            value={content}
            onChange={e => setContent(e.target.value)}
            rows={3}
          />
          {error && <p className="text-sm text-destructive">{error}</p>}
          <div className="flex justify-end">
            <Button type="submit" loading={loading} disabled={!content.trim()}>
              Send
            </Button>
          </div>
        </form>
      </CardContent>
    </Card>
  )
}

// ── Activity composer — shoutout / referral / close ─────────────────────────
function ActivityComposer({ currentMember, members, onNewPost }: {
  currentMember: Member
  members: Member[]
  onNewPost: (post: Post) => void
}) {
  const [type, setType]           = useState<PostType>('shoutout')
  const [content, setContent]     = useState('')
  const [toMemberId, setToMemberId] = useState('')
  const [clientName, setClientName] = useState('')
  const [amount, setAmount]       = useState('')
  const [loading, setLoading]     = useState(false)
  const [error, setError]         = useState('')

  const otherMembers = members.filter(m => m.id !== currentMember.id)
  const needsToMember = type !== 'close'
  const isValid = type === 'close' || toMemberId !== ''

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    if (!isValid) return
    setLoading(true)
    setError('')

    const res = await fetch('/api/posts/create', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ type, to_member_id: type === 'close' ? currentMember.id : toMemberId, content, client_name: clientName, amount }),
    })

    if (!res.ok) {
      const json = await res.json().catch(() => ({}))
      setError(json.error ?? 'Failed to post.')
    } else {
      const json = await res.json()
      if (json.post) onNewPost(json.post as Post)
      const typeLabels: Record<string, string> = { shoutout: 'Shout-Out', referral: 'Referral', close: 'Close' }
      const typeEmojis: Record<string, string> = { shoutout: '🎉', referral: '🤝', close: '💰' }
      fetch('/api/push/send', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          title: `${typeEmojis[type]} New ${typeLabels[type]} from ${currentMember.name}`,
          body: content.trim() || `${currentMember.name} logged a ${typeLabels[type].toLowerCase()}`,
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
        <form onSubmit={handleSubmit} className="space-y-3">
          {/* Type selector */}
          <div className="flex gap-2">
            {activityTypes.map(t => (
              <button
                key={t.type}
                type="button"
                onClick={() => { setType(t.type); setToMemberId('') }}
                className={cn(
                  'flex items-center gap-1.5 px-3 py-1.5 rounded-full text-sm font-medium transition-all flex-1 justify-center',
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

          {/* Member selector (not shown for close — closer is always the logged-in user) */}
          {needsToMember && (
            <div>
              <label className="text-sm font-medium text-gray-700 block mb-1">
                {type === 'shoutout' ? 'Shout out to...' : 'Referred to...'}
              </label>
              {otherMembers.length === 0 ? (
                <p className="text-sm text-destructive">No members found. Try refreshing.</p>
              ) : (
                <select
                  value={toMemberId}
                  onChange={e => setToMemberId(e.target.value)}
                  className="w-full rounded-lg border border-border bg-white px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary"
                  required
                >
                  <option value="">Select a member...</option>
                  {otherMembers.map(m => (
                    <option key={m.id} value={m.id}>{m.name} — {m.business_name}</option>
                  ))}
                </select>
              )}
            </div>
          )}

          {/* Who closed (close only) — auto-set to logged-in user */}
          {type === 'close' && (
            <div>
              <label className="text-sm font-medium text-gray-700 block mb-1">Who closed the sale?</label>
              <div className="w-full rounded-lg border border-border bg-gray-50 px-3 py-2 text-sm text-gray-700">
                {currentMember.name} — {currentMember.business_name}
              </div>
            </div>
          )}

          {/* Client name (referral/close) */}
          {(type === 'referral' || type === 'close') && (
            <Input
              label="Client name (optional)"
              placeholder="e.g. John Smith"
              value={clientName}
              onChange={e => setClientName(e.target.value)}
            />
          )}

          {/* Amount (close only) */}
          {type === 'close' && (
            <Input
              label="Deal value (optional)"
              type="number"
              placeholder="e.g. 5000"
              value={amount}
              onChange={e => setAmount(e.target.value)}
              min="0"
              step="100"
            />
          )}

          {/* Notes */}
          <Textarea
            placeholder={
              type === 'shoutout' ? 'Say something nice...'
              : type === 'referral' ? 'Any details about the referral? (optional)'
              : 'Any details about the close? (optional)'
            }
            value={content}
            onChange={e => setContent(e.target.value)}
            rows={2}
          />

          {error && <p className="text-sm text-destructive">{error}</p>}

          <div className="flex justify-end">
            <Button type="submit" loading={loading} disabled={!isValid}>
              Log {type === 'shoutout' ? 'Shout-Out' : type === 'referral' ? 'Referral' : 'Close'}
            </Button>
          </div>
        </form>
      </CardContent>
    </Card>
  )
}
