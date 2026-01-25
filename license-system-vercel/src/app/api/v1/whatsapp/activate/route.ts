import { NextRequest, NextResponse } from 'next/server';
import { db, generateId, initDatabase } from '@/lib/db';
import { hashLicenseKey } from '@/lib/crypto';
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

// POST: Activate a license for WhatsApp Sender
export async function POST(request: NextRequest) {
  const ip = getClientIp(request);
  const userAgent = getUserAgent(request);

  try {
    if (!dbInitialized) {
      await initDatabase();
      dbInitialized = true;
    }

    const body = await request.json();
    const { license_key, hardware_id, machine_name, os_info } = body;

    if (!license_key || !hardware_id) {
      return NextResponse.json(
        { success: false, message: 'license_key and hardware_id required' },
        { status: 400, headers: corsHeaders }
      );
    }

    // Rate limit
    const rateLimitResult = await checkRateLimit(`whatsapp-activate:${ip}`, 'activate');
    if (!rateLimitResult.allowed) {
      return NextResponse.json(
        { success: false, message: 'Too many requests' },
        { status: 429, headers: corsHeaders }
      );
    }

    const licenseKeyHash = hashLicenseKey(license_key);

    // Find license in whatsapp_licenses table
    const licenseResult = await db.execute({
      sql: `SELECT * FROM whatsapp_licenses WHERE license_key_hash = ?`,
      args: [licenseKeyHash],
    });

    if (licenseResult.rows.length === 0) {
      await logAudit({ 
        event: 'WHATSAPP_ACTIVATE_FAIL', 
        ip, 
        userAgent, 
        details: { reason: 'License not found', hardware_id } 
      });
      return NextResponse.json(
        { success: false, message: 'Invalid license key' },
        { status: 404, headers: corsHeaders }
      );
    }

    const license = licenseResult.rows[0];

    // Check license status
    if (license.status === 'revoked') {
      await logAudit({ 
        event: 'WHATSAPP_ACTIVATE_FAIL', 
        licenseId: license.id as string, 
        ip, 
        userAgent, 
        details: { reason: 'License revoked' } 
      });
      return NextResponse.json(
        { success: false, message: 'License has been revoked' },
        { status: 403, headers: corsHeaders }
      );
    }

    // Check expiry
    if (license.expires_at && new Date(license.expires_at as string) < new Date()) {
      await logAudit({ 
        event: 'WHATSAPP_ACTIVATE_FAIL', 
        licenseId: license.id as string, 
        ip, 
        userAgent, 
        details: { reason: 'License expired' } 
      });
      return NextResponse.json(
        { success: false, message: 'License has expired' },
        { status: 403, headers: corsHeaders }
      );
    }

    // Check existing activations
    const activationsResult = await db.execute({
      sql: `SELECT * FROM whatsapp_activations WHERE license_id = ? AND is_active = 1`,
      args: [license.id],
    });

    // Check if this hardware is already activated
    const existingActivation = activationsResult.rows.find(
      (a) => a.hardware_id === hardware_id
    );

    if (existingActivation) {
      // Already activated - update last validated
      await db.execute({
        sql: `UPDATE whatsapp_activations SET last_validated_at = datetime('now'), last_ip = ? WHERE id = ?`,
        args: [ip, existingActivation.id],
      });

      // Update trial to have license
      await db.execute({
        sql: `UPDATE whatsapp_trials 
              SET license_id = ?, is_locked = 0, updated_at = datetime('now')
              WHERE hardware_id = ?`,
        args: [license.id, hardware_id],
      });

      return NextResponse.json({
        success: true,
        message: 'License already activated on this device',
        license: {
          id: license.id,
          status: 'active',
          activated_at: existingActivation.created_at,
        },
      }, { headers: corsHeaders });
    }

    // Check max activations
    if (activationsResult.rows.length >= (license.max_activations as number)) {
      await logAudit({ 
        event: 'WHATSAPP_ACTIVATE_FAIL', 
        licenseId: license.id as string, 
        ip, 
        userAgent, 
        details: { reason: 'Max activations reached' } 
      });
      return NextResponse.json(
        { success: false, message: 'Maximum activations reached (' + license.max_activations + ' devices)' },
        { status: 403, headers: corsHeaders }
      );
    }

    // Create new activation
    const activationId = generateId();
    await db.execute({
      sql: `INSERT INTO whatsapp_activations (id, license_id, hardware_id, last_validated_at, last_ip, machine_name, os_info)
            VALUES (?, ?, ?, datetime('now'), ?, ?, ?)`,
      args: [activationId, license.id, hardware_id, ip, machine_name || null, os_info || null],
    });

    // Update or create trial record with license
    const trialResult = await db.execute({
      sql: `SELECT * FROM whatsapp_trials WHERE hardware_id = ?`,
      args: [hardware_id],
    });

    if (trialResult.rows.length === 0) {
      // Create trial with license
      const trialId = generateId();
      await db.execute({
        sql: `INSERT INTO whatsapp_trials (id, hardware_id, messages_sent, max_messages, is_locked, license_id, license_activated_at, last_ip, machine_name, os_info)
              VALUES (?, ?, 0, 10, 0, ?, datetime('now'), ?, ?, ?)`,
        args: [trialId, hardware_id, license.id, ip, machine_name || null, os_info || null],
      });
    } else {
      // Update existing trial with license
      await db.execute({
        sql: `UPDATE whatsapp_trials 
              SET license_id = ?, license_activated_at = datetime('now'), is_locked = 0, updated_at = datetime('now')
              WHERE hardware_id = ?`,
        args: [license.id, hardware_id],
      });
    }

    await logAudit({
      event: 'WHATSAPP_ACTIVATE',
      licenseId: license.id as string,
      activationId,
      ip,
      userAgent,
      details: { hardware_id, machine_name, current_activations: activationsResult.rows.length + 1 },
    });

    return NextResponse.json({
      success: true,
      message: 'License activated successfully',
      license: {
        id: license.id,
        status: 'active',
        max_activations: license.max_activations,
        current_activations: activationsResult.rows.length + 1,
      },
    }, { headers: corsHeaders });
  } catch (error) {
    console.error('WhatsApp activate error:', error);
    return NextResponse.json(
      { success: false, message: 'An unexpected error occurred' },
      { status: 500, headers: corsHeaders }
    );
  }
}
