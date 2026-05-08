'use client'
import { useState } from 'react'
import { createClient } from '@/lib/supabase/client'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import Link from 'next/link'

export default function RegisterPage() {
  const [name, setName] = useState('')
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [businessName, setBusinessName] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [done, setDone] = useState(false)

  async function handleRegister(e: React.FormEvent) {
    e.preventDefault()
    setLoading(true)
    setError('')

    const supabase = createClient()
    const { data, error: signUpErr } = await supabase.auth.signUp({ email, password })

    if (signUpErr || !data.user) {
      setError(signUpErr?.message || 'Registration failed')
      setLoading(false)
      return
    }

    // Create member record
    const { error: memberErr } = await supabase.from('members').insert({
      id: data.user.id,
      name: name.trim(),
      business_name: businessName.trim(),
      status: 'pending',
      role: 'member',
    })

    if (memberErr) {
      setError('Account created but profile setup failed. Please contact the admin.')
    } else {
      setDone(true)
    }
    setLoading(false)
  }

  if (done) {
    return (
      <div className="bg-white rounded-2xl shadow-xl p-8 text-center">
        <div className="w-14 h-14 bg-secondary/10 rounded-full flex items-center justify-center mx-auto mb-4">
          <span className="text-3xl">✅</span>
        </div>
        <h2 className="text-xl font-bold text-gray-900 mb-2">Request submitted!</h2>
        <p className="text-muted text-sm">
          Your membership request has been sent. You'll be able to sign in once an admin approves your account.
        </p>
        <div className="mt-6">
          <Link href="/login">
            <Button variant="outline" className="w-full">Back to Sign In</Button>
          </Link>
        </div>
      </div>
    )
  }

  return (
    <div className="bg-white rounded-2xl shadow-xl p-8">
      <h2 className="text-xl font-bold text-gray-900 mb-2">Request membership</h2>
      <p className="text-sm text-muted mb-6">An admin will review and approve your account.</p>
      <form onSubmit={handleRegister} className="space-y-4">
        <Input
          label="Your full name"
          value={name}
          onChange={e => setName(e.target.value)}
          placeholder="Jane Smith"
          required
        />
        <Input
          label="Business name"
          value={businessName}
          onChange={e => setBusinessName(e.target.value)}
          placeholder="Smith Insurance Agency"
          required
        />
        <Input
          label="Email address"
          type="email"
          value={email}
          onChange={e => setEmail(e.target.value)}
          placeholder="jane@smithinsurance.com"
          required
          autoComplete="email"
        />
        <Input
          label="Password"
          type="password"
          value={password}
          onChange={e => setPassword(e.target.value)}
          placeholder="Choose a strong password"
          required
          minLength={8}
          autoComplete="new-password"
        />
        {error && (
          <div className="p-3 bg-red-50 border border-red-100 rounded-lg">
            <p className="text-sm text-destructive">{error}</p>
          </div>
        )}
        <Button type="submit" loading={loading} className="w-full" size="lg">
          Request Access
        </Button>
      </form>
      <p className="text-center text-sm text-muted mt-6">
        Already a member?{' '}
        <Link href="/login" className="text-primary font-medium hover:underline">Sign in</Link>
      </p>
    </div>
  )
}
