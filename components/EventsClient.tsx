'use client'
import { useState } from 'react'
import { Button } from '@/components/ui/button'
import { Input, Textarea } from '@/components/ui/input'
import { Card, CardContent } from '@/components/ui/card'
import { EventCard } from '@/components/EventCard'
import type { Event, Member } from '@/lib/types'
import { Plus, X } from 'lucide-react'
import { cn } from '@/lib/utils'

interface EventsClientProps {
  initialEvents: Event[]
  currentMember: Member
}

export function EventsClient({ initialEvents, currentMember }: EventsClientProps) {
  const [events, setEvents] = useState<Event[]>(initialEvents)
  const [showForm, setShowForm] = useState(false)
  const [source, setSource] = useState<'group' | 'chamber'>('group')
  const [title, setTitle] = useState('')
  const [date, setDate] = useState('')
  const [allDay, setAllDay] = useState(false)
  const [time, setTime] = useState('')
  const [location, setLocation] = useState('')
  const [url, setUrl] = useState('')
  const [description, setDescription] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    if (!title.trim() || !date) return
    setLoading(true)
    setError('')

    const start_time = (!allDay && time)
      ? new Date(`${date}T${time}`).toISOString()
      : new Date(`${date}T00:00:00`).toISOString()

    const res = await fetch('/api/events/create', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ title, description, start_time, all_day: allDay, location, url, source }),
    })

    if (!res.ok) {
      const json = await res.json().catch(() => ({}))
      setError(json.error ?? 'Failed to add event.')
    } else {
      const json = await res.json()
      if (json.event) {
        setEvents(prev =>
          [...prev, json.event as Event].sort(
            (a, b) => new Date(a.start_time).getTime() - new Date(b.start_time).getTime()
          )
        )
      }
      setTitle('')
      setDate('')
      setTime('')
      setAllDay(false)
      setLocation('')
      setUrl('')
      setDescription('')
      setShowForm(false)
    }
    setLoading(false)
  }

  function handleDelete(id: string) {
    setEvents(prev => prev.filter(e => e.id !== id))
  }

  const now = new Date()
  const upcoming = events.filter(e => new Date(e.start_time) >= now)
  const past = events.filter(e => new Date(e.start_time) < now).reverse()

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Events</h1>
          <p className="text-sm text-muted mt-0.5">Group presentations &amp; Chamber events</p>
        </div>
        <Button
          variant={showForm ? 'outline' : 'primary'}
          onClick={() => setShowForm(v => !v)}
        >
          {showForm ? <><X size={16} /> Cancel</> : <><Plus size={16} /> Add Event</>}
        </Button>
      </div>

      {showForm && (
        <Card>
          <CardContent className="p-4">
            <form onSubmit={handleSubmit} className="space-y-3">
              {/* Source toggle */}
              <div>
                <label className="text-sm font-medium text-gray-700 block mb-1">Source</label>
                <div className="flex gap-2">
                  {(['group', 'chamber'] as const).map(s => (
                    <button
                      key={s}
                      type="button"
                      onClick={() => setSource(s)}
                      className={cn(
                        'flex-1 py-1.5 rounded-lg text-sm font-medium transition-all border',
                        source === s
                          ? s === 'group'
                            ? 'bg-primary text-white border-primary'
                            : 'bg-amber-500 text-white border-amber-500'
                          : 'bg-white text-gray-500 border-border hover:bg-gray-50'
                      )}
                    >
                      {s === 'group' ? '🏠 Refer EG' : '🏛️ Chamber'}
                    </button>
                  ))}
                </div>
              </div>

              <Input
                label="Event title *"
                placeholder="e.g. Monthly Presentation Night"
                value={title}
                onChange={e => setTitle(e.target.value)}
                required
              />

              <div className="grid grid-cols-2 gap-3">
                <Input
                  label="Date *"
                  type="date"
                  value={date}
                  onChange={e => setDate(e.target.value)}
                  required
                />
                {!allDay && (
                  <Input
                    label="Time"
                    type="time"
                    value={time}
                    onChange={e => setTime(e.target.value)}
                  />
                )}
              </div>

              <label className="flex items-center gap-2 text-sm text-gray-700 cursor-pointer">
                <input
                  type="checkbox"
                  checked={allDay}
                  onChange={e => { setAllDay(e.target.checked); setTime('') }}
                  className="rounded border-border"
                />
                All day event
              </label>

              <Input
                label="Location (optional)"
                placeholder="e.g. Elk Grove Community Center"
                value={location}
                onChange={e => setLocation(e.target.value)}
              />

              <Input
                label="Link (optional)"
                type="url"
                placeholder="https://elkgrovechamber.org/events/..."
                value={url}
                onChange={e => setUrl(e.target.value)}
              />

              <Textarea
                label="Notes (optional)"
                placeholder="Any details members should know..."
                value={description}
                onChange={e => setDescription(e.target.value)}
                rows={2}
              />

              {error && <p className="text-sm text-destructive">{error}</p>}

              <div className="flex justify-end">
                <Button type="submit" loading={loading} disabled={!title.trim() || !date}>
                  Add Event
                </Button>
              </div>
            </form>
          </CardContent>
        </Card>
      )}

      {upcoming.length === 0 ? (
        <Card>
          <div className="text-center py-12 text-muted">
            <p className="text-sm">No upcoming events. Add one!</p>
          </div>
        </Card>
      ) : (
        <div className="space-y-3">
          {upcoming.map(event => (
            <EventCard key={event.id} event={event} currentMember={currentMember} onDelete={handleDelete} />
          ))}
        </div>
      )}

      {past.length > 0 && (
        <div>
          <p className="text-xs font-medium text-muted uppercase tracking-wide mb-2">Past Events</p>
          <div className="space-y-3 opacity-60">
            {past.map(event => (
              <EventCard key={event.id} event={event} currentMember={currentMember} onDelete={handleDelete} />
            ))}
          </div>
        </div>
      )}
    </div>
  )
}
