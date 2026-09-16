'use client'
import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { UserPlus, Check, Copy } from 'lucide-react'

const EMPTY = { name: '', email: '', phone: '', businessName: '' }

export function AddMemberForm() {
  const [form, setForm] = useState(EMPTY)
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState('')
  const [result, setResult] = useState<{ name: string; email: string; link: string; existed: boolean } | null>(null)
  const [copied, setCopied] = useState(false)
  const router = useRouter()

  function update(field: keyof typeof EMPTY, value: string) {
    setForm(prev => ({ ...prev, [field]: value }))
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setSaving(true)
    setError('')
    setResult(null)
    const res = await fetch('/api/admin/add-member', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(form),
    })
    const json = await res.json().catch(() => ({}))
    if (!res.ok || !json.link) {
      setError(json.error ?? `Could not add member (${res.status})`)
    } else {
      setResult({ name: form.name, email: form.email, link: json.link, existed: Boolean(json.existed) })
      setForm(EMPTY)
      router.refresh()
    }
    setSaving(false)
  }

  async function copyLink() {
    if (!result) return
    await navigator.clipboard.writeText(result.link)
    setCopied(true)
    setTimeout(() => setCopied(false), 3000)
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2"><UserPlus size={18} /> Add a member</CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <p className="text-sm text-muted">
          They're added as an active member right away. You get an invite link to text or email them;
          it lets them set a password and fill in the rest of their profile themselves.
        </p>
        <form onSubmit={handleSubmit} className="space-y-3">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <Input label="Full name" value={form.name} onChange={e => update('name', e.target.value)} placeholder="Jane Smith" required />
            <Input label="Email" type="email" value={form.email} onChange={e => update('email', e.target.value)} placeholder="jane@example.com" required />
            <Input label="Phone (optional)" type="tel" value={form.phone} onChange={e => update('phone', e.target.value)} placeholder="916-555-1234" />
            <Input label="Business (optional)" value={form.businessName} onChange={e => update('businessName', e.target.value)} placeholder="They can fill this in" />
          </div>
          {error && <p className="text-sm text-destructive">{error}</p>}
          <Button type="submit" loading={saving} className="gap-1.5">
            <UserPlus size={15} /> Add member & get invite link
          </Button>
        </form>

        {result && (
          <div className="rounded-xl border border-green-200 bg-green-50 p-4 space-y-2">
            <p className="text-sm font-semibold text-green-800 flex items-center gap-1.5">
              <Check size={15} /> {result.existed ? `${result.name} updated and active.` : `${result.name} added and active.`}
            </p>
            <p className="text-xs text-green-800">Send this link to {result.email}. It lets them set their password and log in:</p>
            <div className="flex gap-2 items-center">
              <input
                readOnly
                value={result.link}
                onFocus={e => e.target.select()}
                className="flex-1 min-w-0 rounded-lg border border-border bg-white px-2 py-1.5 text-xs text-gray-700"
              />
              <Button type="button" variant="outline" size="sm" onClick={copyLink} className="gap-1.5 shrink-0">
                {copied ? <><Check size={13} className="text-green-600" /> Copied!</> : <><Copy size={13} /> Copy</>}
              </Button>
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  )
}
