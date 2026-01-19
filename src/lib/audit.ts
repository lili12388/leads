import { db, generateId } from './db';

interface AuditLogParams {
  event: string;
  licenseId?: string;
  activationId?: string;
  ip?: string;
  userAgent?: string;
  details?: Record<string, unknown>;
}

export async function logAudit(params: AuditLogParams): Promise<void> {
  try {
    await db.execute({
      sql: `INSERT INTO audit_logs (id, event, license_id, activation_id, ip, user_agent, details_json, created_at) 
            VALUES (?, ?, ?, ?, ?, ?, ?, datetime('now'))`,
      args: [
        generateId(),
        params.event,
        params.licenseId || null,
        params.activationId || null,
        params.ip || null,
        params.userAgent || null,
        JSON.stringify(params.details || {}),
      ],
    });
  } catch (err) {
    console.error('Audit log error:', err);
  }
}

export function getClientIp(request: Request): string {
  const forwarded = request.headers.get('x-forwarded-for');
  if (forwarded) {
    return forwarded.split(',')[0].trim();
  }
  const realIp = request.headers.get('x-real-ip');
  if (realIp) {
    return realIp;
  }
  return '::1';
}

export function getUserAgent(request: Request): string {
  return request.headers.get('user-agent') || 'unknown';
}
