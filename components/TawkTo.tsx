"use client"

import { useEffect } from "react"
import { usePathname } from "next/navigation"

// Extend Window interface for Tawk.to
declare global {
  interface Window {
    Tawk_API?: {
      onLoad?: () => void
      onStatusChange?: (status: string) => void
      maximize?: () => void
      minimize?: () => void
      toggle?: () => void
      popup?: () => void
      showWidget?: () => void
      hideWidget?: () => void
      toggleVisibility?: () => void
      endChat?: () => void
      setAttributes?: (attributes: Record<string, string>, callback?: () => void) => void
      addEvent?: (event: string, metadata?: Record<string, string>, callback?: () => void) => void
      addTags?: (tags: string[], callback?: () => void) => void
      removeTags?: (tags: string[], callback?: () => void) => void
    }
    Tawk_LoadStart?: Date
  }
}

interface TawkToProps {
  propertyId: string
  widgetId: string
}

export default function TawkTo({ propertyId, widgetId }: TawkToProps) {
  const pathname = usePathname()
  
  // Hide on admin and affiliate pages
  const hiddenPaths = ['/12admin19', '/affiliate']
  const shouldHide = hiddenPaths.some(path => pathname?.startsWith(path))

  useEffect(() => {
    // Don't load on hidden paths
    if (shouldHide) {
      // Hide widget if already loaded
      if (window.Tawk_API?.hideWidget) {
        window.Tawk_API.hideWidget()
      }
      return
    }

    // Show widget if it was hidden
    if (window.Tawk_API?.showWidget) {
      window.Tawk_API.showWidget()
    }

    // Prevent duplicate scripts
    if (document.getElementById("tawkto-script")) return

    // Initialize Tawk_API
    window.Tawk_API = window.Tawk_API || {}
    window.Tawk_LoadStart = new Date()

    // Create and append script
    const script = document.createElement("script")
    script.id = "tawkto-script"
    script.async = true
    script.src = `https://embed.tawk.to/${propertyId}/${widgetId}`
    script.charset = "UTF-8"
    script.setAttribute("crossorigin", "*")

    document.head.appendChild(script)

    // Optional: Customize behavior when loaded
    window.Tawk_API.onLoad = function () {
      console.log("Tawk.to chat widget loaded")
    }

    return () => {
      // Cleanup on unmount (optional)
      const existingScript = document.getElementById("tawkto-script")
      if (existingScript) {
        existingScript.remove()
      }
    }
  }, [propertyId, widgetId, shouldHide])

  return null // This component doesn't render anything visible
}
