"use client"

import { useEffect, useRef, useState } from "react"
import { safeLocalStorageGet, safeLocalStorageSet } from "@/lib/safe-storage"

// Cookie helper functions for persistent affiliate tracking
function setCookie(name: string, value: string, days: number) {
  try {
    const expires = new Date(Date.now() + days * 24 * 60 * 60 * 1000).toUTCString()
    document.cookie = `${name}=${encodeURIComponent(value)}; expires=${expires}; path=/; SameSite=Lax`
  } catch {
    // Ignore cookie errors (blocked storage, privacy mode, etc.)
  }
}

function getCookie(name: string): string | null {
  const match = document.cookie.match(new RegExp('(^| )' + name + '=([^;]+)'))
  return match ? decodeURIComponent(match[2]) : null
}

// Helper function to open Tawk.to chat
function openTawkChat() {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const TawkAPI = (window as any).Tawk_API
  if (TawkAPI?.maximize) {
    TawkAPI.maximize()
  } else {
    // Fallback: try again after a short delay (widget might still be loading)
    setTimeout(() => {
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const TawkAPIRetry = (window as any).Tawk_API
      if (TawkAPIRetry?.maximize) {
        TawkAPIRetry.maximize()
      } else {
        // If Tawk.to isn't configured yet, show an alert
        alert("Chat is loading... Please try again in a moment, or email us directly at laithou123@gmail.com")
      }
    }, 1000)
  }
}

// Animated counter component
function AnimatedCounter({ end, duration = 2000, suffix = "" }: { end: number; duration?: number; suffix?: string }) {
  const [count, setCount] = useState(0)
  const [hasAnimated, setHasAnimated] = useState(false)
  const ref = useRef<HTMLSpanElement>(null)

  useEffect(() => {
    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting && !hasAnimated) {
          setHasAnimated(true)
          let start = 0
          const increment = end / (duration / 16)
          const timer = setInterval(() => {
            start += increment
            if (start >= end) {
              setCount(end)
              clearInterval(timer)
            } else {
              setCount(Math.floor(start))
            }
          }, 16)
        }
      },
      { threshold: 0.5 }
    )
    if (ref.current) observer.observe(ref.current)
    return () => observer.disconnect()
  }, [end, duration, hasAnimated])

  return <span ref={ref}>{count.toLocaleString()}{suffix}</span>
}

// FAQ Accordion component
function FAQItem({ question, answer, isOpen, onClick }: { question: string; answer: string; isOpen: boolean; onClick: () => void }) {
  return (
    <div className="border border-border rounded-lg overflow-hidden">
      <button
        onClick={onClick}
        className="w-full px-6 py-4 flex items-center justify-between text-left bg-card hover:bg-muted/30 transition-colors"
      >
        <span className="font-semibold text-foreground">{question}</span>
        <span className={`text-primary transition-transform duration-300 ${isOpen ? "rotate-180" : ""}`}>
          <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <path d="M6 9l6 6 6-6" />
          </svg>
        </span>
      </button>
      <div className={`overflow-hidden transition-all duration-300 ${isOpen ? "max-h-96" : "max-h-0"}`}>
        <p className="px-6 py-4 text-muted-foreground bg-muted/20">{answer}</p>
      </div>
    </div>
  )
}

export default function Home() {
  const heroRef = useRef<HTMLDivElement>(null)
  const featuresRef = useRef<HTMLDivElement>(null)
  const [openFAQ, setOpenFAQ] = useState<number | null>(0)
  const [isScrolled, setIsScrolled] = useState(false)
  const [isNavHidden, setIsNavHidden] = useState(false)
  const lastScrollY = useRef(0)

  // Silent Referral Tracking
  useEffect(() => {
    const urlParams = new URLSearchParams(window.location.search)
    const refCode = urlParams.get('ref')
    
    if (refCode) {
      // Store referral code in localStorage (use both keys for compatibility)
      safeLocalStorageSet('affiliateCode', refCode.toUpperCase())
      safeLocalStorageSet('referralCode', refCode.toUpperCase())
      safeLocalStorageSet('referralTimestamp', new Date().toISOString())
      
      // Also store in cookie for extra persistence (30 days)
      setCookie('affiliateCode', refCode.toUpperCase(), 30)
      
      // Track the visit on the server (affiliate click tracking)
      fetch('/api/affiliate/track', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          code: refCode.toUpperCase(),
          userAgent: navigator.userAgent
        })
      }).catch(() => {}) // Silent fail
      
      // Clean URL without reload (removes ?ref=XXX)
      const cleanUrl = window.location.pathname
      try {
        window.history.replaceState({}, '', cleanUrl)
      } catch {
        // Ignore history errors in restrictive contexts
      }
      
      // Set Tawk.to visitor attribute (so admin sees which creator referred)
      setTimeout(() => {
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        const TawkAPI = (window as any).Tawk_API
        if (TawkAPI?.setAttributes) {
          TawkAPI.setAttributes({
            'referralCode': refCode.toUpperCase()
          })
        }
      }, 2000)
    } else {
      // Check if we have a stored referral code to set in Tawk.to
      const storedRef = safeLocalStorageGet('referralCode')
      if (storedRef) {
        setTimeout(() => {
          // eslint-disable-next-line @typescript-eslint/no-explicit-any
          const TawkAPI = (window as any).Tawk_API
          if (TawkAPI?.setAttributes) {
            TawkAPI.setAttributes({
              'referralCode': storedRef
            })
          }
        }, 2000)
      }
    }
  }, [])

  useEffect(() => {
    const handleScroll = () => {
      const currentScrollY = window.scrollY
      setIsScrolled(currentScrollY > 50)
      
      // Determine scroll direction
      if (currentScrollY > lastScrollY.current && currentScrollY > 100) {
        // Scrolling down & past threshold - hide nav
        setIsNavHidden(true)
      } else {
        // Scrolling up - show nav
        setIsNavHidden(false)
      }
      
      lastScrollY.current = currentScrollY
    }
    window.addEventListener("scroll", handleScroll, { passive: true })
    return () => window.removeEventListener("scroll", handleScroll)
  }, [])

  useEffect(() => {
    const observerOptions = {
      threshold: 0.1,
      rootMargin: "0px 0px -100px 0px",
    }

    const observer = new IntersectionObserver((entries) => {
      entries.forEach((entry) => {
        if (entry.isIntersecting) {
          entry.target.classList.add("opacity-100", "translate-y-0")
          entry.target.classList.remove("opacity-0", "translate-y-10")
        }
      })
    }, observerOptions)

    const elements = document.querySelectorAll("[data-animate]")
    elements.forEach((el) => observer.observe(el))

    return () => observer.disconnect()
  }, [])

  const faqs = [
    {
      question: "How quickly will I receive my license?",
      answer: "Instantly! After payment, you'll receive your license key via email within seconds. You can start extracting leads immediately."
    },
    {
      question: "Is there a limit on how many leads I can extract?",
      answer: "No limits whatsoever. With your lifetime license, you can extract unlimited leads from unlimited niches. Extract 100 leads or 100,000 - it's all included."
    },
    {
      question: "What payment methods do you accept?",
      answer: "We accept USDT (TRC20/ERC20), RedotPay, Skrill, and Neteller. Choose the method that works best for you - all transactions are secure and processed quickly."
    },
    {
      question: "Do I need technical skills to use this?",
      answer: "Not at all! If you can use Google Maps, you can use MapsReach. Just search, click, and export. It takes literally 30 seconds to learn."
    },
    {
      question: "What's included in the lifetime license?",
      answer: "Everything! Unlimited extractions, all data fields (emails, phones, social media, reviews), export to Google Sheets/CSV, priority support, and all future updates - forever."
    },
    {
      question: "What's your refund policy?",
      answer: "All sales are final since the license is delivered instantly as a digital product. But I'm happy to answer any questions or show you a demo before you buy so you know exactly what you're getting!"
    }
      ,
    {
      question: "Does the Outreach Tool send WhatsApp and email messages?",
      answer: "Yes. The Outreach Tool supports WhatsApp outreach and email campaigns in one desktop app."
    },
    {
      question: "Can I import my own leads?",
      answer: "Absolutely. Import a CSV file with your leads, then launch WhatsApp or email outreach from the app."
    },
    {
      question: "Is there a free trial for the Outreach Tool?",
      answer: "Yes, a free trial is included so you can test WhatsApp and email outreach before purchasing."
    },
    {
      question: "Do I need a license key?",
      answer: "After your trial, a license key unlocks full features. The app will prompt you when activation is needed."
    },
    {
      question: "Does MapsReach include outreach automation?",
      answer: "Yes. MapsReach includes a built-in outreach tool that lets you send WhatsApp messages and email campaigns to your extracted Google Maps leads."
    },
    {
      question: "Can I contact leads directly after extraction?",
      answer: "Yes. After exporting leads, you can immediately send WhatsApp messages or emails using the Outreach Tool — no third-party software required."
    }
]

  const scrollToSection = (id: string) => {
    document.getElementById(id)?.scrollIntoView({ behavior: "smooth" })
  }

  return (
    <main className="bg-background text-foreground min-h-screen">
      {/* Floating Navigation - no bar, just buttons */}
      <nav className={`fixed top-0 left-0 right-0 z-50 py-0 px-8 transition-all ${isNavHidden ? 'duration-200 -translate-y-full opacity-0' : 'duration-300 translate-y-0 opacity-100'}`}>
        <div className="max-w-7xl mx-auto flex items-center justify-between">
          {/* Logo - clickable, scrolls to top */}
          <button 
            onClick={() => window.scrollTo({ top: 0, behavior: 'smooth' })}
            className="flex items-center gap-1 cursor-pointer hover:opacity-80 transition-opacity"
          >
            <img src="/logo.png" alt="MapsReach" className="h-28 w-auto" />
            {/* Slogan right next to logo */}
            <div className="hidden sm:flex items-center gap-1.5 -ml-1">
              <span className="text-muted-foreground font-medium text-base">Extract</span>
              <span className="text-primary font-bold text-base border-b-2 border-primary">Emails</span>
              <span className="text-muted-foreground">,</span>
              <span className="text-secondary font-bold text-base border-b-2 border-secondary">Phones</span>
              <span className="text-muted-foreground font-medium text-base">& More</span>
            </div>
          </button>
          
          {/* Floating navigation buttons */}
          <div className="hidden md:flex items-center gap-4">
            <a href="/pricing" className="text-accent hover:text-foreground transition-all duration-300 text-base font-semibold px-4 py-2 rounded-lg border border-accent/30 hover:border-accent/60 hover:bg-accent/10">Pricing</a>
            <button onClick={() => scrollToSection("how-it-works")} className="text-muted-foreground hover:text-foreground transition-all duration-300 text-base font-medium px-4 py-2 rounded-lg hover:bg-white/10 hover:backdrop-blur-sm">How it Works</button>
            <button onClick={() => scrollToSection("features")} className="text-muted-foreground hover:text-foreground transition-all duration-300 text-base font-medium px-4 py-2 rounded-lg hover:bg-white/10 hover:backdrop-blur-sm">Features</button>
            <a href="/blog" className="text-muted-foreground hover:text-foreground transition-all duration-300 text-base font-medium px-4 py-2 rounded-lg hover:bg-white/10 hover:backdrop-blur-sm">Blog</a>
          </div>
          
          <a
            href="/download"
            className="px-6 py-3 bg-gradient-to-r from-[#3b82f6] to-[#1d4ed8] text-white font-semibold rounded-full text-base hover:shadow-lg hover:shadow-blue-500/30 transition-all duration-200"
          >
            Try for Free
          </a>
        </div>
      </nav>

      {/* Hero Section */}
      <section
        ref={heroRef}
        className="relative h-screen flex items-center justify-center px-6 py-4 overflow-hidden"
      >
        {/* Premium Background - Radial Spotlight + Noise + Map Theme */}
        <div className="absolute inset-0 bg-gradient-to-b from-[#020a18] via-[#041225] to-[#020510]">
          
          {/* Animated pulsing blue bulbs */}
          <div className="absolute top-[20%] left-[15%] w-[600px] h-[600px] bg-[radial-gradient(circle_at_center,rgba(59,130,246,0.35)_0%,rgba(37,99,235,0.15)_30%,transparent_60%)] animate-[pulse-glow_4s_ease-in-out_infinite]"></div>
          <div className="absolute bottom-[10%] right-[10%] w-[500px] h-[500px] bg-[radial-gradient(circle_at_center,rgba(14,165,233,0.3)_0%,rgba(6,182,212,0.12)_30%,transparent_60%)] animate-[pulse-glow_4s_ease-in-out_infinite_1s]"></div>
          
          <style jsx>{`
            @keyframes pulse-glow {
              0%, 100% { opacity: 0.4; transform: scale(1); }
              50% { opacity: 1; transform: scale(1.1); }
            }
          `}</style>
          
          {/* Central radial spotlight - draws focus to content */}
          <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[1400px] h-[1000px] bg-[radial-gradient(ellipse_at_center,rgba(14,165,233,0.15)_0%,rgba(8,145,178,0.08)_30%,rgba(6,78,117,0.04)_55%,transparent_75%)]"></div>
          
          {/* Top glow accent */}
          <div className="absolute -top-20 left-1/2 -translate-x-1/2 w-[1000px] h-[500px] bg-[radial-gradient(ellipse_at_top,rgba(59,130,246,0.2)_0%,rgba(37,99,235,0.1)_40%,transparent_70%)]"></div>
          
          {/* Bottom corner accents */}
          <div className="absolute -bottom-32 -left-32 w-[600px] h-[600px] bg-[radial-gradient(circle_at_center,rgba(6,182,212,0.12)_0%,transparent_60%)]"></div>
          <div className="absolute -bottom-32 -right-32 w-[500px] h-[500px] bg-[radial-gradient(circle_at_center,rgba(59,130,246,0.1)_0%,transparent_60%)]"></div>
          
          {/* Map-inspired topographic contour lines */}
          <div className="absolute inset-0 opacity-[0.08]">
            <svg className="w-full h-full" xmlns="http://www.w3.org/2000/svg">
              <defs>
                <pattern id="contour" x="0" y="0" width="250" height="250" patternUnits="userSpaceOnUse">
                  <circle cx="125" cy="125" r="100" fill="none" stroke="rgba(59,130,246,0.6)" strokeWidth="0.5"/>
                  <circle cx="125" cy="125" r="75" fill="none" stroke="rgba(6,182,212,0.5)" strokeWidth="0.5"/>
                  <circle cx="125" cy="125" r="50" fill="none" stroke="rgba(59,130,246,0.4)" strokeWidth="0.5"/>
                  <circle cx="125" cy="125" r="25" fill="none" stroke="rgba(6,182,212,0.3)" strokeWidth="0.5"/>
                </pattern>
              </defs>
              <rect width="100%" height="100%" fill="url(#contour)"/>
            </svg>
          </div>
          
          {/* Scattered location pins - map themed */}
          <div className="absolute top-[12%] left-[8%] w-6 h-6 opacity-20 text-cyan-400">
            <svg viewBox="0 0 24 24" fill="currentColor">
              <path d="M12 2C8.13 2 5 5.13 5 9c0 5.25 7 13 7 13s7-7.75 7-13c0-3.87-3.13-7-7-7zm0 9.5c-1.38 0-2.5-1.12-2.5-2.5s1.12-2.5 2.5-2.5 2.5 1.12 2.5 2.5-1.12 2.5-2.5 2.5z"/>
            </svg>
          </div>
          <div className="absolute top-[22%] right-[12%] w-8 h-8 opacity-15 text-blue-400">
            <svg viewBox="0 0 24 24" fill="currentColor">
              <path d="M12 2C8.13 2 5 5.13 5 9c0 5.25 7 13 7 13s7-7.75 7-13c0-3.87-3.13-7-7-7zm0 9.5c-1.38 0-2.5-1.12-2.5-2.5s1.12-2.5 2.5-2.5 2.5 1.12 2.5 2.5-1.12 2.5-2.5 2.5z"/>
            </svg>
          </div>
          <div className="absolute bottom-[35%] left-[6%] w-5 h-5 opacity-15 text-sky-400">
            <svg viewBox="0 0 24 24" fill="currentColor">
              <path d="M12 2C8.13 2 5 5.13 5 9c0 5.25 7 13 7 13s7-7.75 7-13c0-3.87-3.13-7-7-7zm0 9.5c-1.38 0-2.5-1.12-2.5-2.5s1.12-2.5 2.5-2.5 2.5 1.12 2.5 2.5-1.12 2.5-2.5 2.5z"/>
            </svg>
          </div>
          <div className="absolute top-[55%] right-[10%] w-6 h-6 opacity-20 text-teal-400">
            <svg viewBox="0 0 24 24" fill="currentColor">
              <path d="M12 2C8.13 2 5 5.13 5 9c0 5.25 7 13 7 13s7-7.75 7-13c0-3.87-3.13-7-7-7zm0 9.5c-1.38 0-2.5-1.12-2.5-2.5s1.12-2.5 2.5-2.5 2.5 1.12 2.5 2.5-1.12 2.5-2.5 2.5z"/>
            </svg>
          </div>
          <div className="absolute bottom-[18%] right-[20%] w-4 h-4 opacity-15 text-blue-300">
            <svg viewBox="0 0 24 24" fill="currentColor">
              <path d="M12 2C8.13 2 5 5.13 5 9c0 5.25 7 13 7 13s7-7.75 7-13c0-3.87-3.13-7-7-7zm0 9.5c-1.38 0-2.5-1.12-2.5-2.5s1.12-2.5 2.5-2.5 2.5 1.12 2.5 2.5-1.12 2.5-2.5 2.5z"/>
            </svg>
          </div>
          <div className="absolute top-[38%] left-[4%] w-5 h-5 opacity-18 text-cyan-300">
            <svg viewBox="0 0 24 24" fill="currentColor">
              <path d="M12 2C8.13 2 5 5.13 5 9c0 5.25 7 13 7 13s7-7.75 7-13c0-3.87-3.13-7-7-7zm0 9.5c-1.38 0-2.5-1.12-2.5-2.5s1.12-2.5 2.5-2.5 2.5 1.12 2.5 2.5-1.12 2.5-2.5 2.5z"/>
            </svg>
          </div>
          <div className="absolute bottom-[28%] left-[15%] w-7 h-7 opacity-12 text-blue-400">
            <svg viewBox="0 0 24 24" fill="currentColor">
              <path d="M12 2C8.13 2 5 5.13 5 9c0 5.25 7 13 7 13s7-7.75 7-13c0-3.87-3.13-7-7-7zm0 9.5c-1.38 0-2.5-1.12-2.5-2.5s1.12-2.5 2.5-2.5 2.5 1.12 2.5 2.5-1.12 2.5-2.5 2.5z"/>
            </svg>
          </div>
          <div className="absolute top-[75%] right-[8%] w-5 h-5 opacity-18 text-sky-300">
            <svg viewBox="0 0 24 24" fill="currentColor">
              <path d="M12 2C8.13 2 5 5.13 5 9c0 5.25 7 13 7 13s7-7.75 7-13c0-3.87-3.13-7-7-7zm0 9.5c-1.38 0-2.5-1.12-2.5-2.5s1.12-2.5 2.5-2.5 2.5 1.12 2.5 2.5-1.12 2.5-2.5 2.5z"/>
            </svg>
          </div>
          
          {/* Noise texture overlay */}
          <div className="absolute inset-0 opacity-[0.03] bg-[url('data:image/svg+xml;base64,PHN2ZyB4bWxucz0iaHR0cDovL3d3dy53My5vcmcvMjAwMC9zdmciIHdpZHRoPSIzMDAiIGhlaWdodD0iMzAwIj48ZmlsdGVyIGlkPSJhIiB4PSIwIiB5PSIwIj48ZmVUdXJidWxlbmNlIGJhc2VGcmVxdWVuY3k9Ii43NSIgc3RpdGNoVGlsZXM9InN0aXRjaCIgdHlwZT0iZnJhY3RhbE5vaXNlIi8+PC9maWx0ZXI+PHJlY3Qgd2lkdGg9IjMwMCIgaGVpZ2h0PSIzMDAiIGZpbHRlcj0idXJsKCNhKSIgb3BhY2l0eT0iMC40Ii8+PC9zdmc+')]"></div>
          
          {/* Vignette */}
          <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_center,transparent_0%,transparent_50%,rgba(2,5,16,0.6)_100%)]"></div>
        </div>

        {/* Grid pattern */}
        <div className="absolute inset-0 bg-[linear-gradient(rgba(59,130,246,0.03)_1px,transparent_1px),linear-gradient(90deg,rgba(59,130,246,0.03)_1px,transparent_1px)] bg-[size:60px_60px]"></div>

        <div className="relative z-10 max-w-7xl mx-auto pt-0 px-6">
          {/* Two Column Hero Layout */}
          <div className="grid lg:grid-cols-2 gap-8 items-center">
            
            {/* Left Column - Text Content */}
            <div className="text-left mt-10">
              <div data-animate className="opacity-0 translate-y-10 transition-all duration-1000">
                <h1 className="text-3xl sm:text-4xl md:text-5xl font-bold mb-3 leading-tight tracking-tight">
                  <span className="text-foreground">Best Google Maps Scraper</span>
                  <br />
                  <span className="gradient-text">Lead Generation & Outreach Platform 2026</span>
                </h1>
              </div>
              
              <div data-animate className="opacity-0 translate-y-10 transition-all duration-1000" style={{ transitionDelay: "100ms" }}>
                <p className="text-lg md:text-xl text-muted-foreground mb-4 leading-relaxed">
                  <span className="text-primary font-semibold">B2B lead generation and outreach tool</span> that extracts business info from <span className="text-primary font-semibold">Google Maps</span> and lets you contact leads via WhatsApp & email. <span className="text-foreground font-semibold">Clean leads</span>, without the busywork.
                </p>
              </div>
              
              {/* Value props - 2x2 grid */}
              <div data-animate className="opacity-0 translate-y-10 transition-all duration-1000" style={{ transitionDelay: "200ms" }}>
                <div className="grid grid-cols-2 gap-2 mb-4 max-w-md">
                  {["One-time payment", "Lifetime updates", "30-second setup", "4+ hours saved daily"].map((prop, idx) => (
                    <div key={idx} className="flex items-center gap-2 text-sm text-accent">
                      <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                      </svg>
                      <span>{prop}</span>
                    </div>
                  ))}
                </div>
              </div>

              {/* CTA Buttons - Chrome/Edge */}
              <div data-animate className="opacity-0 translate-y-10 transition-all duration-1000" style={{ transitionDelay: "300ms" }}>
                <div className="flex flex-col sm:flex-row gap-3">
                  <a
                    href="/download/chrome"
                    className="group inline-flex items-center justify-center gap-2.5 px-8 py-3.5 min-w-[200px] whitespace-nowrap bg-gradient-to-r from-[#4285F4] to-[#1a73e8] text-white font-semibold rounded-xl text-base hover:shadow-xl hover:shadow-blue-500/40 transition-all duration-300 hover:scale-105"
                  >
                    <img src="/Google_Chrome_icon.png" alt="Chrome" className="w-5 h-5" />
                    <span>Add to Chrome</span>
                    <svg className="w-5 h-5 group-hover:translate-x-1 transition-transform" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 7l5 5m0 0l-5 5m5-5H6" />
                    </svg>
                  </a>
                  <a
                    href="/download/edge"
                    className="group inline-flex items-center justify-center gap-2.5 px-8 py-3.5 min-w-[200px] whitespace-nowrap bg-gradient-to-r from-[#0078D4] to-[#1CA3EC] text-white font-semibold rounded-xl text-base hover:shadow-xl hover:shadow-cyan-500/40 transition-all duration-300 hover:scale-105"
                  >
                    <img src="/edge.png" alt="Edge" className="w-5 h-5" />
                    <span>Add to Edge</span>
                    <svg className="w-5 h-5 group-hover:translate-x-1 transition-transform" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 7l5 5m0 0l-5 5m5-5H6" />
                    </svg>
                  </a>
                  <a
                    href="/download/outreach"
                    className="group inline-flex items-center justify-center gap-2.5 px-8 py-3.5 min-w-[200px] whitespace-nowrap bg-gradient-to-r from-green-500 to-emerald-500 text-white font-semibold rounded-xl text-base hover:shadow-xl hover:shadow-green-500/40 transition-all duration-300 hover:scale-105"
                  >
                    <svg className="w-5 h-5 flex-shrink-0" viewBox="0 0 24 24" fill="currentColor">
                      <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413z"/>
                    </svg>
                    <span>Outreach Tool</span>
                    <svg className="w-5 h-5 group-hover:translate-x-1 transition-transform" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" />
                    </svg>
                  </a>
                </div>
                <p className="text-sm text-green-300 mt-4">Free trial included</p>
                <p className="text-sm text-muted-foreground mt-1">Works with Chrome, Edge, Brave & more</p>
                <p className="text-sm text-muted-foreground mt-1">Outreach Tool included: Send WhatsApp messages & email campaigns directly to your extracted Google Maps leads</p>
              </div>
            </div>

            {/* Right Column - Floating Data Pills */}
            <div className="relative hidden lg:block h-[400px]">
              <div data-animate className="opacity-0 translate-y-10 transition-all duration-1000 absolute inset-0" style={{ transitionDelay: "400ms" }}>
                
                {/* Top tier - scattered high */}
                <div className="absolute top-[0%] right-[8%] animate-float" style={{ animationDelay: "0s" }}>
                  <div className="flex items-center gap-2 px-4 py-2 bg-card/80 backdrop-blur-sm border border-border rounded-full shadow-lg hover:border-primary/50 transition-colors cursor-default">
                    <span className="text-foreground font-medium text-sm">Marketing Agencies</span>
                  </div>
                </div>
                
                <div className="absolute top-[2%] right-[42%] animate-float" style={{ animationDelay: "0.5s" }}>
                  <div className="flex items-center gap-2 px-4 py-2 bg-card/80 backdrop-blur-sm border border-border rounded-full shadow-lg hover:border-secondary/50 transition-colors cursor-default">
                    <span className="text-foreground font-medium text-sm">Freelancers</span>
                  </div>
                </div>

                {/* Second tier - offset positions */}
                <div className="absolute top-[14%] right-[0%] animate-float" style={{ animationDelay: "1s" }}>
                  <div className="flex items-center gap-2 px-4 py-2 bg-card/80 backdrop-blur-sm border border-border rounded-full shadow-lg hover:border-accent/50 transition-colors cursor-default">
                    <span className="text-foreground font-medium text-sm">Sales Teams</span>
                  </div>
                </div>
                
                <div className="absolute top-[16%] right-[24%] animate-float" style={{ animationDelay: "1.5s" }}>
                  <div className="flex items-center gap-2 px-4 py-2 bg-card/80 backdrop-blur-sm border border-border rounded-full shadow-lg hover:border-primary/50 transition-colors cursor-default">
                    <span className="text-foreground font-medium text-sm">Real Estate Pros</span>
                  </div>
                </div>
                
                <div className="absolute top-[12%] right-[52%] animate-float" style={{ animationDelay: "2s" }}>
                  <div className="flex items-center gap-2 px-4 py-2 bg-card/80 backdrop-blur-sm border border-border rounded-full shadow-lg hover:border-secondary/50 transition-colors cursor-default">
                    <span className="text-foreground font-medium text-sm">Local Consultants</span>
                  </div>
                </div>

                {/* Third tier - middle cloud */}
                <div className="absolute top-[30%] right-[5%] animate-float" style={{ animationDelay: "0.3s" }}>
                  <div className="flex items-center gap-2 px-4 py-2 bg-card/80 backdrop-blur-sm border border-border rounded-full shadow-lg hover:border-primary/50 transition-colors cursor-default">
                    <span className="text-foreground font-medium text-sm">B2B Outreach</span>
                  </div>
                </div>
                
                <div className="absolute top-[32%] right-[28%] animate-float" style={{ animationDelay: "0.8s" }}>
                  <div className="flex items-center gap-2 px-4 py-2 bg-card/80 backdrop-blur-sm border border-border rounded-full shadow-lg hover:border-accent/50 transition-colors cursor-default">
                    <span className="text-foreground font-medium text-sm">Business Leads</span>
                  </div>
                </div>
                
                <div className="absolute top-[28%] right-[55%] animate-float" style={{ animationDelay: "1.3s" }}>
                  <div className="flex items-center gap-2 px-4 py-2 bg-card/80 backdrop-blur-sm border border-border rounded-full shadow-lg hover:border-secondary/50 transition-colors cursor-default">
                    <span className="text-foreground font-medium text-sm">Cold Outreach</span>
                  </div>
                </div>

                {/* Fourth tier - features */}
                <div className="absolute top-[46%] right-[2%] animate-float" style={{ animationDelay: "1.2s" }}>
                  <div className="flex items-center gap-2 px-4 py-2 bg-card/80 backdrop-blur-sm border border-border rounded-full shadow-lg hover:border-secondary/50 transition-colors cursor-default">
                    <span className="text-foreground font-medium text-sm">One-Click Extract</span>
                  </div>
                </div>
                
                <div className="absolute top-[48%] right-[30%] animate-float" style={{ animationDelay: "1.7s" }}>
                  <div className="flex items-center gap-2 px-4 py-2 bg-card/80 backdrop-blur-sm border border-border rounded-full shadow-lg hover:border-primary/50 transition-colors cursor-default">
                    <span className="text-foreground font-medium text-sm">Export to Sheets</span>
                  </div>
                </div>
                
                <div className="absolute top-[44%] right-[58%] animate-float" style={{ animationDelay: "2.2s" }}>
                  <div className="flex items-center gap-2 px-4 py-2 bg-card/80 backdrop-blur-sm border border-border rounded-full shadow-lg hover:border-accent/50 transition-colors cursor-default">
                    <span className="text-foreground font-medium text-sm">Export to CSV</span>
                  </div>
                </div>

                {/* Fifth tier - lower features */}
                <div className="absolute top-[62%] right-[8%] animate-float" style={{ animationDelay: "0.6s" }}>
                  <div className="flex items-center gap-2 px-4 py-2 bg-card/80 backdrop-blur-sm border border-border rounded-full shadow-lg hover:border-accent/50 transition-colors cursor-default">
                    <span className="text-foreground font-medium text-sm">Auto-Scroll</span>
                  </div>
                </div>
                
                <div className="absolute top-[60%] right-[35%] animate-float" style={{ animationDelay: "1.1s" }}>
                  <div className="flex items-center gap-2 px-4 py-2 bg-card/80 backdrop-blur-sm border border-border rounded-full shadow-lg hover:border-secondary/50 transition-colors cursor-default">
                    <span className="text-foreground font-medium text-sm">Unlimited Leads</span>
                  </div>
                </div>

                {/* Bottom tier - scattered low */}
                <div className="absolute top-[76%] right-[12%] animate-float" style={{ animationDelay: "1.4s" }}>
                  <div className="flex items-center gap-2 px-4 py-2 bg-card/80 backdrop-blur-sm border border-border rounded-full shadow-lg hover:border-primary/50 transition-colors cursor-default">
                    <span className="text-foreground font-medium text-sm">Dark/Light Mode</span>
                  </div>
                </div>
                
                <div className="absolute top-[74%] right-[42%] animate-float" style={{ animationDelay: "1.9s" }}>
                  <div className="flex items-center gap-2 px-4 py-2 bg-card/80 backdrop-blur-sm border border-border rounded-full shadow-lg hover:border-accent/50 transition-colors cursor-default">
                    <span className="text-foreground font-medium text-sm">Duplicate Check</span>
                  </div>
                </div>
                
              </div>
            </div>
          </div>
        </div>

        {/* Scroll indicator */}
        <div className="absolute bottom-2 left-1/2 -translate-x-1/2 animate-bounce">
          <svg className="w-6 h-6 text-muted-foreground/50" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 14l-7 7m0 0l-7-7m7 7V3" />
          </svg>
        </div>
      </section>

      {/* How It Works */}
      <section id="how-it-works" className="py-10 px-6 relative">
        <div className="max-w-7xl mx-auto">
          <div className="text-center mb-8">
            <h2 className="text-5xl md:text-6xl font-bold mb-6 gradient-text">Google Maps Scraper - Extract Leads in 5 Steps</h2>
            <p className="text-muted-foreground text-xl max-w-3xl mx-auto mb-2">
              Extract leads from Google Maps and launch outreach campaigns in minutes — no extra tools needed.
            </p>
            <p className="text-muted-foreground text-lg max-w-3xl mx-auto">
              No learning curve. No complex setup. The best lead generation tool for 2026 - just install and start extracting.
            </p>
          </div>

          <div className="grid md:grid-cols-5 gap-4 md:gap-2 relative">
            {/* Connection line */}
            <div className="hidden md:block absolute top-1/2 left-0 right-0 h-0.5 bg-gradient-to-r from-primary via-secondary to-accent opacity-30 -translate-y-1/2 z-0"></div>
            
            {[
              { step: 1, title: "Open Google Maps", icon: "", desc: "Go to maps.google.com" },
              { step: 2, title: "Search Your Niche", icon: "", desc: '"Restaurants in NYC"' },
              { step: 3, title: "Click MapsReach", icon: "", desc: "Open the extension" },
              { step: 4, title: "Hit Extract", icon: "", desc: "Watch the magic happen" },
              { step: 5, title: "Export Data", icon: "", desc: "To Sheets or CSV" },
            ].map((item, idx) => (
              <div
                key={idx}
                data-animate
                className="opacity-0 translate-y-10 transition-all duration-1000 relative z-10"
                style={{ transitionDelay: `${idx * 100}ms` }}
              >
                <div className="bg-card border border-border rounded-xl p-6 text-center hover:border-primary/50 hover:shadow-lg hover:shadow-primary/10 transition-all duration-300 h-full flex flex-col justify-between group">
                  <div>
                    {item.icon ? (
                      <div className="w-16 h-16 mx-auto mb-4 rounded-full bg-gradient-to-br from-primary/20 to-secondary/20 flex items-center justify-center text-3xl group-hover:scale-110 transition-transform">
                        {item.icon}
                      </div>
                    ) : null}
                    <div className="inline-flex items-center justify-center w-8 h-8 rounded-full bg-primary text-primary-foreground font-bold text-sm mb-3">
                      {item.step}
                    </div>
                    <h3 className="font-semibold text-foreground mb-1">{item.title}</h3>
                    <p className="text-sm text-muted-foreground">{item.desc}</p>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Visual Workflow Section - 5 Steps with Images */}
      <section className="py-14 md:py-20 px-3 md:px-4 relative">
        <div className="max-w-[1500px] 2xl:max-w-[1700px] w-full mx-auto">
          {/* Section Header */}
          <div className="text-center mb-16 md:mb-20">
            <h2 className="text-4xl md:text-5xl lg:text-6xl font-bold mb-5 gradient-text">
              See How It Works
            </h2>
            <p className="text-muted-foreground text-lg md:text-xl max-w-xl mx-auto">
              Follow along with our simple 5-step visual guide
            </p>
          </div>

          {/* Desktop Layout - 3 + 2 rows with zig-zag flow */}
          {/* Flow: 1 -> 2 -> 3 then down to 4 (under 3) then left to 5 (under 2) */}
          <div className="hidden md:block">
            {/* Row 1: Steps 1, 2, 3 */}
            <div className="relative">
              <div className="grid grid-cols-3 gap-3">
                {[1, 2, 3].map((step) => (
                  <div key={step} className="relative z-10 flex flex-col items-center px-0" data-animate>
                    {/* Step Badge */}
                    <div className="mb-1">
                      <div className="w-14 h-14 rounded-full bg-primary flex items-center justify-center text-white font-bold text-xl shadow-lg shadow-primary/25 ring-4 ring-background">
                        {step}
                      </div>
                    </div>

                    {/* Image */}
                    <div className="w-full overflow-hidden">
                      <img src={`/${step}.png`} alt={`Step ${step}`} className="w-full h-auto object-contain rounded-2xl shadow-2xl shadow-black/40" />
                    </div>
                  </div>
                ))}
              </div>

              {/* Arrow 1->2 */}
              <div className="absolute top-7 left-[16.67%] right-[50%] px-2 -translate-y-1/2 z-20">
                <div className="relative w-full h-[3px] bg-primary/60">
                  <svg className="w-5 h-5 text-primary absolute right-0 top-1/2 -translate-y-1/2 translate-x-1/2" viewBox="0 0 16 16" fill="currentColor">
                    <path d="M6 3l5 5-5 5V3z" />
                  </svg>
                </div>
              </div>

              {/* Arrow 2->3 */}
              <div className="absolute top-7 left-[50%] right-[16.67%] px-2 -translate-y-1/2 z-20">
                <div className="relative w-full h-[3px] bg-primary/60">
                  <svg className="w-5 h-5 text-primary absolute right-0 top-1/2 -translate-y-1/2 translate-x-1/2" viewBox="0 0 16 16" fill="currentColor">
                    <path d="M6 3l5 5-5 5V3z" />
                  </svg>
                </div>
              </div>
            </div>

            {/* Zig-zag connector: Step 3 straight down to Step 4 */}
            <div className="relative h-10 my-2">
              {/* Vertical line from step 3 (center of col 3) straight down */}
              <div className="absolute left-[83.33%] -translate-x-1/2 top-0 h-full w-[3px] bg-primary/60" />

              {/* Down arrow */}
              <svg className="absolute left-[83.33%] -translate-x-1/2 bottom-0 translate-y-1/2 w-5 h-5 text-primary" viewBox="0 0 16 16" fill="currentColor">
                <path d="M3 6l5 5 5-5H3z" />
              </svg>
            </div>

            {/* Row 2: Step 5 (col 2), Step 4 (col 3) - reversed order */}
            <div className="relative">
              <div className="grid grid-cols-3 gap-3">
                {/* Empty first column */}
                <div />

                {/* Step 5 - in column 2 (under step 2) */}
                <div className="relative z-10 flex flex-col items-center px-0" data-animate>
                  <div className="mb-1">
                    <div className="w-14 h-14 rounded-full bg-primary flex items-center justify-center text-white font-bold text-xl shadow-lg shadow-primary/25 ring-4 ring-background">
                      5
                    </div>
                  </div>
                  <div className="w-full overflow-hidden">
                    <img src="/5.png" alt="Step 5" className="w-full h-auto object-contain rounded-2xl shadow-2xl shadow-black/40" />
                  </div>
                </div>

                {/* Step 4 - in column 3 (under step 3) */}
                <div className="relative z-10 flex flex-col items-center px-0" data-animate>
                  <div className="mb-1">
                    <div className="w-14 h-14 rounded-full bg-primary flex items-center justify-center text-white font-bold text-xl shadow-lg shadow-primary/25 ring-4 ring-background">
                      4
                    </div>
                  </div>
                  <div className="w-full overflow-hidden">
                    <img src="/4.png" alt="Step 4" className="w-full h-auto object-contain rounded-2xl shadow-2xl shadow-black/40" />
                  </div>
                </div>
              </div>

              {/* Arrow 4<-5: pointing LEFT from step 4 to step 5 */}
              <div className="absolute top-7 left-[50%] right-[16.67%] px-2 -translate-y-1/2 z-20">
                <div className="relative w-full h-[3px] bg-primary/60">
                  <svg className="w-5 h-5 text-primary absolute left-0 top-1/2 -translate-y-1/2 -translate-x-1/2" viewBox="0 0 16 16" fill="currentColor">
                    <path d="M10 3l-5 5 5 5V3z" />
                  </svg>
                </div>
              </div>
            </div>
          </div>

          {/* Mobile Layout - Vertical Stack */}
          <div className="md:hidden">
            <div className="relative">
              {/* Vertical timeline line */}
              <div className="absolute left-7 top-0 bottom-0 w-[2px] bg-gradient-to-b from-primary/40 via-primary/30 to-primary/20 z-0" />
              
              <div className="space-y-8">
                {[1, 2, 3, 4, 5].map((step) => (
                  <div key={step} className="relative z-10 flex items-start gap-5" data-animate>
                    {/* Step Badge */}
                    <div className="flex-shrink-0">
                      <div className="w-14 h-14 rounded-full bg-primary flex items-center justify-center text-white font-bold text-xl shadow-lg shadow-primary/25 ring-4 ring-background">
                        {step}
                      </div>
                    </div>
                    
                    {/* Image */}
                    <div className="flex-1 overflow-hidden">
                      <div className="h-auto">
                        <img 
                          src={`/${step}.png`} 
                          alt={`Step ${step}`}
                          className="w-full h-auto object-contain rounded-2xl shadow-xl shadow-black/30"
                        />
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Why Freelancers Love It - Benefits */}
      <section id="features" className="py-10 px-4 relative bg-muted/10">
        <div className="max-w-6xl mx-auto">
          <div className="text-center mb-6">
            <h2 className="text-4xl md:text-5xl font-bold mb-4 gradient-text">Why Choose MapsReach?</h2>
            <p className="text-muted-foreground text-lg">Powerful Google Maps scraping tool with features designed for lead generation</p>
          </div>

          <div className="grid md:grid-cols-2 lg:grid-cols-5 gap-6">
            {[
              { 
                title: "Save 4+ Hours Daily", 
                desc: "What takes a VA days to do manually, MapsReach does in minutes. Reclaim your time.", 
                icon: "",
                stat: "4hrs",
                statLabel: "saved daily"
              },
              { 
                title: "Zero Manual Work", 
                desc: "No more copy-pasting. No more tab switching. Fully automated lead extraction.", 
                icon: "",
                stat: "100%",
                statLabel: "automated"
              },
              { 
                title: "Never Miss a Lead", 
                desc: "Extract every single business in your search area. No lead left behind.", 
                icon: "",
                stat: "100%",
                statLabel: "capture rate"
              },
              { 
                title: "One-Time Price", 
                desc: "Pay once, use forever. No monthly fees eating into your margins.", 
                icon: "",
                stat: "$0",
                statLabel: "monthly"
              },
              { 
                title: "End-to-End Workflow", 
                desc: "From Google Maps extraction to WhatsApp & email outreach — all in one tool.", 
                icon: "",
                stat: "🚀",
                statLabel: "complete"
              },
            ].map((item, idx) => (
              <div
                key={idx}
                data-animate
                className="opacity-0 translate-y-10 transition-all duration-1000"
                style={{ transitionDelay: `${idx * 100}ms` }}
              >
                <div className="bg-card border border-border rounded-2xl p-6 hover:border-primary/50 hover:shadow-xl hover:shadow-primary/5 transition-all duration-300 h-full group">
                  {item.icon ? (
                    <div className="text-4xl mb-4 group-hover:scale-110 transition-transform">{item.icon}</div>
                  ) : null}
                  <div className="flex items-baseline gap-2 mb-2">
                    <span className="text-3xl font-bold text-primary">{item.stat}</span>
                    <span className="text-sm text-muted-foreground">{item.statLabel}</span>
                  </div>
                  <h3 className="text-xl font-semibold mb-2 text-foreground">{item.title}</h3>
                  <p className="text-muted-foreground">{item.desc}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Outreach Tool SEO Section */}
      <section className="py-10 px-4 relative">
        <div className="max-w-5xl mx-auto">
          <div className="text-center mb-6">
            <h2 className="text-4xl md:text-5xl font-bold mb-4 gradient-text">Built-in Outreach Tool for WhatsApp & Email Campaigns</h2>
            <p className="text-muted-foreground text-lg mb-4">
              Turn extracted Google Maps leads into conversations. Send WhatsApp messages and email campaigns from a desktop app built for outreach.
            </p>
            <p className="text-muted-foreground text-base max-w-3xl mx-auto">
              MapsReach doesn&apos;t stop at lead extraction. After scraping Google Maps, you can instantly launch WhatsApp and email outreach campaigns from your desktop — turning raw leads into real conversations.
            </p>
          </div>
          <div className="grid md:grid-cols-3 gap-6">
            {[
              { title: "WhatsApp Automation", desc: "Send personalized WhatsApp messages with safe pacing and test mode.", stat: "WhatsApp" },
              { title: "Email Campaigns", desc: "Connect Gmail and run bulk outreach with templates and delays.", stat: "Email" },
              { title: "Import Your Leads", desc: "Paste CSV or sheets data and start outreach in minutes.", stat: "CSV/Sheets" }
            ].map((item, idx) => (
              <div
                key={idx}
                data-animate
                className="opacity-0 translate-y-10 transition-all duration-1000"
                style={{ transitionDelay: `${idx * 100}ms` }}
              >
                <div className="bg-card border border-border rounded-2xl p-6 hover:border-primary/50 hover:shadow-xl hover:shadow-primary/5 transition-all duration-300 h-full">
                  <div className="text-sm font-semibold text-accent mb-2">{item.stat}</div>
                  <h3 className="text-xl font-semibold mb-2 text-foreground">{item.title}</h3>
                  <p className="text-muted-foreground">{item.desc}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Comparison Section */}
      <section className="py-10 px-4 relative">
        <div className="max-w-4xl mx-auto">
          <div className="text-center mb-6">
            <h2 className="text-4xl md:text-5xl font-bold mb-4 gradient-text">Pay Once, Extract & Outreach Forever</h2>
            <p className="text-muted-foreground text-lg mb-2">Unlike other Google Maps scrapers, MapsReach includes built-in outreach automation — no monthly tools, no extra subscriptions.</p>
            <p className="text-muted-foreground text-base">Best paid Google Maps scraper with one-time pricing vs expensive monthly subscriptions</p>
          </div>

          <div data-animate className="opacity-0 translate-y-10 transition-all duration-1000">
            <div className="grid md:grid-cols-2 gap-6">
              {/* Manual Way */}
              <div className="bg-card border border-destructive/30 rounded-2xl p-6">
                <div className="flex items-center gap-3 mb-6">
                  <div className="w-10 h-10 rounded-full bg-destructive/20 flex items-center justify-center">
                    <span className="text-destructive text-xl">✗</span>
                  </div>
                  <h3 className="text-xl font-semibold text-foreground">Manual Lead Research</h3>
                </div>
                <ul className="space-y-4">
                  {[
                    "4-6 hours per 100 leads",
                    "Copy-paste each field",
                    "Miss contact details",
                    "Prone to human errors",
                    "Exhausting & repetitive",
                    "Pay VAs $500+/month"
                  ].map((item, idx) => (
                    <li key={idx} className="flex items-center gap-3 text-muted-foreground">
                      <span className="text-destructive">✗</span>
                      {item}
                    </li>
                  ))}
                </ul>
              </div>

              {/* MapsReach Way */}
              <div className="bg-card border border-accent/50 rounded-2xl p-6 shadow-lg shadow-accent/5">
                <div className="flex items-center gap-3 mb-6">
                  <div className="w-10 h-10 rounded-full bg-accent/20 flex items-center justify-center">
                    <span className="text-accent text-xl">✓</span>
                  </div>
                  <h3 className="text-xl font-semibold text-foreground">With MapsReach</h3>
                </div>
                <ul className="space-y-4">
                  {[
                    "100 leads in 2 minutes",
                    "One-click extraction",
                    "Complete data fields",
                    "100% accurate data",
                    "Effortless & fast",
                    "One-time $59 payment"
                  ].map((item, idx) => (
                    <li key={idx} className="flex items-center gap-3 text-foreground">
                      <span className="text-accent">✓</span>
                      {item}
                    </li>
                  ))}
                </ul>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* FAQ Section */}
      <section id="faq" className="py-10 px-4 relative">
        <div className="max-w-3xl mx-auto">
          <div className="text-center mb-6">
            <h2 className="text-4xl md:text-5xl font-bold mb-4 gradient-text">Google Maps Lead Extractor Questions</h2>
            <p className="text-muted-foreground text-lg">Everything about our Google Maps scraper and lead generation features</p>
          </div>

          <div className="space-y-3">
            {faqs.map((faq, idx) => (
              <FAQItem
                key={idx}
                question={faq.question}
                answer={faq.answer}
                isOpen={openFAQ === idx}
                onClick={() => setOpenFAQ(openFAQ === idx ? null : idx)}
              />
            ))}
          </div>

          <div data-animate className="opacity-0 translate-y-10 transition-all duration-1000 mt-12 text-center">
            <p className="text-muted-foreground mb-4">Still have questions?</p>
            <button
              onClick={openTawkChat}
              className="px-6 py-3 bg-primary/20 text-primary font-semibold rounded-full border border-primary/40 hover:bg-primary/30 transition-all duration-300"
            >
              Chat with the founder →
            </button>
          </div>
        </div>
      </section>

      {/* Final CTA */}
      <section className="py-10 px-4 relative overflow-hidden bg-gradient-to-b from-background to-muted/20">
        {/* Background elements */}
        <div className="absolute inset-0 opacity-20">
          <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-96 h-96 bg-primary rounded-full mix-blend-screen filter blur-3xl"></div>
        </div>

        <div className="max-w-4xl mx-auto text-center relative z-10">
          <div data-animate className="opacity-0 translate-y-10 transition-all duration-1000">
            <h2 className="text-4xl md:text-6xl font-bold mb-6">
              <span className="text-foreground">Get the </span>
              <span className="gradient-text">Best Lead Generation Tool 2026</span>
            </h2>
            <p className="text-xl text-muted-foreground mb-8 max-w-2xl mx-auto">
              Join 2,000+ users who chose the best Google Maps scraper tool for B2B lead generation. Extract business info fast.
            </p>
          </div>

          <div data-animate className="opacity-0 translate-y-10 transition-all duration-1000 flex flex-col sm:flex-row gap-4 justify-center items-center mb-8" style={{ transitionDelay: "100ms" }}>
            <a
              href="/pricing"
              className="group px-10 py-5 bg-gradient-to-r from-primary to-secondary text-white font-bold text-lg rounded-full hover:shadow-2xl hover:shadow-primary/40 transition-all duration-300 hover:scale-105 flex items-center gap-3"
            >
              <span>Get Lifetime Access</span>
              <svg className="w-5 h-5 group-hover:translate-x-1 transition-transform" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 7l5 5m0 0l-5 5m5-5H6" />
              </svg>
            </a>
          </div>

          <div data-animate className="opacity-0 translate-y-10 transition-all duration-1000" style={{ transitionDelay: "200ms" }}>
            <div className="flex flex-wrap items-center justify-center gap-6 text-sm text-muted-foreground">
              <span className="flex items-center gap-2">
                <svg className="w-5 h-5 text-accent" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                </svg>
                Instant license delivery
              </span>
              <span className="flex items-center gap-2">
                <svg className="w-5 h-5 text-accent" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                </svg>
                Lifetime updates included
              </span>
              <span className="flex items-center gap-2">
                <svg className="w-5 h-5 text-accent" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                </svg>
                Secure checkout
              </span>
            </div>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="border-t border-border py-12 px-4 bg-card/50">
        <div className="max-w-6xl mx-auto">
          <div className="grid md:grid-cols-4 gap-8 mb-8">
            <div className="md:col-span-2">
              <div className="flex items-center gap-4 mb-4">
                {/* Logo */}
                <img src="/logo.png" alt="MapsReach" className="h-12 w-auto" />
                {/* Slogan */}
                <div className="flex flex-col">
                  <div className="flex items-center gap-1">
                    <span className="text-muted-foreground font-medium text-sm">Extract</span>
                    <span className="text-primary font-bold text-sm border-b border-primary">Emails</span>
                    <span className="text-muted-foreground">,</span>
                    <span className="text-secondary font-bold text-sm border-b border-secondary">Phones</span>
                    <span className="text-muted-foreground font-medium text-sm">& More</span>
                  </div>
                </div>
              </div>
              <p className="text-muted-foreground text-sm max-w-md">
                Google Maps scraper tool for lead generation. Extract B2B business leads, emails, and phones. One-time payment, unlimited extractions.
              </p>
            </div>
            <div>
              <h4 className="font-semibold text-foreground mb-4">Product</h4>
              <ul className="space-y-2 text-sm">
                <li><button onClick={() => scrollToSection("how-it-works")} className="text-muted-foreground hover:text-foreground transition-colors">How it Works</button></li>
                <li><button onClick={() => scrollToSection("features")} className="text-muted-foreground hover:text-foreground transition-colors">Features</button></li>
                <li><a href="/pricing" className="text-muted-foreground hover:text-foreground transition-colors">Pricing</a></li>
                <li><a href="/blog" className="text-muted-foreground hover:text-foreground transition-colors">Blog</a></li>
              </ul>
            </div>
          </div>
          <div className="pt-8 border-t border-border flex flex-col md:flex-row items-center justify-center gap-4">
            <p className="text-muted-foreground text-sm">
              © 2026 MapsReach. All rights reserved.
              <span className="mx-2">|</span>
              <a href="/privacy" className="hover:underline text-primary">Privacy Policy</a>
              <span className="mx-2">|</span>
              <a href="/terms" className="hover:underline text-primary">Terms of Service</a>
            </p>
          </div>
        </div>
      </footer>

      {/* Note: Tawk.to provides its own floating chat button */}
    </main>
  )
}




