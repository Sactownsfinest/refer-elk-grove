'use client'
import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { cn } from '@/lib/utils'
import { Avatar } from '@/components/ui/avatar'
import type { Member } from '@/lib/types'
import {
  Home, Users, MessageSquare, Trophy, FileText, Settings, LogOut, Shield
} from 'lucide-react'
import { createClient } from '@/lib/supabase/client'
import { useRouter } from 'next/navigation'

const navItems = [
  { href: '/home', label: 'Home', icon: Home },
  { href: '/feed', label: 'Activity', icon: MessageSquare },
  { href: '/directory', label: 'Directory', icon: Users },
  { href: '/leaderboard', label: 'Leaderboard', icon: Trophy },
  { href: '/report', label: 'Report', icon: FileText },
]

interface NavigationProps {
  member: Member
}

export function Navigation({ member }: NavigationProps) {
  const pathname = usePathname()
  const router = useRouter()
  const supabase = createClient()

  async function handleSignOut() {
    await supabase.auth.signOut()
    router.push('/login')
    router.refresh()
  }

  return (
    <>
      {/* Sidebar — desktop */}
      <aside className="hidden md:flex flex-col w-60 bg-primary text-white min-h-screen fixed left-0 top-0 z-30">
        {/* Logo */}
        <div className="px-5 py-5 border-b border-white/10 flex items-center justify-center">
          <img
            src="/Refer%20Elk%20Grove.png"
            alt="Refer Elk Grove"
            style={{ height: 64, width: 'auto', filter: 'brightness(0) invert(1)' }}
            className="drop-shadow-lg"
          />
        </div>

        {/* Nav links */}
        <nav className="flex-1 px-3 py-4 space-y-1">
          {navItems.map(({ href, label, icon: Icon }) => (
            <Link
              key={href}
              href={href}
              className={cn(
                'flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-colors',
                pathname === href
                  ? 'bg-white/15 text-white'
                  : 'text-white/70 hover:bg-white/10 hover:text-white'
              )}
            >
              <Icon size={18} />
              {label}
            </Link>
          ))}
          {member.role === 'admin' && (
            <Link
              href="/admin"
              className={cn(
                'flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-colors',
                pathname.startsWith('/admin')
                  ? 'bg-white/15 text-white'
                  : 'text-white/70 hover:bg-white/10 hover:text-white'
              )}
            >
              <Shield size={18} />
              Admin
            </Link>
          )}
        </nav>

        {/* User section */}
        <div className="px-3 py-4 border-t border-white/10 space-y-1">
          <Link
            href="/profile"
            className={cn(
              'flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm transition-colors w-full',
              pathname === '/profile'
                ? 'bg-white/15 text-white'
                : 'text-white/70 hover:bg-white/10 hover:text-white'
            )}
          >
            <Avatar src={member.photo_url} name={member.name} size="sm" />
            <div className="min-w-0">
              <p className="font-medium text-white text-xs truncate">{member.name || 'My Profile'}</p>
              <p className="text-white/50 text-xs truncate">{member.business_name}</p>
            </div>
          </Link>
          <button
            onClick={handleSignOut}
            className="flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm text-white/70 hover:bg-white/10 hover:text-white transition-colors w-full"
          >
            <LogOut size={18} />
            Sign out
          </button>
        </div>
      </aside>

      {/* Bottom nav — mobile */}
      <nav className="md:hidden fixed bottom-0 left-0 right-0 bg-primary border-t border-white/10 z-30 pb-safe">
        <div className="flex items-center justify-around px-2 py-2">
          {navItems.map(({ href, label, icon: Icon }) => (
            <Link
              key={href}
              href={href}
              className={cn(
                'flex flex-col items-center gap-0.5 px-3 py-1 rounded-lg transition-colors',
                pathname === href ? 'text-accent' : 'text-white/60 hover:text-white'
              )}
            >
              <Icon size={20} />
              <span className="text-[10px] font-medium">{label}</span>
            </Link>
          ))}
          <Link
            href="/profile"
            className={cn(
              'flex flex-col items-center gap-0.5 px-3 py-1 rounded-lg transition-colors',
              pathname === '/profile' ? 'text-accent' : 'text-white/60 hover:text-white'
            )}
          >
            <Settings size={20} />
            <span className="text-[10px] font-medium">Profile</span>
          </Link>
        </div>
      </nav>
    </>
  )
}
