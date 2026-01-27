'use client';

import React, { useEffect, useState } from 'react';

interface DownloadStat {
  type: string;
  count: number;
  last_download_at: string;
}

interface PageView {
  path: string;
  count: number;
  last_viewed_at: string;
}

export default function AnalyticsClient({ token }: { token: string }) {
  const [downloads, setDownloads] = useState<DownloadStat[]>([]);
  const [pageViews, setPageViews] = useState<PageView[]>([]);
  const [loading, setLoading] = useState(true);

  async function fetchAnalytics() {
    setLoading(true);
    try {
      const res = await fetch('/api/v1/admin/analytics', {
        headers: { 'Authorization': 'Bearer ' + token }
      });
      const data = await res.json();
      if (data.success) {
        setDownloads(data.downloads || []);
        setPageViews(data.pageViews || []);
      }
    } catch (err) {
      console.error('Failed to fetch analytics:', err);
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    fetchAnalytics();
  }, []);

  function fmtDate(v: string | null) {
    if (!v) return '-';
    try {
      const d = new Date(v);
      return d.toLocaleString();
    } catch { return v; }
  }

  function getDownloadLabel(type: string) {
    switch (type) {
      case 'chrome_extension': return '🌐 Chrome Extension';
      case 'edge_extension': return '🔷 Edge Extension';
      case 'whatsapp_tool': return '📱 WhatsApp Auto Outreach';
      default: return type;
    }
  }

  return (
    <div style={{ marginTop: 32 }}>
      {/* Downloads Section */}
      <div style={{ marginBottom: 32 }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 16 }}>
          <h2 style={{ margin: 0, fontSize: 20, fontWeight: 600 }}>📥 Download Counters</h2>
          <button
            onClick={fetchAnalytics}
            disabled={loading}
            style={{ padding: '6px 12px', borderRadius: 6, border: '1px solid #e5e7eb', background: '#f9fafb', fontSize: 13, cursor: loading ? 'wait' : 'pointer' }}
          >
            {loading ? 'Loading...' : '⟳ Refresh'}
          </button>
        </div>

        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(250px, 1fr))', gap: 16 }}>
          {downloads.map((d) => (
            <div key={d.type} style={{ 
              background: '#ffffff', 
              border: '1px solid #e5e7eb', 
              borderRadius: 12, 
              padding: 20,
              boxShadow: '0 1px 3px rgba(0,0,0,0.1)'
            }}>
              <div style={{ fontSize: 14, color: '#6b7280', marginBottom: 4 }}>{getDownloadLabel(d.type)}</div>
              <div style={{ fontSize: 32, fontWeight: 700, color: '#111827' }}>{d.count.toLocaleString()}</div>
              <div style={{ fontSize: 12, color: '#9ca3af', marginTop: 4 }}>
                Last: {fmtDate(d.last_download_at)}
              </div>
            </div>
          ))}
          {downloads.length === 0 && !loading && (
            <div style={{ color: '#6b7280', fontSize: 14 }}>No download data yet.</div>
          )}
        </div>
      </div>

      {/* Page Views Section */}
      <div>
        <h2 style={{ margin: 0, fontSize: 20, fontWeight: 600, marginBottom: 16 }}>📊 Page Views</h2>
        
        <div style={{ 
          background: '#ffffff', 
          border: '1px solid #e5e7eb', 
          borderRadius: 12, 
          overflow: 'hidden',
          boxShadow: '0 1px 3px rgba(0,0,0,0.1)'
        }}>
          <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 14 }}>
            <thead>
              <tr style={{ background: '#f9fafb', borderBottom: '1px solid #e5e7eb' }}>
                <th style={{ textAlign: 'left', padding: '12px 16px', fontWeight: 600 }}>Page Path</th>
                <th style={{ textAlign: 'right', padding: '12px 16px', fontWeight: 600 }}>Views</th>
                <th style={{ textAlign: 'right', padding: '12px 16px', fontWeight: 600 }}>Last Viewed</th>
              </tr>
            </thead>
            <tbody>
              {pageViews.map((pv, i) => (
                <tr key={pv.path} style={{ borderBottom: i < pageViews.length - 1 ? '1px solid #f3f4f6' : 'none' }}>
                  <td style={{ padding: '10px 16px', fontFamily: 'monospace', fontSize: 13 }}>{pv.path}</td>
                  <td style={{ padding: '10px 16px', textAlign: 'right', fontWeight: 600 }}>{pv.count.toLocaleString()}</td>
                  <td style={{ padding: '10px 16px', textAlign: 'right', color: '#6b7280', fontSize: 12 }}>{fmtDate(pv.last_viewed_at)}</td>
                </tr>
              ))}
              {pageViews.length === 0 && !loading && (
                <tr>
                  <td colSpan={3} style={{ padding: 20, textAlign: 'center', color: '#6b7280' }}>
                    No page view data yet. Add the tracking script to your website.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>

        {/* Tracking Instructions */}
        <div style={{ marginTop: 24, padding: 16, background: '#f0fdf4', border: '1px solid #bbf7d0', borderRadius: 8 }}>
          <h4 style={{ margin: '0 0 8px 0', fontSize: 14, fontWeight: 600, color: '#166534' }}>📌 How to Track</h4>
          <p style={{ margin: '0 0 8px 0', fontSize: 13, color: '#166534' }}>
            Add this to your website to track page views and downloads:
          </p>
          <pre style={{ 
            background: '#ffffff', 
            padding: 12, 
            borderRadius: 6, 
            fontSize: 12, 
            overflow: 'auto',
            border: '1px solid #dcfce7'
          }}>
{`// Track page view on load
fetch('/api/track/pageview', {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({ path: window.location.pathname })
});

// Track download (call when user clicks download)
// type: 'chrome_extension' | 'edge_extension' | 'whatsapp_tool'
fetch('/api/track/download', {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({ type: 'chrome_extension' })
});`}
          </pre>
        </div>
      </div>
    </div>
  );
}
