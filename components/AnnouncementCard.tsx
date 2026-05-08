import { Card, CardContent } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import type { Announcement } from '@/lib/types'
import { formatDate } from '@/lib/utils'
import { Pin, Megaphone } from 'lucide-react'

interface AnnouncementCardProps {
  announcement: Announcement
}

export function AnnouncementCard({ announcement }: AnnouncementCardProps) {
  return (
    <Card className={announcement.is_pinned ? 'border-accent border-2' : ''}>
      <CardContent className="p-4">
        <div className="flex items-start gap-3">
          <div className={`w-9 h-9 rounded-lg flex items-center justify-center shrink-0 ${announcement.is_pinned ? 'bg-accent' : 'bg-primary/10'}`}>
            {announcement.is_pinned
              ? <Pin size={16} className="text-primary" />
              : <Megaphone size={16} className="text-primary" />
            }
          </div>
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2 flex-wrap mb-1">
              <h4 className="font-semibold text-gray-900">{announcement.title}</h4>
              {announcement.is_pinned && (
                <Badge variant="close" className="text-xs">Pinned</Badge>
              )}
            </div>
            <p className="text-sm text-gray-700 whitespace-pre-wrap">{announcement.content}</p>
            <p className="text-xs text-muted mt-2">{formatDate(announcement.created_at)}</p>
          </div>
        </div>
      </CardContent>
    </Card>
  )
}
