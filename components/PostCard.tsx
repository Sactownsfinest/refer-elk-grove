'use client'
import { Avatar } from '@/components/ui/avatar'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Textarea } from '@/components/ui/input'
import { ReactionBar } from '@/components/ReactionBar'
import type { Post, Reaction } from '@/lib/types'
import { formatRelative, formatCurrency } from '@/lib/utils'
import { MessageCircle, Trash2 } from 'lucide-react'
import { useState } from 'react'

const typeConfig = {
  message: { label: 'Message', emoji: '💬', variant: 'message' as const },
  shoutout: { label: 'Shout-Out', emoji: '🎉', variant: 'shoutout' as const },
  referral: { label: 'Referral', emoji: '🤝', variant: 'referral' as const },
  close: { label: 'Close', emoji: '💰', variant: 'close' as const },
}

interface PostCardProps {
  post: Post
  currentUserId: string
  currentUserRole: string
  onDelete?: (id: string) => void
  // Reactions and replies are shown only where the feed supplies these.
  replies?: Post[]
  reactionsByPost?: Record<string, Reaction[]>
  memberNames?: Record<string, string>
  onToggleReaction?: (postId: string, emoji: string) => void
  // Resolves to an error message, or null when the reply was posted.
  onReply?: (parent: Post, content: string) => Promise<string | null>
}

function useDeletePost(id: string, onDelete?: (id: string) => void) {
  const [deleting, setDeleting] = useState(false)
  async function handleDelete(what: string) {
    if (!confirm(`Delete this ${what}?`)) return
    setDeleting(true)
    const res = await fetch('/api/posts/delete', {
      method: 'DELETE',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ id }),
    })
    if (res.ok) onDelete?.(id)
    setDeleting(false)
  }
  return { deleting, handleDelete }
}

export function PostCard({
  post, currentUserId, currentUserRole, onDelete,
  replies = [], reactionsByPost, memberNames, onToggleReaction, onReply,
}: PostCardProps) {
  const { deleting, handleDelete } = useDeletePost(post.id, onDelete)
  const [replying, setReplying] = useState(false)
  const [draft, setDraft] = useState('')
  const [sending, setSending] = useState(false)
  const [replyError, setReplyError] = useState('')
  const config = typeConfig[post.type]
  const canDelete = post.author_id === currentUserId || currentUserRole === 'admin'

  async function submitReply(e: React.FormEvent) {
    e.preventDefault()
    if (!onReply || !draft.trim() || sending) return
    setSending(true)
    setReplyError('')
    const error = await onReply(post, draft.trim())
    if (error) {
      setReplyError(error)
    } else {
      setDraft('')
      setReplying(false)
    }
    setSending(false)
  }

  return (
    <div className="flex gap-3 p-4 border-b border-border last:border-0">
      <Avatar src={post.author?.photo_url} name={post.author?.name} size="md" />
      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-2 flex-wrap">
          <span className="font-semibold text-sm text-gray-900">{post.author?.name}</span>
          <Badge variant={config.variant}>
            {config.emoji} {config.label}
          </Badge>
          {post.to_member && post.type !== 'message' && post.type !== 'close' && (
            <span className="text-xs text-muted">→ {post.to_member.name}</span>
          )}
          <span className="text-xs text-muted ml-auto">{formatRelative(post.created_at)}</span>
          {canDelete && (
            <button
              onClick={() => handleDelete('post')}
              disabled={deleting}
              aria-label="Delete post"
              className="text-muted hover:text-destructive transition-colors p-0.5 rounded"
            >
              <Trash2 size={14} />
            </button>
          )}
        </div>

        {/* Structured content based on type */}
        {post.type === 'referral' && (
          <div className="mt-2 p-3 bg-green-50 rounded-lg border border-green-100">
            <p className="text-sm font-medium text-green-800">
              Referred{post.client_name ? ` ${post.client_name}` : ' a client'} to {post.to_member?.name || 'a member'}
            </p>
            {post.content && <p className="text-sm text-green-700 mt-1">{post.content}</p>}
          </div>
        )}
        {post.type === 'close' && (
          <div className="mt-2 p-3 bg-yellow-50 rounded-lg border border-yellow-100">
            <p className="text-sm font-medium text-yellow-800">
              {post.author?.name || 'A member'} closed
              {post.client_name ? ` ${post.client_name}` : ' a deal'}
              {post.amount ? ` — ${formatCurrency(post.amount)}` : ''}
            </p>
            {post.content && <p className="text-sm text-yellow-700 mt-1">{post.content}</p>}
          </div>
        )}
        {post.type === 'shoutout' && (
          <div className="mt-2 p-3 bg-blue-50 rounded-lg border border-blue-100">
            <p className="text-sm font-medium text-blue-800">
              Shout-out to {post.to_member?.name || 'a member'}!
            </p>
            {post.content && <p className="text-sm text-blue-700 mt-1">{post.content}</p>}
          </div>
        )}
        {post.type === 'message' && post.content && (
          <p className="text-sm text-gray-700 mt-1 whitespace-pre-wrap break-words">{post.content}</p>
        )}

        {/* Author business */}
        {post.author?.business_name && (
          <p className="text-xs text-muted mt-1.5">{post.author.business_name}</p>
        )}

        {/* React + reply */}
        {onToggleReaction && (
          <ReactionBar
            reactions={reactionsByPost?.[post.id] || []}
            currentUserId={currentUserId}
            memberNames={memberNames}
            onToggle={emoji => onToggleReaction(post.id, emoji)}
          >
            {onReply && (
              <button
                type="button"
                onClick={() => setReplying(v => !v)}
                className="flex items-center gap-1 rounded-full px-2 py-1 text-xs font-medium text-muted hover:bg-gray-100 hover:text-gray-900 transition-colors"
              >
                <MessageCircle size={14} />
                Reply
              </button>
            )}
          </ReactionBar>
        )}

        {/* Replies */}
        {replies.length > 0 && (
          <div className="mt-3 space-y-3 border-l-2 border-border pl-3">
            {replies.map(reply => (
              <ReplyItem
                key={reply.id}
                reply={reply}
                currentUserId={currentUserId}
                currentUserRole={currentUserRole}
                onDelete={onDelete}
                reactions={reactionsByPost?.[reply.id] || []}
                memberNames={memberNames}
                onToggleReaction={onToggleReaction}
              />
            ))}
          </div>
        )}

        {replying && onReply && (
          <form onSubmit={submitReply} className="mt-3 space-y-2">
            <Textarea
              autoFocus
              placeholder={`Reply to ${post.author?.name?.split(' ')[0] || 'this post'}...`}
              value={draft}
              onChange={e => setDraft(e.target.value)}
              rows={2}
            />
            {replyError && <p className="text-sm text-destructive">{replyError}</p>}
            <div className="flex justify-end gap-2">
              <Button type="button" variant="ghost" size="sm" onClick={() => { setReplying(false); setReplyError('') }}>
                Cancel
              </Button>
              <Button type="submit" size="sm" loading={sending} disabled={!draft.trim()}>
                Reply
              </Button>
            </div>
          </form>
        )}
      </div>
    </div>
  )
}

function ReplyItem({ reply, currentUserId, currentUserRole, onDelete, reactions, memberNames, onToggleReaction }: {
  reply: Post
  currentUserId: string
  currentUserRole: string
  onDelete?: (id: string) => void
  reactions: Reaction[]
  memberNames?: Record<string, string>
  onToggleReaction?: (postId: string, emoji: string) => void
}) {
  const { deleting, handleDelete } = useDeletePost(reply.id, onDelete)
  const canDelete = reply.author_id === currentUserId || currentUserRole === 'admin'

  return (
    <div className="flex gap-2">
      <Avatar src={reply.author?.photo_url} name={reply.author?.name} size="sm" />
      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-2 flex-wrap">
          <span className="font-semibold text-sm text-gray-900">{reply.author?.name}</span>
          <span className="text-xs text-muted ml-auto">{formatRelative(reply.created_at)}</span>
          {canDelete && (
            <button
              onClick={() => handleDelete('reply')}
              disabled={deleting}
              aria-label="Delete reply"
              className="text-muted hover:text-destructive transition-colors p-0.5 rounded"
            >
              <Trash2 size={13} />
            </button>
          )}
        </div>
        <p className="text-sm text-gray-700 mt-0.5 whitespace-pre-wrap break-words">{reply.content}</p>
        {onToggleReaction && (
          <ReactionBar
            reactions={reactions}
            currentUserId={currentUserId}
            memberNames={memberNames}
            onToggle={emoji => onToggleReaction(reply.id, emoji)}
          />
        )}
      </div>
    </div>
  )
}
