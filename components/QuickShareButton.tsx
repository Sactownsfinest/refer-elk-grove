'use client'
import { useState } from 'react'
import { Button } from '@/components/ui/button'
import { Card, CardContent } from '@/components/ui/card'
import type { Member } from '@/lib/types'
import { Copy, Check } from 'lucide-react'

interface QuickShareButtonProps {
  member: Member
}

export function QuickShareButton({ member }: QuickShareButtonProps) {
  const [copied, setCopied] = useState(false)

  function buildShareText() {
    const lines: string[] = []
    lines.push(`🤝 ${member.name} — ${member.business_name || ''}`)
    if (member.category) lines.push(`📋 ${member.category}`)
    if (member.phone) lines.push(`📞 ${member.phone}`)
    if (member.website_url) lines.push(`🌐 ${member.website_url}`)
    if (member.google_review_url) lines.push(`⭐ Leave a review: ${member.google_review_url}`)
    return lines.join('\n')
  }

  async function handleCopy() {
    await navigator.clipboard.writeText(buildShareText())
    setCopied(true)
    setTimeout(() => setCopied(false), 2500)
  }

  const shareText = buildShareText()

  return (
    <Card className="border-secondary/20 bg-secondary/5">
      <CardContent className="p-5">
        <h2 className="font-semibold text-gray-900 mb-2">Quick Share Card</h2>
        <p className="text-xs text-muted mb-3">Tap to copy — ready to paste in any text or message</p>
        <pre className="text-sm text-gray-700 bg-white border border-border rounded-lg p-3 whitespace-pre-wrap font-sans mb-3">
          {shareText}
        </pre>
        <Button onClick={handleCopy} variant="secondary" className="w-full">
          {copied ? <><Check size={16} /> Copied to clipboard!</> : <><Copy size={16} /> Copy Share Card</>}
        </Button>
      </CardContent>
    </Card>
  )
}
