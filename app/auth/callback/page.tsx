'use client'
import { useEffect, useState } from 'react'
import { createClient } from '@/lib/supabase/client'
import { useRouter } from 'next/navigation'
import { Card, CardContent } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'

export default function AuthCallbackPage() {
  const [type, setType] = useState<string | null>(null)
  const [password, setPassword] = useState('')
  const [confirm, setConfirm] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [ready, setReady] = useState(false)
  const router = useRouter()
  const supabase = createClient()

  useEffect(() => {
    // Supabase puts tokens in the URL hash after redirect
    // onAuthStateChange fires once the session is established from the hash
    const { data: { subscription } } = supabase.auth.onAuthStateChange((event, session) => {
      if (event === 'PASSWORD_RECOVERY') {
        setType('recovery')
        setReady(true)
      } else if (session && event === 'SIGNED_IN') {
        setType('signin')
        router.replace('/home')
      }
    })
    return () => subscription.unsubscribe()
  }, [])

  async function handleSetPassword(e: React.FormEvent) {
    e.preventDefault()
    if (password !== confirm) { setError('Passwords do not match'); return }
    if (password.length < 8) { setError('Password must be at least 8 characters'); return }
    setLoading(true)
    setError('')
    const { error } = await supabase.auth.updateUser({ password })
    if (error) {
      setError(error.message)
      setLoading(false)
    } else {
      router.replace('/home')
    }
  }

  if (!ready && type !== 'recovery') {
    return (
      <div className="min-h-screen bg-gradient-to-br from-primary to-secondary flex items-center justify-center">
        <p className="text-white/70 text-sm">Signing you in…</p>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-primary to-secondary flex items-center justify-center p-4">
      <div className="w-full max-w-sm">
        <div className="text-center mb-8">
          <img
            src="/Refer%20Elk%20Grove.png"
            alt="Refer Elk Grove"
            style={{ height: 120, width: 'auto', filter: 'brightness(0) invert(1)' }}
            className="mx-auto drop-shadow-xl"
          />
        </div>
        <Card>
          <CardContent className="p-6 space-y-4">
            <h2 className="text-xl font-bold text-gray-900 text-center">Set Your Password</h2>
            <p className="text-sm text-muted text-center">Choose a password to secure your account.</p>
            <form onSubmit={handleSetPassword} className="space-y-3">
              <Input
                label="New password"
                type="password"
                placeholder="At least 8 characters"
                value={password}
                onChange={e => setPassword(e.target.value)}
                required
              />
              <Input
                label="Confirm password"
                type="password"
                placeholder="Repeat password"
                value={confirm}
                onChange={e => setConfirm(e.target.value)}
                required
              />
              {error && <p className="text-sm text-destructive">{error}</p>}
              <Button type="submit" loading={loading} className="w-full">
                Set Password & Enter
              </Button>
            </form>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
