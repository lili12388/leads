"use client"

import { useEffect } from "react"

export default function ConfirmationPage() {
  useEffect(() => {
    // Clear purchase data from localStorage
    // Keep affiliate code in case they want to make another purchase
    localStorage.removeItem('purchaseToken')
    localStorage.removeItem('purchaseId')
    localStorage.removeItem('paymentMethod')
  }, [])

  return (
    <main className="min-h-screen bg-gradient-to-br from-gray-900 via-gray-800 to-gray-900 flex items-center justify-center p-4">
      <div className="bg-gray-800/50 backdrop-blur-xl border border-gray-700 rounded-2xl p-8 w-full max-w-lg text-center">
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
          <a href="mailto:support@mapsreach.com" className="text-green-400 hover:underline">
            support@mapsreach.com
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
