import { NextRequest, NextResponse } from 'next/server'

// Use the shared global data store (declared in track/route.ts)
// For production, use Vercel KV, Supabase, or MongoDB

if (!global.referralConversions) {
  global.referralConversions = []
}

// Conversion management (for admin)
export async function POST(request: NextRequest) {
  try {
    const { code, visitId, adminKey } = await request.json()
    
    // Verify admin
    if (adminKey !== process.env.ADMIN_SECRET) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const conversion = {
      id: `c_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
      code: code.toUpperCase(),
      status: 'pending' as const,
      notes: '',
      timestamp: new Date().toISOString(),
      visitId
    }

    global.referralConversions.push(conversion)

    return NextResponse.json({ success: true, conversionId: conversion.id })
  } catch {
    return NextResponse.json({ error: 'Failed to create conversion' }, { status: 500 })
  }
}

// Update conversion status
export async function PUT(request: NextRequest) {
  try {
    const { conversionId, status, notes, adminKey } = await request.json()
    
    // Verify admin
    if (adminKey !== process.env.ADMIN_SECRET) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const conversion = global.referralConversions.find(c => c.id === conversionId)
    if (!conversion) {
      return NextResponse.json({ error: 'Conversion not found' }, { status: 404 })
    }

    if (status) conversion.status = status
    if (notes !== undefined) conversion.notes = notes
    if (status === 'closed') conversion.closedAt = new Date().toISOString()

    return NextResponse.json({ success: true, conversion })
  } catch {
    return NextResponse.json({ error: 'Failed to update' }, { status: 500 })
  }
}
