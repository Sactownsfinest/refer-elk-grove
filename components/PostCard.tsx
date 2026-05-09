'use client'
import { Avatar } from '@/components/ui/avatar'
import { Badge } from '@/components/ui/badge'
import type { Post } from '@/lib/types'
import { formatRelative, formatCurrency } from '@/lib/utils'
import { Trash2 } from 'lucide-react'
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
}

export function PostCard({ post, currentUserId, currentUserRole, onDelete }: PostCardProps) {
  const [deleting, setDeleting] = useState(false)
  const config = typeConfig[post.type]
  const canDelete = post.author_id === currentUserId || currentUserRole === 'admin'

  async function handleDelete() {
    if (!confirm('Delete this post?')) return
    setDeleting(true)
    const res = await fetch('/api/posts/delete', {
      method: 'DELETE',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ id: post.id }),
    })
    if (res.ok) onDelete?.(post.id)
    setDeleting(false)
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
          {post.to_member && post.type !== 'message' && (
            <span className="text-xs text-muted">→ {post.to_member.name}</span>
          )}
          <span className="text-xs text-muted ml-auto">{formatRelative(post.created_at)}</span>
          {canDelete && (
            <button
              onClick={handleDelete}
              disabled={deleting}
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
              {post.to_member?.name || 'A member'} closed
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
          <p className="text-sm text-gray-700 mt-1">{post.content}</p>
        )}

        {/* Author business */}
        {post.author?.business_name && (
          <p className="text-xs text-muted mt-1.5">{post.author.business_name}</p>
        )}
      </div>
    </div>
  )
}
