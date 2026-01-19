import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { hashLicenseKey } from '@/lib/crypto';

// GET single license details with activations
export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    // Verify admin auth
    const authHeader = request.headers.get('authorization');
    if (!authHeader?.startsWith('Bearer ')) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }
    
    const token = authHeader.slice(7);
    if (token !== process.env.ADMIN_SECRET) {
      return NextResponse.json({ error: 'Invalid admin token' }, { status: 401 });
    }

    const licenseId = params.id;

    // Get license
    const licenseResult = await db.execute(
      'SELECT * FROM licenses WHERE id = ?',
      [licenseId]
    );

    if (licenseResult.rows.length === 0) {
      return NextResponse.json({ error: 'License not found' }, { status: 404 });
    }

    // Get activations for this license
    const activationsResult = await db.execute(
      'SELECT * FROM activations WHERE license_id = ? ORDER BY created_at DESC',
      [licenseId]
    );

    return NextResponse.json({
      success: true,
      license: licenseResult.rows[0],
      activations: activationsResult.rows
    });

  } catch (error) {
    console.error('Get license error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

// PATCH - Update license properties
export async function PATCH(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    // Verify admin auth
    const authHeader = request.headers.get('authorization');
    if (!authHeader?.startsWith('Bearer ')) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }
    
    const token = authHeader.slice(7);
    if (token !== process.env.ADMIN_SECRET) {
      return NextResponse.json({ error: 'Invalid admin token' }, { status: 401 });
    }

    const licenseId = params.id;
    const body = await request.json();
    const { status, max_activations, customer_email, customer_name, notes, plan, expires_at } = body;

    // Build update query
    const updates: string[] = [];
    const args: any[] = [];

    if (status !== undefined) {
      updates.push('status = ?');
      args.push(status);
    }
    if (max_activations !== undefined) {
      updates.push('max_activations = ?');
      args.push(max_activations);
    }
    if (customer_email !== undefined) {
      updates.push('customer_email = ?');
      args.push(customer_email);
    }
    if (customer_name !== undefined) {
      updates.push('customer_name = ?');
      args.push(customer_name);
    }
    if (notes !== undefined) {
      updates.push('notes = ?');
      args.push(notes);
    }
    if (plan !== undefined) {
      updates.push('plan = ?');
      args.push(plan);
    }
    if (expires_at !== undefined) {
      updates.push('expires_at = ?');
      args.push(expires_at);
    }

    if (updates.length === 0) {
      return NextResponse.json({ error: 'No fields to update' }, { status: 400 });
    }

    updates.push('updated_at = datetime("now")');
    args.push(licenseId);

    await db.execute(
      `UPDATE licenses SET ${updates.join(', ')} WHERE id = ?`,
      args
    );

    // Get updated license
    const result = await db.execute(
      'SELECT * FROM licenses WHERE id = ?',
      [licenseId]
    );

    return NextResponse.json({
      success: true,
      license: result.rows[0]
    });

  } catch (error) {
    console.error('Update license error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

// DELETE - Delete license entirely
export async function DELETE(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    // Verify admin auth
    const authHeader = request.headers.get('authorization');
    if (!authHeader?.startsWith('Bearer ')) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }
    
    const token = authHeader.slice(7);
    if (token !== process.env.ADMIN_SECRET) {
      return NextResponse.json({ error: 'Invalid admin token' }, { status: 401 });
    }

    const licenseId = params.id;

    // Delete activations first
    await db.execute(
      'DELETE FROM activations WHERE license_id = ?',
      [licenseId]
    );

    // Delete license
    await db.execute(
      'DELETE FROM licenses WHERE id = ?',
      [licenseId]
    );

    return NextResponse.json({
      success: true,
      message: 'License deleted successfully'
    });

  } catch (error) {
    console.error('Delete license error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
