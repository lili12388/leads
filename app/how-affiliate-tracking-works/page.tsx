'use client';

import Link from 'next/link';

export default function HowAffiliateTrackingWorksPage() {
  return (
    <div className="min-h-screen bg-gradient-to-b from-gray-900 via-gray-800 to-gray-900 text-white">
      {/* Header */}
      <header className="border-b border-gray-700/50 bg-gray-900/80 backdrop-blur-xl sticky top-0 z-50">
        <div className="max-w-4xl mx-auto px-6 py-4 flex items-center justify-between">
          <Link href="/" className="flex items-center gap-2 text-xl font-bold bg-gradient-to-r from-purple-400 to-pink-400 bg-clip-text text-transparent">
            <span className="text-2xl">📍</span> MapsReach
          </Link>
          <Link 
            href="/affiliate/signup"
            className="px-4 py-2 bg-gradient-to-r from-purple-600 to-pink-600 rounded-full text-sm font-medium hover:opacity-90 transition"
          >
            Become an Affiliate
          </Link>
        </div>
      </header>

      {/* Main Content */}
      <main className="max-w-4xl mx-auto px-6 py-16">
        {/* Hero */}
        <div className="text-center mb-16">
          <div className="inline-flex items-center gap-2 px-4 py-2 bg-green-500/10 border border-green-500/30 rounded-full text-green-400 text-sm mb-6">
            <span>🔒</span> 100% Transparent Tracking
          </div>
          <h1 className="text-4xl md:text-5xl font-bold mb-6">
            How Your <span className="bg-gradient-to-r from-purple-400 to-pink-400 bg-clip-text text-transparent">Affiliate Earnings</span> Are Tracked
          </h1>
          <p className="text-xl text-gray-400 max-w-2xl mx-auto">
            We believe in radical transparency. Here's exactly how we track and credit your referrals — no hidden algorithms, no mystery.
          </p>
        </div>

        {/* Timeline */}
        <div className="space-y-0 mb-16">
          {/* Step 1 */}
          <div className="relative pl-12 pb-12 border-l-2 border-purple-500/30 last:border-0">
            <div className="absolute left-0 top-0 w-8 h-8 -translate-x-1/2 bg-purple-600 rounded-full flex items-center justify-center text-sm font-bold">
              1
            </div>
            <div className="bg-gray-800/50 border border-gray-700/50 rounded-2xl p-6">
              <h3 className="text-xl font-bold text-purple-400 mb-2 flex items-center gap-2">
                <span>🔗</span> Visitor Clicks Your Link
              </h3>
              <p className="text-gray-300 mb-4">
                When someone clicks your unique affiliate link (e.g., <code className="bg-gray-700/50 px-2 py-0.5 rounded text-purple-300">mapsreach.com?ref=YOUR_CODE</code>), 
                we capture this click instantly.
              </p>
              <div className="bg-gray-900/50 rounded-xl p-4 text-sm">
                <div className="flex items-center gap-2 text-gray-400">
                  <span className="text-green-400">✓</span> Timestamp recorded
                </div>
                <div className="flex items-center gap-2 text-gray-400">
                  <span className="text-green-400">✓</span> Affiliate code stored in browser
                </div>
                <div className="flex items-center gap-2 text-gray-400">
                  <span className="text-green-400">✓</span> Click logged in your dashboard
                </div>
              </div>
            </div>
          </div>

          {/* Step 2 */}
          <div className="relative pl-12 pb-12 border-l-2 border-purple-500/30">
            <div className="absolute left-0 top-0 w-8 h-8 -translate-x-1/2 bg-purple-600 rounded-full flex items-center justify-center text-sm font-bold">
              2
            </div>
            <div className="bg-gray-800/50 border border-gray-700/50 rounded-2xl p-6">
              <h3 className="text-xl font-bold text-purple-400 mb-2 flex items-center gap-2">
                <span>🛒</span> Visitor Starts Purchase
              </h3>
              <p className="text-gray-300 mb-4">
                When the visitor clicks "Buy Now" and enters their email, we create a purchase record — and here's the crucial part:
              </p>
              <div className="bg-green-500/10 border border-green-500/30 rounded-xl p-4">
                <p className="text-green-400 font-semibold flex items-center gap-2">
                  <span>🔐</span> Your affiliate code is LOCKED at this moment
                </p>
                <p className="text-gray-300 text-sm mt-2">
                  Once a purchase is created with your code, it cannot be changed — not by the buyer, not by us, not by anyone. 
                  This is permanently recorded in our audit log.
                </p>
              </div>
            </div>
          </div>

          {/* Step 3 */}
          <div className="relative pl-12 pb-12 border-l-2 border-purple-500/30">
            <div className="absolute left-0 top-0 w-8 h-8 -translate-x-1/2 bg-purple-600 rounded-full flex items-center justify-center text-sm font-bold">
              3
            </div>
            <div className="bg-gray-800/50 border border-gray-700/50 rounded-2xl p-6">
              <h3 className="text-xl font-bold text-purple-400 mb-2 flex items-center gap-2">
                <span>💳</span> Visitor Pays Manually
              </h3>
              <p className="text-gray-300 mb-4">
                The buyer receives payment instructions (USDT, Skrill, Neteller, etc.) and sends payment directly. 
                They can optionally upload proof to speed up verification.
              </p>
              <div className="text-gray-400 text-sm">
                Status in your dashboard: <span className="text-yellow-400 font-medium">"Payment Sent"</span>
              </div>
            </div>
          </div>

          {/* Step 4 */}
          <div className="relative pl-12 pb-12 border-l-2 border-purple-500/30">
            <div className="absolute left-0 top-0 w-8 h-8 -translate-x-1/2 bg-purple-600 rounded-full flex items-center justify-center text-sm font-bold">
              4
            </div>
            <div className="bg-gray-800/50 border border-gray-700/50 rounded-2xl p-6">
              <h3 className="text-xl font-bold text-purple-400 mb-2 flex items-center gap-2">
                <span>✅</span> We Verify Payment
              </h3>
              <p className="text-gray-300 mb-4">
                Our team manually verifies the payment (we check the blockchain for USDT, or confirm receipt for other methods). 
                Once verified, we deliver the license key to the buyer.
              </p>
              <div className="text-gray-400 text-sm">
                Status in your dashboard: <span className="text-green-400 font-medium">"Payment Verified"</span>
              </div>
            </div>
          </div>

          {/* Step 5 */}
          <div className="relative pl-12">
            <div className="absolute left-0 top-0 w-8 h-8 -translate-x-1/2 bg-gradient-to-r from-purple-600 to-pink-600 rounded-full flex items-center justify-center text-sm font-bold">
              5
            </div>
            <div className="bg-gradient-to-r from-purple-500/10 to-pink-500/10 border border-purple-500/30 rounded-2xl p-6">
              <h3 className="text-xl font-bold text-transparent bg-clip-text bg-gradient-to-r from-purple-400 to-pink-400 mb-2 flex items-center gap-2">
                <span>💰</span> You Get Credited
              </h3>
              <p className="text-gray-300 mb-4">
                Your 30% commission ($17.70 per sale) is instantly credited to your dashboard. 
                The sale shows as <span className="text-purple-400 font-medium">"Sale Completed"</span>.
              </p>
              <div className="bg-gray-900/50 rounded-xl p-4">
                <p className="text-gray-400 text-sm mb-2">Request payout anytime via:</p>
                <div className="flex flex-wrap gap-2">
                  {['USDT', 'PayPal', 'Skrill', 'Bank Transfer'].map(method => (
                    <span key={method} className="px-3 py-1 bg-gray-700/50 rounded-full text-xs text-gray-300">
                      {method}
                    </span>
                  ))}
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Trust Guarantees */}
        <div className="bg-gray-800/30 border border-gray-700/50 rounded-3xl p-8 mb-16">
          <h2 className="text-2xl font-bold text-center mb-8">Our Guarantees to You</h2>
          <div className="grid md:grid-cols-3 gap-6">
            <div className="text-center">
              <div className="w-16 h-16 mx-auto bg-green-500/10 rounded-2xl flex items-center justify-center text-3xl mb-4">
                🔐
              </div>
              <h3 className="font-bold mb-2">Locked Attribution</h3>
              <p className="text-gray-400 text-sm">
                Once someone uses your link, they're yours. Period. No attribution changes possible.
              </p>
            </div>
            <div className="text-center">
              <div className="w-16 h-16 mx-auto bg-blue-500/10 rounded-2xl flex items-center justify-center text-3xl mb-4">
                📊
              </div>
              <h3 className="font-bold mb-2">Real-Time Dashboard</h3>
              <p className="text-gray-400 text-sm">
                See every click and sale the moment it happens. Full transparency, no delays.
              </p>
            </div>
            <div className="text-center">
              <div className="w-16 h-16 mx-auto bg-purple-500/10 rounded-2xl flex items-center justify-center text-3xl mb-4">
                📝
              </div>
              <h3 className="font-bold mb-2">Audit Logs</h3>
              <p className="text-gray-400 text-sm">
                Every action is logged with timestamps. Full history available for every sale.
              </p>
            </div>
          </div>
        </div>

        {/* FAQ */}
        <div className="mb-16">
          <h2 className="text-2xl font-bold text-center mb-8">Common Questions</h2>
          <div className="space-y-4">
            <details className="bg-gray-800/30 border border-gray-700/50 rounded-xl p-5 group">
              <summary className="font-semibold cursor-pointer list-none flex items-center justify-between">
                What if someone clears their cookies?
                <span className="text-gray-500 group-open:rotate-180 transition-transform">▼</span>
              </summary>
              <p className="text-gray-400 mt-3">
                If the affiliate code is already in their URL when they start the purchase, we capture it immediately — 
                cookies are just a backup. The code is locked the moment they enter their email and click "Continue".
              </p>
            </details>
            <details className="bg-gray-800/30 border border-gray-700/50 rounded-xl p-5 group">
              <summary className="font-semibold cursor-pointer list-none flex items-center justify-between">
                Can someone change the affiliate code on their order?
                <span className="text-gray-500 group-open:rotate-180 transition-transform">▼</span>
              </summary>
              <p className="text-gray-400 mt-3">
                No. Once a purchase is created, the affiliate code is permanently locked. This is enforced at the database level 
                and recorded in an append-only audit log that cannot be modified.
              </p>
            </details>
            <details className="bg-gray-800/30 border border-gray-700/50 rounded-xl p-5 group">
              <summary className="font-semibold cursor-pointer list-none flex items-center justify-between">
                How long does my referral last?
                <span className="text-gray-500 group-open:rotate-180 transition-transform">▼</span>
              </summary>
              <p className="text-gray-400 mt-3">
                We use a 30-day cookie. If someone clicks your link and purchases within 30 days, you get credit. 
                If they click another affiliate's link, the most recent click wins (standard last-click attribution).
              </p>
            </details>
            <details className="bg-gray-800/30 border border-gray-700/50 rounded-xl p-5 group">
              <summary className="font-semibold cursor-pointer list-none flex items-center justify-between">
                What if a sale gets refunded?
                <span className="text-gray-500 group-open:rotate-180 transition-transform">▼</span>
              </summary>
              <p className="text-gray-400 mt-3">
                We have a 7-day refund policy. Commissions are only finalized after the refund window closes. 
                If a refund is issued, the commission is reversed — you'll see this clearly in your dashboard.
              </p>
            </details>
          </div>
        </div>

        {/* CTA */}
        <div className="text-center bg-gradient-to-r from-purple-600/20 to-pink-600/20 border border-purple-500/30 rounded-3xl p-10">
          <h2 className="text-3xl font-bold mb-4">Ready to Start Earning?</h2>
          <p className="text-gray-400 mb-6 max-w-lg mx-auto">
            Join our affiliate program and earn 30% ($17.70) on every sale. No hidden fees, no games — just transparent commissions.
          </p>
          <Link
            href="/affiliate/signup"
            className="inline-flex items-center gap-2 px-8 py-4 bg-gradient-to-r from-purple-600 to-pink-600 rounded-full font-semibold text-lg hover:opacity-90 transition"
          >
            <span>🚀</span> Become an Affiliate
          </Link>
        </div>
      </main>

      {/* Footer */}
      <footer className="border-t border-gray-800 mt-20">
        <div className="max-w-4xl mx-auto px-6 py-8 text-center text-gray-500 text-sm">
          <p>© 2024 MapsReach. All rights reserved.</p>
          <div className="flex justify-center gap-4 mt-2">
            <Link href="/" className="hover:text-gray-300 transition">Home</Link>
            <Link href="/affiliate/login" className="hover:text-gray-300 transition">Affiliate Login</Link>
          </div>
        </div>
      </footer>
    </div>
  );
}
