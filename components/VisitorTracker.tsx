'use client'

import { useEffect } from 'react'
import { usePathname } from 'next/navigation'
import { safeSessionStorageGet, safeSessionStorageSet } from '@/lib/safe-storage'

// Generate or get session ID
function getSessionId(): string {
  if (typeof window === 'undefined') return 'server'
  
  let sessionId = safeSessionStorageGet('mapsreach_session')
  if (!sessionId) {
    sessionId = 'sess_' + Math.random().toString(36).substring(2, 15)
    safeSessionStorageSet('mapsreach_session', sessionId)
  }
  return sessionId
}

export default function VisitorTracker() {
  const pathname = usePathname()
  
  useEffect(() => {
    // Don't track admin pages
    if (pathname?.includes('admin')) return
    
    const trackVisit = async () => {
      try {
        await fetch('/api/track', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            page: pathname,
            referrer: document.referrer || 'Direct',
            screenWidth: window.screen.width,
            screenHeight: window.screen.height,
            language: navigator.language,
            sessionId: getSessionId()
          })
        })
      } catch (e) {
        // Silently fail - don't affect user experience
      }
    }
    
    // Small delay to not block page load
    const timer = setTimeout(trackVisit, 100)
    return () => clearTimeout(timer)
  }, [pathname])
  
  return null // This component renders nothing
}
