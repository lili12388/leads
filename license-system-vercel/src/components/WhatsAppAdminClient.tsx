'use client';

import React, { useEffect, useState } from 'react';

interface WhatsAppLicense {
  id: string;
  license_key_plaintext?: string;
  license_key_hash: string;
  status: string;
  max_activations: number;
  active_activations?: number;
  expires_at?: string;
  customer_email?: string;
  customer_name?: string;
  notes?: string;
  last_used?: string;
  created_at: string;
}

interface WhatsAppTrial {
  id: string;
  hardware_id: string;
  messages_sent: number;
  max_messages: number;
  is_locked: number;
  license_id?: string;
  license_email?: string;
  license_customer?: string;
  first_seen_at: string;
  last_seen_at: string;
  last_ip?: string;
  machine_name?: string;
  os_info?: string;
}

interface TrialStats {
  total_users: number;
  licensed_users: number;
  locked_users: number;
  total_messages_sent: number;
}

export default function WhatsAppAdminClient({ token }: { token: string }) {
  const [activeTab, setActiveTab] = useState<'licenses' | 'trials'>('licenses');
  const [licenses, setLicenses] = useState<WhatsAppLicense[]>([]);
  const [trials, setTrials] = useState<WhatsAppTrial[]>([]);
  const [stats, setStats] = useState<TrialStats | null>(null);
  const [loading, setLoading] = useState(false);
  const [showCreate, setShowCreate] = useState(false);
  const [showRevoked, setShowRevoked] = useState(false);
  const [newLicenseKey, setNewLicenseKey] = useState<string | null>(null);
  const [copiedKey, setCopiedKey] = useState(false);
  const [copiedLicenseId, setCopiedLicenseId] = useState<string | null>(null);
  const [form, setForm] = useState({ max_activations: 2, expires_days: 0, customer_email: '', customer_name: '', notes: '' });
  const [actionLoading, setActionLoading] = useState<string | null>(null);
  const [showBonusModal, setShowBonusModal] = useState<WhatsAppTrial | null>(null);
  const [bonusMessages, setBonusMessages] = useState(10);

  async function trialAction(trialId: string, action: string, extraData?: any) {
    setActionLoading(trialId + action);
    try {
      const res = await fetch('/api/v1/whatsapp/admin/trials', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', 'Authorization': 'Bearer ' + token },
        body: JSON.stringify({ trial_id: trialId, action, ...extraData }),
      });
      const data = await res.json();
      if (data.success) {
        fetchTrials();
      } else {
        alert('Action failed: ' + (data.message || data.error || JSON.stringify(data)));
      }
    } catch (err: any) {
      alert('Request failed: ' + (err?.message || err));
    } finally {
      setActionLoading(null);
    }
  }

  async function deleteTrial(trialId: string) {
    if (!confirm('Delete this trial user? This cannot be undone.')) return;
    setActionLoading(trialId + 'delete');
    try {
      const res = await fetch('/api/v1/whatsapp/admin/trials', {
        method: 'DELETE',
        headers: { 'Content-Type': 'application/json', 'Authorization': 'Bearer ' + token },
        body: JSON.stringify({ trial_id: trialId }),
      });
      const data = await res.json();
      if (data.success) {
        fetchTrials();
      } else {
        alert('Delete failed: ' + (data.message || data.error || JSON.stringify(data)));
      }
    } catch (err: any) {
      alert('Request failed: ' + (err?.message || err));
    } finally {
      setActionLoading(null);
    }
  }

  async function fetchLicenses() {
    setLoading(true);
    try {
      const res = await fetch('/api/v1/whatsapp/admin', { headers: { 'Authorization': 'Bearer ' + token } });
      const data = await res.json();
      if (data.success) setLicenses(data.licenses || []);
      else alert('Failed to fetch licenses: ' + (data.error || JSON.stringify(data)));
    } catch (err: any) {
      alert('Fetch failed: ' + (err?.message || err));
    } finally {
      setLoading(false);
    }
  }

  async function fetchTrials() {
    setLoading(true);
    try {
      const res = await fetch('/api/v1/whatsapp/admin/trials', { headers: { 'Authorization': 'Bearer ' + token } });
      const data = await res.json();
      if (data.success) {
        setTrials(data.trials || []);
        setStats(data.stats || null);
      } else alert('Failed to fetch trials: ' + (data.error || JSON.stringify(data)));
    } catch (err: any) {
      alert('Fetch failed: ' + (err?.message || err));
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    fetchLicenses();
    fetchTrials();
  }, []);

  function fmtDate(v: string | null | undefined) {
    if (!v) return '-';
    try {
      const d = new Date(v);
      return d.toLocaleString();
    } catch { return v; }
  }

  async function handleCreate(e: React.FormEvent) {
    e.preventDefault();
    try {
      const payload: any = { max_activations: form.max_activations };
      if (form.expires_days > 0) payload.expires_days = form.expires_days;
      if (form.customer_email.trim()) payload.customer_email = form.customer_email.trim();
      if (form.customer_name.trim()) payload.customer_name = form.customer_name.trim();
      if (form.notes.trim()) payload.notes = form.notes.trim();

      const res = await fetch('/api/v1/whatsapp/admin', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', 'Authorization': 'Bearer ' + token },
        body: JSON.stringify(payload),
      });
      const data = await res.json();
      if (data.success) {
        setShowCreate(false);
        setNewLicenseKey(data.license_key);
        try {
          await navigator.clipboard.writeText(String(data.license_key));
          setCopiedKey(true);
        } catch (e) {}
        fetchLicenses();
      } else {
        alert('Create failed: ' + (data.message || data.error || JSON.stringify(data)));
      }
    } catch (err: any) {
      alert('Create request failed: ' + (err?.message || err));
    }
  }

  async function revoke(id: string) {
    if (!confirm('Revoke WhatsApp license ' + id + '?')) return;
    try {
      const res = await fetch('/api/v1/whatsapp/admin', {
        method: 'DELETE',
        headers: { 'Content-Type': 'application/json', 'Authorization': 'Bearer ' + token },
        body: JSON.stringify({ license_id: id })
      });
      const data = await res.json();
      if (data.success) {
        alert('Revoked');
        fetchLicenses();
        fetchTrials();
      } else alert('Failed: ' + (data.error || data.message || JSON.stringify(data)));
    } catch (err: any) { alert('Request failed: ' + (err?.message || err)); }
  }

  const visibleLicenses = showRevoked ? licenses : licenses.filter(l => l.status !== 'revoked');

  return (
    <div style={{ padding: 24, fontFamily: 'system-ui, sans-serif', background: 'rgba(37,211,102,0.03)', borderRadius: 16, border: '1px solid #e5e7eb', marginTop: 24 }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 20 }}>
        <div>
          <h2 style={{ margin: 0, fontSize: 22, fontWeight: 600, color: '#0f172a', display: 'flex', alignItems: 'center', gap: 8 }}>
            <span style={{ fontSize: 28 }}>📱</span> WhatsApp Sender
          </h2>
          <p style={{ margin: 0, marginTop: 4, fontSize: 13, color: '#6b7280' }}>
            Manage WhatsApp Sender licenses and trial users.
          </p>
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
          <button
            onClick={() => { fetchLicenses(); fetchTrials(); }}
            style={{ padding: '9px 14px', background: '#f3f4f6', border: '1px solid #e5e7eb', borderRadius: 999, fontSize: 13, color: '#374151', cursor: 'pointer' }}
          >
            {loading ? 'Refreshing…' : '🔄 Refresh'}
          </button>
        </div>
      </div>

      {/* Stats Cards */}
      {stats && (
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 16, marginBottom: 20 }}>
          <div style={{ background: '#fff', padding: 16, borderRadius: 12, border: '1px solid #e5e7eb' }}>
            <div style={{ fontSize: 24, fontWeight: 700, color: '#25d366' }}>{stats.total_users}</div>
            <div style={{ fontSize: 12, color: '#6b7280' }}>Total Users</div>
          </div>
          <div style={{ background: '#fff', padding: 16, borderRadius: 12, border: '1px solid #e5e7eb' }}>
            <div style={{ fontSize: 24, fontWeight: 700, color: '#2563eb' }}>{stats.licensed_users}</div>
            <div style={{ fontSize: 12, color: '#6b7280' }}>Licensed Users</div>
          </div>
          <div style={{ background: '#fff', padding: 16, borderRadius: 12, border: '1px solid #e5e7eb' }}>
            <div style={{ fontSize: 24, fontWeight: 700, color: '#dc2626' }}>{stats.locked_users}</div>
            <div style={{ fontSize: 12, color: '#6b7280' }}>Trial Ended (Potential Buyers!)</div>
          </div>
          <div style={{ background: '#fff', padding: 16, borderRadius: 12, border: '1px solid #e5e7eb' }}>
            <div style={{ fontSize: 24, fontWeight: 700, color: '#8b5cf6' }}>{stats.total_messages_sent}</div>
            <div style={{ fontSize: 12, color: '#6b7280' }}>Total Messages Sent</div>
          </div>
        </div>
      )}

      {/* Tabs */}
      <div style={{ display: 'flex', gap: 8, marginBottom: 16 }}>
        <button
          onClick={() => setActiveTab('licenses')}
          style={{
            padding: '10px 20px',
            background: activeTab === 'licenses' ? '#25d366' : '#f3f4f6',
            color: activeTab === 'licenses' ? '#fff' : '#374151',
            border: 'none',
            borderRadius: 999,
            fontSize: 13,
            fontWeight: 500,
            cursor: 'pointer',
          }}
        >
          🔑 Licenses ({licenses.length})
        </button>
        <button
          onClick={() => setActiveTab('trials')}
          style={{
            padding: '10px 20px',
            background: activeTab === 'trials' ? '#25d366' : '#f3f4f6',
            color: activeTab === 'trials' ? '#fff' : '#374151',
            border: 'none',
            borderRadius: 999,
            fontSize: 13,
            fontWeight: 500,
            cursor: 'pointer',
          }}
        >
          👥 Trial Users ({trials.length})
        </button>
      </div>

      {/* Licenses Tab */}
      {activeTab === 'licenses' && (
        <div>
          <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 12 }}>
            <button
              onClick={() => setShowRevoked(v => !v)}
              style={{ padding: '8px 14px', background: showRevoked ? '#111827' : '#ffffff', color: showRevoked ? '#ffffff' : '#374151', border: '1px solid #e5e7eb', borderRadius: 999, fontSize: 12, cursor: 'pointer' }}
            >
              {showRevoked ? 'Hide revoked' : 'Show revoked'}
            </button>
            <button
              onClick={() => setShowCreate(true)}
              style={{ padding: '9px 14px', background: '#25d366', color: '#fff', border: 'none', borderRadius: 999, fontSize: 13, fontWeight: 500, cursor: 'pointer' }}
            >
              + Add WhatsApp License
            </button>
          </div>

          <div style={{ borderRadius: 12, border: '1px solid #e5e7eb', overflow: 'hidden', background: '#fff' }}>
            <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 13 }}>
              <thead>
                <tr style={{ textAlign: 'left', background: '#f9fafb', borderBottom: '1px solid #e5e7eb' }}>
                  <th style={{ padding: '12px 14px', color: '#6b7280', fontWeight: 600 }}>License Key</th>
                  <th style={{ padding: '12px 14px', color: '#6b7280', fontWeight: 600 }}>Customer</th>
                  <th style={{ padding: '12px 14px', color: '#6b7280', fontWeight: 600 }}>Status</th>
                  <th style={{ padding: '12px 14px', color: '#6b7280', fontWeight: 600 }}>Activations</th>
                  <th style={{ padding: '12px 14px', color: '#6b7280', fontWeight: 600 }}>Last Used</th>
                  <th style={{ padding: '12px 14px', color: '#6b7280', fontWeight: 600, textAlign: 'right' }}>Actions</th>
                </tr>
              </thead>
              <tbody>
                {visibleLicenses.length === 0 && (
                  <tr><td colSpan={6} style={{ padding: 24, textAlign: 'center', color: '#9ca3af' }}>No WhatsApp licenses yet.</td></tr>
                )}
                {visibleLicenses.map((lic, index) => {
                  let statusBg = 'rgba(22,163,74,0.12)';
                  let statusColor = '#15803d';
                  if (lic.status === 'revoked') { statusBg = 'rgba(220,38,38,0.10)'; statusColor = '#b91c1c'; }
                  else if (lic.status === 'expired') { statusBg = 'rgba(234,179,8,0.12)'; statusColor = '#b45309'; }

                  return (
                    <tr key={lic.id} style={{ borderBottom: '1px solid #f3f4f6', background: index % 2 === 0 ? '#ffffff' : '#f9fafb' }}>
                      <td style={{ padding: '10px 14px' }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                          <code style={{ fontFamily: 'monospace', background: '#f3f4f6', padding: '4px 8px', borderRadius: 6, fontSize: 11, color: '#111827' }}>
                            {lic.license_key_plaintext || (lic.license_key_hash?.slice(0, 16) + '…')}
                          </code>
                          {lic.license_key_plaintext && (
                            <button
                              onClick={async () => {
                                await navigator.clipboard.writeText(lic.license_key_plaintext!);
                                setCopiedLicenseId(lic.id);
                                setTimeout(() => setCopiedLicenseId(null), 2000);
                              }}
                              style={{ padding: '4px 8px', borderRadius: 6, border: '1px solid #e5e7eb', background: copiedLicenseId === lic.id ? '#22c55e' : '#fff', color: copiedLicenseId === lic.id ? '#fff' : '#000', cursor: 'pointer', fontSize: 10 }}
                            >{copiedLicenseId === lic.id ? 'Copied!' : 'Copy'}</button>
                          )}
                        </div>
                      </td>
                      <td style={{ padding: '10px 14px' }}>
                        {lic.customer_name && <div style={{ fontWeight: 500, fontSize: 12 }}>{lic.customer_name}</div>}
                        {lic.customer_email && <div style={{ fontSize: 11, color: '#6b7280' }}>{lic.customer_email}</div>}
                        {!lic.customer_name && !lic.customer_email && <span style={{ fontSize: 11, color: '#9ca3af' }}>-</span>}
                      </td>
                      <td style={{ padding: '10px 14px' }}>
                        <span style={{ display: 'inline-flex', padding: '3px 9px', borderRadius: 999, fontSize: 11, fontWeight: 500, background: statusBg, color: statusColor, textTransform: 'capitalize' }}>
                          {lic.status}
                        </span>
                      </td>
                      <td style={{ padding: '10px 14px' }}>{lic.active_activations ?? 0} / {lic.max_activations}</td>
                      <td style={{ padding: '10px 14px', color: '#4b5563' }}>{fmtDate(lic.last_used)}</td>
                      <td style={{ padding: '10px 14px', textAlign: 'right' }}>
                        <button
                          onClick={() => revoke(lic.id)}
                          style={{ padding: '6px 11px', borderRadius: 999, border: 'none', background: 'rgba(248,113,113,0.16)', color: '#b91c1c', fontSize: 12, fontWeight: 500, cursor: 'pointer' }}
                        >
                          Revoke
                        </button>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Trials Tab */}
      {activeTab === 'trials' && (
        <div style={{ borderRadius: 12, border: '1px solid #e5e7eb', overflow: 'hidden', background: '#fff' }}>
          <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 13 }}>
            <thead>
              <tr style={{ textAlign: 'left', background: '#f9fafb', borderBottom: '1px solid #e5e7eb' }}>
                <th style={{ padding: '12px 14px', color: '#6b7280', fontWeight: 600 }}>Machine</th>
                <th style={{ padding: '12px 14px', color: '#6b7280', fontWeight: 600 }}>Messages Sent</th>
                <th style={{ padding: '12px 14px', color: '#6b7280', fontWeight: 600 }}>Status</th>
                <th style={{ padding: '12px 14px', color: '#6b7280', fontWeight: 600 }}>License</th>
                <th style={{ padding: '12px 14px', color: '#6b7280', fontWeight: 600 }}>Last Seen</th>
                <th style={{ padding: '12px 14px', color: '#6b7280', fontWeight: 600 }}>IP</th>
                <th style={{ padding: '12px 14px', color: '#6b7280', fontWeight: 600, textAlign: 'right' }}>Actions</th>
              </tr>
            </thead>
            <tbody>
              {trials.length === 0 && (
                <tr><td colSpan={7} style={{ padding: 24, textAlign: 'center', color: '#9ca3af' }}>No trial users yet.</td></tr>
              )}
              {trials.map((trial, index) => {
                const isLocked = trial.is_locked === 1 && !trial.license_id;
                const hasLicense = !!trial.license_id;
                const isLoadingThis = actionLoading?.startsWith(trial.id);

                return (
                  <tr key={trial.id} style={{ borderBottom: '1px solid #f3f4f6', background: index % 2 === 0 ? '#ffffff' : '#f9fafb' }}>
                    <td style={{ padding: '10px 14px' }}>
                      <div style={{ fontWeight: 500, fontSize: 12 }}>{trial.machine_name || 'Unknown'}</div>
                      <div style={{ fontSize: 10, color: '#9ca3af', fontFamily: 'monospace' }}>{trial.hardware_id?.slice(0, 16)}...</div>
                    </td>
                    <td style={{ padding: '10px 14px' }}>
                      <span style={{ fontWeight: 600, color: hasLicense ? '#25d366' : (isLocked ? '#dc2626' : '#111827') }}>
                        {trial.messages_sent}
                      </span>
                      {!hasLicense && <span style={{ color: '#6b7280' }}> / {trial.max_messages}</span>}
                      {hasLicense && <span style={{ color: '#25d366', marginLeft: 4 }}>∞</span>}
                    </td>
                    <td style={{ padding: '10px 14px' }}>
                      {hasLicense ? (
                        <span style={{ display: 'inline-flex', padding: '3px 9px', borderRadius: 999, fontSize: 11, fontWeight: 500, background: 'rgba(37,211,102,0.12)', color: '#15803d' }}>
                          ✓ Licensed
                        </span>
                      ) : isLocked ? (
                        <span style={{ display: 'inline-flex', padding: '3px 9px', borderRadius: 999, fontSize: 11, fontWeight: 500, background: 'rgba(220,38,38,0.10)', color: '#b91c1c' }}>
                          🔒 Trial Ended
                        </span>
                      ) : (
                        <span style={{ display: 'inline-flex', padding: '3px 9px', borderRadius: 999, fontSize: 11, fontWeight: 500, background: 'rgba(234,179,8,0.12)', color: '#b45309' }}>
                          Trial ({trial.max_messages - trial.messages_sent} left)
                        </span>
                      )}
                    </td>
                    <td style={{ padding: '10px 14px', fontSize: 11, color: '#6b7280' }}>
                      {trial.license_customer || trial.license_email || (trial.license_id ? trial.license_id.slice(0, 8) + '...' : '-')}
                    </td>
                    <td style={{ padding: '10px 14px', color: '#4b5563', fontSize: 11 }}>{fmtDate(trial.last_seen_at)}</td>
                    <td style={{ padding: '10px 14px', fontSize: 11, fontFamily: 'monospace', color: '#6b7280' }}>{trial.last_ip || '-'}</td>
                    <td style={{ padding: '10px 14px', textAlign: 'right' }}>
                      <div style={{ display: 'flex', gap: 4, justifyContent: 'flex-end', flexWrap: 'wrap' }}>
                        {/* Reset Trial Button */}
                        <button
                          onClick={() => trialAction(trial.id, 'reset_trial')}
                          disabled={isLoadingThis}
                          title="Reset trial: Set messages to 0 and unlock"
                          style={{ padding: '4px 8px', borderRadius: 6, border: 'none', background: 'rgba(59,130,246,0.12)', color: '#2563eb', fontSize: 10, fontWeight: 500, cursor: 'pointer', opacity: isLoadingThis ? 0.5 : 1 }}
                        >
                          🔄 Reset
                        </button>
                        
                        {/* Add Messages Button */}
                        <button
                          onClick={() => { setShowBonusModal(trial); setBonusMessages(10); }}
                          disabled={isLoadingThis}
                          title="Add bonus messages"
                          style={{ padding: '4px 8px', borderRadius: 6, border: 'none', background: 'rgba(34,197,94,0.12)', color: '#16a34a', fontSize: 10, fontWeight: 500, cursor: 'pointer', opacity: isLoadingThis ? 0.5 : 1 }}
                        >
                          ➕ Add
                        </button>
                        
                        {/* Lock/Unlock Button */}
                        {isLocked ? (
                          <button
                            onClick={() => trialAction(trial.id, 'unlock')}
                            disabled={isLoadingThis}
                            title="Unlock trial"
                            style={{ padding: '4px 8px', borderRadius: 6, border: 'none', background: 'rgba(34,197,94,0.12)', color: '#16a34a', fontSize: 10, fontWeight: 500, cursor: 'pointer', opacity: isLoadingThis ? 0.5 : 1 }}
                          >
                            🔓 Unlock
                          </button>
                        ) : !hasLicense && (
                          <button
                            onClick={() => trialAction(trial.id, 'lock')}
                            disabled={isLoadingThis}
                            title="Lock trial"
                            style={{ padding: '4px 8px', borderRadius: 6, border: 'none', background: 'rgba(234,179,8,0.12)', color: '#b45309', fontSize: 10, fontWeight: 500, cursor: 'pointer', opacity: isLoadingThis ? 0.5 : 1 }}
                          >
                            🔒 Lock
                          </button>
                        )}
                        
                        {/* Unlink License Button */}
                        {hasLicense && (
                          <button
                            onClick={() => trialAction(trial.id, 'unlink_license')}
                            disabled={isLoadingThis}
                            title="Remove license from this user"
                            style={{ padding: '4px 8px', borderRadius: 6, border: 'none', background: 'rgba(234,179,8,0.12)', color: '#b45309', fontSize: 10, fontWeight: 500, cursor: 'pointer', opacity: isLoadingThis ? 0.5 : 1 }}
                          >
                            ⛓️ Unlink
                          </button>
                        )}
                        
                        {/* Delete Button */}
                        <button
                          onClick={() => deleteTrial(trial.id)}
                          disabled={isLoadingThis}
                          title="Delete trial user"
                          style={{ padding: '4px 8px', borderRadius: 6, border: 'none', background: 'rgba(220,38,38,0.12)', color: '#b91c1c', fontSize: 10, fontWeight: 500, cursor: 'pointer', opacity: isLoadingThis ? 0.5 : 1 }}
                        >
                          🗑️
                        </button>
                      </div>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      )}

      {/* Create Modal */}
      {showCreate && (
        <div style={{ position: 'fixed', inset: 0, background: 'rgba(15,23,42,0.45)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 40 }}>
          <form onSubmit={handleCreate} style={{ background: '#ffffff', padding: 24, borderRadius: 16, minWidth: 340, maxWidth: 420, boxShadow: '0 24px 60px rgba(15,23,42,0.35)' }}>
            <h3 style={{ marginTop: 0, marginBottom: 12, fontSize: 18, fontWeight: 600, color: '#0f172a' }}>Create WhatsApp License</h3>
            <p style={{ marginTop: 0, marginBottom: 16, fontSize: 12, color: '#6b7280' }}>
              This license key will work for WhatsApp Sender only (starts with WA-).
            </p>
            <label style={{ display: 'block', marginBottom: 10, fontSize: 13, color: '#111827' }}>
              Max Activations (devices)
              <input type="number" min={1} max={10} value={form.max_activations} onChange={e => setForm({ ...form, max_activations: Math.min(10, Math.max(1, Number(e.target.value))) })} style={{ display: 'block', width: '100%', marginTop: 6, padding: '7px 9px', borderRadius: 8, border: '1px solid #e5e7eb' }} />
            </label>
            <label style={{ display: 'block', marginBottom: 10, fontSize: 13, color: '#111827' }}>
              Expire in days (0 = never)
              <input type="number" min={0} value={form.expires_days} onChange={e => setForm({ ...form, expires_days: Number(e.target.value) })} style={{ display: 'block', width: '100%', marginTop: 6, padding: '7px 9px', borderRadius: 8, border: '1px solid #e5e7eb' }} />
            </label>
            <label style={{ display: 'block', marginBottom: 10, fontSize: 13, color: '#111827' }}>
              Customer Email
              <input value={form.customer_email} onChange={e => setForm({ ...form, customer_email: e.target.value })} style={{ display: 'block', width: '100%', marginTop: 6, padding: '7px 9px', borderRadius: 8, border: '1px solid #e5e7eb' }} />
            </label>
            <label style={{ display: 'block', marginBottom: 14, fontSize: 13, color: '#111827' }}>
              Customer Name
              <input value={form.customer_name} onChange={e => setForm({ ...form, customer_name: e.target.value })} style={{ display: 'block', width: '100%', marginTop: 6, padding: '7px 9px', borderRadius: 8, border: '1px solid #e5e7eb' }} />
            </label>
            <div style={{ display: 'flex', justifyContent: 'flex-end', gap: 8, marginTop: 4 }}>
              <button type="button" onClick={() => setShowCreate(false)} style={{ padding: '8px 12px', borderRadius: 999, border: '1px solid #e5e7eb', background: '#ffffff', fontSize: 13, color: '#374151', cursor: 'pointer' }}>Cancel</button>
              <button type="submit" style={{ padding: '8px 14px', borderRadius: 999, border: 'none', background: '#25d366', color: '#ffffff', fontSize: 13, fontWeight: 500, cursor: 'pointer' }}>Create</button>
            </div>
          </form>
        </div>
      )}

      {/* Add Bonus Messages Modal */}
      {showBonusModal && (
        <div style={{ position: 'fixed', inset: 0, background: 'rgba(15,23,42,0.45)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 50 }}>
          <div style={{ background: '#ffffff', padding: 20, borderRadius: 12, minWidth: 320, maxWidth: 400, boxShadow: '0 20px 50px rgba(15,23,42,0.35)' }}>
            <h3 style={{ marginTop: 0, marginBottom: 6, fontSize: 18, fontWeight: 600 }}>➕ Add Bonus Messages</h3>
            <p style={{ marginTop: 0, marginBottom: 12, fontSize: 13, color: '#6b7280' }}>
              Add extra messages to this trial user's allowance.
            </p>
            <p style={{ marginTop: 0, marginBottom: 12, fontSize: 13, color: '#374151' }}>
              <strong>Machine:</strong> {showBonusModal.machine_name}
            </p>
            <input
              type="number"
              min="1"
              value={bonusMessages}
              onChange={(e) => setBonusMessages(parseInt(e.target.value) || 0)}
              placeholder="Number of bonus messages"
              style={{ width: '100%', padding: 10, borderRadius: 8, border: '1px solid #e5e7eb', fontSize: 14, marginBottom: 12 }}
            />
            <div style={{ display: 'flex', justifyContent: 'flex-end', gap: 8 }}>
              <button
                onClick={() => { setShowBonusModal(null); setBonusMessages(10); }}
                style={{ padding: '8px 12px', borderRadius: 999, border: '1px solid #e5e7eb', background: '#ffffff', fontSize: 13, color: '#374151', cursor: 'pointer' }}
              >
                Cancel
              </button>
              <button
                disabled={!!actionLoading || bonusMessages < 1}
                onClick={async () => {
                  await trialAction(showBonusModal.id, 'add_messages', { bonus_messages: bonusMessages });
                  setShowBonusModal(null);
                  setBonusMessages(10);
                }}
                style={{ padding: '8px 12px', borderRadius: 999, border: 'none', background: '#25d366', color: '#fff', fontSize: 13, cursor: actionLoading ? 'wait' : 'pointer', opacity: !!actionLoading || bonusMessages < 1 ? 0.6 : 1 }}
              >
                {actionLoading ? 'Adding...' : `Add ${bonusMessages} Messages`}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* License Created Modal */}
      {newLicenseKey && (
        <div style={{ position: 'fixed', inset: 0, background: 'rgba(15,23,42,0.45)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 50 }}>
          <div style={{ background: '#ffffff', padding: 20, borderRadius: 12, minWidth: 320, maxWidth: 540, boxShadow: '0 20px 50px rgba(15,23,42,0.35)' }}>
            <h3 style={{ marginTop: 0, marginBottom: 6, fontSize: 18, fontWeight: 600 }}>WhatsApp License Created! 📱</h3>
            <p style={{ marginTop: 0, marginBottom: 12, fontSize: 13, color: '#6b7280' }}>
              Copy this key and send it to your customer. It starts with WA- to indicate it's for WhatsApp Sender.
            </p>
            <div style={{ fontFamily: 'monospace', background: '#f3f4f6', padding: 12, borderRadius: 8, fontSize: 14 }}>
              {newLicenseKey}
            </div>
            <div style={{ display: 'flex', justifyContent: 'flex-end', gap: 8, marginTop: 12 }}>
              <button
                onClick={async () => {
                  await navigator.clipboard.writeText(String(newLicenseKey));
                  setCopiedKey(true);
                  setTimeout(() => setCopiedKey(false), 2000);
                }}
                style={{ padding: '8px 12px', borderRadius: 999, border: 'none', background: '#25d366', color: '#fff', fontSize: 13, cursor: 'pointer' }}
              >
                {copiedKey ? 'Copied!' : 'Copy key'}
              </button>
              <button
                onClick={() => { setNewLicenseKey(null); setCopiedKey(false); }}
                style={{ padding: '8px 12px', borderRadius: 999, border: '1px solid #e5e7eb', background: '#ffffff', fontSize: 13, color: '#374151', cursor: 'pointer' }}
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
