import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'

const FREE_LEAD_LIMIT = 50

function isAuthorized(request: NextRequest) {
  const authHeader = request.headers.get('Authorization') || ''
  if (!authHeader.startsWith('Bearer ')) return false
  const token = authHeader.replace('Bearer ', '').trim()
  return token && token === process.env.ADMIN_SECRET
}

// GET: List all extension trial users with stats
export async function GET(request: NextRequest) {
  try {
    if (!isAuthorized(request)) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const url = new URL(request.url)
    const limit = Math.max(1, Math.min(Number(url.searchParams.get('limit') || 200), 1000))

    // Get all trials
    const res = await db.execute(
      `SELECT * FROM extension_trials ORDER BY last_seen_at DESC LIMIT ?`,
      [limit]
    )

    // Get stats
    const statsResult = await db.execute(
      `SELECT 
        COUNT(*) as total_users,
        0 as licensed_users,
        SUM(CASE WHEN is_locked = 1 OR leads_used >= max_leads THEN 1 ELSE 0 END) as locked_users,
        SUM(leads_used) as total_leads_used
       FROM extension_trials`
    )

    const stats = statsResult.rows[0] || {
      total_users: 0,
      licensed_users: 0,
      locked_users: 0,
      total_leads_used: 0,
    }

    return NextResponse.json({
      success: true,
      leadsTotal: FREE_LEAD_LIMIT,
      trials: res.rows || [],
      stats,
    })
  } catch (error) {
    console.error('Admin trials list error:', error)
    return NextResponse.json({ error: 'Server error' }, { status: 500 })
  }
}

// POST: Manage trial user (reset, restore, add leads, lock, unlock, etc.)
export async function POST(request: NextRequest) {
  try {
    if (!isAuthorized(request)) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const body = await request.json()
    const { action, fingerprint_hash, trial_id } = body || {}

    // Identify trial by fingerprint_hash or trial_id
    const identifier = fingerprint_hash || trial_id
    if (!identifier || typeof identifier !== 'string' || identifier.length < 8) {
      return NextResponse.json({ error: 'Invalid fingerprint or trial_id' }, { status: 400 })
    }

    const whereClause = fingerprint_hash ? 'fingerprint_hash = ?' : 'id = ?'

    switch (action) {
      case 'reset_trial': {
        // Reset leads_used to 0 and unlock
        await db.execute(
          `UPDATE extension_trials 
           SET leads_used = 0, is_locked = 0, updated_at = datetime('now')
           WHERE ${whereClause}`,
          [identifier]
        )
        return NextResponse.json({ success: true, message: 'Trial reset successfully' })
      }

      case 'restore_trial': {
        // Restore free trial to default allowance and unlock
        await db.execute(
          `UPDATE extension_trials 
           SET leads_used = 0, max_leads = ?, is_locked = 0, updated_at = datetime('now')
           WHERE ${whereClause}`,
          [FREE_LEAD_LIMIT, identifier]
        )
        return NextResponse.json({ success: true, message: 'Trial restored successfully' })
      }

      case 'unlock': {
        // Just unlock without resetting leads
        await db.execute(
          `UPDATE extension_trials SET is_locked = 0, updated_at = datetime('now') WHERE ${whereClause}`,
          [identifier]
        )
        return NextResponse.json({ success: true, message: 'Trial unlocked successfully' })
      }

      case 'lock': {
        // Lock the trial
        await db.execute(
          `UPDATE extension_trials SET is_locked = 1, updated_at = datetime('now') WHERE ${whereClause}`,
          [identifier]
        )
        return NextResponse.json({ success: true, message: 'Trial locked successfully' })
      }

      case 'set_max_leads': {
        // Update max leads limit
        const { max_leads } = body
        if (typeof max_leads !== 'number' || max_leads < 0) {
          return NextResponse.json({ error: 'max_leads must be a positive number' }, { status: 400 })
        }
        await db.execute(
          `UPDATE extension_trials SET max_leads = ?, updated_at = datetime('now') WHERE ${whereClause}`,
          [max_leads, identifier]
        )
        return NextResponse.json({ success: true, message: `Max leads set to ${max_leads}` })
      }

      case 'add_leads': {
        // Add bonus leads
        const { bonus_leads } = body
        if (typeof bonus_leads !== 'number' || bonus_leads <= 0) {
          return NextResponse.json({ error: 'bonus_leads must be a positive number' }, { status: 400 })
        }
        await db.execute(
          `UPDATE extension_trials 
           SET max_leads = max_leads + ?, is_locked = 0, updated_at = datetime('now')
           WHERE ${whereClause}`,
          [bonus_leads, identifier]
        )
        return NextResponse.json({ success: true, message: `Added ${bonus_leads} bonus leads` })
      }

      default:
        return NextResponse.json({ error: `Unknown action: ${action}` }, { status: 400 })
    }
  } catch (error) {
    console.error('Admin trial action error:', error)
    return NextResponse.json({ error: 'Server error' }, { status: 500 })
  }
}

// DELETE: Delete a trial user record
export async function DELETE(request: NextRequest) {
  try {
    if (!isAuthorized(request)) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const body = await request.json()
    const { fingerprint_hash, trial_id } = body || {}

    const identifier = fingerprint_hash || trial_id
    if (!identifier || typeof identifier !== 'string' || identifier.length < 8) {
      return NextResponse.json({ error: 'Invalid fingerprint or trial_id' }, { status: 400 })
    }

    const whereClause = fingerprint_hash ? 'fingerprint_hash = ?' : 'id = ?'
    await db.execute(`DELETE FROM extension_trials WHERE ${whereClause}`, [identifier])

    return NextResponse.json({ success: true, message: 'Trial user deleted' })
  } catch (error) {
    console.error('Delete extension trial error:', error)
    return NextResponse.json({ error: 'Server error' }, { status: 500 })
  }
}
