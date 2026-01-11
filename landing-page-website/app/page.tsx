"use client"

import { useEffect, useRef, useState } from "react"

// Cookie helper functions for persistent affiliate tracking
function setCookie(name: string, value: string, days: number) {
  const expires = new Date(Date.now() + days * 24 * 60 * 60 * 1000).toUTCString()
  document.cookie = `${name}=${encodeURIComponent(value)}; expires=${expires}; path=/; SameSite=Lax`
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
        alert("Chat is loading... Please try again in a moment, or email us directly at support@mapsreach.com")
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
      localStorage.setItem('affiliateCode', refCode.toUpperCase())
      localStorage.setItem('referralCode', refCode.toUpperCase())
      localStorage.setItem('referralTimestamp', new Date().toISOString())
      
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
      window.history.replaceState({}, '', cleanUrl)
      
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
      const storedRef = localStorage.getItem('referralCode')
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
      answer: "No limits whatsoever. With your lifetime license, you can extract unlimited leads from unlimited niches. Extract 100 leads or 100,000 – it's all included."
    },
    {
      question: "What payment methods do you accept?",
      answer: "We accept USDT (TRC20/ERC20), RedotPay, Skrill, and Neteller. Choose the method that works best for you – all transactions are secure and processed quickly."
    },
    {
      question: "Do I need technical skills to use this?",
      answer: "Not at all! If you can use Google Maps, you can use MapsReach. Just search, click, and export. It takes literally 30 seconds to learn."
    },
    {
      question: "What's included in the lifetime license?",
      answer: "Everything! Unlimited extractions, all data fields (emails, phones, social media, reviews), export to Google Sheets/CSV, priority support, and all future updates – forever."
    },
    {
      question: "What's your refund policy?",
      answer: "All sales are final since the license is delivered instantly as a digital product. But I'm happy to answer any questions or show you a demo before you buy so you know exactly what you're getting!"
    }
  ]

  const testimonials = [
    {
      name: "Sarah M.",
      role: "Marketing Freelancer",
      text: "Extracted 500+ restaurant leads in under an hour. This used to take me a whole week!",
      avatar: "S",
      rating: 5
    },
    {
      name: "Mike R.",
      role: "Lead Generation Agency",
      text: "Best investment I've made for my agency. Paid for itself on the first client job.",
      avatar: "M",
      rating: 5
    },
    {
      name: "Jessica L.",
      role: "Real Estate Agent",
      text: "Finding local business contacts has never been easier. Game changer for networking.",
      avatar: "J",
      rating: 5
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
            <div className="hidden sm:flex items-center gap-2 -ml-1">
              <span className="text-[#3b82f6] font-semibold text-base tracking-wide">Extract</span>
              <span className="text-[#60a5fa] text-sm">•</span>
              <span className="text-[#2563eb] font-semibold text-base tracking-wide">Export</span>
              <span className="text-[#60a5fa] text-sm">•</span>
              <span className="text-[#1d4ed8] font-semibold text-base tracking-wide">Excel</span>
            </div>
          </button>
          
          {/* Floating navigation buttons */}
          <div className="hidden md:flex items-center gap-4">
            <button onClick={() => scrollToSection("how-it-works")} className="text-muted-foreground hover:text-foreground transition-all duration-300 text-base font-medium px-4 py-2 rounded-lg hover:bg-white/10 hover:backdrop-blur-sm">How it Works</button>
            <button onClick={() => scrollToSection("features")} className="text-muted-foreground hover:text-foreground transition-all duration-300 text-base font-medium px-4 py-2 rounded-lg hover:bg-white/10 hover:backdrop-blur-sm">Features</button>
            <button onClick={() => scrollToSection("pricing")} className="text-muted-foreground hover:text-foreground transition-all duration-300 text-base font-medium px-4 py-2 rounded-lg hover:bg-white/10 hover:backdrop-blur-sm">Pricing</button>
            <button onClick={() => scrollToSection("faq")} className="text-muted-foreground hover:text-foreground transition-all duration-300 text-base font-medium px-4 py-2 rounded-lg hover:bg-white/10 hover:backdrop-blur-sm">FAQ</button>
          </div>
          
          <a
            href="/purchase"
            className="px-6 py-3 bg-gradient-to-r from-[#3b82f6] to-[#1d4ed8] text-white font-semibold rounded-full text-base hover:shadow-lg hover:shadow-blue-500/30 transition-all duration-200"
          >
            Get License
          </a>
        </div>
      </nav>

      {/* Hero Section */}
      <section
        ref={heroRef}
        className="relative min-h-screen flex items-center justify-center px-6 py-12 overflow-hidden"
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

        <div className="relative z-10 max-w-5xl mx-auto text-center pt-8">
          {/* Main Hero Content */}
          <div data-animate className="opacity-0 translate-y-10 transition-all duration-1000">
            <h1 className="text-5xl sm:text-6xl md:text-7xl font-bold mb-5 leading-tight tracking-tight">
              <span className="text-foreground">Stop Hunting Leads.</span>
              <br />
              <span className="gradient-text">Start Extracting Them.</span>
            </h1>
            
            <p className="text-xl md:text-2xl text-muted-foreground mb-6 max-w-3xl mx-auto leading-normal">
              Extract unlimited business leads from Google Maps in seconds. 
              <span className="text-foreground font-medium"> Names, emails, phones, reviews</span> – everything you need, exported directly to Google Sheets.
            </p>
            
            {/* Value props in a sleek row */}
            <div className="flex flex-wrap justify-center gap-6 mb-8">
              <div className="flex items-center gap-2 text-base text-accent">
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                </svg>
                <span>One-time payment</span>
              </div>
              <div className="flex items-center gap-2 text-base text-accent">
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                </svg>
                <span>Lifetime updates</span>
              </div>
              <div className="flex items-center gap-2 text-base text-accent">
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                </svg>
                <span>30-second setup</span>
              </div>
            </div>
          </div>

          {/* CTA Buttons */}
          <div
            data-animate
            className="opacity-0 translate-y-10 transition-all duration-1000 flex flex-col sm:flex-row gap-4 justify-center items-center mb-10"
            style={{ transitionDelay: "200ms" }}
          >
            <a
              href="/purchase"
              className="group px-10 py-5 bg-gradient-to-r from-primary to-secondary text-primary-foreground font-semibold rounded-full text-lg hover:shadow-xl hover:shadow-primary/40 transition-all duration-300 hover:scale-105 flex items-center gap-3"
            >
              <span>Get Lifetime Access – $59</span>
              <svg className="w-6 h-6 group-hover:translate-x-1 transition-transform" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 7l5 5m0 0l-5 5m5-5H6" />
              </svg>
            </a>
            <a
              href="#how-it-works"
              onClick={(e) => { e.preventDefault(); scrollToSection("how-it-works") }}
              className="px-10 py-5 bg-muted/50 text-foreground font-semibold rounded-full text-lg border border-border hover:bg-muted transition-all duration-300 flex items-center gap-3"
            >
              <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M14.752 11.168l-3.197-2.132A1 1 0 0010 9.87v4.263a1 1 0 001.555.832l3.197-2.132a1 1 0 000-1.664z" />
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
              Watch Demo
            </a>
          </div>

          {/* Stats */}
          <div data-animate className="opacity-0 translate-y-10 transition-all duration-1000 grid grid-cols-3 gap-10 max-w-3xl mx-auto" style={{ transitionDelay: "300ms" }}>
            <div className="text-center">
              <div className="text-4xl md:text-5xl font-bold gradient-text"><AnimatedCounter end={2847} suffix="+" /></div>
              <div className="text-base text-foreground font-medium">Active Users</div>
            </div>
            <div className="text-center">
              <div className="text-4xl md:text-5xl font-bold gradient-text"><AnimatedCounter end={12} suffix="M+" /></div>
              <div className="text-base text-foreground font-medium">Leads Extracted</div>
            </div>
            <div className="text-center">
              <div className="text-4xl md:text-5xl font-bold gradient-text"><AnimatedCounter end={4} suffix="hrs" /></div>
              <div className="text-base text-foreground font-medium">Avg. Time Saved/Day</div>
            </div>
          </div>
        </div>

        {/* Scroll indicator */}
        <div className="absolute bottom-4 left-1/2 -translate-x-1/2 animate-bounce">
          <svg className="w-8 h-8 text-muted-foreground" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 14l-7 7m0 0l-7-7m7 7V3" />
          </svg>
        </div>
      </section>

      {/* Social Proof Bar */}
      <section className="py-6 px-6 border-y border-border bg-muted/20">
        <div className="max-w-7xl mx-auto">
          <p className="text-center text-muted-foreground text-base mb-4">Trusted by freelancers and agencies worldwide</p>
          <div className="flex flex-wrap justify-center items-center gap-10 md:gap-20 opacity-60">
            {["🏢 Real Estate", "🍽️ Restaurants", "🔧 Contractors", "💼 Agencies", "🏋️ Fitness", "🏥 Healthcare"].map((industry, idx) => (
              <span key={idx} className="text-muted-foreground font-medium text-lg whitespace-nowrap">{industry}</span>
            ))}
          </div>
        </div>
      </section>

      {/* How It Works */}
      <section id="how-it-works" className="py-10 px-6 relative">
        <div className="max-w-7xl mx-auto">
          <div className="text-center mb-8">
            <span className="inline-block px-5 py-2 bg-primary/10 text-primary rounded-full text-base font-medium mb-5">Simple Process</span>
            <h2 className="text-5xl md:text-6xl font-bold mb-6 gradient-text">From Search to Leads in 5 Steps</h2>
            <p className="text-muted-foreground text-xl max-w-3xl mx-auto">
              No learning curve. No complex setup. Just install and start extracting.
            </p>
          </div>

          <div className="grid md:grid-cols-5 gap-4 md:gap-2 relative">
            {/* Connection line */}
            <div className="hidden md:block absolute top-1/2 left-0 right-0 h-0.5 bg-gradient-to-r from-primary via-secondary to-accent opacity-30 -translate-y-1/2 z-0"></div>
            
            {[
              { step: 1, title: "Open Google Maps", icon: "🗺️", desc: "Go to maps.google.com" },
              { step: 2, title: "Search Your Niche", icon: "🔍", desc: '"Restaurants in NYC"' },
              { step: 3, title: "Click MapsReach", icon: "⚡", desc: "Open the extension" },
              { step: 4, title: "Hit Extract", icon: "🚀", desc: "Watch the magic happen" },
              { step: 5, title: "Export Data", icon: "📊", desc: "To Sheets or CSV" },
            ].map((item, idx) => (
              <div
                key={idx}
                data-animate
                className="opacity-0 translate-y-10 transition-all duration-1000 relative z-10"
                style={{ transitionDelay: `${idx * 100}ms` }}
              >
                <div className="bg-card border border-border rounded-xl p-6 text-center hover:border-primary/50 hover:shadow-lg hover:shadow-primary/10 transition-all duration-300 h-full flex flex-col justify-between group">
                  <div>
                    <div className="w-16 h-16 mx-auto mb-4 rounded-full bg-gradient-to-br from-primary/20 to-secondary/20 flex items-center justify-center text-3xl group-hover:scale-110 transition-transform">
                      {item.icon}
                    </div>
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

          {/* Video/Demo placeholder */}
          <div data-animate className="opacity-0 translate-y-10 transition-all duration-1000 mt-16">
            <div className="relative rounded-2xl overflow-hidden border border-border bg-card shadow-2xl">
              <div className="aspect-video bg-gradient-to-br from-primary/5 to-secondary/5 flex items-center justify-center group cursor-pointer">
                <div className="text-center">
                  <div className="w-20 h-20 mx-auto mb-4 rounded-full bg-primary/90 flex items-center justify-center group-hover:scale-110 group-hover:bg-primary transition-all duration-300 shadow-lg shadow-primary/30">
                    <svg className="w-8 h-8 text-white ml-1" fill="currentColor" viewBox="0 0 24 24">
                      <path d="M8 5v14l11-7z" />
                    </svg>
                  </div>
                  <p className="text-muted-foreground">Watch the 60-second demo</p>
                </div>
              </div>
              {/* Browser mockup frame */}
              <div className="absolute top-0 left-0 right-0 h-10 bg-muted/50 border-b border-border flex items-center px-4 gap-2">
                <div className="flex gap-1.5">
                  <div className="w-3 h-3 rounded-full bg-red-500/70"></div>
                  <div className="w-3 h-3 rounded-full bg-yellow-500/70"></div>
                  <div className="w-3 h-3 rounded-full bg-green-500/70"></div>
                </div>
                <div className="flex-1 mx-4 h-6 bg-muted rounded-md"></div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Data Extraction - What You Get */}
      <section id="features" className="py-10 px-4 relative bg-muted/10">
        <div className="max-w-6xl mx-auto">
          <div className="text-center mb-6">
            <span className="inline-block px-4 py-1 bg-secondary/10 text-secondary rounded-full text-sm font-medium mb-4">Complete Data</span>
            <h2 className="text-4xl md:text-5xl font-bold mb-4 gradient-text">Everything You Need to Close Deals</h2>
            <p className="text-muted-foreground text-lg">Extract comprehensive business data with a single click</p>
          </div>

          <div
            data-animate
            className="opacity-0 translate-y-10 transition-all duration-1000"
          >
            {/* Main data grid */}
            <div className="grid md:grid-cols-2 lg:grid-cols-5 gap-4 mb-8">
              {[
                { icon: "🏢", label: "Business Name", desc: "Full legal name" },
                { icon: "📞", label: "Phone Number", desc: "Direct contact" },
                { icon: "📧", label: "Email Address", desc: "When available" },
                { icon: "🌐", label: "Website URL", desc: "Official site" },
                { icon: "📍", label: "Full Address", desc: "Street & city" },
              ].map((item, idx) => (
                <div key={idx} className="bg-card border border-border rounded-xl p-5 hover:border-primary/50 hover:shadow-lg hover:shadow-primary/5 transition-all duration-300 group">
                  <div className="text-3xl mb-3 group-hover:scale-110 transition-transform">{item.icon}</div>
                  <p className="font-semibold text-foreground">{item.label}</p>
                  <p className="text-sm text-muted-foreground">{item.desc}</p>
                </div>
              ))}
            </div>

            <div className="grid md:grid-cols-2 lg:grid-cols-5 gap-4">
              {[
                { icon: "📱", label: "Social Media", desc: "FB, IG, LinkedIn" },
                { icon: "⭐", label: "Rating", desc: "Star rating" },
                { icon: "💬", label: "Reviews", desc: "Review count" },
                { icon: "🏷️", label: "Category", desc: "Business type" },
                { icon: "🔗", label: "Maps Link", desc: "Direct URL" },
              ].map((item, idx) => (
                <div key={idx} className="bg-card border border-border rounded-xl p-5 hover:border-secondary/50 hover:shadow-lg hover:shadow-secondary/5 transition-all duration-300 group">
                  <div className="text-3xl mb-3 group-hover:scale-110 transition-transform">{item.icon}</div>
                  <p className="font-semibold text-foreground">{item.label}</p>
                  <p className="text-sm text-muted-foreground">{item.desc}</p>
                </div>
              ))}
            </div>
          </div>

          {/* Export options */}
          <div data-animate className="opacity-0 translate-y-10 transition-all duration-1000 mt-12">
            <div className="bg-card border border-border rounded-2xl p-8 text-center">
              <h3 className="text-xl font-semibold mb-4 text-foreground">Export Anywhere</h3>
              <div className="flex flex-wrap justify-center gap-4">
                {[
                  { name: "Google Sheets", icon: "📊" },
                  { name: "CSV File", icon: "📄" },
                  { name: "Excel", icon: "📗" },
                  { name: "Copy to Clipboard", icon: "📋" },
                ].map((item, idx) => (
                  <div key={idx} className="px-6 py-3 bg-muted/50 rounded-full border border-border flex items-center gap-2">
                    <span>{item.icon}</span>
                    <span className="text-muted-foreground">{item.name}</span>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Testimonials */}
      <section className="py-10 px-4 relative">
        <div className="max-w-6xl mx-auto">
          <div className="text-center mb-6">
            <span className="inline-block px-4 py-1 bg-accent/10 text-accent rounded-full text-sm font-medium mb-4">Social Proof</span>
            <h2 className="text-4xl md:text-5xl font-bold mb-4 gradient-text">Loved by 2,000+ Users</h2>
            <p className="text-muted-foreground text-lg">Join thousands of freelancers already saving hours every day</p>
          </div>

          <div className="grid md:grid-cols-3 gap-6">
            {testimonials.map((testimonial, idx) => (
              <div
                key={idx}
                data-animate
                className="opacity-0 translate-y-10 transition-all duration-1000"
                style={{ transitionDelay: `${idx * 100}ms` }}
              >
                <div className="bg-card border border-border rounded-2xl p-6 h-full hover:border-primary/30 transition-colors">
                  <div className="flex gap-1 mb-4">
                    {[...Array(testimonial.rating)].map((_, i) => (
                      <svg key={i} className="w-5 h-5 text-yellow-500" fill="currentColor" viewBox="0 0 20 20">
                        <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
                      </svg>
                    ))}
                  </div>
                  <p className="text-foreground mb-6 leading-relaxed">"{testimonial.text}"</p>
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-full bg-gradient-to-br from-primary to-secondary flex items-center justify-center text-white font-bold">
                      {testimonial.avatar}
                    </div>
                    <div>
                      <p className="font-semibold text-foreground">{testimonial.name}</p>
                      <p className="text-sm text-muted-foreground">{testimonial.role}</p>
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Why Freelancers Love It - Benefits */}
      <section className="py-10 px-4 relative bg-muted/10">
        <div className="max-w-6xl mx-auto">
          <div className="text-center mb-6">
            <span className="inline-block px-4 py-1 bg-primary/10 text-primary rounded-full text-sm font-medium mb-4">Benefits</span>
            <h2 className="text-4xl md:text-5xl font-bold mb-4 gradient-text">Why Smart Freelancers Choose MapsReach</h2>
            <p className="text-muted-foreground text-lg">Built by a freelancer who was tired of wasting time</p>
          </div>

          <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-6">
            {[
              { 
                title: "Save 4+ Hours Daily", 
                desc: "What takes a VA days to do manually, MapsReach does in minutes. Reclaim your time.", 
                icon: "⏱️",
                stat: "4hrs",
                statLabel: "saved daily"
              },
              { 
                title: "Zero Manual Work", 
                desc: "No more copy-pasting. No more tab switching. Fully automated lead extraction.", 
                icon: "🤖",
                stat: "100%",
                statLabel: "automated"
              },
              { 
                title: "Never Miss a Lead", 
                desc: "Extract every single business in your search area. No lead left behind.", 
                icon: "🎯",
                stat: "100%",
                statLabel: "capture rate"
              },
              { 
                title: "One-Time Price", 
                desc: "Pay once, use forever. No monthly fees eating into your margins.", 
                icon: "💰",
                stat: "$0",
                statLabel: "monthly"
              },
            ].map((item, idx) => (
              <div
                key={idx}
                data-animate
                className="opacity-0 translate-y-10 transition-all duration-1000"
                style={{ transitionDelay: `${idx * 100}ms` }}
              >
                <div className="bg-card border border-border rounded-2xl p-6 hover:border-primary/50 hover:shadow-xl hover:shadow-primary/5 transition-all duration-300 h-full group">
                  <div className="text-4xl mb-4 group-hover:scale-110 transition-transform">{item.icon}</div>
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

      {/* Comparison Section */}
      <section className="py-10 px-4 relative">
        <div className="max-w-4xl mx-auto">
          <div className="text-center mb-6">
            <span className="inline-block px-4 py-1 bg-secondary/10 text-secondary rounded-full text-sm font-medium mb-4">Comparison</span>
            <h2 className="text-4xl md:text-5xl font-bold mb-4 gradient-text">MapsReach vs The Old Way</h2>
            <p className="text-muted-foreground text-lg">See why 2,000+ users made the switch</p>
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

      {/* Pricing */}
      <section id="pricing" className="py-10 px-4 relative bg-muted/10">
        <div className="max-w-4xl mx-auto text-center">
          <div className="mb-6">
            <span className="inline-block px-4 py-1 bg-primary/10 text-primary rounded-full text-sm font-medium mb-4">Pricing</span>
            <h2 className="text-4xl md:text-5xl font-bold mb-4 gradient-text">One Price. Unlimited Value.</h2>
            <p className="text-muted-foreground text-lg">No subscriptions. No hidden fees. Just results.</p>
          </div>

          <div
            data-animate
            className="opacity-0 translate-y-10 transition-all duration-1000"
          >
            <div className="bg-card border-2 border-primary/50 rounded-3xl p-8 md:p-12 relative overflow-hidden shadow-2xl shadow-primary/10">
              {/* Popular badge */}
              <div className="absolute top-0 right-0 bg-gradient-to-r from-primary to-secondary text-white px-6 py-2 rounded-bl-2xl font-semibold text-sm">
                LIFETIME ACCESS
              </div>

              {/* Price */}
              <div className="mb-8">
                <div className="text-7xl md:text-8xl font-bold text-foreground">
                  $59
                </div>
                <p className="text-xl text-muted-foreground mt-2">One-time payment • Forever access</p>
              </div>

              {/* Features */}
              <div className="grid md:grid-cols-2 gap-4 text-left mb-8 max-w-xl mx-auto">
                {[
                  "Unlimited lead extractions",
                  "All 10+ data fields",
                  "Export to Sheets & CSV",
                  "Chrome & Edge support",
                  "Priority email support",
                  "All future updates free",
                  "Instant license delivery",
                  "No monthly fees ever"
                ].map((item, idx) => (
                  <div key={idx} className="flex items-center gap-3">
                    <div className="w-6 h-6 rounded-full bg-accent/20 flex items-center justify-center flex-shrink-0">
                      <svg className="w-4 h-4 text-accent" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                      </svg>
                    </div>
                    <span className="text-foreground">{item}</span>
                  </div>
                ))}
              </div>

              {/* CTA */}
              <a
                href="/purchase"
                className="inline-block w-full md:w-auto px-12 py-5 bg-gradient-to-r from-primary to-secondary text-white font-bold text-lg rounded-full hover:shadow-2xl hover:shadow-primary/40 transition-all duration-300 hover:scale-105 text-center"
              >
                Get Lifetime Access Now →
              </a>

              {/* Trust elements */}
              <div className="mt-8 flex flex-wrap items-center justify-center gap-6 text-sm text-muted-foreground">
                <span className="flex items-center gap-2">
                  <svg className="w-5 h-5 text-accent" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" />
                  </svg>
                  Secure Payment
                </span>
                <span className="flex items-center gap-2">
                  <svg className="w-5 h-5 text-accent" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 10h18M7 15h1m4 0h1m-7 4h12a3 3 0 003-3V8a3 3 0 00-3-3H6a3 3 0 00-3 3v8a3 3 0 003 3z" />
                  </svg>
                  Multiple Payment Options
                </span>
                <span className="flex items-center gap-2">
                  <svg className="w-5 h-5 text-accent" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
                  </svg>
                  Activation in Minutes
                </span>
              </div>
            </div>
          </div>

          {/* ROI Calculator hint */}
          <div data-animate className="opacity-0 translate-y-10 transition-all duration-1000 mt-12">
            <div className="bg-card border border-border rounded-2xl p-6 text-center">
              <p className="text-foreground mb-2">
                <span className="font-semibold">Quick Math:</span> If your time is worth $30/hour and you save 4 hours/day...
              </p>
              <p className="text-2xl font-bold text-accent">
                MapsReach pays for itself in just 30 minutes of use.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* FAQ Section */}
      <section id="faq" className="py-10 px-4 relative">
        <div className="max-w-3xl mx-auto">
          <div className="text-center mb-6">
            <span className="inline-block px-4 py-1 bg-secondary/10 text-secondary rounded-full text-sm font-medium mb-4">FAQ</span>
            <h2 className="text-4xl md:text-5xl font-bold mb-4 gradient-text">Got Questions?</h2>
            <p className="text-muted-foreground text-lg">Everything you need to know before getting started</p>
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
              <span className="text-foreground">Ready to </span>
              <span className="gradient-text">10x Your Lead Gen?</span>
            </h2>
            <p className="text-xl text-muted-foreground mb-8 max-w-2xl mx-auto">
              Join 2,000+ freelancers who stopped wasting time and started closing more deals.
            </p>
          </div>

          <div data-animate className="opacity-0 translate-y-10 transition-all duration-1000 flex flex-col sm:flex-row gap-4 justify-center items-center mb-8" style={{ transitionDelay: "100ms" }}>
            <a
              href="/purchase"
              className="group px-10 py-5 bg-gradient-to-r from-primary to-secondary text-white font-bold text-lg rounded-full hover:shadow-2xl hover:shadow-primary/40 transition-all duration-300 hover:scale-105 flex items-center gap-3"
            >
              <span>Get Lifetime Access – $59</span>
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
                  <div className="flex items-center gap-1.5">
                    <span className="text-[#3b82f6] font-bold text-sm">Extract</span>
                    <span className="text-[#60a5fa]">•</span>
                    <span className="text-[#2563eb] font-bold text-sm">Export</span>
                    <span className="text-[#60a5fa]">•</span>
                    <span className="text-[#1d4ed8] font-bold text-sm">Excel</span>
                  </div>
                </div>
              </div>
              <p className="text-muted-foreground text-sm max-w-md">
                The fastest way to extract business leads from Google Maps. Built by a freelancer, for freelancers.
              </p>
            </div>
            <div>
              <h4 className="font-semibold text-foreground mb-4">Product</h4>
              <ul className="space-y-2 text-sm">
                <li><button onClick={() => scrollToSection("how-it-works")} className="text-muted-foreground hover:text-foreground transition-colors">How it Works</button></li>
                <li><button onClick={() => scrollToSection("features")} className="text-muted-foreground hover:text-foreground transition-colors">Features</button></li>
                <li><button onClick={() => scrollToSection("pricing")} className="text-muted-foreground hover:text-foreground transition-colors">Pricing</button></li>
                <li><button onClick={() => scrollToSection("faq")} className="text-muted-foreground hover:text-foreground transition-colors">FAQ</button></li>
              </ul>
            </div>
            <div>
              <h4 className="font-semibold text-foreground mb-4">Support</h4>
              <ul className="space-y-2 text-sm">
                <li><button onClick={openTawkChat} className="text-muted-foreground hover:text-foreground transition-colors">Contact Founder</button></li>
                <li><a href="#" className="text-muted-foreground hover:text-foreground transition-colors">Terms of Service</a></li>
                <li><a href="#" className="text-muted-foreground hover:text-foreground transition-colors">Privacy Policy</a></li>
                <li><a href="#" className="text-muted-foreground hover:text-foreground transition-colors">Sales Policy</a></li>
              </ul>
            </div>
          </div>
          <div className="pt-8 border-t border-border flex flex-col md:flex-row items-center justify-between gap-4">
            <p className="text-muted-foreground text-sm">
              © 2026 MapsReach. All rights reserved.
            </p>
            <div className="flex items-center gap-4">
              <span className="text-muted-foreground text-sm">Accepted payments:</span>
              <div className="flex items-center gap-2">
                {["💳", "🅿️", "🍎"].map((icon, idx) => (
                  <span key={idx} className="text-xl">{icon}</span>
                ))}
              </div>
            </div>
          </div>
        </div>
      </footer>

      {/* Note: Tawk.to provides its own floating chat button */}
    </main>
  )
}
