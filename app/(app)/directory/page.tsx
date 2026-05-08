'use client'
import { useEffect, useState } from 'react'
import { createClient } from '@/lib/supabase/client'
import { MemberCard } from '@/components/MemberCard'
import { Input } from '@/components/ui/input'
import type { Member } from '@/lib/types'
import { Search, Users } from 'lucide-react'

export default function DirectoryPage() {
  const [members, setMembers] = useState<Member[]>([])
  const [search, setSearch] = useState('')
  const [category, setCategory] = useState('')
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    async function load() {
      const supabase = createClient()
      const { data } = await supabase
        .from('members')
        .select('*')
        .eq('status', 'active')
        .order('name')
      setMembers((data as Member[]) || [])
      setLoading(false)
    }
    load()
  }, [])

  const categories = Array.from(new Set(members.map(m => m.category).filter(Boolean)))

  const filtered = members.filter(m => {
    const matchSearch = !search ||
      m.name?.toLowerCase().includes(search.toLowerCase()) ||
      m.business_name?.toLowerCase().includes(search.toLowerCase()) ||
      m.category?.toLowerCase().includes(search.toLowerCase())
    const matchCategory = !category || m.category === category
    return matchSearch && matchCategory
  })

  return (
    <div className="space-y-5">
      <div>
        <h1 className="text-2xl font-bold text-gray-900">Member Directory</h1>
        <p className="text-muted text-sm mt-1">{members.length} members</p>
      </div>

      {/* Filters */}
      <div className="flex gap-3 flex-wrap">
        <div className="flex-1 min-w-48 relative">
          <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-muted" />
          <input
            type="text"
            placeholder="Search members..."
            value={search}
            onChange={e => setSearch(e.target.value)}
            className="w-full rounded-lg border border-border bg-white pl-9 pr-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary"
          />
        </div>
        {categories.length > 0 && (
          <select
            value={category}
            onChange={e => setCategory(e.target.value)}
            className="rounded-lg border border-border bg-white px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary"
          >
            <option value="">All categories</option>
            {categories.map(c => (
              <option key={c} value={c!}>{c}</option>
            ))}
          </select>
        )}
      </div>

      {loading ? (
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          {[...Array(6)].map((_, i) => (
            <div key={i} className="h-48 bg-gray-100 rounded-xl animate-pulse" />
          ))}
        </div>
      ) : filtered.length === 0 ? (
        <div className="text-center py-16 text-muted">
          <Users size={40} className="mx-auto mb-3 opacity-30" />
          <p className="text-sm">No members found</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          {filtered.map(member => (
            <MemberCard key={member.id} member={member} />
          ))}
        </div>
      )}
    </div>
  )
}
