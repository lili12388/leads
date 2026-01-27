'use client';

import { useSearchParams } from 'next/navigation';
import { Suspense } from 'react';

function ErrorContent() {
  const searchParams = useSearchParams();
  const error = searchParams.get('message') || searchParams.get('error') || 'An unknown error occurred';

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
        <div className="text-6xl mb-5">
          ❌
        </div>
        <h1 className="text-2xl font-semibold mb-4" style={{ color: '#ef4444' }}>
          Connection Failed
        </h1>
        <div className="px-4 py-3 rounded-lg mb-6" style={{ 
          background: 'rgba(239, 68, 68, 0.1)',
          border: '1px solid rgba(239, 68, 68, 0.2)',
          color: '#fca5a5',
          fontSize: '13px'
        }}>
          {error}
        </div>
        <p className="mb-8" style={{ color: '#94a3b8', fontSize: '14px' }}>
          Please close this tab and try again.
        </p>
        <div className="pt-5" style={{ borderTop: '1px solid rgba(148, 163, 184, 0.1)' }}>
          <p style={{ color: '#64748b', fontSize: '12px' }}>
            Powered by <strong style={{ color: '#3b82f6' }}>MapsReach</strong>
          </p>
        </div>
      </div>
    </div>
  );
}

export default function OAuthErrorPage() {
  return (
    <Suspense fallback={
      <div className="min-h-screen flex items-center justify-center" style={{ background: 'linear-gradient(135deg, #0f172a 0%, #1e293b 50%, #0f172a 100%)' }}>
        <div style={{ color: '#f1f5f9' }}>Loading...</div>
      </div>
    }>
      <ErrorContent />
    </Suspense>
  );
}
