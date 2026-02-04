"use client"

import Link from "next/link"
import { useState } from "react"

export default function DownloadPage() {
  const [activeTab, setActiveTab] = useState<'chrome' | 'edge' | 'outreach'>('chrome')

  const chromeSteps = [
    { number: 1, title: "Download", description: "Click the download button to get the ZIP file" },
    { number: 2, title: "Unzip", description: "Extract to a folder you'll remember" },
    { number: 3, title: "Open Extensions", description: "Go to chrome://extensions" },
    { number: 4, title: "Developer Mode", description: "Toggle ON in the top-right corner" },
    { number: 5, title: "Load Extension", description: "Click 'Load unpacked' and select folder" },
  ]

  const edgeSteps = [
    { number: 1, title: "Download", description: "Click the download button to get the ZIP file" },
    { number: 2, title: "Unzip", description: "Extract to a folder you'll remember" },
    { number: 3, title: "Open Extensions", description: "Go to edge://extensions" },
    { number: 4, title: "Developer Mode", description: "Toggle ON in the bottom-left corner" },
    { number: 5, title: "Load Extension", description: "Click 'Load unpacked' and select folder" },
  ]

  const steps = activeTab === 'edge' ? edgeSteps : chromeSteps

  const activeDownload = activeTab === 'edge' ? {
    title: 'Microsoft Edge Extension',
    subtitle: 'Edge & Chromium browsers ? Quick setup',
    buttonText: 'Download for Edge',
    buttonGradient: 'from-[#0078D4] to-[#1CA3EC]',
    topBar: 'from-[#0078D4] to-[#50E6FF]',
    borderColor: 'border-[#0078D4]/30',
    iconSrc: '/edge.png',
    downloadType: 'edge_extension',
    note: 'Installs in Edge via load-unpacked (developer mode)',
    features: [
      'Extract business emails & phones',
      'Export to CSV or Google Sheets',
      'Auto-scroll + lead dedupe',
      'Unlimited lead extraction',
      'Works on Edge & Chromium browsers',
      '2-minute setup',
    ],
  } : {
    title: 'Google Chrome Extension',
    subtitle: 'Chrome browser extension ? Quick setup',
    buttonText: 'Download for Chrome',
    buttonGradient: 'from-[#4285F4] to-[#1a73e8]',
    topBar: 'from-[#EA4335] via-[#FBBC05] to-[#34A853]',
    borderColor: 'border-[#4285F4]/30',
    iconSrc: '/Google_Chrome_icon.png',
    downloadType: 'chrome_extension',
    note: 'Installs in Chrome via load-unpacked (developer mode)',
    features: [
      'Extract business emails & phones',
      'Export to CSV or Google Sheets',
      'Auto-scroll + lead dedupe',
      'Unlimited lead extraction',
      'Works on Chrome, Brave, Opera',
      '2-minute setup',
    ],
  }

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
            <Link href="/pricing" className="text-accent hover:text-foreground transition-all duration-300 text-base font-semibold px-4 py-2 rounded-lg border border-accent/30 hover:border-accent/60 hover:bg-accent/10"> Pricing</Link>
            <Link href="/" className="text-muted-foreground hover:text-foreground transition-all duration-300 text-base font-medium px-4 py-2 rounded-lg hover:bg-white/10">Home</Link>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <section className="py-12 px-4">
        <div className="max-w-6xl mx-auto">

          {/* Title */}
          <div className="text-center mb-10">
            <h1 className="text-4xl md:text-5xl font-bold mb-4 text-foreground">
              Install <span className="text-primary">MapsReach</span>
            </h1>
            <p className="text-xl text-muted-foreground max-w-2xl mx-auto">
              Select your browser and follow the quick setup guide
            </p>
          </div>

          {/* Split View Container */}
          <div className="grid lg:grid-cols-3 gap-0 rounded-3xl overflow-hidden border border-border/30 bg-card/20 backdrop-blur-sm">
            
            {/* Chrome Side */}
            <div 
              className={`relative p-8 cursor-pointer transition-all duration-500 ${
                activeTab === 'chrome' 
                  ? 'bg-gradient-to-br from-[#4285F4]/20 via-[#4285F4]/10 to-transparent' 
                  : 'bg-transparent hover:bg-white/5'
              }`}
              onClick={() => setActiveTab('chrome')}
            >
              {/* Active indicator line */}
              <div className={`absolute top-0 left-0 right-0 h-1 bg-gradient-to-r from-[#EA4335] via-[#FBBC05] to-[#34A853] transition-opacity duration-300 ${activeTab === 'chrome' ? 'opacity-100' : 'opacity-0'}`} />
              
              <div className="flex items-center gap-4 mb-6">
                <div className={`w-16 h-16 rounded-2xl flex items-center justify-center transition-all duration-300 ${activeTab === 'chrome' ? 'bg-white/20 scale-110' : 'bg-white/10'}`}>
                  <img src="/Google_Chrome_icon.png" alt="Google Chrome" className="w-10 h-10" />
                </div>
                <div>
                  <h2 className="text-2xl font-bold text-foreground">Google Chrome</h2>
                  <p className="text-muted-foreground text-sm">Most popular browser</p>
                </div>
                {activeTab === 'chrome' && (
                  <div className="ml-auto">
                    <div className="w-6 h-6 rounded-full bg-[#4285F4] flex items-center justify-center">
                      <svg className="w-4 h-4 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M5 13l4 4L19 7" />
                      </svg>
                    </div>
                  </div>
                )}
              </div>

            </div>

            {/* Divider */}
            {/* Edge Side */}
            <div 
              className={`relative p-8 cursor-pointer transition-all duration-500 border-t lg:border-t-0 lg:border-l border-border/30 ${
                activeTab === 'edge' 
                  ? 'bg-gradient-to-bl from-[#0078D4]/20 via-[#0078D4]/10 to-transparent' 
                  : 'bg-transparent hover:bg-white/5'
              }`}
              onClick={() => setActiveTab('edge')}
            >
              {/* Active indicator line */}
              <div className={`absolute top-0 left-0 right-0 h-1 bg-gradient-to-r from-[#0078D4] to-[#50E6FF] transition-opacity duration-300 ${activeTab === 'edge' ? 'opacity-100' : 'opacity-0'}`} />
              
              <div className="flex items-center gap-4 mb-6">
                <div className={`w-16 h-16 rounded-2xl flex items-center justify-center transition-all duration-300 ${activeTab === 'edge' ? 'bg-white/20 scale-110' : 'bg-white/10'}`}>
                  <img src="/edge.png" alt="Microsoft Edge" className="w-10 h-10" />
                </div>
                <div>
                  <h2 className="text-2xl font-bold text-foreground">Microsoft Edge</h2>
                  <p className="text-muted-foreground text-sm">Works on Edge & Chromium browsers</p>
                </div>
                {activeTab === 'edge' && (
                  <div className="ml-auto">
                    <div className="w-6 h-6 rounded-full bg-[#0078D4] flex items-center justify-center">
                      <svg className="w-4 h-4 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M5 13l4 4L19 7" />
                      </svg>
                    </div>
                  </div>
                )}
              </div>

            </div>

            {/* Outreach Side */}
            <div 
              className={`relative p-8 cursor-pointer transition-all duration-500 border-t lg:border-t-0 lg:border-l border-border/30 ${
                activeTab === 'outreach' 
                  ? 'bg-gradient-to-bl from-green-500/20 via-green-500/10 to-transparent' 
                  : 'bg-transparent hover:bg-white/5'
              }`}
              onClick={() => setActiveTab('outreach')}
            >
              {/* Active indicator line */}
              <div className={`absolute top-0 left-0 right-0 h-1 bg-gradient-to-r from-green-500 to-emerald-400 transition-opacity duration-300 ${activeTab === 'outreach' ? 'opacity-100' : 'opacity-0'}`} />
              
              <div className="flex items-center gap-4 mb-6">
                <div className={`w-16 h-16 rounded-2xl flex items-center justify-center transition-all duration-300 ${activeTab === 'outreach' ? 'bg-white/20 scale-110' : 'bg-white/10'}`}>
                  <svg className="w-10 h-10 text-green-400" viewBox="0 0 24 24" fill="currentColor">
                    <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413z"/>
                  </svg>
                </div>
                <div>
                  <h2 className="text-2xl font-bold text-foreground">Outreach Tool</h2>
                  <p className="text-muted-foreground text-sm">WhatsApp & Email automation</p>
                </div>
                {activeTab === 'outreach' && (
                  <div className="ml-auto">
                    <div className="w-6 h-6 rounded-full bg-green-500 flex items-center justify-center">
                      <svg className="w-4 h-4 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M5 13l4 4L19 7" />
                      </svg>
                    </div>
                  </div>
                )}
              </div>
            </div>
          </div>

          {/* Installation Steps - Dynamic based on selected browser */}
          {activeTab !== 'outreach' && (
            <div className="mt-12">
              <div className="flex items-center justify-center gap-3 mb-8">
                <div className={`w-3 h-3 rounded-full ${activeTab === 'chrome' ? 'bg-[#4285F4]' : 'bg-[#0078D4]'}`} />
                <h3 className="text-xl font-semibold text-foreground">
                  {activeTab === 'chrome' ? 'Chrome' : 'Edge'} Installation Steps
                </h3>
              </div>

              <div className="grid lg:grid-cols-2 gap-8 items-start mb-10">
                {/* Download Details */}
                <div className={`relative p-8 rounded-3xl ${activeDownload.borderColor} border bg-gradient-to-br from-white/5 via-white/0 to-transparent`}>

                  <div className="flex items-center gap-4 mb-6">
                    <div className="w-16 h-16 rounded-2xl bg-white/10 flex items-center justify-center">
                      <img src={activeDownload.iconSrc} alt={activeDownload.title} className="w-10 h-10" />
                    </div>
                    <div>
                      <h3 className="text-2xl font-bold text-foreground">{activeDownload.title}</h3>
                      <p className="text-muted-foreground text-sm">{activeDownload.subtitle}</p>
                    </div>
                  </div>

                  <div className="grid grid-cols-2 gap-3 mb-6">
                    {activeDownload.features.map((feature) => (
                      <div key={feature} className="flex items-center gap-2 text-sm text-muted-foreground">
                        <svg className="w-4 h-4 text-primary flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                        </svg>
                        <span>{feature}</span>
                      </div>
                    ))}
                  </div>

                  <a
                    href="/MapsReach-Extension.zip"
                    download="MapsReach-Extension.zip"
                    onClick={() => {
                      fetch('/api/track/download', {
                        method: 'POST',
                        headers: { 'Content-Type': 'application/json' },
                        body: JSON.stringify({ type: activeDownload.downloadType })
                      }).catch(() => {})
                    }}
                    className={`w-full inline-flex items-center justify-center gap-3 px-6 py-4 bg-gradient-to-r ${activeDownload.buttonGradient} text-white font-bold rounded-xl text-lg hover:shadow-lg transition-all duration-200 hover:scale-[1.02]`}
                  >
                    <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" />
                    </svg>
                    {activeDownload.buttonText}
                  </a>

                  <p className="text-center text-xs text-muted-foreground mt-4">
                    {activeDownload.note}
                  </p>
                </div>
              </div>

              {/* Steps as horizontal timeline */}
              <div className="relative max-w-4xl mx-auto">
                <div className={`absolute top-6 left-[10%] right-[10%] h-0.5 ${
                  activeTab === 'chrome' ? 'bg-[#4285F4]/30' : 'bg-[#0078D4]/30'
                }`} />
                
                <div className="grid grid-cols-5 gap-2">
                  {steps.map((step) => (
                    <div key={step.number} className="relative flex flex-col items-center text-center">
                      <div className={`w-12 h-12 rounded-full flex items-center justify-center z-10 ${
                        activeTab === 'chrome' ? 'bg-[#4285F4]' : 'bg-[#0078D4]'
                      }`}>
                        <span className="text-white font-bold">{step.number}</span>
                      </div>
                      <h4 className="font-semibold text-foreground mt-3 text-sm">{step.title}</h4>
                      <p className="text-xs text-muted-foreground mt-1 px-1">{step.description}</p>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          )}

          {activeTab !== 'outreach' ? (
            <div className="mt-16 text-center">
              <div className="inline-flex items-center gap-4 px-6 py-3 bg-card/30 rounded-full border border-border/50">
                <span className="text-muted-foreground text-sm">Also works with:</span>
                <div className="flex items-center gap-3">
                  <span className="text-foreground font-medium text-sm">Brave</span>
                  <span className="text-border"></span>
                  <span className="text-foreground font-medium text-sm">Opera</span>
                  <span className="text-border"></span>
                  <span className="text-foreground font-medium text-sm">Vivaldi</span>
                </div>
              </div>
              <p className="text-xs text-muted-foreground mt-3">Use Chrome instructions for other Chromium browsers</p>
            </div>
          ) : (
            <div className="mt-14">
              <div className="text-center mb-10">
                <div className="inline-flex items-center gap-2 px-4 py-2 bg-green-500/10 border border-green-500/30 rounded-full mb-4">
                  <span className="text-green-400 text-sm font-medium"> NEW</span>
                </div>
                <h2 className="text-3xl md:text-4xl font-bold mb-4 text-foreground">
                  <span className="text-green-400">MapsReach</span> Outreach Tool
                </h2>
                <p className="text-lg text-muted-foreground max-w-2xl mx-auto">
                  Automate your WhatsApp & Email outreach to leads extracted from Google Maps
                </p>
              </div>

              <div className="max-w-2xl mx-auto">
                <div className="relative p-8 rounded-3xl border border-green-500/30 bg-gradient-to-br from-green-500/10 via-green-500/5 to-transparent">
                  
                  <div className="flex items-center gap-4 mb-6">
                    <div className="w-16 h-16 rounded-2xl bg-green-500/20 flex items-center justify-center">
                      <svg className="w-10 h-10 text-green-400" viewBox="0 0 24 24" fill="currentColor">
                        <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413z"/>
                      </svg>
                    </div>
                    <div>
                      <h3 className="text-2xl font-bold text-foreground">WhatsApp & Email Automation</h3>
                      <p className="text-muted-foreground text-sm">Windows Desktop App  One-time Purchase</p>
                    </div>
                  </div>

                  {/* Features */}
                  <div className="grid grid-cols-2 gap-3 mb-6">
                    {[
                      "Send bulk WhatsApp messages",
                      "Automated email campaigns",
                      "Import leads from CSV",
                      "Personalized templates",
                      "Message scheduling",
                      "Desktop shortcuts"
                    ].map((feature, idx) => (
                      <div key={idx} className="flex items-center gap-2 text-sm text-muted-foreground">
                        <svg className="w-4 h-4 text-green-400 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                        </svg>
                        <span>{feature}</span>
                      </div>
                    ))}
                  </div>

                  <Link
                    href="/download/outreach"
                    className="w-full inline-flex items-center justify-center gap-3 px-6 py-4 bg-gradient-to-r from-green-500 to-emerald-500 text-white font-bold rounded-xl text-lg hover:shadow-lg hover:shadow-green-500/30 transition-all duration-200 hover:scale-[1.02]"
                  >
                    <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" />
                    </svg>
                    Open Outreach Tool Page
                    <span className="text-sm opacity-80">(Windows)</span>
                  </Link>

                  <p className="text-center text-xs text-muted-foreground mt-4">
                    Installs to your computer with desktop shortcut  Requires license key
                  </p>
                </div>
              </div>
            </div>
          )}

          {/* Need Help */}
          <div className="mt-12 text-center">
            <a
              href="mailto:laithou123@gmail.com"
              className="inline-flex items-center gap-2 px-6 py-3 bg-white/5 hover:bg-white/10 border border-border/50 rounded-xl transition-all text-muted-foreground hover:text-foreground"
            >
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
              </svg>
              <span className="font-medium">Need help? Contact Support</span>
            </a>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="py-8 px-4 border-t border-border/30 mt-12">
        <div className="max-w-6xl mx-auto text-center text-muted-foreground text-sm">
          <p> 2026 MapsReach. All rights reserved.</p>
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
