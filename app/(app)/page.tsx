'use client'
import { useEffect } from 'react'
import { useRouter } from 'next/navigation'

// This page satisfies the (app) layout group.
// The actual / route is handled by app/page.tsx which redirects to /home.
export default function AppPage() {
  const router = useRouter()
  useEffect(() => { router.replace('/home') }, [router])
  return null
}
