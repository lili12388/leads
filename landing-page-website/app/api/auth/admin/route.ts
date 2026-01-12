import { NextRequest, NextResponse } from 'next/server'

export async function POST(request: NextRequest) {
  try {
    const { username, password } = await request.json()
    
    const adminUsername = process.env.ADMIN_USERNAME || 'admin'
    const adminPassword = process.env.ADMIN_PASSWORD || 'mapsreach2024'
    
    // Debug: log what we're comparing (remove this later)
    console.log('Login attempt:', { 
      provided: { username, password },
      expected: { adminUsername, adminPassword },
      envExists: { 
        ADMIN_USERNAME: !!process.env.ADMIN_USERNAME,
        ADMIN_PASSWORD: !!process.env.ADMIN_PASSWORD 
      }
    })
    
    if (username === adminUsername && password === adminPassword) {
      return NextResponse.json({ 
        success: true, 
        adminKey: process.env.ADMIN_SECRET || 'default-admin-secret-change-me'
      })
    }
    
    return NextResponse.json({ 
      error: 'Invalid credentials',
      debug: {
        usernameMatch: username === adminUsername,
        passwordMatch: password === adminPassword,
        envSet: !!process.env.ADMIN_USERNAME
      }
    }, { status: 401 })
  } catch {
    return NextResponse.json({ error: 'Authentication failed' }, { status: 500 })
  }
}
