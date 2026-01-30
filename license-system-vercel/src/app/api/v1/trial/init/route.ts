import { NextRequest, NextResponse } from 'next/server'
import { db, generateId } from '@/lib/db'

const FREE_LEAD_LIMIT = 50

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { fingerprint_hash, fingerprint_components, extension_id, client } = body || {}

    if (!fingerprint_hash || typeof fingerprint_hash !== 'string' || fingerprint_hash.length < 8) {
      return NextResponse.json({ ok: false, error: 'Invalid fingerprint' }, { status: 400 })
    }

    const ip = request.headers.get('x-forwarded-for')?.split(',')[0]?.trim()
      || request.headers.get('x-real-ip')
      || 'unknown'

    const existing = await db.execute(
      `SELECT * FROM extension_trials WHERE fingerprint_hash = ?`,
      [fingerprint_hash]
    )

    if (existing.rows.length === 0) {
      const id = generateId()
      await db.execute(
        `INSERT INTO extension_trials (
          id, fingerprint_hash, fingerprint_components, extension_id,
          leads_used, max_leads, is_locked, last_ip, client_browser, client_os, client_timezone
        ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
        [
          id,
          fingerprint_hash,
          fingerprint_components ? JSON.stringify(fingerprint_components) : null,
          extension_id || null,
          0,
          FREE_LEAD_LIMIT,
          0,
          ip,
          client?.browser || null,
          client?.os || null,
          client?.timezone || null,
        ]
      )
      return NextResponse.json({
        success: true,
        isNew: true,
        leadsUsed: 0,
        leadsRemaining: FREE_LEAD_LIMIT,
        leadsTotal: FREE_LEAD_LIMIT,
        isLocked: false,
      })
    }

    const trial = existing.rows[0] as any
    const leadsUsed = Number(trial.leads_used || 0)
    const maxLeads = Number(trial.max_leads || FREE_LEAD_LIMIT)
    const isLocked = trial.is_locked === 1 || leadsUsed >= maxLeads

    await db.execute(
      `UPDATE extension_trials 
       SET last_seen_at = datetime('now'),
           last_ip = ?,
           client_browser = COALESCE(?, client_browser),
           client_os = COALESCE(?, client_os),
           client_timezone = COALESCE(?, client_timezone),
           fingerprint_components = COALESCE(?, fingerprint_components)
       WHERE fingerprint_hash = ?`,
      [
        ip,
        client?.browser || null,
        client?.os || null,
        client?.timezone || null,
        fingerprint_components ? JSON.stringify(fingerprint_components) : null,
        fingerprint_hash,
      ]
    )

    return NextResponse.json({
      success: true,
      isNew: false,
      leadsUsed,
      leadsRemaining: Math.max(0, maxLeads - leadsUsed),
      leadsTotal: maxLeads,
      isLocked,
    })
  } catch (error) {
    console.error('Trial init error:', error)
    return NextResponse.json({ ok: false, error: 'Server error' }, { status: 500 })
  }
}

export async function GET(request: NextRequest) {
  try {
    const fingerprint_hash = request.nextUrl.searchParams.get('fingerprint_hash')
    if (!fingerprint_hash || fingerprint_hash.length < 8) {
      return NextResponse.json({ ok: false, error: 'Invalid fingerprint' }, { status: 400 })
    }

    const existing = await db.execute(
      `SELECT * FROM extension_trials WHERE fingerprint_hash = ?`,
      [fingerprint_hash]
    )

    if (existing.rows.length === 0) {
      return NextResponse.json({
        success: true,
        exists: false,
        leadsRemaining: FREE_LEAD_LIMIT,
        leadsTotal: FREE_LEAD_LIMIT,
        isLocked: false,
      })
    }

    const trial = existing.rows[0] as any
    const leadsUsed = Number(trial.leads_used || 0)
    const maxLeads = Number(trial.max_leads || FREE_LEAD_LIMIT)
    const isLocked = trial.is_locked === 1 || leadsUsed >= maxLeads

    return NextResponse.json({
      success: true,
      exists: true,
      leadsUsed,
      leadsRemaining: Math.max(0, maxLeads - leadsUsed),
      leadsTotal: maxLeads,
      isLocked,
      createdAt: trial.created_at,
    })
  } catch (error) {
    console.error('Trial status error:', error)
    return NextResponse.json({ ok: false, error: 'Server error' }, { status: 500 })
  }
}
