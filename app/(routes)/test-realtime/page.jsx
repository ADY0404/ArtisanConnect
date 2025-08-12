"use client"

import { useState, useEffect } from 'react'
import { useSession } from 'next-auth/react'
import { useSocket } from '@/app/_hooks/useSocket'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Badge } from '@/components/ui/badge'
import MessageProviderButton from '@/app/_components/MessageProviderButton'

export default function TestRealTimePage() {
  const { data: session, status } = useSession()
  const { socket, isConnected, connectionError } = useSocket()
  const [messages, setMessages] = useState([])
  const [newMessage, setNewMessage] = useState('')
  const [logs, setLogs] = useState([])

  const addLog = (message, type = 'info') => {
    const timestamp = new Date().toLocaleTimeString()
    setLogs(prev => [...prev.slice(-9), { message, type, timestamp }])
  }

  useEffect(() => {
    if (socket) {
      addLog('Socket instance available', 'success')
      
      socket.on('connect', () => addLog('Connected to server', 'success'))
      socket.on('disconnect', () => addLog('Disconnected from server', 'error'))
      socket.on('chat:new_message', (msg) => {
        addLog(`Message from ${msg.senderName}`, 'info')
        setMessages(prev => [...prev, msg])
      })

      return () => {
        socket.off('connect')
        socket.off('disconnect') 
        socket.off('chat:new_message')
      }
    }
  }, [socket])

  const joinAsUser = () => {
    if (socket && session?.user) {
      socket.emit('user:join', {
        userId: session.user.email,
        email: session.user.email,
        name: session.user.name || 'Test User'
      })
      addLog('Joined as user', 'success')
    }
  }

  const joinRoom = () => {
    if (socket) {
      socket.emit('booking:join', {
        bookingId: 'test-booking-123',
        userRole: 'customer'
      })
      addLog('Joining test room', 'info')
    }
  }

  const sendMessage = () => {
    if (socket && newMessage.trim()) {
      socket.emit('chat:send_message', {
        bookingId: 'test-booking-123',
        message: newMessage.trim(),
        messageType: 'text'
      })
      addLog('Message sent', 'success')
      setNewMessage('')
    }
  }

  if (status === 'loading') {
    return <div className="p-4">Loading...</div>
  }

  if (!session) {
    return (
      <div className="p-4">
        <Card>
          <CardHeader>
            <CardTitle>Sign In Required</CardTitle>
          </CardHeader>
          <CardContent>
            <Button onClick={() => window.location.href = '/api/auth/signin'}>
              Sign In
            </Button>
          </CardContent>
        </Card>
      </div>
    )
  }

  return (
    <div className="container mx-auto p-4">
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            Socket.IO Test
            <Badge variant={isConnected ? "default" : "destructive"}>
              {isConnected ? "Connected" : "Disconnected"}
            </Badge>
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <div>
              <h3 className="font-semibold mb-2">Status</h3>
              <div className="text-sm space-y-1">
                <div>Socket: {socket ? '✅' : '❌'}</div>
                <div>Connected: {isConnected ? '✅' : '❌'}</div>
                <div>User: {session?.user?.name}</div>
                <div>Error: {connectionError || 'None'}</div>
              </div>
            </div>
            <div>
              <h3 className="font-semibold mb-2">Actions</h3>
              <div className="space-y-2">
                <Button onClick={joinAsUser} size="sm" disabled={!socket}>
                  Join as User
                </Button>
                <Button onClick={joinRoom} size="sm" disabled={!socket}>
                  Join Test Room
                </Button>
              </div>
            </div>
          </div>

          <div className="space-y-2">
            <h3 className="font-semibold">Send Message</h3>
            <div className="flex gap-2">
              <Input 
                placeholder="Test message..."
                value={newMessage}
                onChange={(e) => setNewMessage(e.target.value)}
                onKeyPress={(e) => e.key === 'Enter' && sendMessage()}
              />
              <Button onClick={sendMessage} disabled={!newMessage.trim()}>
                Send
              </Button>
            </div>
          </div>

          <div className="space-y-2">
            <h3 className="font-semibold">Messages ({messages.length})</h3>
            <div className="bg-gray-50 p-3 rounded max-h-40 overflow-y-auto">
              {messages.length === 0 ? (
                <div className="text-gray-500">No messages yet</div>
              ) : (
                messages.map((msg, i) => (
                  <div key={i} className="text-sm">
                    {msg.senderName}: {msg.message}
                  </div>
                ))
              )}
            </div>
          </div>

          <div className="space-y-2">
            <h3 className="font-semibold">Logs</h3>
            <div className="bg-black text-green-400 p-3 rounded font-mono text-sm max-h-40 overflow-y-auto">
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

          {/* Message Provider Button Test */}
          <div className="border rounded-lg p-6">
            <h3 className="text-xl font-semibold mb-4">Message Provider Button Test</h3>
            
            <div className="mb-4">
              <p className="text-gray-600 mb-2">Test the Message Provider button with sample business data:</p>
              <MessageProviderButton 
                business={{
                  id: "test-business-1",
                  name: "Sample Cleaning Service",
                  contactPerson: "John Smith",
                  email: "john@cleaningservice.com",
                  phone: "+1 (555) 123-4567"
                }}
              />
            </div>
            
            <div className="text-sm text-gray-500">
              <p>• Click the button to see contact information toast</p>
              <p>• Click "Copy Email" to copy the email to clipboard</p>
              <p>• This simulates the functionality until full chat is implemented</p>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  )
} 