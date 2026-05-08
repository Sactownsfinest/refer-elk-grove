import { redirect } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'
import Link from 'next/link'
import { Navigation } from '@/components/Navigation'
import type { Member } from '@/lib/types'
import { Shield, Users, Megaphone, LayoutDashboard, UserPlus } from 'lucide-react'

export default async function AdminLayout({ children }: { children: React.ReactNode }) {
  const supabase = await createClient()
  const { data: { session } } = await supabase.auth.getSession()
  if (!session) redirect('/login')

  const { data: member } = await supabase.from('members').select('*').eq('id', session.user.id).single()
  if (!member || member.role !== 'admin') redirect('/')

  return (
    <div className="min-h-screen bg-background flex">
      <Navigation member={member as Member} />
      <main className="flex-1 md:ml-60 pb-20 md:pb-0 min-h-screen">
        <div className="max-w-4xl mx-auto px-4 py-6">
          {/* Admin sub-nav */}
          <div className="flex items-center gap-2 mb-6 p-3 bg-primary/5 border border-primary/10 rounded-xl flex-wrap">
            <Shield size={16} className="text-primary" />
            <span className="text-sm font-semibold text-primary mr-2">Admin:</span>
            <Link href="/admin" className="text-sm text-muted hover:text-primary transition-colors flex items-center gap-1">
              <LayoutDashboard size={14} /> Approvals
            </Link>
            <span className="text-muted">·</span>
            <Link href="/admin/members" className="text-sm text-muted hover:text-primary transition-colors flex items-center gap-1">
              <Users size={14} /> Members
            </Link>
            <span className="text-muted">·</span>
            <Link href="/admin/announcements" className="text-sm text-muted hover:text-primary transition-colors flex items-center gap-1">
              <Megaphone size={14} /> Announcements
            </Link>
            <span className="text-muted">·</span>
            <Link href="/admin/seed" className="text-sm text-muted hover:text-primary transition-colors flex items-center gap-1">
              <UserPlus size={14} /> Seed Members
            </Link>
          </div>
          {children}
        </div>
      </main>
    </div>
  )
}
