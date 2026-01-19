import { NextResponse } from 'next/server';

export async function GET() {
  return NextResponse.json({
    name: 'Extension License System',
    version: '1.0.0',
    status: 'operational',
    endpoints: {
      public: {
        activate: 'POST /api/v1/license/activate',
        validate: 'POST /api/v1/license/validate',
      },
      admin: {
        createLicense: 'POST /api/v1/admin/licenses/create',
        listLicenses: 'GET /api/v1/admin/licenses/create',
        revokeLicense: 'POST /api/v1/admin/licenses/revoke',
        resetActivations: 'POST /api/v1/admin/licenses/reset-activations',
        deactivate: 'POST /api/v1/admin/licenses/deactivate',
        licenseStatus: 'GET /api/v1/admin/licenses/[id]/status',
        auditLog: 'GET /api/v1/admin/licenses/[id]/audit',
        stats: 'GET /api/v1/admin/stats',
      },
    },
    documentation: '/README.md',
  });
}
