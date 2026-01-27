'use client';

import { useSearchParams } from 'next/navigation';
import { Suspense } from 'react';

function SuccessContent() {
  const searchParams = useSearchParams();
  const email = searchParams.get('email') || 'your account';

  return (
    <div className="min-h-screen flex items-center justify-center" style={{ background: 'linear-gradient(135deg, #0f172a 0%, #1e293b 50%, #0f172a 100%)' }}>
      <div className="max-w-md mx-auto text-center p-12 rounded-2xl" style={{ 
        background: 'linear-gradient(145deg, #1e293b, #273548)',
        boxShadow: '0 20px 60px rgba(0,0,0,0.4), 0 0 0 1px rgba(148, 163, 184, 0.1)',
        border: '1px solid rgba(148, 163, 184, 0.1)'
      }}>
        <img 
          src="https://www.mapsreach.com/logo.png" 
          alt="MapsReach" 
          className="w-20 h-20 mx-auto mb-6"
        />
        <div className="text-6xl mb-5" style={{ color: '#25d366', textShadow: '0 0 20px rgba(37, 211, 102, 0.4)' }}>
          ✓
        </div>
        <h1 className="text-2xl font-semibold mb-4" style={{ color: '#f1f5f9' }}>
          Successfully Connected!
        </h1>
        <p className="inline-block px-5 py-2.5 rounded-lg mb-4" style={{ 
          color: '#3b82f6', 
          background: 'rgba(59, 130, 246, 0.1)',
          fontWeight: 600,
          fontSize: '18px'
        }}>
          {email}
        </p>
        <p className="mb-8" style={{ color: '#94a3b8', fontSize: '14px' }}>
          Your Gmail account is now connected to MapsReach Outreach.
        </p>
        <div className="py-4 px-5 rounded-xl mb-8" style={{ 
          background: 'rgba(37, 211, 102, 0.1)',
          border: '1px solid rgba(37, 211, 102, 0.2)',
          color: '#25d366',
          fontSize: '13px',
          fontWeight: 500
        }}>
          ✓ You can close this tab and return to the app
        </div>
        <div className="pt-5" style={{ borderTop: '1px solid rgba(148, 163, 184, 0.1)' }}>
          <p style={{ color: '#64748b', fontSize: '12px' }}>
            Powered by <strong style={{ color: '#3b82f6' }}>MapsReach</strong>
          </p>
        </div>
      </div>
    </div>
  );
}

export default function OAuthSuccessPage() {
  return (
    <Suspense fallback={
      <div className="min-h-screen flex items-center justify-center" style={{ background: 'linear-gradient(135deg, #0f172a 0%, #1e293b 50%, #0f172a 100%)' }}>
        <div style={{ color: '#f1f5f9' }}>Loading...</div>
      </div>
    }>
      <SuccessContent />
    </Suspense>
  );
}
