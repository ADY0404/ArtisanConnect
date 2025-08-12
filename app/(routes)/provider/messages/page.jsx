"use client"
import React, { useState, useEffect } from 'react'
import { useSession } from 'next-auth/react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Badge } from '@/components/ui/badge'
import ChatWindow from '@/app/_components/ChatWindow'
import { MessageCircle, Search, Phone, Video, MoreVertical, ChevronLeft, Menu } from 'lucide-react'
import { Sheet, SheetContent, SheetTrigger } from '@/components/ui/sheet'
import useMediaQuery from '@/app/_hooks/useMediaQuery'

function ProviderMessagesPage() {
  const { data: session } = useSession()
  const [conversations, setConversations] = useState([])
  const [selectedConversation, setSelectedConversation] = useState(null)
  const [searchQuery, setSearchQuery] = useState('')
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)
  const [sidebarOpen, setSidebarOpen] = useState(true)
  const [stats, setStats] = useState({
    totalConversations: 0,
    unreadMessages: 0,
    activeChats: 0,
    responseRate: 0
  })
  
  const isMobile = useMediaQuery('(max-width: 768px)')

  // Load conversations on component mount
  useEffect(() => {
    if (session?.user) {
      loadConversations()
    }
  }, [session])

  // Auto-close sidebar on mobile when conversation is selected
  useEffect(() => {
    if (isMobile && selectedConversation) {
      setSidebarOpen(false)
    }
  }, [selectedConversation, isMobile])

  const loadConversations = async () => {
    try {
      setLoading(true)
      const response = await fetch('/api/provider/messages')
      const data = await response.json()
      
      if (response.ok) {
        setConversations(data.conversations || [])
        setStats(data.stats || stats)
        setError(null)
        console.log('✅ Loaded conversations:', data.conversations?.length || 0)
      } else {
        setError(data.error || 'Failed to load conversations')
        console.error('❌ Provider messages API failed:', data.error)
      }
    } catch (err) {
      setError('Network error loading conversations')
      console.error('Error loading conversations:', err)
    } finally {
      setLoading(false)
    }
  }

  // Filter conversations based on search
  const filteredConversations = conversations.filter(conv => 
    conv.customerName.toLowerCase().includes(searchQuery.toLowerCase()) ||
    conv.serviceName.toLowerCase().includes(searchQuery.toLowerCase()) ||
    conv.lastMessage.toLowerCase().includes(searchQuery.toLowerCase())
  )

  const formatTime = (timestamp) => {
    const date = new Date(timestamp)
    const now = new Date()
    const diffInHours = (now - date) / (1000 * 60 * 60)
    
    if (diffInHours < 24) {
      return date.toLocaleTimeString('en-US', { 
        hour: 'numeric', 
        minute: '2-digit', 
        hour12: true 
      })
    } else if (diffInHours < 7 * 24) {
      return date.toLocaleDateString('en-US', { weekday: 'short' })
    } else {
      return date.toLocaleDateString('en-US', { 
        month: 'short', 
        day: 'numeric' 
      })
    }
  }

  const handleSelectConversation = (conversation) => {
    setSelectedConversation(conversation)
    if (isMobile) {
      setSidebarOpen(false)
    }
  }

  const backToConversations = () => {
    if (isMobile) {
      setSidebarOpen(true)
    }
  }

  if (loading) {
    return (
      <div className="flex h-screen bg-gray-50">
        <div className="flex-1 flex items-center justify-center">
          <div className="text-center">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto mb-4"></div>
            <p className="text-gray-600">Loading conversations...</p>
          </div>
        </div>
      </div>
    )
  }

  if (error) {
    return (
      <div className="flex h-screen bg-gray-50">
        <div className="flex-1 flex items-center justify-center">
          <div className="text-center max-w-md">
            <div className="bg-red-100 rounded-full h-16 w-16 flex items-center justify-center mx-auto mb-4">
              <MessageCircle className="h-8 w-8 text-red-600" />
            </div>
            <h3 className="text-lg font-semibold text-gray-900 mb-2">Connection Error</h3>
            <p className="text-gray-600 mb-4">{error}</p>
            <Button onClick={loadConversations} className="bg-primary hover:bg-primary/90">
              Try Again
            </Button>
          </div>
        </div>
      </div>
    )
  }

  // Sidebar content component
  const SidebarContent = () => (
    <div className="flex flex-col h-full">
      {/* Header */}
      <div className="p-4 border-b border-gray-200">
        <div className="flex items-center justify-between mb-4">
          <h1 className="text-xl font-semibold text-gray-900">Messages</h1>
          <div className="flex space-x-2">
            <Badge variant="secondary">{stats.totalConversations || 0}</Badge>
            {stats.unreadMessages > 0 && (
              <Badge className="bg-red-500 hover:bg-red-600">
                {stats.unreadMessages}
              </Badge>
            )}
          </div>
        </div>
        
        {/* Search */}
        <div className="relative">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
          <Input
            placeholder="Search conversations..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="pl-10 bg-gray-50 border-gray-200"
          />
        </div>
      </div>

      {/* Conversations List */}
      <div className="flex-1 overflow-y-auto">
        {filteredConversations.length === 0 ? (
          <div className="flex flex-col items-center justify-center h-full text-center p-6">
            <div className="bg-gray-100 rounded-full h-16 w-16 flex items-center justify-center mb-4">
              <MessageCircle className="h-8 w-8 text-gray-400" />
            </div>
            <h3 className="text-lg font-medium text-gray-900 mb-2">No conversations yet</h3>
            <p className="text-gray-500 text-sm">
              {searchQuery ? 'No conversations match your search.' : 'Start engaging with customers to see conversations here.'}
            </p>
          </div>
        ) : (
          <div className="space-y-1 p-2">
            {filteredConversations.map((conversation) => (
              <div
                key={conversation.bookingId}
                onClick={() => handleSelectConversation(conversation)}
                className={`p-3 rounded-lg cursor-pointer transition-colors ${
                  selectedConversation?.bookingId === conversation.bookingId
                    ? 'bg-primary/10 border border-primary/20'
                    : 'hover:bg-gray-50'
                }`}
              >
                <div className="flex items-start space-x-3">
                  {/* Avatar */}
                  <div className="relative">
                    <div className="w-12 h-12 rounded-full bg-gradient-to-br from-blue-500 to-purple-600 flex items-center justify-center text-white font-semibold">
                      {conversation.customerInitials}
                    </div>
                    {conversation.isActive && (
                      <div className="absolute -bottom-1 -right-1 w-4 h-4 bg-green-500 border-2 border-white rounded-full"></div>
                    )}
                  </div>
                  
                  {/* Content */}
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center justify-between mb-1">
                      <h4 className="font-medium text-gray-900 truncate">
                        {conversation.customerName}
                      </h4>
                      <span className="text-xs text-gray-500">
                        {formatTime(conversation.lastMessageTime)}
                      </span>
                    </div>
                    
                    <p className="text-sm text-gray-600 mb-1">
                      {conversation.serviceName}
                    </p>
                    
                    <div className="flex items-center justify-between">
                      <p className="text-sm text-gray-500 truncate">
                        {conversation.lastMessage}
                      </p>
                      {conversation.unreadCount > 0 && (
                        <Badge className="bg-primary text-white text-xs h-5 min-w-[20px] rounded-full">
                          {conversation.unreadCount}
                        </Badge>
                      )}
                    </div>
                    
                    {/* Status indicators */}
                    <div className="flex items-center mt-2 space-x-2">
                      <Badge 
                        variant={conversation.bookingStatus === 'completed' ? 'default' : 'secondary'}
                        className="text-xs"
                      >
                        {conversation.isDirect ? 'Direct' : conversation.bookingStatus}
                      </Badge>
                      {conversation.isActive && (
                        <div className="flex items-center text-xs text-green-600">
                          <div className="w-2 h-2 bg-green-500 rounded-full mr-1"></div>
                          Active
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Stats Footer */}
      <div className="p-4 border-t border-gray-200 bg-gray-50">
        <div className="grid grid-cols-3 gap-4 text-center">
          <div>
            <div className="text-lg font-semibold text-gray-900">{stats.totalConversations || 0}</div>
            <div className="text-xs text-gray-500">Total</div>
          </div>
          <div>
            <div className="text-lg font-semibold text-green-600">{stats.activeChats || 0}</div>
            <div className="text-xs text-gray-500">Active</div>
          </div>
          <div>
            <div className="text-lg font-semibold text-blue-600">{stats.responseRate || 0}%</div>
            <div className="text-xs text-gray-500">Response</div>
          </div>
        </div>
      </div>
    </div>
  );

  // Chat content component
  const ChatContent = () => (
    <div className="flex-1 flex flex-col h-full">
      {/* Chat Header */}
      <div className="p-4 border-b border-gray-200 bg-white flex items-center justify-between">
        <div className="flex items-center space-x-3">
          {isMobile && (
            <Button 
              variant="ghost" 
              size="sm" 
              className="mr-2 md:hidden"
              onClick={backToConversations}
            >
              <ChevronLeft className="h-5 w-5" />
            </Button>
          )}
          <div className="w-10 h-10 rounded-full bg-gradient-to-br from-blue-500 to-purple-600 flex items-center justify-center text-white font-semibold">
            {selectedConversation?.customerInitials}
          </div>
          <div>
            <h2 className="font-semibold text-gray-900">
              {selectedConversation?.customerName}
            </h2>
            <p className="text-sm text-gray-500">
              {selectedConversation?.serviceName}
            </p>
          </div>
        </div>
        
        <div className="flex items-center space-x-2">
          <Button variant="ghost" size="sm" className="hidden sm:flex">
            <Phone className="h-4 w-4" />
          </Button>
          <Button variant="ghost" size="sm" className="hidden sm:flex">
            <Video className="h-4 w-4" />
          </Button>
          <Button variant="ghost" size="sm">
            <MoreVertical className="h-4 w-4" />
          </Button>
        </div>
      </div>

      {/* Chat Messages */}
      <div className="flex-1 bg-gray-50">
        <ChatWindow
          bookingId={selectedConversation?.bookingId}
          currentUser={{
            id: session?.user?.id,
            name: session?.user?.name,
            email: session?.user?.email,
            role: 'provider'
          }}
          otherUser={{
            name: selectedConversation?.customerName,
            email: selectedConversation?.customerEmail,
            role: 'customer'
          }}
          businessInfo={selectedConversation?.businessInfo}
        />
      </div>
    </div>
  );

  // Empty state component
  const EmptyState = () => (
    <div className="flex-1 flex items-center justify-center bg-gray-50">
      <div className="text-center max-w-md">
        <div className="bg-gray-100 rounded-full h-20 w-20 flex items-center justify-center mx-auto mb-6">
          <MessageCircle className="h-10 w-10 text-gray-400" />
        </div>
        <h3 className="text-xl font-semibold text-gray-900 mb-2">
          Select a conversation
        </h3>
        <p className="text-gray-500">
          Choose a conversation from the sidebar to start messaging with your customers.
        </p>
        {isMobile && (
          <Button 
            className="mt-4"
            onClick={() => setSidebarOpen(true)}
          >
            View Conversations
          </Button>
        )}
      </div>
    </div>
  );

  // Mobile layout
  if (isMobile) {
    return (
      <div className="flex h-screen bg-white">
        {sidebarOpen ? (
          <div className="w-full">
            <SidebarContent />
          </div>
        ) : (
          <div className="w-full h-full flex flex-col">
            {selectedConversation ? <ChatContent /> : <EmptyState />}
          </div>
        )}
      </div>
    );
  }

  // Desktop layout
  return (
    <div className="flex h-screen bg-white">
      {/* Left Sidebar - Conversations List */}
      <div className="w-80 border-r border-gray-200 flex flex-col">
        <SidebarContent />
      </div>

      {/* Right Side - Chat Area */}
      <div className="flex-1 flex flex-col">
        {selectedConversation ? <ChatContent /> : <EmptyState />}
      </div>
    </div>
  )
}

export default ProviderMessagesPage 