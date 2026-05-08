import { createServerClient } from '@supabase/ssr'
import { NextResponse, type NextRequest } from 'next/server'

export async function middleware(request: NextRequest) {
  let supabaseResponse = NextResponse.next({ request })

  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll() {
          return request.cookies.getAll()
        },
        setAll(cookiesToSet) {
          cookiesToSet.forEach(({ name, value }) => request.cookies.set(name, value))
          supabaseResponse = NextResponse.next({ request })
          cookiesToSet.forEach(({ name, value, options }) =>
            supabaseResponse.cookies.set(name, value, options)
          )
        },
      },
    }
  )

  const { data: { user } } = await supabase.auth.getUser()

  const { pathname } = request.nextUrl
  const isAuthRoute = pathname.startsWith('/login') || pathname.startsWith('/register')
  const isPendingRoute = pathname === '/pending'
  const isAdminRoute = pathname.startsWith('/admin')
  const isApiRoute = pathname.startsWith('/api')

  if (isApiRoute) return supabaseResponse

  if (!user) {
    if (!isAuthRoute) {
      return NextResponse.redirect(new URL('/login', request.url))
    }
    return supabaseResponse
  }

  const { data: member } = await supabase
    .from('members')
    .select('status, role')
    .eq('id', user.id)
    .single()

  if (!member) {
    await supabase.auth.signOut()
    return NextResponse.redirect(new URL('/login', request.url))
  }

  if (member.status === 'pending' && !isPendingRoute && !isAuthRoute) {
    return NextResponse.redirect(new URL('/pending', request.url))
  }

  if (member.status === 'active' && isPendingRoute) {
    return NextResponse.redirect(new URL('/home', request.url))
  }

  if (isAdminRoute && member.role !== 'admin') {
    return NextResponse.redirect(new URL('/home', request.url))
  }

  if (isAuthRoute && member.status === 'active') {
    return NextResponse.redirect(new URL('/home', request.url))
  }

  return supabaseResponse
}

export const config = {
  matcher: ['/((?!_next/static|_next/image|favicon.ico|icons|manifest.json).*)'],
}
