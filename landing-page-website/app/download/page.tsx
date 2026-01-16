"use client"

import Link from "next/link"
import { useState } from "react"

export default function DownloadPage() {
  const [currentStep, setCurrentStep] = useState(1)

  const steps = [
    {
      number: 1,
      title: "Download the Extension",
      description: "Click the download button below to get the MapsReach extension folder.",
      gif: "/download-gifs/step1-download.gif",
      placeholder: "📥 Downloading extension folder..."
    },
    {
      number: 2,
      title: "Unzip the Folder",
      description: "Extract the downloaded ZIP file to a folder on your computer. Remember where you save it!",
      gif: "/download-gifs/step2-unzip.gif",
      placeholder: "📁 Extracting files..."
    },
    {
      number: 3,
      title: "Open Chrome Extensions",
      description: "Open Chrome and go to chrome://extensions or click Menu → More Tools → Extensions.",
      gif: "/download-gifs/step3-extensions.gif",
      placeholder: "🔧 Opening extensions page..."
    },
    {
      number: 4,
      title: "Enable Developer Mode",
      description: "Toggle ON the 'Developer mode' switch in the top-right corner of the extensions page.",
      gif: "/download-gifs/step4-devmode.gif",
      placeholder: "👨‍💻 Enabling developer mode..."
    },
    {
      number: 5,
      title: "Load the Extension",
      description: "Click 'Load unpacked' and select the folder you extracted in step 2.",
      gif: "/download-gifs/step5-load.gif",
      placeholder: "🚀 Loading MapsReach..."
    }
  ]

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <header className="py-0 px-8 border-b border-border">
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
            <Link href="/blog" className="text-muted-foreground hover:text-foreground transition-all duration-300 text-base font-medium px-4 py-2 rounded-lg hover:bg-white/10">Blog</Link>
          </div>
        </div>
      </header>

      {/* Hero Section */}
      <section className="py-12 px-4">
        <div className="max-w-4xl mx-auto text-center">
          <div className="inline-flex items-center gap-2 px-4 py-2 bg-primary/10 border border-primary/30 rounded-full mb-6">
            <span className="text-2xl">🎉</span>
            <span className="text-primary font-medium">Get 100 Free Leads to Start!</span>
          </div>
          <h1 className="text-4xl md:text-5xl font-bold mb-4">
            Download <span className="text-primary">MapsReach</span> Extension
          </h1>
          <p className="text-xl text-muted-foreground max-w-2xl mx-auto mb-8">
            Follow these simple steps to install MapsReach and start extracting leads from Google Maps in minutes.
          </p>
          
          {/* Download Button */}
          <a
            href="/downloads/mapsreach-extension.zip"
            download
            className="inline-flex items-center gap-3 px-8 py-4 bg-gradient-to-r from-[#3b82f6] to-[#1d4ed8] text-white font-bold rounded-xl text-lg hover:shadow-lg hover:shadow-blue-500/30 transition-all duration-200 mb-4"
          >
            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" />
            </svg>
            Download MapsReach Extension
          </a>
          <p className="text-sm text-muted-foreground">Version 1.0 • Works with Chrome, Edge, Brave</p>
        </div>
      </section>

      {/* Steps Section */}
      <section className="py-8 px-4 pb-20">
        <div className="max-w-5xl mx-auto">
          <h2 className="text-2xl font-bold text-center mb-8">Installation Guide</h2>
          
          {/* Step Navigation */}
          <div className="flex justify-center gap-2 mb-8 flex-wrap">
            {steps.map((step) => (
              <button
                key={step.number}
                onClick={() => setCurrentStep(step.number)}
                className={`px-4 py-2 rounded-lg font-medium transition-all ${
                  currentStep === step.number
                    ? "bg-primary text-white"
                    : "bg-card border border-border hover:border-primary/50"
                }`}
              >
                Step {step.number}
              </button>
            ))}
          </div>

          {/* Current Step Display */}
          <div className="bg-card border border-border rounded-2xl overflow-hidden">
            <div className="p-6 border-b border-border">
              <div className="flex items-center gap-4">
                <div className="w-12 h-12 bg-primary/20 rounded-full flex items-center justify-center">
                  <span className="text-primary font-bold text-xl">{currentStep}</span>
                </div>
                <div>
                  <h3 className="text-xl font-bold">{steps[currentStep - 1].title}</h3>
                  <p className="text-muted-foreground">{steps[currentStep - 1].description}</p>
                </div>
              </div>
            </div>
            
            {/* GIF Display Area */}
            <div className="aspect-video bg-muted/20 flex items-center justify-center">
              {/* Placeholder for GIF - replace with actual GIFs later */}
              <div className="text-center p-8">
                <div className="w-24 h-24 bg-primary/10 rounded-2xl flex items-center justify-center mx-auto mb-4">
                  <span className="text-5xl">
                    {currentStep === 1 && "📥"}
                    {currentStep === 2 && "📁"}
                    {currentStep === 3 && "🔧"}
                    {currentStep === 4 && "👨‍💻"}
                    {currentStep === 5 && "🚀"}
                  </span>
                </div>
                <p className="text-muted-foreground text-lg">{steps[currentStep - 1].placeholder}</p>
                <p className="text-sm text-muted-foreground mt-2">
                  (Tutorial GIF will appear here)
                </p>
              </div>
            </div>

            {/* Navigation Buttons */}
            <div className="p-6 flex justify-between items-center border-t border-border">
              <button
                onClick={() => setCurrentStep(Math.max(1, currentStep - 1))}
                disabled={currentStep === 1}
                className={`px-6 py-2 rounded-lg font-medium flex items-center gap-2 ${
                  currentStep === 1
                    ? "text-muted-foreground cursor-not-allowed"
                    : "bg-muted hover:bg-muted/80"
                }`}
              >
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
                </svg>
                Previous
              </button>
              
              {currentStep < 5 ? (
                <button
                  onClick={() => setCurrentStep(Math.min(5, currentStep + 1))}
                  className="px-6 py-2 bg-primary text-white rounded-lg font-medium flex items-center gap-2 hover:bg-primary/90"
                >
                  Next Step
                  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                  </svg>
                </button>
              ) : (
                <div className="flex items-center gap-2 text-accent font-medium">
                  <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                  </svg>
                  You're all set!
                </div>
              )}
            </div>
          </div>

          {/* All Steps Quick Reference */}
          <div className="mt-12">
            <h3 className="text-xl font-bold text-center mb-6">Quick Reference</h3>
            <div className="grid md:grid-cols-5 gap-4">
              {steps.map((step) => (
                <div
                  key={step.number}
                  className={`p-4 rounded-xl border cursor-pointer transition-all ${
                    currentStep === step.number
                      ? "bg-primary/10 border-primary"
                      : "bg-card border-border hover:border-primary/50"
                  }`}
                  onClick={() => setCurrentStep(step.number)}
                >
                  <div className="text-3xl mb-2">
                    {step.number === 1 && "📥"}
                    {step.number === 2 && "📁"}
                    {step.number === 3 && "🔧"}
                    {step.number === 4 && "👨‍💻"}
                    {step.number === 5 && "🚀"}
                  </div>
                  <p className="font-medium text-sm">{step.title}</p>
                </div>
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* Help Section */}
      <section className="py-12 px-4 bg-card border-t border-border">
        <div className="max-w-4xl mx-auto text-center">
          <h2 className="text-2xl font-bold mb-4">Need Help?</h2>
          <p className="text-muted-foreground mb-6">
            Having trouble installing? Our support team is here to help.
          </p>
          <div className="flex flex-wrap justify-center gap-4">
            <Link
              href="/contact"
              className="px-6 py-3 bg-primary text-white font-medium rounded-lg hover:bg-primary/90 transition-colors"
            >
              Contact Support
            </Link>
            <Link
              href="/blog/google-maps-lead-generation-guide"
              className="px-6 py-3 bg-muted hover:bg-muted/80 font-medium rounded-lg transition-colors"
            >
              Read Our Guide
            </Link>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="border-t border-border py-8 px-4">
        <div className="max-w-6xl mx-auto text-center text-muted-foreground text-sm">
          <p>© 2026 MapsReach. All rights reserved.</p>
        </div>
      </footer>
    </div>
  )
}
