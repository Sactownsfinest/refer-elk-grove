'use client'
import { useState, useRef } from 'react'
import { Button } from '@/components/ui/button'
import { Input, Textarea } from '@/components/ui/input'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Avatar } from '@/components/ui/avatar'
import type { Member } from '@/lib/types'
import {
  Camera, Save, Phone, MapPin, Globe, Star, ExternalLink, Link
} from 'lucide-react'

const CATEGORIES = [
  'Banking', 'Catering', 'Commercial', 'Consulting', 'Drinking Water',
  'Education', 'Financial Planning', 'Furniture', 'Glass and Windows',
  'Healthcare', 'Home Health', 'HVAC', 'Insurance', 'Legal', 'Marketing',
  'Pet Care', 'Plumbing', 'Promo Items', 'Real Estate', 'Technology', 'Other'
]

function SocialLink({ href, icon: Icon, label }: { href?: string | null; icon: React.ElementType; label: string }) {
  if (!href) return null
  return (
    <a
      href={href}
      target="_blank"
      rel="noopener noreferrer"
      className="flex items-center gap-2 px-3 py-2 rounded-lg border border-border bg-white hover:bg-gray-50 text-sm text-gray-700 hover:text-primary transition-colors"
    >
      <Icon size={15} className="text-primary shrink-0" />
      {label}
      <ExternalLink size={11} className="ml-auto text-muted" />
    </a>
  )
}

export function ProfileClient({ member: initial, email }: { member: Member; email: string }) {
  const [member, setMember] = useState<Member>(initial)
  const [form, setForm] = useState<Partial<Member>>(initial)
  const [uploading, setUploading] = useState(false)
  const [saving, setSaving] = useState(false)
  const [success, setSuccess] = useState(false)
  const [error, setError] = useState('')
  const fileRef = useRef<HTMLInputElement>(null)

  function update(field: keyof Member, value: string) {
    setForm(prev => ({ ...prev, [field]: value }))
  }

  async function handlePhotoUpload(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0]
    if (!file) return
    setUploading(true)
    const fd = new FormData()
    fd.append('file', file)
    const res = await fetch('/api/profile/upload-avatar', { method: 'POST', body: fd })
    if (res.ok) {
      const { url } = await res.json()
      setForm(prev => ({ ...prev, photo_url: url }))
      setMember(prev => ({ ...prev, photo_url: url }))
    }
    setUploading(false)
  }

  async function handleSave(e: React.FormEvent) {
    e.preventDefault()
    setSaving(true)
    setError('')
    const res = await fetch('/api/profile/update', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(form),
    })
    if (res.ok) {
      setMember({ ...member, ...form } as Member)
      setSuccess(true)
      setTimeout(() => setSuccess(false), 3000)
    } else {
      setError('Failed to save. Try again.')
    }
    setSaving(false)
  }

  const hasLinks = member.google_review_url || member.website_url || member.facebook_url ||
    member.instagram_url || member.linkedin_url || member.nextdoor_url

  return (
    <div className="space-y-5">
      {/* Profile view card */}
      <Card>
        <CardContent className="p-6">
          <div className="flex items-start gap-4">
            <div className="relative shrink-0">
              <Avatar src={form.photo_url} name={form.name} size="xl" />
              <button
                type="button"
                onClick={() => fileRef.current?.click()}
                className="absolute bottom-0 right-0 w-7 h-7 bg-primary text-white rounded-full flex items-center justify-center shadow-md hover:opacity-90 transition-opacity"
              >
                <Camera size={14} />
              </button>
              <input ref={fileRef} type="file" accept="image/*" className="hidden" onChange={handlePhotoUpload} />
            </div>
            <div className="flex-1 min-w-0">
              <h1 className="text-xl font-bold text-gray-900 truncate">{member.name || 'My Profile'}</h1>
              <p className="text-primary font-medium text-sm">{member.business_name}</p>
              {member.category && (
                <span className="inline-block mt-1 px-2 py-0.5 rounded-full bg-primary/10 text-primary text-xs font-medium">
                  {member.category}
                </span>
              )}
              <p className="text-xs text-muted mt-1">{email}</p>
              {uploading && <p className="text-xs text-primary mt-1">Uploading photo...</p>}
            </div>
          </div>

          {(member.phone || member.address || member.bio) && (
            <div className="mt-4 space-y-2 border-t border-border pt-4">
              {member.phone && (
                <a href={`tel:${member.phone}`} className="flex items-center gap-2 text-sm text-gray-700 hover:text-primary transition-colors">
                  <Phone size={14} className="text-muted shrink-0" />
                  {member.phone}
                </a>
              )}
              {member.address && (
                <div className="flex items-start gap-2 text-sm text-gray-700">
                  <MapPin size={14} className="text-muted shrink-0 mt-0.5" />
                  {member.address}
                </div>
              )}
              {member.bio && (
                <p className="text-sm text-gray-600 mt-2 leading-relaxed">{member.bio}</p>
              )}
            </div>
          )}

          {hasLinks && (
            <div className="mt-4 border-t border-border pt-4">
              <p className="text-xs font-semibold text-muted uppercase tracking-wide mb-3">Links & Reviews</p>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                <SocialLink href={member.google_review_url} icon={Star} label="Google Reviews" />
                <SocialLink href={member.website_url} icon={Globe} label="Website" />
                <SocialLink href={member.facebook_url} icon={Link} label="Facebook" />
                <SocialLink href={member.instagram_url} icon={Link} label="Instagram" />
                <SocialLink href={member.linkedin_url} icon={Link} label="LinkedIn" />
                {member.nextdoor_url && (
                  <a
                    href={member.nextdoor_url}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="flex items-center gap-2 px-3 py-2 rounded-lg border border-border bg-white hover:bg-gray-50 text-sm text-gray-700 hover:text-primary transition-colors"
                  >
                    <span className="text-primary font-bold text-xs shrink-0">ND</span>
                    Nextdoor
                    <ExternalLink size={11} className="ml-auto text-muted" />
                  </a>
                )}
              </div>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Edit form */}
      <form onSubmit={handleSave} className="space-y-5">
        <Card>
          <CardHeader><CardTitle>Basic Information</CardTitle></CardHeader>
          <CardContent className="space-y-4">
            <Input label="Full name" value={form.name || ''} onChange={e => update('name', e.target.value)} required />
            <Input label="Business name" value={form.business_name || ''} onChange={e => update('business_name', e.target.value)} />
            <div className="flex flex-col gap-1">
              <label className="text-sm font-medium text-gray-700">Business category</label>
              <select
                value={form.category || ''}
                onChange={e => update('category', e.target.value)}
                className="w-full rounded-lg border border-border bg-white px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary"
              >
                <option value="">Select category...</option>
                {CATEGORIES.map(c => <option key={c} value={c}>{c}</option>)}
              </select>
            </div>
            <Input label="Phone number" value={form.phone || ''} onChange={e => update('phone', e.target.value)} type="tel" />
            <Input label="Business address" value={form.address || ''} onChange={e => update('address', e.target.value)} />
            <Textarea
              label="Bio / What you're looking for in referrals"
              value={form.bio || ''}
              onChange={e => update('bio', e.target.value)}
              rows={3}
              placeholder="Tell other members what kinds of referrals you're looking for..."
            />
          </CardContent>
        </Card>

        <Card>
          <CardHeader><CardTitle>Social & Review Links</CardTitle></CardHeader>
          <CardContent className="space-y-4">
            <Input label="Google Review URL" value={form.google_review_url || ''} onChange={e => update('google_review_url', e.target.value)} placeholder="https://g.page/r/..." type="url" />
            <Input label="Website URL" value={form.website_url || ''} onChange={e => update('website_url', e.target.value)} placeholder="https://yourbusiness.com" type="url" />
            <Input label="Facebook URL" value={form.facebook_url || ''} onChange={e => update('facebook_url', e.target.value)} placeholder="https://facebook.com/..." type="url" />
            <Input label="Instagram URL" value={form.instagram_url || ''} onChange={e => update('instagram_url', e.target.value)} placeholder="https://instagram.com/..." type="url" />
            <Input label="LinkedIn URL" value={form.linkedin_url || ''} onChange={e => update('linkedin_url', e.target.value)} placeholder="https://linkedin.com/in/..." type="url" />
            <Input label="Nextdoor URL" value={form.nextdoor_url || ''} onChange={e => update('nextdoor_url', e.target.value)} placeholder="https://nextdoor.com/..." type="url" />
          </CardContent>
        </Card>

        {error && <p className="text-sm text-destructive">{error}</p>}
        {success && <p className="text-sm text-secondary font-medium">Profile saved successfully!</p>}

        <Button type="submit" loading={saving} size="lg" className="w-full">
          <Save size={16} />
          Save Profile
        </Button>
      </form>
    </div>
  )
}
