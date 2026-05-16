'use client'
import { useState } from 'react'
import { Card, CardContent } from '@/components/ui/card'
import type { Event, Member } from '@/lib/types'
import { formatDate, formatTime } from '@/lib/utils'
import { MapPin, ExternalLink, Trash2, Clock } from 'lucide-react'

interface EventCardProps {
  event: Event
  currentMember: Member
  onDelete?: (id: string) => void
}

export function EventCard({ event, currentMember, onDelete }: EventCardProps) {
  const [deleting, setDeleting] = useState(false)
  const canDelete = event.author_id === currentMember.id || currentMember.role === 'admin'
  const isChamber = event.source === 'chamber'

  async function handleDelete() {
    if (!confirm('Delete this event?')) return
    setDeleting(true)
    const res = await fetch('/api/events/delete', {
      method: 'DELETE',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ id: event.id }),
    })
    if (res.ok) onDelete?.(event.id)
    setDeleting(false)
  }

  return (
    <Card>
      <CardContent className="p-4">
        <div className="flex items-start justify-between gap-3">
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2 flex-wrap mb-1">
              <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium ${isChamber ? 'bg-amber-100 text-amber-700' : 'bg-primary/10 text-primary'}`}>
                {isChamber ? '🏛️ Chamber' : '🏠 Refer EG'}
              </span>
              <span className="text-xs text-muted">{formatDate(event.start_time)}</span>
              {!event.all_day && (
                <span className="text-xs text-muted flex items-center gap-0.5">
                  <Clock size={11} />
                  {formatTime(event.start_time)}
                </span>
              )}
            </div>

            <h3 className="font-semibold text-gray-900">{event.title}</h3>

            {event.location && (
              <p className="text-xs text-muted mt-0.5 flex items-center gap-1">
                <MapPin size={12} /> {event.location}
              </p>
            )}

            {event.description && (
              <p className="text-sm text-gray-600 mt-1">{event.description}</p>
            )}

            {event.url && (
              <a
                href={event.url}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center gap-1 text-xs text-primary hover:underline mt-1.5"
              >
                <ExternalLink size={12} /> View details
              </a>
            )}

            {event.author && (
              <p className="text-xs text-muted mt-2">Added by {event.author.name}</p>
            )}
          </div>

          {canDelete && (
            <button
              onClick={handleDelete}
              disabled={deleting}
              className="text-muted hover:text-destructive transition-colors p-0.5 rounded shrink-0"
            >
              <Trash2 size={14} />
            </button>
          )}
        </div>
      </CardContent>
    </Card>
  )
}
