import { NextRequest, NextResponse } from 'next/server'

// Use the shared global data store (declared in track/route.ts)
// For production, use Vercel KV, Supabase, or MongoDB

if (!global.referralCreators) {
  global.referralCreators = []
}

// Admin: Add new creator
export async function POST(request: NextRequest) {
  try {
    const { name, code, password, commission, adminKey } = await request.json()
    
    if (adminKey !== process.env.ADMIN_SECRET) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    if (!name || !code || !password) {
      return NextResponse.json({ error: 'Missing required fields' }, { status: 400 })
    }

    // Check if code already exists
    if (global.referralCreators.find(c => c.code === code.toUpperCase())) {
      return NextResponse.json({ error: 'Creator code already exists' }, { status: 400 })
    }

    const siteUrl = process.env.NEXT_PUBLIC_SITE_URL || 'https://getleadsnap.com'
    
    const creator = {
      code: code.toUpperCase(),
      name,
      password, // In production, hash this!
      commission: commission || 20,
      referralLink: `${siteUrl}?ref=${code.toUpperCase()}`,
      createdAt: new Date().toISOString()
    }

    global.referralCreators.push(creator)

    return NextResponse.json({ 
      success: true, 
      creator: { ...creator, password: undefined } 
    })
  } catch {
    return NextResponse.json({ error: 'Failed to create' }, { status: 500 })
  }
}

// Get creators (admin) or validate creator login
export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url)
  const adminKey = searchParams.get('adminKey')
  const code = searchParams.get('code')
  const password = searchParams.get('password')

  // Admin: get all creators
  if (adminKey === process.env.ADMIN_SECRET) {
    return NextResponse.json({
      creators: global.referralCreators.map(c => ({
        ...c,
        password: undefined
      }))
    })
  }

  // Creator login validation
  if (code && password) {
    const creator = global.referralCreators.find(
      c => c.code === code.toUpperCase() && c.password === password
    )
    
    if (creator) {
      return NextResponse.json({
        success: true,
        creator: {
          code: creator.code,
          name: creator.name,
          commission: creator.commission,
          referralLink: creator.referralLink
        }
      })
    } else {
      return NextResponse.json({ error: 'Invalid credentials' }, { status: 401 })
    }
  }

  return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
}

// Admin: Delete creator
export async function DELETE(request: NextRequest) {
  try {
    const { code, adminKey } = await request.json()
    
    if (adminKey !== process.env.ADMIN_SECRET) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const index = global.referralCreators.findIndex(c => c.code === code.toUpperCase())
    if (index === -1) {
      return NextResponse.json({ error: 'Creator not found' }, { status: 404 })
    }

    global.referralCreators.splice(index, 1)
    return NextResponse.json({ success: true })
  } catch {
    return NextResponse.json({ error: 'Failed to delete' }, { status: 500 })
  }
}
