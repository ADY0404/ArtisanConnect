"use client"

import { useState } from 'react'
import { useSession } from 'next-auth/react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'

export default function TestChatAPI() {
  const { data: session } = useSession()
  const [messages, setMessages] = useState([])
  const [newMessage, setNewMessage] = useState('')
  const [loading, setLoading] = useState(false)
  const [results, setResults] = useState('')

  const testBookingId = 'dm_test_business_customer_test_com'

  const testGetMessages = async () => {
    setLoading(true)
    try {
      const response = await fetch(`/api/chat/${testBookingId}`)
      const data = await response.json()
      
      if (data.success) {
        setMessages(data.data.messages)
        setResults(`✅ Retrieved ${data.data.messages.length} messages`)
      } else {
        setResults(`❌ Error: ${data.error}`)
      }
    } catch (error) {
      setResults(`❌ Error: ${error.message}`)
    }
    setLoading(false)
  }

  const testSendMessage = async () => {
    if (!newMessage.trim()) return
    
    setLoading(true)
    try {
      const response = await fetch(`/api/chat/${testBookingId}`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          message: newMessage.trim()
        })
      })
      
      const data = await response.json()
      
      if (data.success) {
        setResults(`✅ Message sent successfully`)
        setNewMessage('')
        // Refresh messages
        testGetMessages()
      } else {
        setResults(`❌ Error sending: ${data.error}`)
      }
    } catch (error) {
      setResults(`❌ Error: ${error.message}`)
    }
    setLoading(false)
  }

  const clearDatabase = async () => {
    setLoading(true)
    try {
      // This would need a special API endpoint to clear test data
      setResults('⚠️ Clear function would need special API endpoint')
    } catch (error) {
      setResults(`❌ Error: ${error.message}`)
    }
    setLoading(false)
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
              Sign In to Test Chat API
            </Button>
          </CardContent>
        </Card>
      </div>
    )
  }

  return (
    <div className="container mx-auto p-4 max-w-4xl">
      <Card>
        <CardHeader>
          <CardTitle>Chat API Test</CardTitle>
          <p className="text-sm text-gray-600">
            Testing direct message chat functionality - Booking ID: {testBookingId}
          </p>
        </CardHeader>
        
        <CardContent className="space-y-6">
          {/* User Info */}
          <div className="bg-gray-50 p-3 rounded">
            <h3 className="font-semibold">Current User:</h3>
            <p>Name: {session.user.name}</p>
            <p>Email: {session.user.email}</p>
          </div>

          {/* Test Actions */}
          <div className="grid grid-cols-2 gap-4">
            <Button 
              onClick={testGetMessages} 
              disabled={loading}
              variant="outline"
            >
              {loading ? 'Loading...' : 'Get Messages'}
            </Button>
            
            <Button 
              onClick={clearDatabase} 
              disabled={loading}
              variant="destructive"
            >
              Clear Test Data
            </Button>
          </div>

          {/* Send Message */}
          <div className="space-y-2">
            <h3 className="font-semibold">Send Test Message:</h3>
            <div className="flex gap-2">
              <Input
                value={newMessage}
                onChange={(e) => setNewMessage(e.target.value)}
                placeholder="Type a test message..."
                onKeyPress={(e) => e.key === 'Enter' && testSendMessage()}
              />
              <Button 
                onClick={testSendMessage} 
                disabled={loading || !newMessage.trim()}
              >
                Send
              </Button>
            </div>
          </div>

          {/* Results */}
          <div className="space-y-2">
            <h3 className="font-semibold">Results:</h3>
            <div className="bg-black text-green-400 p-3 rounded font-mono text-sm min-h-[100px]">
              {results || 'No results yet...'}
            </div>
          </div>

          {/* Messages Display */}
          <div className="space-y-2">
            <h3 className="font-semibold">Messages ({messages.length}):</h3>
            <div className="bg-gray-50 p-3 rounded max-h-60 overflow-y-auto">
              {messages.length === 0 ? (
                <p className="text-gray-500">No messages found</p>
              ) : (
                messages.map((msg, i) => (
                  <div key={i} className="border-b py-2 last:border-b-0">
                    <div className="text-sm font-medium">{msg.senderName}</div>
                    <div className="text-sm">{msg.message}</div>
                    <div className="text-xs text-gray-500">
                      {new Date(msg.timestamp).toLocaleString()}
                    </div>
                  </div>
                ))
              )}
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  )
} 