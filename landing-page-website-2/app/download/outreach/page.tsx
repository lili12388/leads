"use client"

import Link from "next/link"

export default function OutreachDownloadPage() {
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
      title: "Activate with License",
      description: "Enter your license key to unlock all features.",
    },
    {
      number: 5,
      title: "Import Leads & Send",
      description: "Import your CSV and start WhatsApp or email outreach.",
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
          <p className="text-sm text-muted-foreground mb-8">Windows 10/11 only</p>

          {/* Download Button */}
          <a
            href="/MapsReach-Outreach-Setup.exe"
            download="MapsReach-Outreach-Setup.exe"
            onClick={() => {
              fetch('/api/track/download', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ type: 'whatsapp_tool' })
              }).catch(() => {})
            }}
            className="inline-flex items-center gap-3 px-10 py-5 bg-gradient-to-r from-green-500 to-emerald-500 text-white font-bold rounded-2xl text-xl hover:shadow-xl hover:shadow-green-500/40 transition-all duration-200 hover:scale-105"
          >
            <svg className="w-7 h-7" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" />
            </svg>
            Download Outreach Tool
          </a>
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
