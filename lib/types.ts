export type MemberStatus = 'pending' | 'active' | 'inactive'
export type MemberRole = 'member' | 'admin'
export type PostType = 'message' | 'shoutout' | 'referral' | 'close'

export interface Member {
  id: string
  name: string | null
  business_name: string | null
  category: string | null
  phone: string | null
  address: string | null
  bio: string | null
  photo_url: string | null
  facebook_url: string | null
  instagram_url: string | null
  linkedin_url: string | null
  nextdoor_url: string | null
  google_review_url: string | null
  website_url: string | null
  role: MemberRole
  status: MemberStatus
  created_at: string
  email?: string
}

export interface Post {
  id: string
  author_id: string
  type: PostType
  to_member_id: string | null
  content: string | null
  client_name: string | null
  amount: number | null
  created_at: string
  author?: Member
  to_member?: Member
}

export interface Announcement {
  id: string
  author_id: string
  title: string
  content: string
  is_pinned: boolean
  created_at: string
  author?: Member
}

export interface LeaderboardEntry {
  member_id: string
  member: Member
  referrals_given: number
  closes_logged: number
  shoutouts_received: number
}
