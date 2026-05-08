'use client'
import { useState } from 'react'
import { Button } from '@/components/ui/button'
import { createClient } from '@/lib/supabase/client'
import { useRouter } from 'next/navigation'
import type { Member } from '@/lib/types'

interface MemberAdminActionsProps {
  member: Member
}

export function MemberAdminActions({ member }: MemberAdminActionsProps) {
  const [loading, setLoading] = useState(false)
  const router = useRouter()

  async function update(changes: Partial<Member>) {
    setLoading(true)
    const supabase = createClient()
    await supabase.from('members').update(changes).eq('id', member.id)
    router.refresh()
    setLoading(false)
  }

  return (
    <div className="flex gap-2 flex-wrap">
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
    </div>
  )
}
