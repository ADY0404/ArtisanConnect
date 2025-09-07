"use client"

import { useState, useEffect, useRef } from 'react'
import { useSession } from 'next-auth/react'
import { useBookingChat } from '@/app/_hooks/useSocket'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Badge } from '@/components/ui/badge'
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar'
import { Send, Paperclip, Image as ImageIcon, FileText, Phone, MapPin, Calendar, Clock, Check, CheckCheck, Wifi, MessageCircle, AlertCircle } from 'lucide-react'
import { Separator } from '@/components/ui/separator'
import useMediaQuery from '@/app/_hooks/useMediaQuery'

export default function ChatWindow({ bookingId, businessInfo, bookingDetails }) {
  const { data: session } = useSession()
  const [message, setMessage] = useState('')
  const [isTyping, setIsTyping] = useState(false)
  const [showDebug, setShowDebug] = useState(process.env.NODE_ENV === 'development')
  const messagesEndRef = useRef(null)
  const typingTimeoutRef = useRef(null)
  const isMobile = useMediaQuery('(max-width: 640px)')

  const {
    messages,
    typingUsers,
    roomInfo,
    loading,
    error,
    isJoinedToRoom,
    unreadCount,
    sendMessage,
    startTyping,
    stopTyping,
    markMessageAsRead,
    checkRoomStatus,
    getMessageStatus
  } = useBookingChat(bookingId)

  // Auto scroll to bottom when new messages arrive
  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' })
  }

  useEffect(() => {
    scrollToBottom()
    console.log(`💬 ChatWindow: ${messages.length} messages loaded for bookingId: ${bookingId}`)
  }, [messages, bookingId])

  // Mark messages as read when they become visible
  useEffect(() => {
    const unreadMessages = messages.filter(msg => 
      msg.senderId !== session?.user?.email && !msg.isRead
    )
    
    unreadMessages.forEach(msg => {
      markMessageAsRead(msg.messageId)
    })
  }, [messages, session, markMessageAsRead])

  const handleSendMessage = (e) => {
    e.preventDefault()
    
    if (!message.trim()) return

    if (sendMessage(message)) {
      setMessage('')
      stopTyping()
      // Scroll to bottom immediately after sending
      setTimeout(scrollToBottom, 100)
    }
  }

  const handleTyping = (e) => {
    setMessage(e.target.value)
    
    if (!isTyping) {
      setIsTyping(true)
      startTyping()
    }

    // Clear existing timeout
    if (typingTimeoutRef.current) {
      clearTimeout(typingTimeoutRef.current)
    }

    // Stop typing indicator after 1 second of no typing
    typingTimeoutRef.current = setTimeout(() => {
      setIsTyping(false)
      stopTyping()
    }, 1000)
  }

  // Get message delivery status icon
  const getMessageStatusIcon = (msg) => {
    if (msg.senderId !== session?.user?.email) return null
    
    const status = getMessageStatus(msg.messageId)
    
    switch (status.status) {
      case 'sent':
        return <Check className="w-4 h-4 text-gray-400" />
      case 'delivered':
        return <CheckCheck className="w-4 h-4 text-blue-500" />
      case 'read':
        return <CheckCheck className="w-4 h-4 text-green-500" />
      default:
        return <Clock className="w-4 h-4 text-gray-400" />
    }
  }

  // Check if provider is online (simplified)
  const isProviderOnline = roomInfo?.members?.some(member => 
    member.userRole === 'provider' && member.isOnline !== false
  )

  if (loading) {
    return (
      <div className="flex items-center justify-center h-full">
        <div className="text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto"></div>
          <p className="mt-2 text-gray-600">Loading chat...</p>
        </div>
      </div>
    )
  }

  return (
    <div className="flex flex-col h-full bg-gray-50">
      {/* Chat Header - Only show on desktop or when needed */}
      {!isMobile && (
        <div className="bg-white border-b px-4 sm:px-6 py-3 sm:py-4 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="relative">
              <Avatar className="w-8 h-8 sm:w-10 sm:h-10">
                <AvatarImage src={businessInfo?.images?.[0]} />
                <AvatarFallback>
                  {businessInfo?.name?.charAt(0) || 'B'}
                </AvatarFallback>
              </Avatar>
              {/* Online status indicator */}
              <div className={`absolute -bottom-1 -right-1 w-2 h-2 sm:w-3 sm:h-3 rounded-full border-2 border-white ${
                isProviderOnline ? 'bg-green-500' : 'bg-gray-400'
              }`} />
            </div>
            <div className="hidden sm:block">
              <h3 className="font-semibold text-sm sm:text-base">{businessInfo?.name}</h3>
              <p className="text-xs sm:text-sm text-gray-600">
                {isProviderOnline ? 'Online' : 'Offline - Messages will be delivered when they return'}
              </p>
            </div>
          </div>
          
          <div className="flex items-center gap-2">
            {!isProviderOnline && (
              <Badge variant="secondary" className="text-xs hidden sm:flex">
                <Wifi className="w-3 h-3 mr-1" />
                Offline
              </Badge>
            )}
            
            {unreadCount > 0 && (
              <Badge className="bg-red-500 text-white text-xs">
                {unreadCount} unread
              </Badge>
            )}
            
            {showDebug && (
              <Button
                variant="ghost"
                size="sm"
                onClick={checkRoomStatus}
                className="text-xs hidden sm:flex"
              >
                Debug
              </Button>
            )}
          </div>
        </div>
      )}

      {/* Offline Messaging Notice - Compact on mobile */}
      {!isProviderOnline && (
        <div className={`bg-blue-50 border-l-4 border-blue-400 p-2 sm:p-4 mx-2 sm:mx-4 mt-2 sm:mt-4 rounded text-xs sm:text-sm`}>
          <div className="flex items-start">
            <MessageCircle className="w-4 h-4 sm:w-5 sm:h-5 text-blue-400 mr-1 sm:mr-2 mt-0.5 flex-shrink-0" />
            <div>
              <p className="font-medium text-blue-800">
                {isMobile ? 'Provider offline' : 'Provider is currently offline'}
              </p>
              <p className="text-blue-600 mt-0.5 sm:mt-1 text-xs hidden sm:block">
                Your messages will be delivered automatically when they come back online
              </p>
            </div>
          </div>
        </div>
      )}

      {/* Messages Area */}
      <div className="flex-1 overflow-y-auto p-3 sm:p-4 space-y-3 sm:space-y-4">
        {error && (
          <div className="bg-red-50 border border-red-200 rounded-lg p-2 sm:p-3 mb-2 sm:mb-4">
            <div className="flex items-center">
              <AlertCircle className="w-4 h-4 text-red-500 mr-2 flex-shrink-0" />
              <p className="text-xs sm:text-sm text-red-700">{error}</p>
            </div>
          </div>
        )}

        {messages.length === 0 ? (
          <div className="text-center py-6 sm:py-8">
            <MessageCircle className="w-10 h-10 sm:w-12 sm:h-12 mx-auto mb-2 sm:mb-3 text-gray-300" />
            <p className="text-gray-500 text-sm sm:text-base">No messages yet</p>
            <p className="text-xs sm:text-sm text-gray-400 mt-1">
              Start a conversation with {businessInfo?.name}
            </p>
          </div>
        ) : (
          messages.map((msg) => (
            <div
              key={msg.messageId}
              className={`flex ${msg.senderId === session?.user?.email ? 'justify-end' : 'justify-start'}`}
            >
              <div
                className={`max-w-[75%] sm:max-w-xs lg:max-w-md px-3 py-2 sm:px-4 sm:py-2 rounded-lg ${
                  msg.senderId === session?.user?.email
                    ? 'bg-primary text-white'
                    : 'bg-white border'
                }`}
              >
                {msg.senderId !== session?.user?.email && (
                  <p className="text-xs font-medium mb-1 text-gray-600">
                    {msg.senderName} {msg.senderRole === 'provider' ? '(Provider)' : '(Customer)'}
                  </p>
                )}
                
                <p className="text-xs sm:text-sm break-words">{msg.message}</p>
                
                <div className="flex items-center justify-between mt-1">
                  <p className="text-[10px] sm:text-xs opacity-70">
                    {new Date(msg.timestamp).toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'})}
                  </p>
                  
                  {/* Message status indicators for sent messages */}
                  {msg.senderId === session?.user?.email && (
                    <div className="flex items-center ml-2">
                      {getMessageStatusIcon(msg)}
                    </div>
                  )}
                </div>
              </div>
            </div>
          ))
        )}

        {/* Typing Indicators */}
        {typingUsers.length > 0 && (
          <div className="flex justify-start">
            <div className="bg-gray-200 rounded-lg px-3 py-2">
              <div className="flex items-center space-x-1">
                <div className="flex space-x-1">
                  <div className="w-2 h-2 bg-gray-500 rounded-full animate-bounce" />
                  <div className="w-2 h-2 bg-gray-500 rounded-full animate-bounce" style={{ animationDelay: '0.1s' }} />
                  <div className="w-2 h-2 bg-gray-500 rounded-full animate-bounce" style={{ animationDelay: '0.2s' }} />
                </div>
                <span className="text-xs text-gray-600 ml-2">
                  {typingUsers[0].userName} is typing...
                </span>
              </div>
            </div>
          </div>
        )}

        <div ref={messagesEndRef} />
      </div>

      {/* Message Input */}
      <div className="bg-white border-t p-2 sm:p-4">
        <form onSubmit={handleSendMessage} className="flex gap-2">
          <Input
            value={message}
            onChange={handleTyping}
            placeholder={isMobile ? "Type message..." : (isProviderOnline ? "Type your message..." : "Type your message (will be delivered when provider is online)...")}
            className="flex-1 text-sm"
            disabled={!isJoinedToRoom}
          />
          <Button 
            type="submit" 
            disabled={!message.trim() || !isJoinedToRoom}
            className="px-3 sm:px-6"
            size={isMobile ? "sm" : "default"}
          >
            <Send className="w-4 h-4" />
          </Button>
        </form>
        
        {!isJoinedToRoom && (
          <p className="text-xs text-gray-500 mt-2">
            Connecting to chat...
          </p>
        )}
      </div>

      {/* Debug Info */}
      {showDebug && roomInfo && (
        <div className="bg-gray-100 p-2 sm:p-3 border-t text-xs hidden sm:block">
          <div className="grid grid-cols-2 gap-2">
            <div>
              <strong>Room:</strong> {roomInfo.roomName}
            </div>
            <div>
              <strong>Members:</strong> {roomInfo.memberCount}
            </div>
            <div>
              <strong>Joined:</strong> {isJoinedToRoom ? 'Yes' : 'No'}
            </div>
            <div>
              <strong>Messages:</strong> {messages.length}
            </div>
          </div>
        </div>
      )}
    </div>
  )
} 