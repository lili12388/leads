"use client"

import Link from "next/link"
import { useState } from "react"

export default function DownloadPage() {
  const [activeTab, setActiveTab] = useState<'chrome' | 'edge'>('chrome')

  const chromeSteps = [
    { number: 1, title: "Download", description: "Click the download button to get the ZIP file" },
    { number: 2, title: "Unzip", description: "Extract to a folder you'll remember" },
    { number: 3, title: "Open Extensions", description: "Go to chrome://extensions" },
    { number: 4, title: "Developer Mode", description: "Toggle ON in the top-right corner" },
    { number: 5, title: "Load Extension", description: "Click 'Load unpacked' and select folder" },
  ]

  const edgeSteps = [
    { number: 1, title: "Open Store", description: "Click the button to open Edge Add-ons store" },
    { number: 2, title: "Add to Edge", description: "Click 'Get' to install MapsReach" },
    { number: 3, title: "Start Extracting", description: "Go to Google Maps and click MapsReach icon" },
  ]

  const steps = activeTab === 'chrome' ? chromeSteps : edgeSteps

  return (
    <div className="min-h-screen bg-gradient-to-b from-[#020a18] via-[#041225] to-[#020510]">
      {/* Header */}
      <header className="py-0 px-8 border-b border-border/30">
        <div className="max-w-7xl mx-auto flex items-center justify-between">
          <Link href="/" className="flex items-center gap-1 hover:opacity-80 transition-opacity">
            <img src="/logo.png" alt="MapsReach" className="h-28 w-auto" />
            <div className="hidden sm:flex items-center gap-2 -ml-1">
              <span className="text-[#3b82f6] font-semibold text-base tracking-wide">Extract</span>
              <span className="text-[#60a5fa] text-sm">•</span>
              <span className="text-[#2563eb] font-semibold text-base tracking-wide">Export</span>
              <span className="text-[#60a5fa] text-sm">•</span>
              <span className="text-[#1d4ed8] font-semibold text-base tracking-wide">Excel</span>
            </div>
          </Link>
          <div className="hidden md:flex items-center gap-4">
            <Link href="/pricing" className="text-accent hover:text-foreground transition-all duration-300 text-base font-semibold px-4 py-2 rounded-lg border border-accent/30 hover:border-accent/60 hover:bg-accent/10">💰 Pricing</Link>
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
          <div className="grid lg:grid-cols-2 gap-0 rounded-3xl overflow-hidden border border-border/30 bg-card/20 backdrop-blur-sm">
            
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
                  <svg className="w-10 h-10" viewBox="0 0 48 48">
                    <circle cx="24" cy="24" r="20" fill="#4285F4"/>
                    <circle cx="24" cy="24" r="8" fill="white"/>
                    <path d="M24 4a20 20 0 0116.97 9.39l-9.49 5.48a8 8 0 00-7.48-5.14V4z" fill="#EA4335"/>
                    <path d="M40.97 13.39A20 20 0 0144 24a20 20 0 01-7.03 15.18l-9.49-16.44a8 8 0 00.52-6.87l12.97-2.48z" fill="#FBBC05"/>
                    <path d="M36.97 39.18A20 20 0 014 24a20 20 0 013.03-10.61l9.49 16.44a8 8 0 007.48 2.74l12.97 6.61z" fill="#34A853"/>
                  </svg>
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

              {activeTab === 'chrome' && (
                <a
                  href="/MapsReach-Extension.zip"
                  download="MapsReach-Extension.zip"
                  onClick={(e) => e.stopPropagation()}
                  className="w-full inline-flex items-center justify-center gap-3 px-6 py-4 bg-gradient-to-r from-[#4285F4] to-[#1a73e8] text-white font-bold rounded-xl text-lg hover:shadow-lg hover:shadow-blue-500/30 transition-all duration-200 hover:scale-[1.02]"
                >
                  <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" />
                  </svg>
                  Download for Chrome
                </a>
              )}
            </div>

            {/* Divider */}
            <div className="hidden lg:block absolute left-1/2 top-0 bottom-0 w-px bg-gradient-to-b from-transparent via-border/50 to-transparent" style={{ transform: 'translateX(-50%)' }} />
            
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
                  <svg className="w-10 h-10" viewBox="0 0 48 48">
                    <defs>
                      <linearGradient id="edgeGrad1" x1="0%" y1="0%" x2="100%" y2="100%">
                        <stop offset="0%" stopColor="#0078D4"/>
                        <stop offset="100%" stopColor="#1CA3EC"/>
                      </linearGradient>
                      <linearGradient id="edgeGrad2" x1="0%" y1="100%" x2="100%" y2="0%">
                        <stop offset="0%" stopColor="#50E6FF"/>
                        <stop offset="100%" stopColor="#32BEDD"/>
                      </linearGradient>
                    </defs>
                    <circle cx="24" cy="24" r="20" fill="url(#edgeGrad1)"/>
                    <path d="M24 8c-8.837 0-16 7.163-16 16 0 4.418 1.791 8.418 4.686 11.314C15.58 32.418 19.58 30 24 30c8.837 0 16-7.163 16-16 0-3.313-1.005-6.392-2.729-8.951C34.392 9.005 29.313 8 24 8z" fill="url(#edgeGrad2)" opacity="0.8"/>
                  </svg>
                </div>
                <div>
                  <h2 className="text-2xl font-bold text-foreground">Microsoft Edge</h2>
                  <p className="text-muted-foreground text-sm">Official Add-on</p>
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

              {activeTab === 'edge' && (
                <a
                  href="https://microsoftedge.microsoft.com/addons/detail/mapsreach-extract-%E2%80%A2-exp/emifecdjjaekekfjpcbocgihccnafefp"
                  target="_blank"
                  rel="noopener noreferrer"
                  onClick={(e) => e.stopPropagation()}
                  className="w-full inline-flex items-center justify-center gap-3 px-6 py-4 bg-gradient-to-r from-[#0078D4] to-[#1CA3EC] text-white font-bold rounded-xl text-lg hover:shadow-lg hover:shadow-cyan-500/30 transition-all duration-200 hover:scale-[1.02]"
                >
                  <svg className="w-6 h-6" fill="currentColor" viewBox="0 0 20 20">
                    <path fillRule="evenodd" d="M6.267 3.455a3.066 3.066 0 001.745-.723 3.066 3.066 0 013.976 0 3.066 3.066 0 001.745.723 3.066 3.066 0 012.812 2.812c.051.643.304 1.254.723 1.745a3.066 3.066 0 010 3.976 3.066 3.066 0 00-.723 1.745 3.066 3.066 0 01-2.812 2.812 3.066 3.066 0 00-1.745.723 3.066 3.066 0 01-3.976 0 3.066 3.066 0 00-1.745-.723 3.066 3.066 0 01-2.812-2.812 3.066 3.066 0 00-.723-1.745 3.066 3.066 0 010-3.976 3.066 3.066 0 00.723-1.745 3.066 3.066 0 012.812-2.812zm7.44 5.252a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                  </svg>
                  Get from Edge Store
                </a>
              )}
            </div>
          </div>

          {/* Installation Steps - Dynamic based on selected browser */}
          <div className="mt-12">
            <div className="flex items-center justify-center gap-3 mb-8">
              <div className={`w-3 h-3 rounded-full ${activeTab === 'chrome' ? 'bg-[#4285F4]' : 'bg-[#0078D4]'}`} />
              <h3 className="text-xl font-semibold text-foreground">
                {activeTab === 'chrome' ? 'Chrome' : 'Edge'} Installation Steps
              </h3>
            </div>

            {/* Video Placeholder */}
            <div className={`aspect-video max-w-3xl mx-auto rounded-2xl mb-10 flex items-center justify-center border ${
              activeTab === 'chrome' ? 'border-[#4285F4]/30 bg-[#4285F4]/5' : 'border-[#0078D4]/30 bg-[#0078D4]/5'
            }`}>
              <div className="text-center">
                <div className="text-6xl mb-3">🎬</div>
                <p className="text-xl text-muted-foreground">Video tutorial coming soon</p>
              </div>
            </div>

            {/* Steps as horizontal timeline */}
            <div className="relative max-w-4xl mx-auto">
              {/* Connection line */}
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

          {/* Also Works With */}
          <div className="mt-16 text-center">
            <div className="inline-flex items-center gap-4 px-6 py-3 bg-card/30 rounded-full border border-border/50">
              <span className="text-muted-foreground text-sm">Also works with:</span>
              <div className="flex items-center gap-3">
                <span className="text-foreground font-medium text-sm">Brave</span>
                <span className="text-border">•</span>
                <span className="text-foreground font-medium text-sm">Opera</span>
                <span className="text-border">•</span>
                <span className="text-foreground font-medium text-sm">Vivaldi</span>
              </div>
            </div>
            <p className="text-xs text-muted-foreground mt-3">Use Chrome instructions for other Chromium browsers</p>
          </div>

          {/* Need Help */}
          <div className="mt-12 text-center">
            <a
              href="mailto:support@mapsreach.com"
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
          <p>© 2026 MapsReach. All rights reserved.</p>
          <div className="mt-2 flex items-center justify-center gap-4">
            <Link href="/privacy" className="hover:text-foreground transition-colors">Privacy Policy</Link>
            <span>•</span>
            <Link href="/pricing" className="hover:text-foreground transition-colors">Pricing</Link>
            <span>•</span>
            <Link href="/" className="hover:text-foreground transition-colors">Home</Link>
          </div>
        </div>
      </footer>
    </div>
  )
}
