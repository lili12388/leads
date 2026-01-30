'use client';

import React, { useEffect, useState } from 'react';

interface ExtensionTrial {
  id: string;
  fingerprint_hash: string;
  fingerprint_components?: string;
  extension_id?: string;
  leads_used: number;
  max_leads: number;
  is_locked: number;
  first_seen_at: string;
  last_seen_at: string;
  last_ip?: string;
  client_browser?: string;
  client_os?: string;
  client_timezone?: string;
}

interface TrialStats {
  total_users: number;
  licensed_users: number;
  locked_users: number;
  total_leads_used: number;
}

export default function ExtensionTrialClient({ token }: { token: string }) {
  const [trials, setTrials] = useState<ExtensionTrial[]>([]);
  const [stats, setStats] = useState<TrialStats | null>(null);
  const [loading, setLoading] = useState(false);
  const [actionLoading, setActionLoading] = useState<string | null>(null);
  const [showBonusModal, setShowBonusModal] = useState<ExtensionTrial | null>(null);
  const [bonusLeads, setBonusLeads] = useState(50);

  async function fetchTrials() {
    setLoading(true);
    try {
      const res = await fetch('/api/v1/admin/trials', { headers: { 'Authorization': 'Bearer ' + token } });
      const data = await res.json();
      if (data.success) {
        setTrials(data.trials || []);
        setStats(data.stats || null);
      } else {
        alert('Failed to fetch trials: ' + (data.error || JSON.stringify(data)));
      }
    } catch (err: any) {
      alert('Fetch failed: ' + (err?.message || err));
    } finally {
      setLoading(false);
    }
  }

  async function trialAction(fingerprintHash: string, action: string, extraData?: any) {
    setActionLoading(fingerprintHash + action);
    try {
      const res = await fetch('/api/v1/admin/trials', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', 'Authorization': 'Bearer ' + token },
        body: JSON.stringify({ fingerprint_hash: fingerprintHash, action, ...extraData }),
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

  async function deleteTrial(fingerprintHash: string) {
    if (!confirm('Delete this trial user? This cannot be undone.')) return;
    setActionLoading(fingerprintHash + 'delete');
    try {
      const res = await fetch('/api/v1/admin/trials', {
        method: 'DELETE',
        headers: { 'Content-Type': 'application/json', 'Authorization': 'Bearer ' + token },
        body: JSON.stringify({ fingerprint_hash: fingerprintHash }),
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

  useEffect(() => {
    fetchTrials();
  }, []);

  function fmtDate(v: string | null | undefined) {
    if (!v) return '-';
    try {
      const d = new Date(v);
      return d.toLocaleString();
    } catch { return v; }
  }

  return (
    <div style={{ fontFamily: 'system-ui, sans-serif' }}>
      {/* Header with Refresh Button */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 20 }}>
        <div>
          <div style={{ fontSize: 14, fontWeight: 600, color: '#111827' }}>Extension Trial Users</div>
          <div style={{ fontSize: 12, color: '#6b7280' }}>Manage free trial usage (50 leads). Reset a user to restore their trial.</div>
        </div>
        <button
          onClick={fetchTrials}
          style={{ padding: '9px 14px', background: '#f3f4f6', border: '1px solid #e5e7eb', borderRadius: 999, fontSize: 13, color: '#374151', cursor: 'pointer' }}
        >
          {loading ? 'Refreshing…' : '🔄 Refresh trials'}
        </button>
      </div>

      {/* Stats Cards */}
      {stats && (
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 16, marginBottom: 20 }}>
          <div style={{ background: '#fff', padding: 16, borderRadius: 12, border: '1px solid #e5e7eb' }}>
            <div style={{ fontSize: 24, fontWeight: 700, color: '#16a34a' }}>{stats.total_users}</div>
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
            <div style={{ fontSize: 24, fontWeight: 700, color: '#8b5cf6' }}>{stats.total_leads_used}</div>
            <div style={{ fontSize: 12, color: '#6b7280' }}>Total Leads Used</div>
          </div>
        </div>
      )}

      {/* Trials Table */}
      <div style={{ borderRadius: 12, border: '1px solid #e5e7eb', overflow: 'hidden', background: '#fff' }}>
        <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 13 }}>
          <thead>
            <tr style={{ textAlign: 'left', background: '#f9fafb', borderBottom: '1px solid #e5e7eb' }}>
              <th style={{ padding: '12px 14px', color: '#6b7280', fontWeight: 600 }}>Fingerprint</th>
              <th style={{ padding: '12px 14px', color: '#6b7280', fontWeight: 600 }}>Leads Used</th>
              <th style={{ padding: '12px 14px', color: '#6b7280', fontWeight: 600 }}>Max</th>
              <th style={{ padding: '12px 14px', color: '#6b7280', fontWeight: 600 }}>Status</th>
              <th style={{ padding: '12px 14px', color: '#6b7280', fontWeight: 600 }}>Last Seen</th>
              <th style={{ padding: '12px 14px', color: '#6b7280', fontWeight: 600 }}>Last IP</th>
              <th style={{ padding: '12px 14px', color: '#6b7280', fontWeight: 600, textAlign: 'right' }}>Actions</th>
            </tr>
          </thead>
          <tbody>
            {trials.length === 0 && (
              <tr><td colSpan={7} style={{ padding: 24, textAlign: 'center', color: '#9ca3af' }}>No trial users tracked yet.</td></tr>
            )}
            {trials.map((trial, index) => {
              const isLocked = trial.is_locked === 1 || trial.leads_used >= trial.max_leads;
              const isLoadingThis = actionLoading?.startsWith(trial.fingerprint_hash);
              const remaining = Math.max(0, trial.max_leads - trial.leads_used);

              return (
                <tr key={trial.id || trial.fingerprint_hash} style={{ borderBottom: '1px solid #f3f4f6', background: index % 2 === 0 ? '#ffffff' : '#f9fafb' }}>
                  <td style={{ padding: '10px 14px' }}>
                    <div style={{ fontWeight: 500, fontSize: 12, fontFamily: 'monospace' }}>
                      {trial.fingerprint_hash?.slice(0, 14)}...{trial.fingerprint_hash?.slice(-6)}
                    </div>
                    {trial.client_browser && (
                      <div style={{ fontSize: 10, color: '#9ca3af' }}>{trial.client_browser} / {trial.client_os || 'Unknown OS'}</div>
                    )}
                  </td>
                  <td style={{ padding: '10px 14px' }}>
                    <span style={{ fontWeight: 600, color: isLocked ? '#dc2626' : '#111827' }}>
                      {trial.leads_used}
                    </span>
                  </td>
                  <td style={{ padding: '10px 14px', color: '#6b7280' }}>
                    {trial.max_leads}
                  </td>
                  <td style={{ padding: '10px 14px' }}>
                    {isLocked ? (
                      <span style={{ display: 'inline-flex', padding: '3px 9px', borderRadius: 999, fontSize: 11, fontWeight: 500, background: 'rgba(220,38,38,0.10)', color: '#b91c1c' }}>
                        🔒 Trial Ended
                      </span>
                    ) : (
                      <span style={{ display: 'inline-flex', padding: '3px 9px', borderRadius: 999, fontSize: 11, fontWeight: 500, background: 'rgba(234,179,8,0.12)', color: '#b45309' }}>
                        Trial ({remaining} left)
                      </span>
                    )}
                  </td>
                  <td style={{ padding: '10px 14px', color: '#4b5563', fontSize: 11 }}>{fmtDate(trial.last_seen_at)}</td>
                  <td style={{ padding: '10px 14px', fontSize: 11, fontFamily: 'monospace', color: '#6b7280' }}>{trial.last_ip || '-'}</td>
                  <td style={{ padding: '10px 14px', textAlign: 'right' }}>
                    <div style={{ display: 'flex', gap: 4, justifyContent: 'flex-end', flexWrap: 'wrap' }}>
                      {/* Reset Trial Button */}
                      <button
                        onClick={() => trialAction(trial.fingerprint_hash, 'reset_trial')}
                        disabled={isLoadingThis}
                        title="Reset trial: Set leads to 0 and unlock"
                        style={{ padding: '4px 8px', borderRadius: 6, border: 'none', background: 'rgba(59,130,246,0.12)', color: '#2563eb', fontSize: 10, fontWeight: 500, cursor: 'pointer', opacity: isLoadingThis ? 0.5 : 1 }}
                      >
                        🔄 Reset
                      </button>

                      {/* Restore Trial Button */}
                      <button
                        onClick={() => {
                          if (confirm("Restore this user's free trial to the default 50 leads?")) {
                            trialAction(trial.fingerprint_hash, 'restore_trial');
                          }
                        }}
                        disabled={isLoadingThis}
                        title="Restore free trial: reset usage + default allowance"
                        style={{ padding: '4px 8px', borderRadius: 6, border: 'none', background: 'rgba(16,185,129,0.12)', color: '#059669', fontSize: 10, fontWeight: 500, cursor: 'pointer', opacity: isLoadingThis ? 0.5 : 1 }}
                      >
                        Restore
                      </button>

                      {/* Add Leads Button */}
                      <button
                        onClick={() => { setShowBonusModal(trial); setBonusLeads(50); }}
                        disabled={isLoadingThis}
                        title="Add bonus leads"
                        style={{ padding: '4px 8px', borderRadius: 6, border: 'none', background: 'rgba(34,197,94,0.12)', color: '#16a34a', fontSize: 10, fontWeight: 500, cursor: 'pointer', opacity: isLoadingThis ? 0.5 : 1 }}
                      >
                        ➕ Add
                      </button>

                      {/* Lock/Unlock Button */}
                      {isLocked ? (
                        <button
                          onClick={() => trialAction(trial.fingerprint_hash, 'unlock')}
                          disabled={isLoadingThis}
                          title="Unlock trial"
                          style={{ padding: '4px 8px', borderRadius: 6, border: 'none', background: 'rgba(34,197,94,0.12)', color: '#16a34a', fontSize: 10, fontWeight: 500, cursor: 'pointer', opacity: isLoadingThis ? 0.5 : 1 }}
                        >
                          🔓 Unlock
                        </button>
                      ) : (
                        <button
                          onClick={() => trialAction(trial.fingerprint_hash, 'lock')}
                          disabled={isLoadingThis}
                          title="Lock trial"
                          style={{ padding: '4px 8px', borderRadius: 6, border: 'none', background: 'rgba(234,179,8,0.12)', color: '#b45309', fontSize: 10, fontWeight: 500, cursor: 'pointer', opacity: isLoadingThis ? 0.5 : 1 }}
                        >
                          🔒 Lock
                        </button>
                      )}

                      {/* Delete Button */}
                      <button
                        onClick={() => deleteTrial(trial.fingerprint_hash)}
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

      {/* Add Bonus Leads Modal */}
      {showBonusModal && (
        <div style={{ position: 'fixed', inset: 0, background: 'rgba(15,23,42,0.45)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 50 }}>
          <div style={{ background: '#ffffff', padding: 20, borderRadius: 12, minWidth: 320, maxWidth: 400, boxShadow: '0 20px 50px rgba(15,23,42,0.35)' }}>
            <h3 style={{ marginTop: 0, marginBottom: 6, fontSize: 18, fontWeight: 600 }}>➕ Add Bonus Leads</h3>
            <p style={{ marginTop: 0, marginBottom: 12, fontSize: 13, color: '#6b7280' }}>
              Add extra leads to this trial user's allowance.
            </p>
            <p style={{ marginTop: 0, marginBottom: 12, fontSize: 13, color: '#374151' }}>
              <strong>Fingerprint:</strong> {showBonusModal.fingerprint_hash?.slice(0, 20)}...
            </p>
            <input
              type="number"
              min="1"
              value={bonusLeads}
              onChange={(e) => setBonusLeads(parseInt(e.target.value) || 0)}
              placeholder="Number of bonus leads"
              style={{ width: '100%', padding: 10, borderRadius: 8, border: '1px solid #e5e7eb', fontSize: 14, marginBottom: 12 }}
            />
            <div style={{ display: 'flex', justifyContent: 'flex-end', gap: 8 }}>
              <button
                onClick={() => { setShowBonusModal(null); setBonusLeads(50); }}
                style={{ padding: '8px 12px', borderRadius: 999, border: '1px solid #e5e7eb', background: '#ffffff', fontSize: 13, color: '#374151', cursor: 'pointer' }}
              >
                Cancel
              </button>
              <button
                disabled={!!actionLoading || bonusLeads < 1}
                onClick={async () => {
                  await trialAction(showBonusModal.fingerprint_hash, 'add_leads', { bonus_leads: bonusLeads });
                  setShowBonusModal(null);
                  setBonusLeads(50);
                }}
                style={{ padding: '8px 12px', borderRadius: 999, border: 'none', background: '#16a34a', color: '#fff', fontSize: 13, cursor: actionLoading ? 'wait' : 'pointer', opacity: !!actionLoading || bonusLeads < 1 ? 0.6 : 1 }}
              >
                {actionLoading ? 'Adding...' : `Add ${bonusLeads} Leads`}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
