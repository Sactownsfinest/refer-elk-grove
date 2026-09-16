'use client'
import { useState } from 'react'
import { Button } from '@/components/ui/button'
import { useRouter } from 'next/navigation'
import { Check, X, Copy } from 'lucide-react'

interface ApprovalActionsProps {
  memberId: string
}

// Approvals go through the server (service role) instead of the browser client.
// The old browser-side update was silently blocked by row-level security, so the
// button flashed and nothing changed. This path also surfaces any error.
export function ApprovalActions({ memberId }: ApprovalActionsProps) {
  const [loading, setLoading] = useState<'approve' | 'deny' | null>(null)
  const [error, setError] = useState('')
  const [inviteLink, setInviteLink] = useState('')
  const [copied, setCopied] = useState(false)
  const router = useRouter()

  async function setStatus(status: 'active' | 'inactive') {
    const res = await fetch('/api/admin/update-member', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ memberId, changes: { status } }),
    })
    const json = await res.json().catch(() => ({}))
    if (!res.ok) throw new Error(json.error ?? `Request failed (${res.status})`)
  }

  async function handleApprove() {
    setLoading('approve')
    setError('')
    try {
      await setStatus('active')
      // Hand the admin a ready-to-send invite link so the new member can set a password.
      const res = await fetch('/api/admin/invite-link', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ memberId }),
      })
      const json = await res.json().catch(() => ({}))
      if (res.ok && json.link) setInviteLink(json.link)
      else router.refresh()
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Approval failed')
    }
    setLoading(null)
  }

  async function handleDeny() {
    if (!confirm('Deny and remove this membership request?')) return
    setLoading('deny')
    setError('')
    try {
      await setStatus('inactive')
      router.refresh()
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Deny failed')
    }
    setLoading(null)
  }

  async function copyLink() {
    await navigator.clipboard.writeText(inviteLink)
    setCopied(true)
    setTimeout(() => setCopied(false), 3000)
  }

  if (inviteLink) {
    return (
      <div className="flex flex-col gap-1 w-full">
        <p className="text-sm font-medium text-green-700 flex items-center gap-1">
          <Check size={14} /> Approved. Send them this invite link:
        </p>
        <div className="flex gap-2 items-center">
          <input
            readOnly
            value={inviteLink}
            className="flex-1 min-w-0 rounded-lg border border-border bg-gray-50 px-2 py-1.5 text-xs text-gray-700"
            onFocus={e => e.target.select()}
          />
          <Button variant="outline" size="sm" onClick={copyLink} className="gap-1.5">
            {copied ? <><Check size={13} className="text-green-600" /> Copied!</> : <><Copy size={13} /> Copy</>}
          </Button>
          <Button variant="ghost" size="sm" onClick={() => router.refresh()}>Done</Button>
        </div>
      </div>
    )
  }

  return (
    <div className="flex flex-col gap-1">
      <div className="flex gap-2">
        <Button
          variant="secondary"
          size="sm"
          onClick={handleApprove}
          loading={loading === 'approve'}
        >
          <Check size={14} />
          Approve
        </Button>
        <Button
          variant="destructive"
          size="sm"
          onClick={handleDeny}
          loading={loading === 'deny'}
        >
          <X size={14} />
          Deny
        </Button>
      </div>
      {error && <p className="text-xs text-destructive">{error}</p>}
    </div>
  )
}
