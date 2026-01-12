'use client'

import { useEffect } from 'react'
import { usePathname } from 'next/navigation'

// Generate or get session ID
function getSessionId(): string {
  if (typeof window === 'undefined') return 'server'
  
  let sessionId = sessionStorage.getItem('mapsreach_session')
  if (!sessionId) {
    sessionId = 'sess_' + Math.random().toString(36).substring(2, 15)
    sessionStorage.setItem('mapsreach_session', sessionId)
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
