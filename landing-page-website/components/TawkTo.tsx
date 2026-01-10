"use client"

import { useEffect } from "react"

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
  useEffect(() => {
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
  }, [propertyId, widgetId])

  return null // This component doesn't render anything visible
}
