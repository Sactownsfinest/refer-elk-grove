'use client'
import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { cn } from '@/lib/utils'
import { Avatar } from '@/components/ui/avatar'
import type { Member } from '@/lib/types'
import {
  Home, Users, MessageSquare, Trophy, FileText, Settings, LogOut, Shield, Download
} from 'lucide-react'
import { createClient } from '@/lib/supabase/client'
import { useRouter } from 'next/navigation'
import { InstallPrompt } from '@/components/InstallPrompt'
import { useEffect, useState } from 'react'

const navItems = [
  { href: '/home', label: 'Home', icon: Home },
  { href: '/feed', label: 'Activity', icon: MessageSquare },
  { href: '/directory', label: 'Directory', icon: Users },
  { href: '/leaderboard', label: 'Board', icon: Trophy },
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
      {/* ── Mobile top header ── */}
      <header className="md:hidden fixed top-0 left-0 right-0 bg-primary z-30 flex items-center justify-between px-3 py-2 border-b border-white/10">
        {/* Logo */}
        <img
          src="/Refer%20Elk%20Grove.png"
          alt="Refer Elk Grove"
          style={{ height: 38, width: 'auto', filter: 'brightness(0) invert(1)' }}
        />
        {/* Right actions */}
        <div className="flex items-center gap-1">
          <MobileInstallButton />
          <button
            onClick={handleSignOut}
            className="flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg text-xs text-white/70 hover:bg-white/10 hover:text-white transition-colors"
          >
            <LogOut size={16} />
            <span>Sign out</span>
          </button>
        </div>
      </header>

      {/* Sidebar — desktop */}
      <aside className="hidden md:flex flex-col w-60 bg-primary text-white min-h-screen fixed left-0 top-0 z-30">
        {/* Logo */}
        <div className="border-b border-white/10">
          <img
            src="/Refer%20Elk%20Grove.png"
            alt="Refer Elk Grove"
            style={{ width: '100%', height: 'auto', display: 'block', filter: 'brightness(0) invert(1)', padding: '10px 12px' }}
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
          <InstallPrompt />
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
                'flex flex-col items-center gap-0.5 px-2 py-1 rounded-lg transition-colors',
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
              'flex flex-col items-center gap-0.5 px-2 py-1 rounded-lg transition-colors',
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

// Inline mobile install button so it has its own state
function MobileInstallButton() {
  const [prompt, setPrompt] = useState<Event & { prompt: () => Promise<void> } | null>(null)
  const [isIOS, setIsIOS] = useState(false)
  const [showIOSHint, setShowIOSHint] = useState(false)
  const [installed, setInstalled] = useState(false)

  useEffect(() => {
    if (window.matchMedia('(display-mode: standalone)').matches) {
      setInstalled(true)
      return
    }
    const ios = /iphone|ipad|ipod/i.test(navigator.userAgent) && !(window.navigator as any).standalone
    setIsIOS(ios)
    const handler = (e: Event) => { e.preventDefault(); setPrompt(e as any) }
    window.addEventListener('beforeinstallprompt', handler)
    return () => window.removeEventListener('beforeinstallprompt', handler)
  }, [])

  if (installed) return null

  if (isIOS) {
    return (
      <div className="relative">
        <button
          onClick={() => setShowIOSHint(h => !h)}
          className="flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg text-xs text-white/70 hover:bg-white/10 hover:text-white transition-colors"
        >
          <Download size={16} />
          <span>Install</span>
        </button>
        {showIOSHint && (
          <div className="absolute right-0 top-10 w-56 p-3 bg-primary border border-white/20 rounded-xl text-xs text-white/80 leading-relaxed z-50 shadow-xl">
            Tap the <strong className="text-white">Share</strong> button in Safari, then <strong className="text-white">Add to Home Screen</strong>
          </div>
        )}
      </div>
    )
  }

  if (!prompt) return null

  return (
    <button
      onClick={async () => { await prompt.prompt(); setPrompt(null) }}
      className="flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg text-xs text-white/70 hover:bg-white/10 hover:text-white transition-colors"
    >
      <Download size={16} />
      <span>Install</span>
    </button>
  )
}
