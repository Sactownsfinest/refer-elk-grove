'use client'
import { useState } from 'react'
import { Button } from '@/components/ui/button'
import { Input, Textarea } from '@/components/ui/input'
import { createClient } from '@/lib/supabase/client'
import { useRouter } from 'next/navigation'

interface AnnouncementFormProps {
  authorId: string
}

export function AnnouncementForm({ authorId }: AnnouncementFormProps) {
  const [title, setTitle] = useState('')
  const [content, setContent] = useState('')
  const [isPinned, setIsPinned] = useState(false)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const router = useRouter()

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    if (!title.trim() || !content.trim()) return
    setLoading(true)
    setError('')
    const supabase = createClient()
    const { error: err } = await supabase.from('announcements').insert({
      author_id: authorId,
      title: title.trim(),
      content: content.trim(),
      is_pinned: isPinned,
    })
    if (err) {
      setError('Failed to post announcement.')
    } else {
      fetch('/api/push/send', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          title: `📢 ${isPinned ? '📌 ' : ''}${title.trim()}`,
          body: content.trim().slice(0, 100),
          url: '/home',
          excludeMemberId: authorId,
        }),
      }).catch(() => {})
      setTitle('')
      setContent('')
      setIsPinned(false)
      router.refresh()
    }
    setLoading(false)
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <Input
        label="Title"
        value={title}
        onChange={e => setTitle(e.target.value)}
        placeholder="Meeting this Thursday at 7am"
        required
      />
      <Textarea
        label="Content"
        value={content}
        onChange={e => setContent(e.target.value)}
        placeholder="Full details here..."
        rows={4}
        required
      />
      <label className="flex items-center gap-2 cursor-pointer">
        <input
          type="checkbox"
          checked={isPinned}
          onChange={e => setIsPinned(e.target.checked)}
          className="w-4 h-4 rounded border-border text-primary focus:ring-primary"
        />
        <span className="text-sm font-medium text-gray-700">Pin this announcement (shows at top)</span>
      </label>
      {error && <p className="text-sm text-destructive">{error}</p>}
      <Button type="submit" loading={loading}>
        Post Announcement
      </Button>
    </form>
  )
}
