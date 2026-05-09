'use client'
import { useEffect, useState, Suspense } from 'react'
import { useSearchParams, useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'
import { Card, CardContent } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'

function VerifyInner() {
  const searchParams = useSearchParams()
  const router = useRouter()
  const [status, setStatus] = useState<'verifying' | 'set-password' | 'error'>('verifying')
  const [errorMsg, setErrorMsg] = useState('')
  const [password, setPassword] = useState('')
  const [confirm, setConfirm] = useState('')
  const [saving, setSaving] = useState(false)
  const [saveError, setSaveError] = useState('')

  useEffect(() => {
    const tokenHash = searchParams.get('token_hash')
    const type = (searchParams.get('type') ?? 'recovery') as 'recovery'

    if (!tokenHash) {
      setErrorMsg('Invalid invite link — no token found.')
      setStatus('error')
      return
    }

    const supabase = createClient()
    supabase.auth.verifyOtp({ token_hash: tokenHash, type })
      .then(({ error }) => {
        if (error) {
          setErrorMsg(error.message)
          setStatus('error')
        } else {
          setStatus('set-password')
        }
      })
  }, [])

  async function handleSetPassword(e: React.FormEvent) {
    e.preventDefault()
    if (password !== confirm) { setSaveError('Passwords do not match'); return }
    if (password.length < 8) { setSaveError('Password must be at least 8 characters'); return }
    setSaving(true)
    setSaveError('')
    const supabase = createClient()
    const { error } = await supabase.auth.updateUser({ password })
    if (error) {
      setSaveError(error.message)
      setSaving(false)
    } else {
      router.replace('/home')
    }
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-primary to-secondary flex items-center justify-center p-4">
      <div className="w-full max-w-sm">
        <div className="text-center mb-8">
          <img
            src="/logo.png"
            alt="Refer Elk Grove"
            style={{ height: 140, width: 'auto', filter: 'brightness(0) invert(1)' }}
            className="mx-auto drop-shadow-xl"
          />
        </div>

        <Card>
          <CardContent className="p-6">
            {status === 'verifying' && (
              <p className="text-center text-muted text-sm py-4">Verifying your invite link…</p>
            )}

            {status === 'error' && (
              <div className="text-center space-y-3">
                <p className="text-destructive font-semibold">Link expired or invalid</p>
                <p className="text-sm text-muted">{errorMsg}</p>
                <p className="text-xs text-muted">Ask your admin to generate a new invite link.</p>
              </div>
            )}

            {status === 'set-password' && (
              <form onSubmit={handleSetPassword} className="space-y-4">
                <div className="text-center mb-2">
                  <h2 className="text-xl font-bold text-gray-900">Welcome!</h2>
                  <p className="text-sm text-muted mt-1">Set a password to secure your account.</p>
                </div>
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
                {saveError && <p className="text-sm text-destructive">{saveError}</p>}
                <Button type="submit" loading={saving} className="w-full">
                  Set Password & Enter
                </Button>
              </form>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  )
}

export default function AuthVerifyPage() {
  return (
    <Suspense>
      <VerifyInner />
    </Suspense>
  )
}
