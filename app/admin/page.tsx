import { createAdminClient, createClient } from '@/lib/supabase/server'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Avatar } from '@/components/ui/avatar'
import { Badge } from '@/components/ui/badge'
import { ApprovalActions } from '@/components/admin/ApprovalActions'
import type { Member } from '@/lib/types'
import { formatDate } from '@/lib/utils'
import { UserCheck } from 'lucide-react'

export default async function AdminPage() {
  const admin = createAdminClient()

  const { data: pending } = await admin
    .from('members')
    .select('*')
    .eq('status', 'pending')
    .order('created_at', { ascending: true })

  return (
    <div className="space-y-5">
      <div>
        <h1 className="text-2xl font-bold text-gray-900">Approval Queue</h1>
        <p className="text-muted text-sm mt-1">{pending?.length ?? 0} pending requests</p>
      </div>

      {!pending || pending.length === 0 ? (
        <Card>
          <CardContent className="py-16 text-center">
            <UserCheck size={40} className="mx-auto mb-3 text-secondary opacity-60" />
            <p className="text-muted text-sm">No pending membership requests</p>
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-3">
          {pending.map(member => (
            <Card key={member.id}>
              <CardContent className="p-4">
                <div className="flex items-center gap-3 flex-wrap">
                  <Avatar src={member.photo_url} name={member.name} size="md" />
                  <div className="flex-1 min-w-0">
                    <p className="font-semibold text-gray-900">{member.name}</p>
                    <p className="text-sm text-muted">{member.business_name}</p>
                    <p className="text-xs text-muted">Requested {formatDate(member.created_at)}</p>
                  </div>
                  <Badge variant="pending">Pending</Badge>
                  <ApprovalActions memberId={member.id} />
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  )
}
