'use client'
import { useEffect, useState } from 'react'
import { Download } from 'lucide-react'

export function InstallPrompt() {
  const [prompt, setPrompt] = useState<Event & { prompt: () => Promise<void> } | null>(null)
  const [isIOS, setIsIOS] = useState(false)
  const [showIOSHint, setShowIOSHint] = useState(false)
  const [installed, setInstalled] = useState(false)

  useEffect(() => {
    // Check if already installed (standalone mode)
    if (window.matchMedia('(display-mode: standalone)').matches) {
      setInstalled(true)
      return
    }

    const ios = /iphone|ipad|ipod/i.test(navigator.userAgent) && !(window.navigator as any).standalone
    setIsIOS(ios)

    const handler = (e: Event) => {
      e.preventDefault()
      setPrompt(e as any)
    }
    window.addEventListener('beforeinstallprompt', handler)
    return () => window.removeEventListener('beforeinstallprompt', handler)
  }, [])

  if (installed) return null

  if (isIOS) {
    return (
      <>
        <button
          onClick={() => setShowIOSHint(h => !h)}
          className="flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium text-white/70 hover:bg-white/10 hover:text-white transition-colors w-full"
        >
          <Download size={18} />
          Install App
        </button>
        {showIOSHint && (
          <div className="mx-3 mb-2 p-3 bg-white/10 rounded-lg text-xs text-white/80 leading-relaxed">
            Tap the <strong className="text-white">Share</strong> button in Safari, then <strong className="text-white">Add to Home Screen</strong>
          </div>
        )}
      </>
    )
  }

  if (!prompt) return null

  return (
    <button
      onClick={async () => {
        await prompt.prompt()
        setPrompt(null)
      }}
      className="flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium text-white/70 hover:bg-white/10 hover:text-white transition-colors w-full"
    >
      <Download size={18} />
      Install App
    </button>
  )
}
