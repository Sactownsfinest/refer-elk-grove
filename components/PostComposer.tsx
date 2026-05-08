'use client'
import { useState } from 'react'
import { Button } from '@/components/ui/button'
import { Textarea } from '@/components/ui/input'
import { Input } from '@/components/ui/input'
import { Card, CardContent } from '@/components/ui/card'
import { createClient } from '@/lib/supabase/client'
import type { Member, PostType } from '@/lib/types'
import { MessageSquare, Star, Handshake, DollarSign } from 'lucide-react'
import { cn } from '@/lib/utils'

const types: { type: PostType; label: string; icon: React.ReactNode; color: string }[] = [
  { type: 'message', label: 'Message', icon: <MessageSquare size={16} />, color: 'bg-gray-100 text-gray-700 hover:bg-gray-200' },
  { type: 'shoutout', label: 'Shout-Out', icon: <Star size={16} />, color: 'bg-blue-100 text-blue-700 hover:bg-blue-200' },
  { type: 'referral', label: 'Referral', icon: <Handshake size={16} />, color: 'bg-green-100 text-green-700 hover:bg-green-200' },
  { type: 'close', label: 'Close', icon: <DollarSign size={16} />, color: 'bg-yellow-100 text-yellow-700 hover:bg-yellow-200' },
]

interface PostComposerProps {
  currentMember: Member
  members: Member[]
  onPost?: () => void
}

export function PostComposer({ currentMember, members, onPost }: PostComposerProps) {
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

    const supabase = createClient()
    const { error: err } = await supabase.from('posts').insert({
      author_id: currentMember.id,
      type,
      to_member_id: toMemberId || null,
      content: content.trim() || null,
      client_name: clientName.trim() || null,
      amount: amount ? parseFloat(amount) : null,
    })

    if (err) {
      setError('Failed to post. Please try again.')
    } else {
      setContent('')
      setToMemberId('')
      setClientName('')
      setAmount('')
      onPost?.()
    }
    setLoading(false)
  }

  return (
    <Card>
      <CardContent className="p-4">
        <form onSubmit={handleSubmit}>
          {/* Type selector */}
          <div className="flex gap-2 mb-3 flex-wrap">
            {types.map(t => (
              <button
                key={t.type}
                type="button"
                onClick={() => setType(t.type)}
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

          {/* To member selector */}
          {needsToMember && (
            <div className="mb-3">
              <label className="text-sm font-medium text-gray-700 block mb-1">
                {type === 'close' ? 'Who closed the deal?' : type === 'shoutout' ? 'Shout out to...' : 'Referred to...'}
              </label>
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
            </div>
          )}

          {/* Client name (referral/close) */}
          {(type === 'referral' || type === 'close') && (
            <div className="mb-3">
              <Input
                label="Client name (optional)"
                placeholder="e.g. John Smith"
                value={clientName}
                onChange={e => setClientName(e.target.value)}
              />
            </div>
          )}

          {/* Amount (close only) */}
          {type === 'close' && (
            <div className="mb-3">
              <Input
                label="Deal value (optional)"
                type="number"
                placeholder="e.g. 5000"
                value={amount}
                onChange={e => setAmount(e.target.value)}
                min="0"
                step="100"
              />
            </div>
          )}

          {/* Message / notes */}
          <div className="mb-3">
            <Textarea
              placeholder={
                type === 'message' ? 'Share something with the group...'
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
