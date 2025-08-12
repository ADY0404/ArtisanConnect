"use client"
import React, { useState, useEffect } from 'react'
import { useSession } from 'next-auth/react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Badge } from '@/components/ui/badge'
import ChatWindow from '@/app/_components/ChatWindow'
import { MessageCircle, Search, Phone, Star, Calendar, MapPin, ChevronLeft } from 'lucide-react'
import useMediaQuery from '@/app/_hooks/useMediaQuery'

function CustomerMessagesPage() {
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
    completedBookings: 0
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
      const response = await fetch('/api/customer/messages')
      const data = await response.json()
      
      if (response.ok) {
        setConversations(data.conversations || [])
        setStats(data.stats || stats)
        setError(null)
        console.log('✅ Loaded customer conversations:', data.conversations?.length || 0)
      } else {
        setError(data.error || 'Failed to load conversations')
        console.error('❌ Customer messages API failed:', data.error)
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
    conv.providerName.toLowerCase().includes(searchQuery.toLowerCase()) ||
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

  const getStatusColor = (status) => {
    switch (status) {
      case 'confirmed': return 'bg-green-100 text-green-800'
      case 'pending': return 'bg-yellow-100 text-yellow-800'
      case 'completed': return 'bg-blue-100 text-blue-800'
      case 'cancelled': return 'bg-red-100 text-red-800'
      default: return 'bg-gray-100 text-gray-800'
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
            <p className="text-gray-600">Loading your conversations...</p>
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
  
  // Header component
  const PageHeader = () => (
    <div className="border-b border-gray-200 bg-white">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="py-4 sm:py-6">
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
            <div>
              <h1 className="text-xl sm:text-2xl font-bold text-gray-900">My Messages</h1>
              <p className="text-gray-600">Chat with your service providers</p>
            </div>
            
            {/* Stats */}
            <div className="flex space-x-4">
              <div className="text-center">
                <div className="text-xl sm:text-2xl font-bold text-blue-600">{stats.totalConversations || 0}</div>
                <div className="text-xs sm:text-sm text-gray-500">Conversations</div>
              </div>
              {stats.unreadMessages > 0 && (
                <div className="text-center">
                  <div className="text-xl sm:text-2xl font-bold text-red-600">{stats.unreadMessages}</div>
                  <div className="text-xs sm:text-sm text-gray-500">Unread</div>
                </div>
              )}
              <div className="text-center">
                <div className="text-xl sm:text-2xl font-bold text-green-600">{stats.completedBookings || 0}</div>
                <div className="text-xs sm:text-sm text-gray-500">Completed</div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
  
  // Sidebar content component
  const SidebarContent = () => (
    <div className="flex flex-col h-full">
      {/* Search */}
      <div className="p-4 border-b border-gray-200 bg-white">
        <div className="relative">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
          <Input
            placeholder="Search providers or services..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="pl-10 bg-white border-gray-200"
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
            <p className="text-gray-500 text-sm mb-4">
              {searchQuery ? 'No conversations match your search.' : 'Book a service to start chatting with providers.'}
            </p>
            {!searchQuery && (
              <Button 
                onClick={() => window.location.href = '/search'}
                className="bg-primary hover:bg-primary/90"
              >
                Find Services
              </Button>
            )}
          </div>
        ) : (
          <div className="space-y-1 p-2">
            {filteredConversations.map((conversation) => (
              <div
                key={conversation.bookingId}
                onClick={() => handleSelectConversation(conversation)}
                className={`p-4 rounded-lg cursor-pointer transition-colors ${
                  selectedConversation?.bookingId === conversation.bookingId
                    ? 'bg-white border border-primary/20 shadow-sm'
                    : 'hover:bg-white'
                }`}
              >
                <div className="flex items-start space-x-3">
                  {/* Provider Avatar */}
                  <div className="relative">
                    <div className="w-12 h-12 rounded-full bg-gradient-to-br from-green-500 to-blue-600 flex items-center justify-center text-white font-semibold">
                      {conversation.providerInitials}
                    </div>
                    {conversation.isActive && (
                      <div className="absolute -bottom-1 -right-1 w-4 h-4 bg-green-500 border-2 border-white rounded-full"></div>
                    )}
                  </div>
                  
                  {/* Content */}
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center justify-between mb-1">
                      <h4 className="font-medium text-gray-900 truncate">
                        {conversation.providerName}
                      </h4>
                      <span className="text-xs text-gray-500">
                        {formatTime(conversation.lastMessageTime)}
                      </span>
                    </div>
                    
                    <div className="flex items-center gap-2 mb-2">
                      <p className="text-sm text-gray-600 truncate">
                        {conversation.serviceName}
                      </p>
                      <Badge className={`text-xs ${getStatusColor(conversation.bookingStatus)}`}>
                        {conversation.bookingStatus}
                      </Badge>
                    </div>

                    {/* Booking Info */}
                    <div className="text-xs text-gray-500 mb-2">
                      <div className="flex items-center gap-1">
                        <Calendar className="h-3 w-3" />
                        {new Date(conversation.bookingDate).toLocaleDateString()} at {conversation.bookingTime}
                      </div>
                    </div>
                    
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
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
  
  // Chat content component
  const ChatContent = () => (
    <div className="h-full flex flex-col">
      {/* Chat Header */}
      <div className="p-4 border-b border-gray-200 bg-white">
        <div className="flex items-center justify-between">
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
            <div className="w-10 h-10 rounded-full bg-gradient-to-br from-green-500 to-blue-600 flex items-center justify-center text-white font-semibold">
              {selectedConversation?.providerInitials}
            </div>
            <div>
              <h3 className="font-semibold text-gray-900">{selectedConversation?.providerName}</h3>
              <p className="text-sm text-gray-600">{selectedConversation?.serviceName}</p>
            </div>
          </div>
          
          <div className="flex items-center space-x-2">
            <Badge className={`${getStatusColor(selectedConversation?.bookingStatus)}`}>
              {selectedConversation?.bookingStatus}
            </Badge>
            {selectedConversation?.businessInfo?.phone && (
              <Button variant="outline" size="sm" className="hidden sm:flex">
                <Phone className="h-4 w-4" />
              </Button>
            )}
          </div>
        </div>
        
        {/* Booking Details - Hide on small screens */}
        <div className="mt-3 p-3 bg-gray-50 rounded-lg hidden sm:block">
          <div className="grid grid-cols-2 gap-4 text-sm">
            <div>
              <div className="flex items-center gap-1 text-gray-600">
                <Calendar className="h-4 w-4" />
                <span>Booking Date</span>
              </div>
              <div className="font-medium">
                {new Date(selectedConversation?.bookingDate).toLocaleDateString()} at {selectedConversation?.bookingTime}
              </div>
            </div>
            {selectedConversation?.businessInfo?.address && (
              <div>
                <div className="flex items-center gap-1 text-gray-600">
                  <MapPin className="h-4 w-4" />
                  <span>Location</span>
                </div>
                <div className="font-medium truncate">
                  {selectedConversation?.businessInfo.address}
                </div>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Chat Messages */}
      <div className="flex-1">
        <ChatWindow 
          bookingId={selectedConversation?.bookingId}
          currentUserEmail={session?.user?.email}
          currentUserName={session?.user?.name}
          otherUserName={selectedConversation?.providerName}
          onNewMessage={loadConversations} // Refresh conversations when new message
        />
      </div>
    </div>
  );
  
  // Empty state component
  const EmptyState = () => (
    <div className="h-full flex items-center justify-center bg-gray-50">
      <div className="text-center">
        <div className="bg-gray-100 rounded-full h-16 w-16 flex items-center justify-center mx-auto mb-4">
          <MessageCircle className="h-8 w-8 text-gray-400" />
        </div>
        <h3 className="text-lg font-medium text-gray-900 mb-2">Select a conversation</h3>
        <p className="text-gray-500">Choose a provider from the list to start chatting</p>
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
      <div className="min-h-screen bg-white flex flex-col">
        <PageHeader />
        
        <div className="flex-1">
          {sidebarOpen ? (
            <div className="w-full h-full">
              <SidebarContent />
            </div>
          ) : (
            <div className="w-full h-full">
              {selectedConversation ? <ChatContent /> : <EmptyState />}
            </div>
          )}
        </div>
      </div>
    );
  }

  // Desktop layout
  return (
    <div className="min-h-screen bg-white">
      <PageHeader />

      <div className="flex h-[calc(100vh-180px)]">
        {/* Left Sidebar - Conversations List */}
        <div className="w-96 border-r border-gray-200 flex flex-col bg-gray-50">
          <SidebarContent />
        </div>

        {/* Right Side - Chat Window */}
        <div className="flex-1">
          {selectedConversation ? <ChatContent /> : <EmptyState />}
        </div>
      </div>
    </div>
  )
}

export default CustomerMessagesPage 