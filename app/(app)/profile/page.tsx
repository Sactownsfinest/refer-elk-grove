'use client'
import { useState, useEffect, useRef } from 'react'
import { createClient } from '@/lib/supabase/client'
import { Button } from '@/components/ui/button'
import { Input, Textarea } from '@/components/ui/input'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Avatar } from '@/components/ui/avatar'
import type { Member } from '@/lib/types'
import { Camera, Save, LogOut } from 'lucide-react'
import { useRouter } from 'next/navigation'

const CATEGORIES = [
  'Real Estate', 'Insurance', 'Financial Services', 'Legal', 'Healthcare',
  'Construction', 'Auto', 'Marketing', 'Technology', 'Retail',
  'Food & Beverage', 'Home Services', 'Education', 'Non-Profit', 'Other'
]

export default function ProfilePage() {
  const [member, setMember] = useState<Member | null>(null)
  const [form, setForm] = useState<Partial<Member>>({})
  const [loading, setLoading] = useState(false)
  const [saving, setSaving] = useState(false)
  const [success, setSuccess] = useState(false)
  const [error, setError] = useState('')
  const fileRef = useRef<HTMLInputElement>(null)
  const router = useRouter()

  useEffect(() => {
    async function load() {
      const supabase = createClient()
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) return
      const { data } = await supabase.from('members').select('*').eq('id', user.id).single()
      if (data) {
        setMember(data as Member)
        setForm(data as Member)
      }
    }
    load()
  }, [])

  function update(field: keyof Member, value: string) {
    setForm(prev => ({ ...prev, [field]: value }))
  }

  async function handlePhotoUpload(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0]
    if (!file || !member) return
    setLoading(true)
    const supabase = createClient()
    const ext = file.name.split('.').pop()
    const path = `${member.id}/avatar.${ext}`
    const { error: uploadErr } = await supabase.storage.from('avatars').upload(path, file, { upsert: true })
    if (!uploadErr) {
      const { data } = supabase.storage.from('avatars').getPublicUrl(path)
      setForm(prev => ({ ...prev, photo_url: data.publicUrl }))
    }
    setLoading(false)
  }

  async function handleSave(e: React.FormEvent) {
    e.preventDefault()
    if (!member) return
    setSaving(true)
    setError('')
    const supabase = createClient()
    const { error: err } = await supabase
      .from('members')
      .update({
        name: form.name,
        business_name: form.business_name,
        category: form.category,
        phone: form.phone,
        address: form.address,
        bio: form.bio,
        photo_url: form.photo_url,
        facebook_url: form.facebook_url,
        instagram_url: form.instagram_url,
        linkedin_url: form.linkedin_url,
        nextdoor_url: form.nextdoor_url,
        google_review_url: form.google_review_url,
        website_url: form.website_url,
      })
      .eq('id', member.id)

    if (err) {
      setError('Failed to save. Try again.')
    } else {
      setSuccess(true)
      setTimeout(() => setSuccess(false), 3000)
    }
    setSaving(false)
  }

  async function handleSignOut() {
    const supabase = createClient()
    await supabase.auth.signOut()
    router.push('/login')
  }

  if (!member) {
    return <div className="animate-pulse h-96 bg-gray-100 rounded-xl" />
  }

  return (
    <div className="space-y-5">
      <h1 className="text-2xl font-bold text-gray-900">My Profile</h1>

      <form onSubmit={handleSave} className="space-y-5">
        {/* Photo */}
        <Card>
          <CardContent className="p-5">
            <div className="flex items-center gap-4">
              <div className="relative">
                <Avatar src={form.photo_url} name={form.name} size="xl" />
                <button
                  type="button"
                  onClick={() => fileRef.current?.click()}
                  className="absolute bottom-0 right-0 w-7 h-7 bg-primary text-white rounded-full flex items-center justify-center shadow-md hover:bg-primary-light transition-colors"
                >
                  <Camera size={14} />
                </button>
                <input ref={fileRef} type="file" accept="image/*" className="hidden" onChange={handlePhotoUpload} />
              </div>
              <div>
                <p className="font-semibold text-gray-900">{member.name}</p>
                <p className="text-sm text-muted">{member.business_name}</p>
                {loading && <p className="text-xs text-primary mt-1">Uploading...</p>}
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Basic info */}
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
            <Textarea label="Bio / What you're looking for in referrals" value={form.bio || ''} onChange={e => update('bio', e.target.value)} rows={3} placeholder="Tell other members what kinds of referrals you're looking for..." />
          </CardContent>
        </Card>

        {/* Social links */}
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
        {success && <p className="text-sm text-secondary font-medium">Profile saved!</p>}

        <div className="flex gap-3">
          <Button type="submit" loading={saving} className="flex-1">
            <Save size={16} />
            Save Profile
          </Button>
          <Button type="button" variant="ghost" onClick={handleSignOut}>
            <LogOut size={16} />
            Sign Out
          </Button>
        </div>
      </form>
    </div>
  )
}
