import { NextResponse } from 'next/server'

export async function GET() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL
  const key = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY

  if (!url || !key) {
    return NextResponse.json({ ok: false, error: 'Env vars missing', url: !!url, key: !!key })
  }

  try {
    const res = await fetch(`${url}/auth/v1/settings`, {
      headers: { apikey: key },
      signal: AbortSignal.timeout(5000),
    })
    const data = await res.json()
    return NextResponse.json({ ok: res.ok, status: res.status, disable_signup: data?.disable_signup ?? 'unknown' })
  } catch (e) {
    return NextResponse.json({ ok: false, error: String(e) })
  }
}
