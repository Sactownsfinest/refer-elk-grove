'use client'
import { useState } from 'react'
import { Button } from '@/components/ui/button'
import { createClient } from '@/lib/supabase/client'
import { useRouter } from 'next/navigation'
import { Trash2, Pin, PinOff } from 'lucide-react'

interface AnnouncementDeleteButtonProps {
  announcementId: string
  isPinned: boolean
}

export function AnnouncementDeleteButton({ announcementId, isPinned }: AnnouncementDeleteButtonProps) {
  const [loading, setLoading] = useState(false)
  const router = useRouter()

  async function handleDelete() {
    if (!confirm('Delete this announcement?')) return
    setLoading(true)
    const supabase = createClient()
    await supabase.from('announcements').delete().eq('id', announcementId)
    router.refresh()
    setLoading(false)
  }

  async function handleTogglePin() {
    setLoading(true)
    const supabase = createClient()
    await supabase.from('announcements').update({ is_pinned: !isPinned }).eq('id', announcementId)
    router.refresh()
    setLoading(false)
  }

  return (
    <div className="absolute top-3 right-3 flex gap-1">
      <button
        onClick={handleTogglePin}
        disabled={loading}
        className="p-1.5 bg-white/90 rounded-md text-muted hover:text-primary transition-colors shadow-sm"
        title={isPinned ? 'Unpin' : 'Pin'}
      >
        {isPinned ? <PinOff size={14} /> : <Pin size={14} />}
      </button>
      <button
        onClick={handleDelete}
        disabled={loading}
        className="p-1.5 bg-white/90 rounded-md text-muted hover:text-destructive transition-colors shadow-sm"
        title="Delete"
      >
        <Trash2 size={14} />
      </button>
    </div>
  )
}
