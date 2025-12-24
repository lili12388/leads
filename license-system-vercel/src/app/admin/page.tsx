import React from 'react';
import { db, initDatabase } from '@/lib/db';
import AdminTableClient from '@/components/AdminTableClient';

export const dynamic = 'force-dynamic';

export default async function AdminPage({ searchParams }: { searchParams?: { token?: string } }) {
  const token = searchParams?.token || '';

  if (!token || token !== process.env.ADMIN_SECRET) {
    return (
      <html>
        <body style={{ fontFamily: 'system-ui, sans-serif', padding: 40 }}>
          <h2>Admin Login</h2>
          <p>Provide admin token as <code>?token=YOUR_ADMIN_SECRET</code> in the URL.</p>
        </body>
      </html>
    );
  }

  // Authorized - fetch licenses from DB
  await initDatabase();
  let licenses: any[] = [];
  try {
    const res = await db.execute(
      `SELECT l.*, l.license_key_plaintext, (SELECT COUNT(*) FROM activations WHERE license_id = l.id AND is_active = 1) as active_activations,
       (SELECT MAX(last_validated_at) FROM activations WHERE license_id = l.id) as last_used
       FROM licenses l
       ORDER BY l.created_at DESC`
    );
    licenses = res.rows || [];
  } catch (error) {
    console.error('Database query failed:', error);
    return (
      <html>
        <body style={{ fontFamily: 'system-ui, sans-serif', padding: 40 }}>
          <h2>Error</h2>
          <p>Failed to fetch licenses. Please check server logs for details.</p>
        </body>
      </html>
    );
  }

  return (
    <html>
      <head>
        <title>License Admin</title>
      </head>
      <body style={{ fontFamily: 'system-ui, sans-serif', padding: 20 }}>
        <h1>License Admin</h1>
        <p>Logged in as admin. Use with care.</p>
        {/* Render client-side table component for interactivity */}
        <div>
          <AdminTableClient initialLicenses={licenses} token={token} />
        </div>
      </body>
    </html>
  );
}
