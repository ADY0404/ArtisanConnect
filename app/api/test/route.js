import { NextResponse } from 'next/server'

export async function GET() {
  return NextResponse.json({
    message: 'API is working!',
    timestamp: new Date().toISOString(),
    environment: process.env.NODE_ENV
  })
}

export async function POST(request) {
  const body = await request.json()
  return NextResponse.json({
    message: 'POST request received',
    data: body,
    timestamp: new Date().toISOString()
  })
} 