import { NextRequest, NextResponse } from 'next/server';
import { db, initDatabase } from '@/lib/db';
import { checkRateLimit } from '@/lib/rate-limit';
import { getClientIp } from '@/lib/audit';

const ADMIN_SECRET = process.env.ADMIN_SECRET;

function verifyAdminAuth(request: NextRequest): boolean {
  if (!ADMIN_SECRET) return false;
  const authHeader = request.headers.get('authorization');
  if (!authHeader) return false;
  const [type, token] = authHeader.split(' ');
  return type === 'Bearer' && token === ADMIN_SECRET;
}

let dbInitialized = false;

async function ensureDbInit() {
  if (!dbInitialized) {
    await initDatabase();
    dbInitialized = true;
  }
}

// GET: List all WhatsApp trial users
export async function GET(request: NextRequest) {
  const ip = getClientIp(request);

  if (!verifyAdminAuth(request)) {
    return NextResponse.json(
      { error: 'UNAUTHORIZED', message: 'Invalid or missing admin credentials' },
      { status: 401 }
    );
  }

  try {
    await ensureDbInit();

    const rateLimitResult = await checkRateLimit(`admin:${ip}`, 'admin');
    if (!rateLimitResult.allowed) {
      return NextResponse.json(
        { error: 'RATE_LIMITED', message: 'Too many requests' },
        { status: 429 }
      );
    }

    // Get all trials
    const result = await db.execute(
      `SELECT t.*, l.customer_email as license_email, l.customer_name as license_customer
       FROM whatsapp_trials t
       LEFT JOIN whatsapp_licenses l ON t.license_id = l.id
       ORDER BY t.last_seen_at DESC`
    );

    // Get stats
    const statsResult = await db.execute(
      `SELECT 
        COUNT(*) as total_users,
        SUM(CASE WHEN license_id IS NOT NULL THEN 1 ELSE 0 END) as licensed_users,
        SUM(CASE WHEN is_locked = 1 AND license_id IS NULL THEN 1 ELSE 0 END) as locked_users,
        SUM(messages_sent) as total_messages_sent
       FROM whatsapp_trials`
    );

    const stats = statsResult.rows[0] || {
      total_users: 0,
      licensed_users: 0,
      locked_users: 0,
      total_messages_sent: 0,
    };

    return NextResponse.json({
      success: true,
      trials: result.rows || [],
      stats,
    });
  } catch (error) {
    console.error('List WhatsApp trials error:', error);
    return NextResponse.json(
      { error: 'INTERNAL_ERROR', message: 'An unexpected error occurred' },
      { status: 500 }
    );
  }
}

// POST: Manage trial user (reset, update max messages, unlock, etc.)
export async function POST(request: NextRequest) {
  const ip = getClientIp(request);

  if (!verifyAdminAuth(request)) {
    return NextResponse.json(
      { error: 'UNAUTHORIZED', message: 'Invalid or missing admin credentials' },
      { status: 401 }
    );
  }

  try {
    await ensureDbInit();

    const rateLimitResult = await checkRateLimit(`admin:${ip}`, 'admin');
    if (!rateLimitResult.allowed) {
      return NextResponse.json(
        { error: 'RATE_LIMITED', message: 'Too many requests' },
        { status: 429 }
      );
    }

    const body = await request.json();
    const { action, trial_id, hardware_id } = body;

    // Identify trial by ID or hardware_id
    const identifier = trial_id || hardware_id;
    if (!identifier) {
      return NextResponse.json(
        { error: 'INVALID_REQUEST', message: 'trial_id or hardware_id is required' },
        { status: 400 }
      );
    }

    const whereClause = trial_id ? 'id = ?' : 'hardware_id = ?';

    switch (action) {
      case 'reset_trial': {
        // Reset messages_sent to 0 and unlock
        await db.execute(
          `UPDATE whatsapp_trials SET messages_sent = 0, is_locked = 0 WHERE ${whereClause}`,
          [identifier]
        );
        return NextResponse.json({ success: true, message: 'Trial reset successfully' });
      }

      case 'restore_trial': {
        // Restore free trial to default allowance and unlock
        const defaultMax = 10;
        await db.execute(
          `UPDATE whatsapp_trials 
           SET messages_sent = 0, max_messages = ?, is_locked = 0, license_id = NULL 
           WHERE ${whereClause}`,
          [defaultMax, identifier]
        );
        return NextResponse.json({ success: true, message: 'Trial restored successfully' });
      }

      case 'unlock': {
        // Just unlock without resetting messages
        await db.execute(
          `UPDATE whatsapp_trials SET is_locked = 0 WHERE ${whereClause}`,
          [identifier]
        );
        return NextResponse.json({ success: true, message: 'Trial unlocked successfully' });
      }

      case 'lock': {
        // Lock the trial
        await db.execute(
          `UPDATE whatsapp_trials SET is_locked = 1 WHERE ${whereClause}`,
          [identifier]
        );
        return NextResponse.json({ success: true, message: 'Trial locked successfully' });
      }

      case 'set_max_messages': {
        // Update max messages limit
        const { max_messages } = body;
        if (typeof max_messages !== 'number' || max_messages < 0) {
          return NextResponse.json(
            { error: 'INVALID_REQUEST', message: 'max_messages must be a positive number' },
            { status: 400 }
          );
        }
        await db.execute(
          `UPDATE whatsapp_trials SET max_messages = ? WHERE ${whereClause}`,
          [max_messages, identifier]
        );
        return NextResponse.json({ success: true, message: `Max messages set to ${max_messages}` });
      }

      case 'add_messages': {
        // Add bonus messages
        const { bonus_messages } = body;
        if (typeof bonus_messages !== 'number' || bonus_messages <= 0) {
          return NextResponse.json(
            { error: 'INVALID_REQUEST', message: 'bonus_messages must be a positive number' },
            { status: 400 }
          );
        }
        await db.execute(
          `UPDATE whatsapp_trials SET max_messages = max_messages + ?, is_locked = 0 WHERE ${whereClause}`,
          [bonus_messages, identifier]
        );
        return NextResponse.json({ success: true, message: `Added ${bonus_messages} bonus messages` });
      }

      case 'unlink_license': {
        // Remove license association
        await db.execute(
          `UPDATE whatsapp_trials SET license_id = NULL WHERE ${whereClause}`,
          [identifier]
        );
        return NextResponse.json({ success: true, message: 'License unlinked from trial' });
      }

      default:
        return NextResponse.json(
          { error: 'INVALID_REQUEST', message: `Unknown action: ${action}` },
          { status: 400 }
        );
    }
  } catch (error) {
    console.error('Manage WhatsApp trial error:', error);
    return NextResponse.json(
      { error: 'INTERNAL_ERROR', message: 'An unexpected error occurred' },
      { status: 500 }
    );
  }
}

// DELETE: Delete a trial user record
export async function DELETE(request: NextRequest) {
  const ip = getClientIp(request);

  if (!verifyAdminAuth(request)) {
    return NextResponse.json(
      { error: 'UNAUTHORIZED', message: 'Invalid or missing admin credentials' },
      { status: 401 }
    );
  }

  try {
    await ensureDbInit();

    const rateLimitResult = await checkRateLimit(`admin:${ip}`, 'admin');
    if (!rateLimitResult.allowed) {
      return NextResponse.json(
        { error: 'RATE_LIMITED', message: 'Too many requests' },
        { status: 429 }
      );
    }

    const body = await request.json();
    const { trial_id, hardware_id } = body;

    const identifier = trial_id || hardware_id;
    if (!identifier) {
      return NextResponse.json(
        { error: 'INVALID_REQUEST', message: 'trial_id or hardware_id is required' },
        { status: 400 }
      );
    }

    const whereClause = trial_id ? 'id = ?' : 'hardware_id = ?';
    await db.execute(`DELETE FROM whatsapp_trials WHERE ${whereClause}`, [identifier]);

    return NextResponse.json({ success: true, message: 'Trial user deleted' });
  } catch (error) {
    console.error('Delete WhatsApp trial error:', error);
    return NextResponse.json(
      { error: 'INTERNAL_ERROR', message: 'An unexpected error occurred' },
      { status: 500 }
    );
  }
}
