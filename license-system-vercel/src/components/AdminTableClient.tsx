'use client';

import React, { useEffect, useState } from 'react';

export default function AdminTableClient({ initialLicenses = [], token = '' }: { initialLicenses: any[]; token: string; }) {
  const [licenses, setLicenses] = useState(initialLicenses);
  const [loading, setLoading] = useState(false);
  const [showCreate, setShowCreate] = useState(false);
  const [showRevoked, setShowRevoked] = useState(false);
  const [newLicenseKey, setNewLicenseKey] = useState<string | null>(null);
  const [copiedKey, setCopiedKey] = useState(false);
  const [ephemeralKeys, setEphemeralKeys] = useState<Record<string, string>>(() => {
    try {
      const raw = localStorage.getItem('admin_ephemeral_keys');
      return raw ? JSON.parse(raw) : {};
    } catch (e) {
      return {};
    }
  });
  const [form, setForm] = useState({ plan: 'lifetime', max_activations: 1, expires_days: 0, customer_email: '', customer_name: '', notes: '' });
  const [editingMaxActivations, setEditingMaxActivations] = useState<string | null>(null);
  const [newMaxActivations, setNewMaxActivations] = useState<number>(1);
  const [copiedLicenseId, setCopiedLicenseId] = useState<string | null>(null);

  function buildCreatePayload() {
    const maxActivations = Number(form.max_activations);
    if (!Number.isFinite(maxActivations) || maxActivations < 1 || maxActivations > 10) {
      throw new Error('Max Activations must be between 1 and 10');
    }

    const expiresDays = Number(form.expires_days);
    const payload: any = {
      plan: form.plan,
      max_activations: Math.trunc(maxActivations),
    };

    if (Number.isFinite(expiresDays) && expiresDays > 0) payload.expires_days = Math.trunc(expiresDays);

    const email = (form.customer_email || '').trim();
    if (email) payload.customer_email = email;

    const name = (form.customer_name || '').trim();
    if (name) payload.customer_name = name;

    const notes = (form.notes || '').trim();
    if (notes) payload.notes = notes;

    return payload;
  }

  async function refresh() {
    setLoading(true);
    try {
      const res = await fetch('/api/v1/admin/licenses', { headers: { 'Authorization': 'Bearer ' + token } });
      const data = await res.json();
      if (data.success) setLicenses(data.licenses || []);
      else alert('Failed to fetch licenses: ' + (data.error || JSON.stringify(data)));
    } catch (err: any) {
      alert('Refresh failed: ' + (err?.message || err));
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    // keep initial data; optionally refresh
  }, []);

  function fmtDate(v: string | null) {
    if (!v) return '-';
    try {
      const d = new Date(v);
      return d.toLocaleString();
    } catch { return v; }
  }

  async function handleCreate(e: React.FormEvent) {
    e.preventDefault();
    try {
      const payload = buildCreatePayload();
      const res = await fetch('/api/v1/admin/licenses/create', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', 'Authorization': 'Bearer ' + token },
        body: JSON.stringify(payload),
      });
      const data = await res.json();
      if (data.success) {
        // Show the generated license key once (not stored in DB in plaintext)
        setShowCreate(false);
        setNewLicenseKey(data.license_key);
        // Keep the plaintext visible in the table briefly (session-only)
        try {
          const k = String(data.license_key);
          setEphemeralKeys(prev => {
            const next = { ...prev, [data.license_id]: k };
            try { localStorage.setItem('admin_ephemeral_keys', JSON.stringify(next)); } catch (e) {}
            return next;
          });
        } catch (e) {}
        try {
          await navigator.clipboard.writeText(String(data.license_key));
          setCopiedKey(true);
        } catch (e) {
          // clipboard might not be available in some environments
        }
        refresh();
      } else {
        const details = data?.details?.fieldErrors ? JSON.stringify(data.details.fieldErrors) : '';
        alert('Create failed: ' + (data.message || data.error || JSON.stringify(data)) + (details ? '\n' + details : ''));
      }
    } catch (err: any) {
      alert('Create request failed: ' + (err?.message || err));
    }
  }

  async function revoke(id: string) {
    if (!confirm('Revoke license ' + id + '?')) return;
    try {
      const res = await fetch('/api/v1/admin/licenses/revoke', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', 'Authorization': 'Bearer ' + token },
        body: JSON.stringify({ license_id: id })
      });
      const data = await res.json();
      if (data.success || data.ok) {
        alert('Revoked');
        setLicenses(prev => prev.map(l => (l.id === id ? { ...l, status: 'revoked', active_activations: 0 } : l)));
        refresh();
      } else alert('Failed: ' + (data.error || data.message || JSON.stringify(data)));
    } catch (err: any) { alert('Request failed: ' + (err?.message || err)); }
  }

  async function resetActivations(id: string) {
    if (!confirm('Reset activations for ' + id + '?')) return;
    try {
      const res = await fetch('/api/v1/admin/licenses/reset-activations', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', 'Authorization': 'Bearer ' + token },
        body: JSON.stringify({ license_id: id })
      });
      const data = await res.json();
      if (data.success) {
        alert('Activations reset');
        refresh();
      } else alert('Failed: ' + (data.error || data.message || JSON.stringify(data)));
    } catch (err: any) { alert('Request failed: ' + (err?.message || err)); }
  }

  async function updateMaxActivations(id: string, maxActivations: number) {
    try {
      const res = await fetch('/api/v1/admin/licenses/' + id, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json', 'Authorization': 'Bearer ' + token },
        body: JSON.stringify({ max_activations: maxActivations })
      });
      const data = await res.json();
      if (data.success) {
        setEditingMaxActivations(null);
        refresh();
      } else alert('Failed: ' + (data.error || data.message || JSON.stringify(data)));
    } catch (err: any) { alert('Request failed: ' + (err?.message || err)); }
  }

  const visibleLicenses = showRevoked ? licenses : licenses.filter((l: any) => String(l.status || '').toLowerCase() !== 'revoked');

  return (
    <div
      style={{
        padding: 24,
        fontFamily: 'system-ui, sans-serif',
        background: 'rgba(15,23,42,0.02)',
        borderRadius: 16,
        border: '1px solid #e5e7eb',
        boxShadow: '0 18px 45px rgba(15,23,42,0.12)',
      }}
    >
      <div
        style={{
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          marginBottom: 20,
          gap: 16,
        }}
      >
        <div>
          <h2
            style={{
              margin: 0,
              fontSize: 22,
              fontWeight: 600,
              color: '#0f172a',
            }}
          >
            Licenses
          </h2>
          <p
            style={{
              margin: 0,
              marginTop: 4,
              fontSize: 13,
              color: '#6b7280',
            }}
          >
            Create, revoke and reset licenses for your extension.
          </p>
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
          <button
            onClick={() => setShowRevoked(v => !v)}
            style={{
              padding: '9px 14px',
              background: showRevoked ? '#111827' : '#ffffff',
              color: showRevoked ? '#ffffff' : '#374151',
              border: '1px solid #e5e7eb',
              borderRadius: 999,
              fontSize: 13,
              cursor: 'pointer',
              whiteSpace: 'nowrap',
            }}
          >
            {showRevoked ? 'Hide revoked' : 'Show revoked'}
          </button>
          <button
            onClick={() => setShowCreate(true)}
            style={{
              padding: '9px 14px',
              background: '#2563eb',
              color: '#fff',
              border: 'none',
              borderRadius: 999,
              fontSize: 13,
              fontWeight: 500,
              boxShadow: '0 10px 20px rgba(37,99,235,0.35)',
              cursor: 'pointer',
              whiteSpace: 'nowrap',
            }}
          >
            + Add License
          </button>
          <button
            onClick={refresh}
            style={{
              padding: '9px 14px',
              background: '#f3f4f6',
              border: '1px solid #e5e7eb',
              borderRadius: 999,
              fontSize: 13,
              color: '#374151',
              cursor: 'pointer',
              whiteSpace: 'nowrap',
            }}
          >
            {loading ? 'Refreshing…' : 'Refresh'}
          </button>
        </div>
      </div>

      <div
        style={{
          borderRadius: 12,
          border: '1px solid #e5e7eb',
          overflow: 'hidden',
        }}
      >
        <div style={{ overflowX: 'auto' }}>
          <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 13 }}>
            <thead>
              <tr style={{ textAlign: 'left', background: '#f9fafb', borderBottom: '1px solid #e5e7eb' }}>
                <th style={{ padding: '12px 14px', color: '#6b7280', fontWeight: 600 }}>License Key</th>
                <th style={{ padding: '12px 14px', color: '#6b7280', fontWeight: 600 }}>Customer</th>
                <th style={{ padding: '12px 14px', color: '#6b7280', fontWeight: 600 }}>License ID</th>
                <th style={{ padding: '12px 14px', color: '#6b7280', fontWeight: 600 }}>Plan</th>
                <th style={{ padding: '12px 14px', color: '#6b7280', fontWeight: 600 }}>Status</th>
                <th style={{ padding: '12px 14px', color: '#6b7280', fontWeight: 600 }}>Activations (Used/Max)</th>
                <th style={{ padding: '12px 14px', color: '#6b7280', fontWeight: 600 }}>Last Used</th>
                <th style={{ padding: '12px 14px', color: '#6b7280', fontWeight: 600, textAlign: 'right' }}>Actions</th>
              </tr>
            </thead>
            <tbody>
              {visibleLicenses.length === 0 && (
                <tr>
                  <td
                    colSpan={8}
                    style={{
                      padding: 24,
                      textAlign: 'center',
                      color: '#9ca3af',
                    }}
                  >
                    No licenses yet.
                  </td>
                </tr>
              )}
              {visibleLicenses.map((lic: any, index: number) => {
                const status = String(lic.status || '').toLowerCase();
                let statusBg = 'rgba(148,163,184,0.12)';
                let statusColor = '#64748b';
                if (status === 'active') {
                  statusBg = 'rgba(22,163,74,0.12)';
                  statusColor = '#15803d';
                } else if (status === 'revoked') {
                  statusBg = 'rgba(220,38,38,0.10)';
                  statusColor = '#b91c1c';
                } else if (status === 'expired') {
                  statusBg = 'rgba(234,179,8,0.12)';
                  statusColor = '#b45309';
                }

                return (
                  <tr
                    key={lic.id}
                    style={{
                      borderBottom: '1px solid #f3f4f6',
                      background: index % 2 === 0 ? '#ffffff' : '#f9fafb',
                    }}
                  >
                    <td style={{ padding: '10px 14px', fontFamily: 'monospace', color: '#111827' }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                        <code style={{ fontFamily: 'monospace', background: '#f3f4f6', padding: '4px 8px', borderRadius: 6, fontSize: 12, color: '#111827' }}>
                          {ephemeralKeys[lic.id] || lic.license_key_plaintext || ((lic.license_key_hash || '').slice(0, 16) + '…')}
                        </code>
                        {(ephemeralKeys[lic.id] || lic.license_key_plaintext) && (
                          <button
                            onClick={async () => {
                              try {
                                const toCopy = ephemeralKeys[lic.id] || lic.license_key_plaintext;
                                await navigator.clipboard.writeText(String(toCopy));
                                setCopiedLicenseId(lic.id);
                                setTimeout(() => setCopiedLicenseId(null), 2000);
                              } catch (e) {
                                // Copy failed silently
                              }
                            }}
                            style={{ padding: '4px 8px', borderRadius: 6, border: '1px solid #e5e7eb', background: copiedLicenseId === lic.id ? '#22c55e' : '#fff', color: copiedLicenseId === lic.id ? '#fff' : '#000', cursor: 'pointer', fontSize: 11, transition: 'all 0.2s' }}
                          >{copiedLicenseId === lic.id ? 'Copied!' : 'Copy'}</button>
                        )}
                      </div>
                    </td>
                    <td style={{ padding: '10px 14px', color: '#111827' }}>
                      <div style={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
                        {lic.customer_name && (
                          <div style={{ fontWeight: 500, fontSize: 12 }}>{lic.customer_name}</div>
                        )}
                        {lic.customer_email && (
                          <div style={{ fontSize: 11, color: '#6b7280' }}>{lic.customer_email}</div>
                        )}
                        {!lic.customer_name && !lic.customer_email && (
                          <span style={{ fontSize: 11, color: '#9ca3af' }}>-</span>
                        )}
                      </div>
                    </td>
                    <td style={{ padding: '10px 14px', fontFamily: 'monospace', fontSize: 11, color: '#6b7280' }}>
                      {lic.id}
                    </td>
                    <td style={{ padding: '10px 14px', textTransform: 'capitalize', color: '#111827' }}>{lic.plan}</td>
                    <td style={{ padding: '10px 14px' }}>
                      <span
                        style={{
                          display: 'inline-flex',
                          alignItems: 'center',
                          padding: '3px 9px',
                          borderRadius: 999,
                          fontSize: 11,
                          fontWeight: 500,
                          background: statusBg,
                          color: statusColor,
                          textTransform: 'capitalize',
                        }}
                      >
                        {lic.status}
                      </span>
                    </td>
                    <td style={{ padding: '10px 14px', color: '#111827' }}>
                      {editingMaxActivations === lic.id ? (
                        <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                          <input
                            type="number"
                            min={1}
                            max={99}
                            value={newMaxActivations}
                            onChange={e => setNewMaxActivations(Math.min(99, Math.max(1, Number(e.target.value))))}
                            style={{ width: 50, padding: '4px 6px', borderRadius: 6, border: '1px solid #e5e7eb', fontSize: 12 }}
                          />
                          <button
                            onClick={() => updateMaxActivations(lic.id, newMaxActivations)}
                            style={{ padding: '4px 8px', borderRadius: 6, border: 'none', background: '#22c55e', color: '#fff', cursor: 'pointer', fontSize: 11 }}
                          >Save</button>
                          <button
                            onClick={() => setEditingMaxActivations(null)}
                            style={{ padding: '4px 8px', borderRadius: 6, border: '1px solid #e5e7eb', background: '#fff', cursor: 'pointer', fontSize: 11 }}
                          >Cancel</button>
                        </div>
                      ) : (
                        <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                          <span>{lic.active_activations ?? 0} / {lic.max_activations ?? 1}</span>
                          <button
                            onClick={() => { setEditingMaxActivations(lic.id); setNewMaxActivations(lic.max_activations ?? 1); }}
                            style={{ padding: '3px 6px', borderRadius: 4, border: '1px solid #e5e7eb', background: '#fff', cursor: 'pointer', fontSize: 10, color: '#6b7280' }}
                          >Edit</button>
                        </div>
                      )}
                    </td>
                    <td style={{ padding: '10px 14px', color: '#4b5563' }}>{fmtDate(lic.last_used)}</td>
                    <td style={{ padding: '10px 14px', textAlign: 'right', whiteSpace: 'nowrap' }}>
                      <button
                        onClick={() => revoke(lic.id)}
                        style={{
                          marginRight: 8,
                          padding: '6px 11px',
                          borderRadius: 999,
                          border: 'none',
                          background: 'rgba(248,113,113,0.16)',
                          color: '#b91c1c',
                          fontSize: 12,
                          fontWeight: 500,
                          cursor: 'pointer',
                        }}
                      >
                        Revoke
                      </button>
                      <button
                        onClick={() => resetActivations(lic.id)}
                        style={{
                          padding: '6px 11px',
                          borderRadius: 999,
                          border: 'none',
                          background: 'rgba(59,130,246,0.08)',
                          color: '#1d4ed8',
                          fontSize: 12,
                          fontWeight: 500,
                          cursor: 'pointer',
                        }}
                      >
                        Reset
                      </button>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>

      {showCreate && (
        <div
          style={{
            position: 'fixed',
            inset: 0,
            background: 'rgba(15,23,42,0.45)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            zIndex: 40,
          }}
        >
          <form
            onSubmit={handleCreate}
            style={{
              background: '#ffffff',
              padding: 24,
              borderRadius: 16,
              minWidth: 340,
              maxWidth: 420,
              boxShadow: '0 24px 60px rgba(15,23,42,0.35)',
            }}
          >
            <h3
              style={{
                marginTop: 0,
                marginBottom: 12,
                fontSize: 18,
                fontWeight: 600,
                color: '#0f172a',
              }}
            >
              Create License
            </h3>
            <p style={{ marginTop: 0, marginBottom: 16, fontSize: 12, color: '#6b7280' }}>
              Configure a new license key for your customer. You can always revoke or reset it later.
            </p>
            <label style={{ display: 'block', marginBottom: 10, fontSize: 13, color: '#111827' }}>
              Plan
              <select
                value={form.plan}
                onChange={e => setForm({ ...form, plan: e.target.value })}
                style={{
                  display: 'block',
                  width: '100%',
                  marginTop: 6,
                  padding: '7px 9px',
                  borderRadius: 8,
                  border: '1px solid #e5e7eb',
                }}
              >
                <option value="monthly">Monthly</option>
                <option value="yearly">Yearly</option>
                <option value="lifetime">Lifetime</option>
              </select>
            </label>
            <label style={{ display: 'block', marginBottom: 10, fontSize: 13, color: '#111827' }}>
              Max Activations
              <input
                type="number"
                min={1}
                max={10}
                value={form.max_activations}
                onChange={e => setForm({ ...form, max_activations: Math.min(10, Math.max(1, Number(e.target.value))) })}
                style={{
                  display: 'block',
                  width: '100%',
                  marginTop: 6,
                  padding: '7px 9px',
                  borderRadius: 8,
                  border: '1px solid #e5e7eb',
                }}
              />
            </label>
            <label style={{ display: 'block', marginBottom: 10, fontSize: 13, color: '#111827' }}>
              Expire in (days, 0 for default)
              <input
                type="number"
                min={0}
                value={form.expires_days}
                onChange={e => setForm({ ...form, expires_days: Number(e.target.value) })}
                style={{
                  display: 'block',
                  width: '100%',
                  marginTop: 6,
                  padding: '7px 9px',
                  borderRadius: 8,
                  border: '1px solid #e5e7eb',
                }}
              />
            </label>
            <label style={{ display: 'block', marginBottom: 10, fontSize: 13, color: '#111827' }}>
              Customer Email
              <input
                value={form.customer_email}
                onChange={e => setForm({ ...form, customer_email: e.target.value })}
                style={{
                  display: 'block',
                  width: '100%',
                  marginTop: 6,
                  padding: '7px 9px',
                  borderRadius: 8,
                  border: '1px solid #e5e7eb',
                }}
              />
            </label>
            <label style={{ display: 'block', marginBottom: 14, fontSize: 13, color: '#111827' }}>
              Customer Name
              <input
                value={form.customer_name}
                onChange={e => setForm({ ...form, customer_name: e.target.value })}
                style={{
                  display: 'block',
                  width: '100%',
                  marginTop: 6,
                  padding: '7px 9px',
                  borderRadius: 8,
                  border: '1px solid #e5e7eb',
                }}
              />
            </label>
            <div style={{ display: 'flex', justifyContent: 'flex-end', gap: 8, marginTop: 4 }}>
              <button
                type="button"
                onClick={() => setShowCreate(false)}
                style={{
                  padding: '8px 12px',
                  borderRadius: 999,
                  border: '1px solid #e5e7eb',
                  background: '#ffffff',
                  fontSize: 13,
                  color: '#374151',
                  cursor: 'pointer',
                }}
              >
                Cancel
              </button>
              <button
                type="submit"
                style={{
                  padding: '8px 14px',
                  borderRadius: 999,
                  border: 'none',
                  background: '#16a34a',
                  color: '#ffffff',
                  fontSize: 13,
                  fontWeight: 500,
                  cursor: 'pointer',
                  boxShadow: '0 12px 30px rgba(22,163,74,0.4)',
                }}
              >
                Create
              </button>
            </div>
          </form>
        </div>
      )}

      {newLicenseKey && (
        <div
          style={{
            position: 'fixed',
            inset: 0,
            background: 'rgba(15,23,42,0.45)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            zIndex: 50,
          }}
        >
          <div
            style={{
              background: '#ffffff',
              padding: 20,
              borderRadius: 12,
              minWidth: 320,
              maxWidth: 540,
              boxShadow: '0 20px 50px rgba(15,23,42,0.35)',
            }}
          >
            <h3 style={{ marginTop: 0, marginBottom: 6, fontSize: 18, fontWeight: 600 }}>License created</h3>
            <p style={{ marginTop: 0, marginBottom: 12, fontSize: 13, color: '#6b7280' }}>
              This is the only time the plaintext license key will be shown. Copy it now and store it safely.
            </p>
            <div style={{ fontFamily: 'monospace', background: '#f3f4f6', padding: 12, borderRadius: 8, fontSize: 14 }}>
              {newLicenseKey}
            </div>
            <div style={{ display: 'flex', justifyContent: 'flex-end', gap: 8, marginTop: 12 }}>
              <button
                onClick={async () => {
                  try {
                    await navigator.clipboard.writeText(String(newLicenseKey));
                    setCopiedKey(true);
                    setTimeout(() => setCopiedKey(false), 2000);
                  } catch (e) {
                    // Copy failed silently
                  }
                }}
                style={{
                  padding: '8px 12px',
                  borderRadius: 999,
                  border: 'none',
                  background: '#2563eb',
                  color: '#fff',
                  fontSize: 13,
                  cursor: 'pointer',
                }}
              >
                {copiedKey ? 'Copied' : 'Copy key'}
              </button>
              <button
                onClick={() => { setNewLicenseKey(null); setCopiedKey(false); }}
                style={{
                  padding: '8px 12px',
                  borderRadius: 999,
                  border: '1px solid #e5e7eb',
                  background: '#ffffff',
                  fontSize: 13,
                  color: '#374151',
                  cursor: 'pointer',
                }}
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
