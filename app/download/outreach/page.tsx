"use client"

import Link from "next/link"
import { useState, useEffect } from "react"

export default function OutreachDownloadPage() {
  const [email, setEmail] = useState("")
  const [isConfirmed, setIsConfirmed] = useState(false)
  const [isValidEmail, setIsValidEmail] = useState(false)
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [isRegistered, setIsRegistered] = useState(false)
  const [showError, setShowError] = useState(false)

  // Validate Gmail address
  useEffect(() => {
    const gmailRegex = /^[a-zA-Z0-9._%+-]+@gmail\.com$/i
    setIsValidEmail(gmailRegex.test(email.trim()))
    setShowError(false)
  }, [email])

  const canDownload = isValidEmail && isConfirmed && isRegistered

  const handleRegister = async () => {
    if (!isValidEmail) {
      setShowError(true)
      return
    }
    if (!isConfirmed) {
      setShowError(true)
      return
    }

    setIsSubmitting(true)
    try {
      // Send email to your API for tracking
      await fetch('/api/track/outreach-email', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email: email.trim().toLowerCase() })
      })
    } catch (e) {
      // Continue even if tracking fails
    }
    setIsRegistered(true)
    setIsSubmitting(false)
  }

  const handleDownload = () => {
    // Track download
    fetch('/api/track/download', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ type: 'whatsapp_tool', email: email.trim().toLowerCase() })
    }).catch(() => {})
  }

  const steps = [
    {
      number: 1,
      title: "Download the Installer",
      description: "Click the download button to get the MapsReach Outreach setup file.",
    },
    {
      number: 2,
      title: "Run the Installer",
      description: "Open the downloaded file and follow the setup steps.",
    },
    {
      number: 3,
      title: "Launch the App",
      description: "Open MapsReach Outreach from your desktop or Start menu.",
    },
    {
      number: 4,
      title: "Start a Free Trial",
      description: "Download and use a free trial to explore the tool before you buy.",
    },
    {
      number: 5,
      title: "Import Leads & Send",
      description: "Import your CSV and start WhatsApp or email outreach anytime.",
    },
  ]

  return (
    <div className="min-h-screen bg-gradient-to-b from-[#020a18] via-[#041225] to-[#020510]">
      {/* Header */}
      <header className="py-0 px-8 border-b border-border/30">
        <div className="max-w-7xl mx-auto flex items-center justify-between">
          <Link href="/" className="flex items-center gap-1 hover:opacity-80 transition-opacity">
            <img src="/logo.png" alt="MapsReach" className="h-28 w-auto" />
            <div className="hidden sm:flex items-center gap-1.5 -ml-1">
              <span className="text-muted-foreground font-medium text-base">Extract</span>
              <span className="text-primary font-bold text-base border-b-2 border-primary">Emails</span>
              <span className="text-muted-foreground">,</span>
              <span className="text-secondary font-bold text-base border-b-2 border-secondary">Phones</span>
              <span className="text-muted-foreground font-medium text-base">& More</span>
            </div>
          </Link>
          <div className="hidden md:flex items-center gap-4">
            <Link href="/pricing" className="text-accent hover:text-foreground transition-all duration-300 text-base font-semibold px-4 py-2 rounded-lg border border-accent/30 hover:border-accent/60 hover:bg-accent/10">Pricing</Link>
            <Link href="/download/chrome" className="text-muted-foreground hover:text-foreground transition-all duration-300 text-base font-medium px-4 py-2 rounded-lg hover:bg-white/10">Chrome</Link>
            <Link href="/download/edge" className="text-muted-foreground hover:text-foreground transition-all duration-300 text-base font-medium px-4 py-2 rounded-lg hover:bg-white/10">Edge</Link>
          </div>
        </div>
      </header>

      {/* Hero Section */}
      <section className="py-16 px-4">
        <div className="max-w-4xl mx-auto text-center">
          <h1 className="text-4xl md:text-5xl font-bold mb-4 text-foreground">
            Download <span className="text-green-400">MapsReach Outreach</span>
          </h1>
          <p className="text-xl text-muted-foreground max-w-2xl mx-auto mb-4">
            Automate WhatsApp and email outreach to the leads you extracted.
          </p>
          <p className="text-sm text-muted-foreground mb-2">Windows 10/11 only</p>
          <p className="text-sm text-muted-foreground mb-8">No credit card required</p>

          {/* Email Registration Card */}
          <div className="max-w-md mx-auto mb-8">
            <div className={`relative p-6 rounded-2xl border transition-all duration-500 ${
              isRegistered 
                ? 'bg-green-500/10 border-green-500/50' 
                : 'bg-card/50 border-border/50'
            }`}>
              {/* Lock/Unlock Icon */}
              <div className={`absolute -top-4 left-1/2 -translate-x-1/2 w-8 h-8 rounded-full flex items-center justify-center transition-all duration-300 ${
                isRegistered ? 'bg-green-500' : 'bg-amber-500'
              }`}>
                {isRegistered ? (
                  <svg className="w-4 h-4 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M5 13l4 4L19 7" />
                  </svg>
                ) : (
                  <svg className="w-4 h-4 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
                  </svg>
                )}
              </div>

              {!isRegistered ? (
                <>
                  <h3 className="text-lg font-bold text-foreground text-center mt-2 mb-2">
                    📧 Register Your Gmail
                  </h3>
                  <p className="text-sm text-muted-foreground text-center mb-4">
                    The Outreach Tool's <span className="text-green-400 font-medium">Email Campaign</span> feature sends emails from your Gmail account.
                    To enable this, we need to authorize your email. Enter the <span className="text-foreground font-medium">exact Gmail address</span> you'll use for sending.
                  </p>

                  {/* Email Input */}
                  <div className="mb-4">
                    <div className={`relative flex items-center rounded-xl border transition-all ${
                      email && !isValidEmail 
                        ? 'border-red-500/50 bg-red-500/5' 
                        : isValidEmail 
                          ? 'border-green-500/50 bg-green-500/5' 
                          : 'border-border/50 bg-card/50'
                    }`}>
                      <span className="pl-4 text-muted-foreground">
                        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
                        </svg>
                      </span>
                      <input
                        type="email"
                        value={email}
                        onChange={(e) => setEmail(e.target.value)}
                        placeholder="your-email@gmail.com"
                        className="flex-1 bg-transparent px-3 py-3 text-foreground placeholder:text-muted-foreground/50 outline-none text-base"
                      />
                      {isValidEmail && (
                        <span className="pr-4 text-green-500">
                          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                          </svg>
                        </span>
                      )}
                    </div>
                    {email && !isValidEmail && (
                      <p className="text-red-400 text-xs mt-1 ml-1">Please enter a valid Gmail address (@gmail.com)</p>
                    )}
                  </div>

                  {/* Confirmation Checkbox */}
                  <label className={`flex items-start gap-3 p-3 rounded-xl cursor-pointer transition-all ${
                    isConfirmed ? 'bg-green-500/10 border border-green-500/30' : 'bg-card/30 border border-transparent hover:bg-card/50'
                  }`}>
                    <input
                      type="checkbox"
                      checked={isConfirmed}
                      onChange={(e) => setIsConfirmed(e.target.checked)}
                      className="mt-0.5 w-5 h-5 rounded accent-green-500 cursor-pointer"
                    />
                    <span className="text-sm text-muted-foreground">
                      I confirm this is the <span className="text-foreground font-medium">Gmail address</span> I will use in the Outreach Tool for sending emails.
                    </span>
                  </label>

                  {/* Error Message */}
                  {showError && (
                    <div className="mt-3 p-3 rounded-xl bg-red-500/10 border border-red-500/30">
                      <p className="text-red-400 text-sm text-center">
                        {!isValidEmail ? "Please enter a valid Gmail address" : "Please confirm your email is correct"}
                      </p>
                    </div>
                  )}

                  {/* Register Button */}
                  <button
                    onClick={handleRegister}
                    disabled={isSubmitting}
                    className={`w-full mt-4 py-3 px-6 rounded-xl font-semibold transition-all duration-200 flex items-center justify-center gap-2 ${
                      isValidEmail && isConfirmed
                        ? 'bg-gradient-to-r from-green-500 to-emerald-500 text-white hover:shadow-lg hover:shadow-green-500/30 hover:scale-[1.02]'
                        : 'bg-white/10 text-muted-foreground cursor-not-allowed'
                    }`}
                  >
                    {isSubmitting ? (
                      <>
                        <svg className="w-5 h-5 animate-spin" fill="none" viewBox="0 0 24 24">
                          <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                          <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                        </svg>
                        Registering...
                      </>
                    ) : (
                      <>
                        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 11V7a4 4 0 118 0m-4 8v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2z" />
                        </svg>
                        Unlock Download
                      </>
                    )}
                  </button>
                </>
              ) : (
                <div className="text-center py-2">
                  <div className="text-green-400 text-lg font-bold mb-1">✓ Email Registered!</div>
                  <p className="text-sm text-muted-foreground">
                    <span className="text-foreground font-medium">{email}</span> has been registered.
                  </p>
                </div>
              )}
            </div>
          </div>

          {/* Download Button */}
          {canDownload ? (
            <a
              href="/MapsReach-Outreach-Setup.exe"
              download="MapsReach-Outreach-Setup.exe"
              onClick={handleDownload}
              className="inline-flex items-center gap-3 px-10 py-5 bg-gradient-to-r from-green-500 to-emerald-500 text-white font-bold rounded-2xl text-xl hover:shadow-xl hover:shadow-green-500/40 transition-all duration-200 hover:scale-105 animate-pulse"
            >
              <svg className="w-7 h-7" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" />
              </svg>
              Download Outreach Tool
            </a>
          ) : (
            <div className="inline-flex flex-col items-center gap-2">
              <button
                disabled
                className="inline-flex items-center gap-3 px-10 py-5 bg-white/10 text-muted-foreground font-bold rounded-2xl text-xl cursor-not-allowed"
              >
                <svg className="w-7 h-7" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
                </svg>
                Download Locked
              </button>
              <p className="text-sm text-muted-foreground">Register your Gmail above to unlock</p>
            </div>
          )}
        </div>
      </section>

      {/* Installation Steps */}
      <section className="py-12 px-4">
        <div className="max-w-4xl mx-auto">
          <h2 className="text-2xl font-bold text-center mb-8 text-foreground">Installation Steps</h2>

          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-4">
            {steps.map((step) => (
              <div key={step.number} className="p-5 rounded-xl bg-card/50 border border-border/50 hover:border-green-500/50 transition-colors">
                <div className="flex items-start gap-4">
                  <div className="w-10 h-10 rounded-full bg-green-500 flex items-center justify-center flex-shrink-0">
                    <span className="text-white font-bold">{step.number}</span>
                  </div>
                  <div>
                    <h3 className="font-semibold text-foreground mb-1">{step.title}</h3>
                    <p className="text-sm text-muted-foreground">{step.description}</p>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Requirements */}
      <section className="py-12 px-4">
        <div className="max-w-4xl mx-auto">
          <h2 className="text-2xl font-bold text-center mb-8 text-foreground">Requirements</h2>
          <div className="grid md:grid-cols-3 gap-6">
            <div className="flex items-center gap-3 p-4 rounded-xl bg-card/30 border border-border/50">
              <span className="text-muted-foreground">Windows 10/11</span>
            </div>
            <div className="flex items-center gap-3 p-4 rounded-xl bg-card/30 border border-border/50">
              <span className="text-muted-foreground">License key</span>
            </div>
            <div className="flex items-center gap-3 p-4 rounded-xl bg-card/30 border border-border/50">
              <span className="text-muted-foreground">CSV leads file</span>
            </div>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="py-8 px-4 border-t border-border/30">
        <div className="max-w-6xl mx-auto text-center text-muted-foreground text-sm">
          <p>2026 MapsReach. All rights reserved.</p>
          <div className="mt-2 flex items-center justify-center gap-4">
            <Link href="/privacy" className="hover:text-foreground transition-colors">Privacy Policy</Link>
            <span></span>
            <Link href="/pricing" className="hover:text-foreground transition-colors">Pricing</Link>
            <span></span>
            <Link href="/" className="hover:text-foreground transition-colors">Home</Link>
          </div>
        </div>
      </footer>
    </div>
  )
}
