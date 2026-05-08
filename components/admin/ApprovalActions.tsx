'use client'
import { useState } from 'react'
import { Button } from '@/components/ui/button'
import { createClient } from '@/lib/supabase/client'
import { useRouter } from 'next/navigation'
import { Check, X } from 'lucide-react'

interface ApprovalActionsProps {
  memberId: string
}

export function ApprovalActions({ memberId }: ApprovalActionsProps) {
  const [loading, setLoading] = useState<'approve' | 'deny' | null>(null)
  const router = useRouter()

  async function handleApprove() {
    setLoading('approve')
    const supabase = createClient()
    await supabase.from('members').update({ status: 'active' }).eq('id', memberId)
    router.refresh()
    setLoading(null)
  }

  async function handleDeny() {
    if (!confirm('Deny and remove this membership request?')) return
    setLoading('deny')
    const supabase = createClient()
    await supabase.from('members').update({ status: 'inactive' }).eq('id', memberId)
    router.refresh()
    setLoading(null)
  }

  return (
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
  )
}
