import { createClient } from '@/lib/supabase/server'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Avatar } from '@/components/ui/avatar'
import { Badge } from '@/components/ui/badge'
import { MemberAdminActions } from '@/components/admin/MemberAdminActions'
import type { Member } from '@/lib/types'

export default async function AdminMembersPage() {
  const supabase = await createClient()

  const { data: members } = await supabase
    .from('members')
    .select('*')
    .order('created_at', { ascending: true })

  return (
    <div className="space-y-5">
      <div>
        <h1 className="text-2xl font-bold text-gray-900">All Members</h1>
        <p className="text-muted text-sm mt-1">{members?.length ?? 0} total accounts</p>
      </div>

      <Card>
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-border text-left">
                <th className="px-4 py-3 text-xs text-muted font-medium">Member</th>
                <th className="px-4 py-3 text-xs text-muted font-medium">Status</th>
                <th className="px-4 py-3 text-xs text-muted font-medium">Role</th>
                <th className="px-4 py-3 text-xs text-muted font-medium">Actions</th>
              </tr>
            </thead>
            <tbody>
              {(members || []).map(member => (
                <tr key={member.id} className="border-b border-border/50 last:border-0">
                  <td className="px-4 py-3">
                    <div className="flex items-center gap-2">
                      <Avatar src={member.photo_url} name={member.name} size="sm" />
                      <div>
                        <p className="font-medium text-gray-900">{member.name || '(no name)'}</p>
                        <p className="text-xs text-muted">{member.business_name}</p>
                      </div>
                    </div>
                  </td>
                  <td className="px-4 py-3">
                    <Badge variant={member.status as 'pending' | 'active' | 'inactive'}>
                      {member.status}
                    </Badge>
                  </td>
                  <td className="px-4 py-3">
                    {member.role === 'admin' && <Badge variant="admin">Admin</Badge>}
                  </td>
                  <td className="px-4 py-3">
                    <MemberAdminActions member={member as Member} />
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </Card>
    </div>
  )
}
