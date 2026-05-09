'use client'
import { useState } from 'react'
import { Button } from '@/components/ui/button'
import { useRouter } from 'next/navigation'
import type { Member } from '@/lib/types'
import { Copy, Check, Link } from 'lucide-react'

interface MemberAdminActionsProps {
  member: Member
}

export function MemberAdminActions({ member }: MemberAdminActionsProps) {
  const [loading, setLoading]         = useState(false)
  const [linkLoading, setLinkLoading] = useState(false)
  const [copied, setCopied]           = useState(false)
  const [linkError, setLinkError]     = useState('')
  const router = useRouter()

  async function update(changes: Partial<Member>) {
    setLoading(true)
    await fetch('/api/admin/update-member', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ memberId: member.id, changes }),
    })
    router.refresh()
    setLoading(false)
  }

  async function getInviteLink() {
    setLinkLoading(true)
    setLinkError('')
    const res = await fetch('/api/admin/invite-link', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ memberId: member.id }),
    })
    const json = await res.json()
    if (!res.ok || !json.link) {
      setLinkError(json.error ?? 'Failed to generate link')
      setLinkLoading(false)
      return
    }
    await navigator.clipboard.writeText(json.link)
    setCopied(true)
    setTimeout(() => setCopied(false), 3000)
    setLinkLoading(false)
  }

  return (
    <div className="flex gap-2 flex-wrap items-center">
      {member.status === 'active' && (
        <Button variant="outline" size="sm" onClick={() => update({ status: 'inactive' })} loading={loading}>
          Deactivate
        </Button>
      )}
      {member.status === 'inactive' && (
        <Button variant="secondary" size="sm" onClick={() => update({ status: 'active' })} loading={loading}>
          Reactivate
        </Button>
      )}
      {member.role === 'member' && (
        <Button variant="ghost" size="sm" onClick={() => update({ role: 'admin' })} loading={loading}>
          Make Admin
        </Button>
      )}
      {member.role === 'admin' && (
        <Button variant="ghost" size="sm" onClick={() => update({ role: 'member' })} loading={loading}>
          Remove Admin
        </Button>
      )}

      {/* Invite / password reset link */}
      <Button
        variant="outline"
        size="sm"
        onClick={getInviteLink}
        loading={linkLoading}
        className="gap-1.5"
      >
        {copied
          ? <><Check size={13} className="text-green-600" /> Copied!</>
          : <><Link size={13} /> Invite Link</>
        }
      </Button>
      {linkError && <p className="text-xs text-destructive w-full">{linkError}</p>}
    </div>
  )
}
