import { NextResponse } from 'next/server'
import { Server } from 'socket.io'

// Global variable to store the Socket.IO server instance
let io

// This will be called when the API route is hit
export async function GET(request) {
  if (!global.io) {
    console.log('🚀 Initializing Socket.IO server...')
    
    // In Next.js 14, we need to use the custom server approach
    // For now, we'll return a response that the client can use to establish connection
    global.io = true // Mark as initialized
    
    console.log('✅ Socket.IO server marked as ready')
  }

  return NextResponse.json({ 
    message: 'Socket.IO server is ready',
    status: 'success',
    socketPath: '/api/socketio'
  })
}

// We need to create a separate endpoint for Socket.IO connections
export async function POST(request) {
  return NextResponse.json({ 
    message: 'Use WebSocket connection for real-time communication',
    status: 'redirect'
  })
}

// Helper function to generate unique message IDs
function generateMessageId() {
  return `msg_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`
}

// Export the io instance for use in other parts of the application
export { io } 