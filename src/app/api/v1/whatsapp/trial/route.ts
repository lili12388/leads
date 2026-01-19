import { NextRequest, NextResponse } from 'next/server';
import { db, generateId, initDatabase } from '@/lib/db';
import { logAudit, getClientIp, getUserAgent } from '@/lib/audit';
import { checkRateLimit } from '@/lib/rate-limit';

let dbInitialized = false;

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Methods': 'GET, POST, OPTIONS',
  'Access-Control-Allow-Headers': 'Content-Type, Authorization',
};

export async function OPTIONS() {
  return new NextResponse(null, { status: 200, headers: corsHeaders });
}

// GET: Check trial status by hardware ID
export async function GET(request: NextRequest) {
  const ip = getClientIp(request);

  try {
    if (!dbInitialized) {
      await initDatabase();
      dbInitialized = true;
    }

    const { searchParams } = new URL(request.url);
    const hardwareId = searchParams.get('hardware_id');

    if (!hardwareId) {
      return NextResponse.json(
        { ok: false, code: 'BAD_REQUEST', message: 'hardware_id required' },
        { status: 400, headers: corsHeaders }
      );
    }

    // Rate limit
    const rateLimitResult = await checkRateLimit(`whatsapp-trial:${ip}`, 'activate');
    if (!rateLimitResult.allowed) {
      return NextResponse.json(
        { ok: false, code: 'RATE_LIMITED', message: 'Too many requests' },
        { status: 429, headers: corsHeaders }
      );
    }

    // Check if hardware ID exists
    const result = await db.execute({
      sql: `SELECT * FROM whatsapp_trials WHERE hardware_id = ?`,
      args: [hardwareId],
    });

    // Also handle machine_name and os_info if provided
    const machineName = searchParams.get('machine_name');
    const osInfo = searchParams.get('os_info');

    if (result.rows.length === 0) {
      // New user - create trial record
      const id = generateId();
      await db.execute({
        sql: `INSERT INTO whatsapp_trials (id, hardware_id, messages_sent, max_messages, last_ip, machine_name, os_info)
              VALUES (?, ?, 0, 10, ?, ?, ?)`,
        args: [id, hardwareId, ip, machineName, osInfo],
      });

      return NextResponse.json({
        success: true,
        is_new: true,
        messages_sent: 0,
        remaining_messages: 10,
        max_messages: 10,
        is_locked: false,
        has_license: false,
      }, { headers: corsHeaders });
    }

    const trial = result.rows[0];
    const messagesSent = trial.messages_sent as number;
    const maxMessages = trial.max_messages as number;
    const isLocked = trial.is_locked === 1;
    const hasLicense = !!trial.license_id;

    // Update last seen and machine info
    await db.execute({
      sql: `UPDATE whatsapp_trials 
            SET last_seen_at = datetime('now'), last_ip = ?, 
                machine_name = COALESCE(?, machine_name), 
                os_info = COALESCE(?, os_info) 
            WHERE hardware_id = ?`,
      args: [ip, machineName, osInfo, hardwareId],
    });

    return NextResponse.json({
      success: true,
      is_new: false,
      messages_sent: messagesSent,
      remaining_messages: Math.max(0, maxMessages - messagesSent),
      max_messages: maxMessages,
      is_locked: isLocked || messagesSent >= maxMessages,
      has_license: hasLicense,
    }, { headers: corsHeaders });
  } catch (error) {
    console.error('WhatsApp trial check error:', error);
    return NextResponse.json(
      { success: false, error: 'An unexpected error occurred' },
      { status: 500, headers: corsHeaders }
    );
  }
}

// POST: Increment message count
export async function POST(request: NextRequest) {
  const ip = getClientIp(request);
  const userAgent = getUserAgent(request);

  try {
    if (!dbInitialized) {
      await initDatabase();
      dbInitialized = true;
    }

    const body = await request.json();
    const { hardware_id, machine_name, os_info, increment = 1 } = body;

    if (!hardware_id) {
      return NextResponse.json(
        { ok: false, code: 'BAD_REQUEST', message: 'hardware_id required' },
        { status: 400, headers: corsHeaders }
      );
    }

    // Rate limit
    const rateLimitResult = await checkRateLimit(`whatsapp-trial:${ip}`, 'activate');
    if (!rateLimitResult.allowed) {
      return NextResponse.json(
        { ok: false, code: 'RATE_LIMITED', message: 'Too many requests' },
        { status: 429, headers: corsHeaders }
      );
    }

    // Get or create trial
    let result = await db.execute({
      sql: `SELECT * FROM whatsapp_trials WHERE hardware_id = ?`,
      args: [hardware_id],
    });

    if (result.rows.length === 0) {
      // Create new trial
      const id = generateId();
      await db.execute({
        sql: `INSERT INTO whatsapp_trials (id, hardware_id, messages_sent, max_messages, last_ip, machine_name, os_info)
              VALUES (?, ?, 0, 10, ?, ?, ?)`,
        args: [id, hardware_id, ip, machine_name || null, os_info || null],
      });
      
      result = await db.execute({
        sql: `SELECT * FROM whatsapp_trials WHERE hardware_id = ?`,
        args: [hardware_id],
      });
    }

    const trial = result.rows[0];
    
    // Check if has license (unlimited)
    if (trial.license_id) {
      // Increment anyway for statistics
      await db.execute({
        sql: `UPDATE whatsapp_trials 
              SET messages_sent = messages_sent + ?,
                  last_seen_at = datetime('now'), 
                  last_ip = ?,
                  machine_name = COALESCE(?, machine_name),
                  os_info = COALESCE(?, os_info),
                  updated_at = datetime('now')
              WHERE hardware_id = ?`,
        args: [increment, ip, machine_name, os_info, hardware_id],
      });

      return NextResponse.json({
        success: true,
        messages_sent: (trial.messages_sent as number) + increment,
        remaining_messages: -1, // Unlimited
        max_messages: -1,
        is_locked: false,
        has_license: true,
      }, { headers: corsHeaders });
    }

    const currentSent = trial.messages_sent as number;
    const maxMessages = trial.max_messages as number;

    // Check if already locked
    if (trial.is_locked === 1 || currentSent >= maxMessages) {
      return NextResponse.json({
        success: false,
        error: 'Free trial ended. Please purchase a license.',
        messages_sent: currentSent,
        remaining_messages: 0,
        max_messages: maxMessages,
        is_locked: true,
        has_license: false,
      }, { status: 403, headers: corsHeaders });
    }

    // Increment count
    const newCount = currentSent + increment;
    const isNowLocked = newCount >= maxMessages;

    await db.execute({
      sql: `UPDATE whatsapp_trials 
            SET messages_sent = ?, 
                is_locked = ?,
                last_seen_at = datetime('now'), 
                last_ip = ?,
                machine_name = COALESCE(?, machine_name),
                os_info = COALESCE(?, os_info),
                updated_at = datetime('now')
            WHERE hardware_id = ?`,
      args: [newCount, isNowLocked ? 1 : 0, ip, machine_name, os_info, hardware_id],
    });

    await logAudit({
      event: 'WHATSAPP_MESSAGE_SENT',
      ip,
      userAgent,
      details: { hardware_id, messages_sent: newCount, is_locked: isNowLocked },
    });

    return NextResponse.json({
      success: true,
      messages_sent: newCount,
      remaining_messages: Math.max(0, maxMessages - newCount),
      max_messages: maxMessages,
      is_locked: isNowLocked,
      has_license: false,
    }, { headers: corsHeaders });
  } catch (error) {
    console.error('WhatsApp trial increment error:', error);
    return NextResponse.json(
      { success: false, error: 'An unexpected error occurred' },
      { status: 500, headers: corsHeaders }
    );
  }
}
