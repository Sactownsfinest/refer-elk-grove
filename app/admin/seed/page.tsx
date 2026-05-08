'use client'
import { useState } from 'react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'

type MemberRow = {
  name: string
  businessName: string
  category: string
  phone: string
  email: string
}

const INITIAL_MEMBERS: MemberRow[] = [
  { name: 'Karla Cano',     businessName: "Karla's Pet Care",   category: 'Pet Care',          phone: '916-812-6380', email: '' },
  { name: 'Lou Basinal',    businessName: 'Age in Place',        category: 'Home Health',       phone: '916-302-3038', email: '' },
  { name: 'Frisha Moore',   businessName: 'Moore Learning',      category: 'Education',         phone: '916-866-7027', email: '' },
  { name: 'Steve Snear',    businessName: 'The Glass Guy',       category: 'Glass and Windows', phone: '916-714-4405', email: '' },
  { name: 'Eli Lopez',      businessName: 'SAFE Credit Union',   category: 'Banking',           phone: '916-504-9180', email: '' },
  { name: 'Lilian Ofomali', businessName: 'Lilyz Catering',      category: 'Catering',          phone: '916-612-7913', email: '' },
  { name: 'Alfonso De',     businessName: 'One Hour HVAC',       category: 'HVAC',              phone: '916-905-5550', email: '' },
  { name: 'Elena Kyriacou', businessName: 'Drain Time',          category: 'Plumbing',          phone: '916-405-1227', email: '' },
  { name: 'Emil Canlas',    businessName: 'BBSI',                category: 'Consulting',        phone: '925-207-5357', email: '' },
  { name: 'Brian Stone',    businessName: 'Leavitt United',      category: 'Commercial',        phone: '916-405-9187', email: '' },
  { name: 'Jeff Behrendt',  businessName: 'Pacific Pure Water',  category: 'Drinking Water',    phone: '916-504-9969', email: '' },
  { name: 'Mike Brandt',    businessName: 'Edward Jones',        category: 'Financial Planning',phone: '916-685-6753', email: '' },
  { name: 'Liz Watkins',    businessName: 'RC Willey',           category: 'Furniture',         phone: '916-665-3100', email: '' },
]

type Result = { name: string; success: boolean; error?: string }

export default function SeedMembersPage() {
  const [members, setMembers] = useState<MemberRow[]>(INITIAL_MEMBERS)
  const [loading, setLoading] = useState(false)
  const [results, setResults] = useState<Result[] | null>(null)

  function update(index: number, field: keyof MemberRow, value: string) {
    setMembers(prev => prev.map((m, i) => i === index ? { ...m, [field]: value } : m))
  }

  async function handleSeed() {
    setLoading(true)
    setResults(null)
    const res = await fetch('/api/admin/seed', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(members),
    })
    const data = await res.json()
    setResults(data.results ?? [{ name: 'Unknown', success: false, error: data.error }])
    setLoading(false)
  }

  const emailsFilled = members.filter(m => m.email.trim()).length
  const total = members.length

  return (
    <div>
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-gray-900">Add Members to Directory</h1>
        <p className="text-muted text-sm mt-1">
          Fill in each member's email and click Add to Directory. No emails are sent — members
          appear in the directory immediately. When you're ready for someone to log in, go to
          Supabase → Authentication → Users and send them a password reset email.
        </p>
      </div>

      {results && (
        <div className="mb-6 rounded-xl border border-border bg-white p-4 space-y-2">
          <p className="font-semibold text-sm mb-3">Results</p>
          {results.map((r, i) => (
            <div key={i} className="flex items-center gap-2 text-sm">
              <span>{r.success ? '✅' : '❌'}</span>
              <span className="font-medium">{r.name}</span>
              {r.error && <span className="text-destructive">— {r.error}</span>}
            </div>
          ))}
        </div>
      )}

      <div className="bg-white rounded-xl border border-border overflow-hidden mb-6">
        <table className="w-full text-sm">
          <thead className="bg-gray-50 border-b border-border">
            <tr>
              <th className="px-4 py-3 text-left font-medium text-muted">Name</th>
              <th className="px-4 py-3 text-left font-medium text-muted">Business</th>
              <th className="px-4 py-3 text-left font-medium text-muted">Category</th>
              <th className="px-4 py-3 text-left font-medium text-muted">Phone</th>
              <th className="px-4 py-3 text-left font-medium text-muted">
                Email <span className="text-destructive">*</span>
              </th>
            </tr>
          </thead>
          <tbody className="divide-y divide-border">
            {members.map((m, i) => (
              <tr key={i} className="hover:bg-gray-50">
                <td className="px-4 py-2">
                  <input
                    className="w-full bg-transparent outline-none text-gray-900 placeholder:text-muted"
                    value={m.name}
                    onChange={e => update(i, 'name', e.target.value)}
                  />
                </td>
                <td className="px-4 py-2">
                  <input
                    className="w-full bg-transparent outline-none text-gray-900 placeholder:text-muted"
                    value={m.businessName}
                    onChange={e => update(i, 'businessName', e.target.value)}
                  />
                </td>
                <td className="px-4 py-2">
                  <input
                    className="w-full bg-transparent outline-none text-gray-900 placeholder:text-muted"
                    value={m.category}
                    onChange={e => update(i, 'category', e.target.value)}
                  />
                </td>
                <td className="px-4 py-2">
                  <input
                    className="w-full bg-transparent outline-none text-gray-900 placeholder:text-muted"
                    value={m.phone}
                    onChange={e => update(i, 'phone', e.target.value)}
                  />
                </td>
                <td className="px-4 py-2">
                  <input
                    className="w-full bg-transparent outline-none placeholder:text-red-300 text-gray-900"
                    type="email"
                    placeholder="email@example.com"
                    value={m.email}
                    onChange={e => update(i, 'email', e.target.value)}
                  />
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      <div className="flex items-center gap-4">
        <Button onClick={handleSeed} loading={loading} size="lg" disabled={emailsFilled === 0}>
          Add to Directory ({emailsFilled}/{total} emails filled)
        </Button>
        <p className="text-xs text-muted">
          Only rows with an email will be processed. You can run this multiple times.
        </p>
      </div>
    </div>
  )
}
