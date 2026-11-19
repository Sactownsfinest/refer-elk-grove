'use client'
import { useState } from 'react'
import { SmilePlus } from 'lucide-react'
import { REACTION_EMOJIS } from '@/lib/feed'
import type { Reaction } from '@/lib/types'
import { cn } from '@/lib/utils'

interface ReactionBarProps {
  reactions: Reaction[]
  currentUserId: string
  memberNames?: Record<string, string>
  onToggle: (emoji: string) => void
  children?: React.ReactNode
}

export function ReactionBar({ reactions, currentUserId, memberNames, onToggle, children }: ReactionBarProps) {
  const [picking, setPicking] = useState(false)

  const groups = REACTION_EMOJIS
    .map(emoji => ({ emoji, by: reactions.filter(r => r.emoji === emoji).map(r => r.member_id) }))
    .filter(g => g.by.length > 0)

  return (
    <div className="flex items-center gap-1.5 flex-wrap mt-2">
      {groups.map(g => {
        const mine = g.by.includes(currentUserId)
        const names = g.by.map(id => (id === currentUserId ? 'You' : memberNames?.[id] || 'A member')).join(', ')
        return (
          <button
            key={g.emoji}
            type="button"
            onClick={() => onToggle(g.emoji)}
            title={names}
            aria-label={`${g.emoji} ${g.by.length}: ${names}`}
            aria-pressed={mine}
            className={cn(
              'flex items-center gap-1 rounded-full border px-2 py-0.5 text-xs font-medium transition-colors',
              mine
                ? 'border-primary bg-primary/10 text-primary'
                : 'border-border bg-white text-gray-600 hover:bg-gray-50'
            )}
          >
            <span>{g.emoji}</span>
            <span>{g.by.length}</span>
          </button>
        )
      })}

      {picking ? (
        <div className="flex items-center gap-0.5 rounded-full border border-border bg-white px-1.5 py-0.5 shadow-sm">
          {REACTION_EMOJIS.map(emoji => (
            <button
              key={emoji}
              type="button"
              onClick={() => { onToggle(emoji); setPicking(false) }}
              aria-label={`React ${emoji}`}
              className="rounded-full px-1 text-base leading-7 hover:bg-gray-100 transition-colors"
            >
              {emoji}
            </button>
          ))}
        </div>
      ) : (
        <button
          type="button"
          onClick={() => setPicking(true)}
          aria-label="Add a reaction"
          className="flex items-center gap-1 rounded-full px-2 py-1 text-xs font-medium text-muted hover:bg-gray-100 hover:text-gray-900 transition-colors"
        >
          <SmilePlus size={14} />
          React
        </button>
      )}

      {children}
    </div>
  )
}
