'use client';

import React, { useState } from 'react';
import AdminTableClient from './AdminTableClient';
import WhatsAppAdminClient from './WhatsAppAdminClient';
import AnalyticsClient from './AnalyticsClient';

type TabType = 'extension' | 'whatsapp' | 'analytics';

interface AdminDashboardProps {
  token: string;
  initialLicenses: any[];
}

export default function AdminDashboard({ token, initialLicenses }: AdminDashboardProps) {
  const [activeTab, setActiveTab] = useState<TabType>('extension');

  const tabs: { id: TabType; label: string; icon: string }[] = [
    { id: 'extension', label: 'Extension Licenses', icon: '🧩' },
    { id: 'whatsapp', label: 'WhatsApp Licenses', icon: '📱' },
    { id: 'analytics', label: 'Analytics', icon: '📊' },
  ];

  return (
    <div>
      {/* Tab Navigation */}
      <div style={{ 
        display: 'flex', 
        gap: 8, 
        marginBottom: 24,
        borderBottom: '1px solid #e5e7eb',
        paddingBottom: 0
      }}>
        {tabs.map((tab) => (
          <button
            key={tab.id}
            onClick={() => setActiveTab(tab.id)}
            style={{
              padding: '12px 20px',
              fontSize: 14,
              fontWeight: activeTab === tab.id ? 600 : 400,
              color: activeTab === tab.id ? '#111827' : '#6b7280',
              background: activeTab === tab.id ? '#ffffff' : 'transparent',
              border: activeTab === tab.id ? '1px solid #e5e7eb' : '1px solid transparent',
              borderBottom: activeTab === tab.id ? '1px solid #ffffff' : '1px solid transparent',
              borderRadius: '8px 8px 0 0',
              marginBottom: -1,
              cursor: 'pointer',
              transition: 'all 0.15s ease',
              display: 'flex',
              alignItems: 'center',
              gap: 8,
            }}
          >
            <span>{tab.icon}</span>
            {tab.label}
          </button>
        ))}
      </div>

      {/* Tab Content */}
      <div>
        {activeTab === 'extension' && (
          <AdminTableClient initialLicenses={initialLicenses} token={token} />
        )}
        
        {activeTab === 'whatsapp' && (
          <WhatsAppAdminClient token={token} />
        )}
        
        {activeTab === 'analytics' && (
          <AnalyticsClient token={token} />
        )}
      </div>
    </div>
  );
}
