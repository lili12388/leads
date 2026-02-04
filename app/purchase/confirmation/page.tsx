"use client"

import { useEffect } from "react"
import { safeLocalStorageRemove } from "@/lib/safe-storage"

export default function ConfirmationPage() {
  useEffect(() => {
    // Clear purchase data from localStorage
    // Keep affiliate code in case they want to make another purchase
    safeLocalStorageRemove('purchaseToken')
    safeLocalStorageRemove('purchaseId')
    safeLocalStorageRemove('paymentMethod')
  }, [])

  return (
    <main className="min-h-screen relative overflow-hidden flex items-center justify-center p-4">
      {/* Premium Background */}
      <div className="fixed inset-0 bg-gradient-to-b from-[#0a1628] via-[#0d1f38] to-[#0a1220]">
        {/* Central radial spotlight */}
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[1200px] h-[800px] bg-[radial-gradient(ellipse_at_center,rgba(14,165,233,0.25)_0%,rgba(8,145,178,0.12)_30%,transparent_70%)]"></div>
        
        {/* Top glow */}
        <div className="absolute -top-20 left-1/2 -translate-x-1/2 w-[800px] h-[400px] bg-[radial-gradient(ellipse_at_top,rgba(34,197,94,0.3)_0%,transparent_70%)]"></div>
        
        {/* Corner accents */}
        <div className="absolute -bottom-32 -left-32 w-[500px] h-[500px] bg-[radial-gradient(circle_at_center,rgba(6,182,212,0.2)_0%,transparent_60%)]"></div>
        <div className="absolute -bottom-32 -right-32 w-[400px] h-[400px] bg-[radial-gradient(circle_at_center,rgba(34,197,94,0.15)_0%,transparent_60%)]"></div>
        
        {/* Topographic contours */}
        <div className="absolute inset-0 opacity-[0.15]">
          <svg className="w-full h-full" xmlns="http://www.w3.org/2000/svg">
            <defs>
              <pattern id="contour4" x="0" y="0" width="250" height="250" patternUnits="userSpaceOnUse">
                <circle cx="125" cy="125" r="100" fill="none" stroke="rgba(34,197,94,0.5)" strokeWidth="0.5"/>
                <circle cx="125" cy="125" r="75" fill="none" stroke="rgba(6,182,212,0.4)" strokeWidth="0.5"/>
                <circle cx="125" cy="125" r="50" fill="none" stroke="rgba(34,197,94,0.3)" strokeWidth="0.5"/>
              </pattern>
            </defs>
            <rect width="100%" height="100%" fill="url(#contour4)"/>
          </svg>
        </div>
        
        {/* Location pins */}
        <div className="absolute top-[15%] left-[10%] w-6 h-6 opacity-30 text-green-400">
          <svg viewBox="0 0 24 24" fill="currentColor"><path d="M12 2C8.13 2 5 5.13 5 9c0 5.25 7 13 7 13s7-7.75 7-13c0-3.87-3.13-7-7-7zm0 9.5c-1.38 0-2.5-1.12-2.5-2.5s1.12-2.5 2.5-2.5 2.5 1.12 2.5 2.5-1.12 2.5-2.5 2.5z"/></svg>
        </div>
        <div className="absolute top-[25%] right-[12%] w-7 h-7 opacity-25 text-cyan-400">
          <svg viewBox="0 0 24 24" fill="currentColor"><path d="M12 2C8.13 2 5 5.13 5 9c0 5.25 7 13 7 13s7-7.75 7-13c0-3.87-3.13-7-7-7zm0 9.5c-1.38 0-2.5-1.12-2.5-2.5s1.12-2.5 2.5-2.5 2.5 1.12 2.5 2.5-1.12 2.5-2.5 2.5z"/></svg>
        </div>
        <div className="absolute bottom-[30%] left-[8%] w-5 h-5 opacity-20 text-emerald-400">
          <svg viewBox="0 0 24 24" fill="currentColor"><path d="M12 2C8.13 2 5 5.13 5 9c0 5.25 7 13 7 13s7-7.75 7-13c0-3.87-3.13-7-7-7zm0 9.5c-1.38 0-2.5-1.12-2.5-2.5s1.12-2.5 2.5-2.5 2.5 1.12 2.5 2.5-1.12 2.5-2.5 2.5z"/></svg>
        </div>
        <div className="absolute top-[60%] right-[10%] w-6 h-6 opacity-30 text-teal-400">
          <svg viewBox="0 0 24 24" fill="currentColor"><path d="M12 2C8.13 2 5 5.13 5 9c0 5.25 7 13 7 13s7-7.75 7-13c0-3.87-3.13-7-7-7zm0 9.5c-1.38 0-2.5-1.12-2.5-2.5s1.12-2.5 2.5-2.5 2.5 1.12 2.5 2.5-1.12 2.5-2.5 2.5z"/></svg>
        </div>
        
        {/* Noise texture */}
        <div className="absolute inset-0 opacity-[0.08] bg-[url('data:image/svg+xml;base64,PHN2ZyB4bWxucz0iaHR0cDovL3d3dy53My5vcmcvMjAwMC9zdmciIHdpZHRoPSIzMDAiIGhlaWdodD0iMzAwIj48ZmlsdGVyIGlkPSJhIiB4PSIwIiB5PSIwIj48ZmVUdXJidWxlbmNlIGJhc2VGcmVxdWVuY3k9Ii43NSIgc3RpdGNoVGlsZXM9InN0aXRjaCIgdHlwZT0iZnJhY3RhbE5vaXNlIi8+PC9maWx0ZXI+PHJlY3Qgd2lkdGg9IjMwMCIgaGVpZ2h0PSIzMDAiIGZpbHRlcj0idXJsKCNhKSIgb3BhY2l0eT0iMC40Ii8+PC9zdmc+')]"></div>
        
        {/* Vignette */}
        <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_center,transparent_0%,transparent_40%,rgba(2,5,16,0.4)_100%)]"></div>
        
        {/* Grid pattern */}
        <div className="absolute inset-0 bg-[linear-gradient(rgba(34,197,94,0.05)_1px,transparent_1px),linear-gradient(90deg,rgba(34,197,94,0.05)_1px,transparent_1px)] bg-[size:60px_60px]"></div>
      </div>

      <div className="relative z-10 bg-gray-800/40 backdrop-blur-xl border border-gray-700/50 rounded-2xl p-8 w-full max-w-lg text-center">
        {/* Success Animation */}
        <div className="mb-6">
          <div className="w-24 h-24 bg-gradient-to-br from-green-500 to-emerald-600 rounded-full flex items-center justify-center mx-auto shadow-lg shadow-green-500/25 animate-bounce">
            <svg className="w-12 h-12 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
            </svg>
          </div>
        </div>

        {/* Content */}
        <h1 className="text-3xl font-bold text-white mb-3">Payment Submitted!</h1>
        <p className="text-gray-400 text-lg mb-8">
          Thank you! We&apos;re reviewing your payment now.
        </p>

        {/* Status Card */}
        <div className="bg-yellow-500/10 border border-yellow-500/30 rounded-xl p-6 mb-8">
          <div className="flex items-center justify-center gap-3 mb-3">
            <div className="w-3 h-3 bg-yellow-400 rounded-full animate-pulse"></div>
            <span className="text-yellow-400 font-semibold">Awaiting Verification</span>
          </div>
          <p className="text-gray-300 text-sm">
            Our team will verify your payment within <span className="text-white font-semibold">1 hour</span> (usually much faster).
          </p>
        </div>

        {/* What's Next */}
        <div className="bg-gray-700/30 rounded-xl p-6 mb-8 text-left">
          <h2 className="text-lg font-semibold text-white mb-4">What happens next?</h2>
          <ul className="space-y-4">
            <li className="flex gap-3">
              <div className="shrink-0 w-8 h-8 bg-blue-600/30 text-blue-400 rounded-full flex items-center justify-center text-sm font-medium">1</div>
              <div>
                <div className="text-white font-medium">We verify your payment</div>
                <div className="text-gray-400 text-sm">Checking the transaction in our payment account</div>
              </div>
            </li>
            <li className="flex gap-3">
              <div className="shrink-0 w-8 h-8 bg-purple-600/30 text-purple-400 rounded-full flex items-center justify-center text-sm font-medium">2</div>
              <div>
                <div className="text-white font-medium">You receive your license</div>
                <div className="text-gray-400 text-sm">Sent to your email with installation instructions</div>
              </div>
            </li>
            <li className="flex gap-3">
              <div className="shrink-0 w-8 h-8 bg-green-600/30 text-green-400 rounded-full flex items-center justify-center text-sm font-medium">3</div>
              <div>
                <div className="text-white font-medium">Start extracting leads!</div>
                <div className="text-gray-400 text-sm">Unlimited leads from Google Maps forever</div>
              </div>
            </li>
          </ul>
        </div>

        {/* Email Reminder */}
        <div className="bg-gray-700/50 rounded-xl p-4 mb-6">
          <div className="flex items-center justify-center gap-2 text-gray-300">
            <svg className="w-5 h-5 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
            </svg>
            <span className="text-sm">Check your email (and spam folder) for updates</span>
          </div>
        </div>

        {/* Support */}
        <div className="text-gray-400 text-sm">
          Questions? Email us at{' '}
          <a href="mailto:laithou123@gmail.com" className="text-green-400 hover:underline">
            laithou123@gmail.com
          </a>
        </div>

        {/* Home Link */}
        <div className="mt-8 pt-6 border-t border-gray-700/50">
          <a 
            href="/"
            className="inline-flex items-center gap-2 text-gray-400 hover:text-white transition-colors"
          >
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 19l-7-7m0 0l7-7m-7 7h18" />
            </svg>
            Back to homepage
          </a>
        </div>
      </div>
    </main>
  )
}
