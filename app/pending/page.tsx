'use client'
import { createClient } from '@/lib/supabase/client'
import { useRouter } from 'next/navigation'
import { Button } from '@/components/ui/button'

export default function PendingPage() {
  const router = useRouter()

  async function handleSignOut() {
    const supabase = createClient()
    await supabase.auth.signOut()
    router.push('/login')
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-primary to-secondary flex items-center justify-center p-4">
      <div className="bg-white rounded-2xl shadow-xl p-8 max-w-md w-full text-center">
        <div className="w-16 h-16 bg-accent/20 rounded-full flex items-center justify-center mx-auto mb-4">
          <span className="text-4xl">⏳</span>
        </div>
        <h1 className="text-xl font-bold text-gray-900 mb-2">Pending Approval</h1>
        <p className="text-muted text-sm mb-6">
          Your membership request is being reviewed by the group admin. You'll receive access once approved.
          Check back soon!
        </p>
        <Button variant="outline" onClick={handleSignOut} className="w-full">
          Sign Out
        </Button>
      </div>
    </div>
  )
}
