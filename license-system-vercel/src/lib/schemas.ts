import { z } from 'zod';

// ===========================================
// CLIENT INFO SCHEMA
// ===========================================

export const ClientInfoSchema = z.object({
  browser: z.string().min(1).max(50).optional().default('other'),
  os: z.string().min(1).max(50).optional().default('other'),
  app_version: z.string().max(20).optional().default('1.0.0'),
  timezone: z.string().max(100).optional().default('UTC'),
  lang: z.string().max(10).optional().default('en'),
});

// ===========================================
// ACTIVATE REQUEST/RESPONSE
// ===========================================

export const ActivateRequestSchema = z.object({
  license_key: z.string()
    .min(10)
    .max(50)
    .regex(/^LIC-[A-Z0-9]{4}-[A-Z0-9]{4}-[A-Z0-9]{4}-[A-Z0-9]{4}$/i, 
      'License key must be in format LIC-XXXX-XXXX-XXXX-XXXX'),
  extension_id: z.string().min(1).max(100),
  fingerprint_hash: z.string().min(8).max(128),
  client: ClientInfoSchema.optional().default({}),
});

export type ActivateRequest = z.infer<typeof ActivateRequestSchema>;

export interface ActivateResponse {
  ok: true;
  token: string;
  expires_at: string; // ISO date
  grace_seconds: number;
  plan: string;
  max_activations: number;
}

// ===========================================
// VALIDATE REQUEST/RESPONSE
// ===========================================

export const ValidateRequestSchema = z.object({
  token: z.string().min(50),
  extension_id: z.string().min(10).max(100),
  fingerprint_hash: z.string().length(64, 'Fingerprint hash must be SHA256 (64 chars)'),
});

export type ValidateRequest = z.infer<typeof ValidateRequestSchema>;

export interface ValidateResponse {
  ok: true;
  valid: true;
  refresh_token?: string;
  expires_at?: string;
  reason: null;
}

// ===========================================
// ADMIN SCHEMAS
// ===========================================

export const CreateLicenseSchema = z.object({
  plan: z.enum(['monthly', 'yearly', 'lifetime']).default('lifetime'),
  max_activations: z.number().int().min(1).max(10).default(1),
  expires_days: z.number().int().min(1).max(3650).optional(), // Days until expiry
  customer_email: z.string().email().optional(),
  customer_name: z.string().max(200).optional(),
  notes: z.string().max(1000).optional(),
});

// Alias for routes that use camelCase import
export const createLicenseSchema = CreateLicenseSchema;

export type CreateLicenseRequest = z.infer<typeof CreateLicenseSchema>;

export const RevokeLicenseSchema = z.object({
  license_key: z.string().min(10).max(50),
  reason: z.string().max(500).optional(),
});

export type RevokeLicenseRequest = z.infer<typeof RevokeLicenseSchema>;

export const ResetActivationsSchema = z.object({
  license_key: z.string().min(10).max(50),
  slot_index: z.number().int().min(0).optional(), // If omitted, reset all
});

export type ResetActivationsRequest = z.infer<typeof ResetActivationsSchema>;

export const LicenseStatusQuerySchema = z.object({
  license_key: z.string().min(10).max(50),
});

export const AuditQuerySchema = z.object({
  license_key: z.string().min(10).max(50).optional(),
  limit: z.coerce.number().int().min(1).max(100).default(50),
  offset: z.coerce.number().int().min(0).default(0),
});

// ===========================================
// ERROR RESPONSE
// ===========================================

export interface ErrorResponse {
  ok: false;
  code: ErrorCode;
  message: string;
  retry_after: number;
}

export type ErrorCode =
  | 'LICENSE_NOT_FOUND'
  | 'LICENSE_REVOKED'
  | 'LICENSE_EXPIRED'
  | 'LICENSE_MAX_ACTIVATIONS_REACHED'
  | 'DEVICE_MISMATCH'
  | 'FINGERPRINT_MISMATCH'
  | 'TOKEN_INVALID'
  | 'TOKEN_EXPIRED'
  | 'RATE_LIMITED'
  | 'BAD_REQUEST'
  | 'UNAUTHORIZED'
  | 'INTERNAL_ERROR';

export function errorResponse(
  code: ErrorCode,
  message: string,
  retryAfter: number = 0
): ErrorResponse {
  return {
    ok: false,
    code,
    message,
    retry_after: retryAfter,
  };
}

// ===========================================
// TYPE GUARDS
// ===========================================

export function isActivateRequest(data: unknown): data is ActivateRequest {
  return ActivateRequestSchema.safeParse(data).success;
}

export function isValidateRequest(data: unknown): data is ValidateRequest {
  return ValidateRequestSchema.safeParse(data).success;
}
