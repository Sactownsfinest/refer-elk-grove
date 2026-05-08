import { createClient } from '@/lib/supabase/server'
import { Avatar } from '@/components/ui/avatar'
import { Badge } from '@/components/ui/badge'
import { Card, CardContent } from '@/components/ui/card'
import type { Member } from '@/lib/types'
import { notFound } from 'next/navigation'
import Link from 'next/link'
import { Phone, Globe, MapPin, Star, ArrowLeft } from 'lucide-react'
import { QuickShareButton } from '@/components/QuickShareButton'

interface PageProps {
  params: Promise<{ id: string }>
}

export default async function MemberProfilePage({ params }: PageProps) {
  const { id } = await params
  const supabase = await createClient()

  const { data: member } = await supabase
    .from('members')
    .select('*')
    .eq('id', id)
    .eq('status', 'active')
    .single()

  if (!member) notFound()

  const { data: postsGiven } = await supabase
    .from('posts')
    .select('type')
    .eq('author_id', id)
    .in('type', ['referral'])

  const { data: postsReceived } = await supabase
    .from('posts')
    .select('type')
    .eq('to_member_id', id)

  const referralsGiven = postsGiven?.length ?? 0
  const closesReceived = postsReceived?.filter(p => p.type === 'close').length ?? 0
  const shoutoutsReceived = postsReceived?.filter(p => p.type === 'shoutout').length ?? 0

  const m = member as Member

  const socialLinks = [
    m.google_review_url && { href: m.google_review_url, label: '⭐ Leave a Google Review', bg: 'bg-yellow-50 border-yellow-200 text-yellow-800' },
    m.facebook_url && { href: m.facebook_url, label: 'f  Facebook', bg: 'bg-blue-50 border-blue-200 text-blue-700' },
    m.instagram_url && { href: m.instagram_url, label: '📸 Instagram', bg: 'bg-pink-50 border-pink-200 text-pink-700' },
    m.linkedin_url && { href: m.linkedin_url, label: 'in LinkedIn', bg: 'bg-blue-50 border-blue-300 text-blue-800' },
    m.nextdoor_url && { href: m.nextdoor_url, label: 'Nextdoor', bg: 'bg-green-50 border-green-200 text-green-800' },
  ].filter(Boolean) as { href: string; label: string; bg: string }[]

  return (
    <div className="space-y-5">
      <Link href="/directory" className="inline-flex items-center gap-1 text-sm text-muted hover:text-primary transition-colors">
        <ArrowLeft size={16} />
        Back to Directory
      </Link>

      {/* Profile header */}
      <Card>
        <CardContent className="p-6">
          <div className="flex flex-col sm:flex-row gap-5 items-start">
            <Avatar src={m.photo_url} name={m.name} size="xl" />
            <div className="flex-1">
              <h1 className="text-2xl font-bold text-gray-900">{m.name}</h1>
              <p className="text-primary font-semibold text-lg">{m.business_name}</p>
              {m.category && <Badge variant="default" className="mt-2">{m.category}</Badge>}
              {m.bio && <p className="text-sm text-muted mt-3 italic">"{m.bio}"</p>}
            </div>
          </div>

          {/* Stats */}
          <div className="grid grid-cols-3 gap-4 mt-6 pt-5 border-t border-border">
            <div className="text-center">
              <p className="text-2xl font-bold text-secondary">{referralsGiven}</p>
              <p className="text-xs text-muted">Referrals Given</p>
            </div>
            <div className="text-center">
              <p className="text-2xl font-bold text-accent-dark">{closesReceived}</p>
              <p className="text-xs text-muted">Closes</p>
            </div>
            <div className="text-center">
              <p className="text-2xl font-bold text-primary">{shoutoutsReceived}</p>
              <p className="text-xs text-muted">Shout-Outs</p>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Contact info */}
      <Card>
        <CardContent className="p-5 space-y-3">
          <h2 className="font-semibold text-gray-900">Contact</h2>
          {m.phone && (
            <a href={`tel:${m.phone}`} className="flex items-center gap-2 text-sm text-gray-700 hover:text-primary transition-colors">
              <Phone size={15} className="text-muted shrink-0" />
              {m.phone}
            </a>
          )}
          {m.address && (
            <div className="flex items-start gap-2 text-sm text-gray-700">
              <MapPin size={15} className="text-muted shrink-0 mt-0.5" />
              {m.address}
            </div>
          )}
          {m.website_url && (
            <a href={m.website_url} target="_blank" rel="noopener noreferrer"
              className="flex items-center gap-2 text-sm text-gray-700 hover:text-primary transition-colors">
              <Globe size={15} className="text-muted shrink-0" />
              {m.website_url.replace(/^https?:\/\//, '')}
            </a>
          )}
        </CardContent>
      </Card>

      {/* Social links */}
      {socialLinks.length > 0 && (
        <Card>
          <CardContent className="p-5">
            <h2 className="font-semibold text-gray-900 mb-3">Connect & Review</h2>
            <div className="flex flex-wrap gap-3">
              {socialLinks.map(({ href, label, bg }) => (
                <a key={href} href={href} target="_blank" rel="noopener noreferrer"
                  className={`flex items-center gap-2 px-4 py-2 border rounded-lg text-sm hover:opacity-80 transition-opacity font-medium ${bg}`}>
                  {label}
                </a>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Quick share */}
      <QuickShareButton member={m} />
    </div>
  )
}
