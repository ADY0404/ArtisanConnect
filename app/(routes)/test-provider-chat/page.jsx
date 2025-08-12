"use client"

import { useState, useEffect } from 'react'
import { useSession } from 'next-auth/react'
import { useSocket } from '@/app/_hooks/useSocket'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Badge } from '@/components/ui/badge'

export default function TestProviderChat() {
  const { data: session } = useSession()
  const { socket, isConnected } = useSocket()
  const [messages, setMessages] = useState([])
  const [logs, setLogs] = useState([])
  const [isJoinedAsProvider, setIsJoinedAsProvider] = useState(false)
  const [testBookingId] = useState('dm_test_business_customer_test_com')

  const addLog = (message, type = 'info') => {
    const timestamp = new Date().toLocaleTimeString()
    setLogs(prev => [...prev.slice(-9), { message, type, timestamp }])
  }

  useEffect(() => {
    if (socket) {
      addLog('Socket instance available', 'success')
      
      socket.on('connect', () => addLog('Connected to server as Provider', 'success'))
      socket.on('disconnect', () => addLog('Disconnected from server', 'error'))
      
      // Listen for new messages from customers
      socket.on('chat:new_message', (msg) => {
        addLog(`📩 New message from ${msg.senderName}: ${msg.message}`, 'success')
        setMessages(prev => [...prev, msg])
      })

      // Listen for typing indicators
      socket.on('chat:user_typing', (data) => {
        if (data.isTyping) {
          addLog(`⌨️ ${data.userName} is typing...`, 'info')
        }
      })

      // Listen for room events
      socket.on('booking:user_joined', (data) => {
        addLog(`👤 ${data.userName} joined the chat`, 'info')
      })

      socket.on('booking:room_joined', (data) => {
        addLog(`🏠 Joined room: ${data.roomName} (${data.memberCount} members)`, 'success')
        setIsJoinedAsProvider(true)
      })

      return () => {
        socket.off('connect')
        socket.off('disconnect') 
        socket.off('chat:new_message')
        socket.off('chat:user_typing')
        socket.off('booking:user_joined')
        socket.off('booking:room_joined')
      }
    }
  }, [socket])

  const joinAsProvider = () => {
    if (socket && session?.user) {
      socket.emit('user:join', {
        userId: `provider_${session.user.email}`,
        email: session.user.email,
        name: `${session.user.name} (Provider)`,
        role: 'provider'
      })
      
      socket.emit('booking:join', {
        bookingId: testBookingId,
        userRole: 'provider'
      })
      
      addLog('Joined as provider for test booking', 'success')
    }
  }

  const sendProviderResponse = () => {
    if (socket) {
      socket.emit('chat:send_message', {
        bookingId: testBookingId,
        message: `Hello! I'm a provider and I received your message. I'm available to help you with your service needs.`,
        messageType: 'text'
      })
      addLog('Sent provider response', 'success')
    }
  }

  const loadChatHistory = async () => {
    try {
      addLog('Loading chat history...', 'info')
      const response = await fetch(`/api/chat/${testBookingId}`)
      const data = await response.json()
      
      if (data.success) {
        setMessages(data.data.messages || [])
        addLog(`✅ Loaded ${data.data.messages.length} messages from history`, 'success')
      } else {
        addLog(`❌ Failed to load history: ${data.error}`, 'error')
      }
    } catch (error) {
      addLog(`❌ Error loading history: ${error.message}`, 'error')
    }
  }

  if (!session) {
    return (
      <div className="p-4">
        <Card>
          <CardHeader>
            <CardTitle>Provider Chat Test - Sign In Required</CardTitle>
          </CardHeader>
          <CardContent>
            <Button onClick={() => window.location.href = '/api/auth/signin'}>
              Sign In as Provider
            </Button>
          </CardContent>
        </Card>
      </div>
    )
  }

  return (
    <div className="container mx-auto p-4 max-w-6xl">
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            Provider Chat Test
            <Badge variant={isConnected ? "default" : "destructive"}>
              {isConnected ? "Connected" : "Disconnected"}
            </Badge>
            {isJoinedAsProvider && (
              <Badge variant="secondary">Provider Mode</Badge>
            )}
          </CardTitle>
          <p className="text-sm text-gray-600">
            Testing chat from provider perspective - Booking ID: {testBookingId}
          </p>
        </CardHeader>
        
        <CardContent className="space-y-6">
          {/* Provider Actions */}
          <div className="grid grid-cols-3 gap-4">
            <Button 
              onClick={joinAsProvider} 
              disabled={!socket || isJoinedAsProvider}
              variant={isJoinedAsProvider ? "secondary" : "default"}
            >
              {isJoinedAsProvider ? "Joined as Provider" : "Join as Provider"}
            </Button>
            
            <Button 
              onClick={sendProviderResponse} 
              disabled={!isJoinedAsProvider}
              variant="outline"
            >
              Send Provider Response
            </Button>
            
            <Button 
              onClick={loadChatHistory} 
              variant="outline"
            >
              Load Chat History
            </Button>
          </div>

          {/* Instructions */}
          <div className="bg-blue-50 p-4 rounded-lg">
            <h3 className="font-semibold text-blue-800">How to Test Provider Reception:</h3>
            <ol className="list-decimal list-inside text-sm text-blue-700 mt-2 space-y-1">
              <li>Click "Join as Provider" to join the test chat room</li>
              <li>Open another browser tab and go to any business detail page</li>
              <li>Click "Message Provider" button and send a message</li>
              <li>Come back to this tab - you should see the message appear in real-time</li>
              <li>Click "Send Provider Response" to test two-way communication</li>
              <li>Use "Load Chat History" to verify messages are persisted</li>
            </ol>
          </div>

          {/* Messages Display */}
          <div className="grid grid-cols-2 gap-6">
            {/* Real-time Messages */}
            <div className="space-y-2">
              <h3 className="font-semibold">Real-time Messages ({messages.length})</h3>
              <div className="bg-gray-50 p-3 rounded max-h-60 overflow-y-auto">
                {messages.length === 0 ? (
                  <p className="text-gray-500">No messages yet - waiting for customers...</p>
                ) : (
                  messages.map((msg, i) => (
                    <div key={i} className="border-b py-2 last:border-b-0">
                      <div className="flex items-center gap-2">
                        <span className="text-sm font-medium">{msg.senderName}</span>
                        <Badge variant="outline" className="text-xs">
                          {msg.senderRole || 'customer'}
                        </Badge>
                      </div>
                      <div className="text-sm mt-1">{msg.message}</div>
                      <div className="text-xs text-gray-500">
                        {new Date(msg.timestamp).toLocaleTimeString()}
                      </div>
                    </div>
                  ))
                )}
              </div>
            </div>

            {/* Activity Logs */}
            <div className="space-y-2">
              <h3 className="font-semibold">Activity Logs</h3>
              <div className="bg-black text-green-400 p-3 rounded font-mono text-sm max-h-60 overflow-y-auto">
                {logs.map((log, i) => (
                  <div key={i} className={
                    log.type === 'error' ? 'text-red-400' : 
                    log.type === 'success' ? 'text-green-400' : 'text-blue-400'
                  }>
                    [{log.timestamp}] {log.message}
                  </div>
                ))}
              </div>
            </div>
          </div>

          {/* Connection Status */}
          <div className="bg-gray-50 p-3 rounded">
            <h3 className="font-semibold mb-2">Connection Status:</h3>
            <div className="grid grid-cols-2 gap-4 text-sm">
              <div>Socket: {socket ? '✅ Connected' : '❌ Not Connected'}</div>
              <div>User: {session?.user?.name}</div>
              <div>Provider Mode: {isJoinedAsProvider ? '✅ Active' : '❌ Inactive'}</div>
              <div>Room: booking_{testBookingId}</div>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  )
} 