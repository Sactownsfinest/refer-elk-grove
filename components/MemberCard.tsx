'use client'
import { Avatar } from '@/components/ui/avatar'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Card, CardContent } from '@/components/ui/card'
import type { Member } from '@/lib/types'
import { Phone, Globe, MapPin, Mail, Copy, Check, ExternalLink } from 'lucide-react'
import Link from 'next/link'
import { useState } from 'react'

interface MemberCardProps {
  member: Member
  compact?: boolean
}

export function MemberCard({ member, compact = false }: MemberCardProps) {
  const [copied, setCopied] = useState(false)

  function buildShareText() {
    const lines = [`🤝 ${member.name} — ${member.business_name || ''}`]
    if (member.category) lines.push(`📋 ${member.category}`)
    if (member.phone) lines.push(`📞 ${member.phone}`)
    if (member.website_url) lines.push(`🌐 ${member.website_url}`)
    if (member.google_review_url) lines.push(`⭐ Leave a review: ${member.google_review_url}`)
    if (member.bio) lines.push(`\n"${member.bio}"`)
    return lines.join('\n')
  }

  async function handleCopy() {
    await navigator.clipboard.writeText(buildShareText())
    setCopied(true)
    setTimeout(() => setCopied(false), 2000)
  }

  if (compact) {
    return (
      <Link href={`/directory/${member.id}`}>
        <Card className="hover:shadow-md transition-shadow cursor-pointer">
          <CardContent className="flex items-center gap-3 py-3">
            <Avatar src={member.photo_url} name={member.name} size="md" />
            <div className="min-w-0 flex-1">
              <p className="font-semibold text-sm text-gray-900 truncate">{member.name}</p>
              <p className="text-xs text-muted truncate">{member.business_name}</p>
            </div>
            {member.category && (
              <Badge variant="default" className="text-xs shrink-0">{member.category}</Badge>
            )}
          </CardContent>
        </Card>
      </Link>
    )
  }

  const socialLinks = [
    member.google_review_url && { href: member.google_review_url, label: '⭐ Review', bg: 'bg-yellow-50 text-yellow-800 border-yellow-200' },
    member.facebook_url && { href: member.facebook_url, label: 'f Facebook', bg: 'bg-blue-50 text-blue-700 border-blue-200' },
    member.instagram_url && { href: member.instagram_url, label: '📸 Instagram', bg: 'bg-pink-50 text-pink-700 border-pink-200' },
    member.linkedin_url && { href: member.linkedin_url, label: 'in LinkedIn', bg: 'bg-blue-50 text-blue-800 border-blue-300' },
    member.nextdoor_url && { href: member.nextdoor_url, label: 'Nextdoor', bg: 'bg-green-50 text-green-800 border-green-200' },
  ].filter(Boolean) as { href: string; label: string; bg: string }[]

  return (
    <Card className="hover:shadow-md transition-shadow">
      <CardContent className="p-5">
        {/* Header */}
        <div className="flex items-start gap-4 mb-4">
          <Link href={`/directory/${member.id}`}>
            <Avatar src={member.photo_url} name={member.name} size="lg" className="hover:opacity-90 transition-opacity" />
          </Link>
          <div className="flex-1 min-w-0">
            <Link href={`/directory/${member.id}`}>
              <h3 className="font-bold text-gray-900 hover:text-primary transition-colors leading-tight">
                {member.name || 'Unknown Member'}
              </h3>
            </Link>
            <p className="text-sm font-medium text-primary">{member.business_name}</p>
            {member.category && (
              <Badge variant="default" className="mt-1">{member.category}</Badge>
            )}
          </div>
        </div>

        {/* Contact */}
        <div className="space-y-1.5 mb-4">
          {member.phone && (
            <a href={`tel:${member.phone}`} className="flex items-center gap-2 text-sm text-muted hover:text-primary transition-colors">
              <Phone size={14} />
              {member.phone}
            </a>
          )}
          {member.email && (
            <a href={`mailto:${member.email}`} className="flex items-center gap-2 text-sm text-muted hover:text-primary transition-colors">
              <Mail size={14} />
              <span className="truncate">{member.email}</span>
            </a>
          )}
          {member.address && (
            <div className="flex items-start gap-2 text-sm text-muted">
              <MapPin size={14} className="mt-0.5 shrink-0" />
              <span>{member.address}</span>
            </div>
          )}
          {member.website_url && (
            <a href={member.website_url} target="_blank" rel="noopener noreferrer" className="flex items-center gap-2 text-sm text-muted hover:text-primary transition-colors">
              <Globe size={14} />
              <span className="truncate">{member.website_url.replace(/^https?:\/\//, '')}</span>
            </a>
          )}
        </div>

        {/* Bio */}
        {member.bio && (
          <p className="text-sm text-muted italic mb-4 line-clamp-2">"{member.bio}"</p>
        )}

        {/* Social links */}
        {socialLinks.length > 0 && (
          <div className="flex flex-wrap gap-2 mb-4">
            {socialLinks.map(({ href, label, bg }) => (
              <a key={href} href={href} target="_blank" rel="noopener noreferrer"
                className={`px-2 py-1 border rounded-md text-xs font-medium transition-opacity hover:opacity-80 ${bg}`}>
                {label}
              </a>
            ))}
          </div>
        )}

        {/* Actions */}
        <div className="flex gap-2">
          <Button variant="outline" size="sm" onClick={handleCopy} className="flex-1">
            {copied ? <><Check size={14} /> Copied!</> : <><Copy size={14} /> Quick Share</>}
          </Button>
          <Link href={`/directory/${member.id}`} className="flex-1">
            <Button variant="ghost" size="sm" className="w-full">
              <ExternalLink size={14} />
              View Profile
            </Button>
          </Link>
        </div>
      </CardContent>
    </Card>
  )
}
