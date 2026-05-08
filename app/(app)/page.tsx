import { redirect } from 'next/navigation'

// Satisfies Next.js route group requirement. app/page.tsx handles the actual / route.
export default function AppPage() {
  redirect('/home')
}
