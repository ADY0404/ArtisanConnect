"use client"
import { useEffect, useState, useRef, useCallback } from 'react'
import { useSession } from 'next-auth/react'
import io from 'socket.io-client'

let globalSocket = null

// Main Socket Hook
export function useSocket() {
  const { data: session } = useSession()
  const [socket, setSocket] = useState(null)
  const [isConnected, setIsConnected] = useState(false)
  const [connectionError, setConnectionError] = useState(null)
  const [offlineMessages, setOfflineMessages] = useState([])
  const [deliveryStatus, setDeliveryStatus] = useState({})
  const [connectionCount, setConnectionCount] = useState(0)
  const reconnectAttempts = useRef(0)
  const maxReconnectAttempts = 5

  const connect = useCallback(() => {
    if (globalSocket) {
      setSocket(globalSocket)
      setIsConnected(globalSocket.connected)
      return globalSocket
    }

    try {
      console.log('🔄 Connecting to Socket.IO server...')
      
      const newSocket = io({
        transports: ['websocket', 'polling'],
        autoConnect: true,
        reconnection: true,
        reconnectionAttempts: maxReconnectAttempts,
        reconnectionDelay: 1000,
        timeout: 20000,
        forceNew: false
      })

      // Connection events
      newSocket.on('connect', () => {
        console.log('✅ Socket connected:', newSocket.id)
        setIsConnected(true)
        setConnectionError(null)
        reconnectAttempts.current = 0
        
        // Auto-authenticate with session data if available
        if (session?.user) {
          const userData = {
            userId: session.user.email,
            email: session.user.email,
            name: session.user.name,
            role: determineUserRole(session.user)
          }
          
          console.log('🔑 Auto-authenticating with session data:', userData)
          newSocket.emit('user:join', userData)
        }
      })

      newSocket.on('disconnect', (reason) => {
        console.log('❌ Socket disconnected:', reason)
        setIsConnected(false)
        
        if (reason === 'io server disconnect') {
          // Server disconnected, try to reconnect
          console.log('🔄 Attempting to reconnect...')
          newSocket.connect()
        }
      })

      newSocket.on('connect_error', (error) => {
        console.error('❌ Socket connection error:', error)
        setConnectionError(error.message)
        setIsConnected(false)
        reconnectAttempts.current++
        
        if (reconnectAttempts.current >= maxReconnectAttempts) {
          console.error('💥 Max reconnection attempts reached')
          setConnectionError('Max reconnection attempts reached')
        }
      })

      newSocket.on('reconnect', (attemptNumber) => {
        console.log(`🔄 Socket reconnected after ${attemptNumber} attempts`)
        setIsConnected(true)
        setConnectionError(null)
        reconnectAttempts.current = 0
      })

      newSocket.on('reconnect_error', (error) => {
        console.error('❌ Socket reconnection error:', error)
        setConnectionError(`Reconnection failed: ${error.message}`)
      })

      newSocket.on('reconnect_failed', () => {
        console.error('💥 Socket reconnection failed completely')
        setConnectionError('Unable to reconnect to server')
      })

      // Server events
      newSocket.on('server:connection_count', (data) => {
        setConnectionCount(data.total)
      })

      // Listen for offline message delivery notifications
      newSocket.on('chat:offline_message_delivered', (data) => {
        console.log('📨 Offline message delivered:', data)
        setOfflineMessages(prev => [...prev, data.message])
        
        // Show notification to user
        if (typeof window !== 'undefined' && window.toast) {
          window.toast.info(`New message delivered while you were offline from ${data.message.senderName}`)
        }
      })

      // Listen for message delivery confirmations
      newSocket.on('chat:message_delivered', (data) => {
        console.log('✅ Message delivered to offline user:', data)
        setDeliveryStatus(prev => ({
          ...prev,
          [data.messageId]: {
            status: 'delivered',
            deliveredTo: data.deliveredTo,
            deliveredAt: data.deliveredAt
          }
        }))
      })

      // Listen for authentication confirmation
      newSocket.on('user:authenticated', (data) => {
        console.log('🔑 User authenticated:', data)
      })

      // Enhanced error handling
      newSocket.on('error', (error) => {
        console.error('❌ Socket error:', error)
        if (typeof window !== 'undefined' && window.toast) {
          window.toast.error(`Connection error: ${error.message}`)
        }
      })

      // Connection health monitoring
      const pingInterval = setInterval(() => {
        if (newSocket.connected) {
          newSocket.emit('ping')
        }
      }, 30000) // Ping every 30 seconds

      newSocket.on('pong', (data) => {
        console.log('🏓 Pong received:', data.timestamp)
      })

      globalSocket = newSocket
      setSocket(newSocket)
      
      return newSocket

    } catch (error) {
      console.error('❌ Failed to initialize socket:', error)
      setConnectionError(error.message)
      return null
    }
  }, [session])

  const disconnect = useCallback(() => {
    if (globalSocket) {
      console.log('🔌 Disconnecting socket...')
      globalSocket.disconnect()
      globalSocket = null
      setSocket(null)
      setIsConnected(false)
    }
  }, [])

  useEffect(() => {
    if (typeof window === 'undefined') return

    console.log('🔌 Initializing Socket.IO connection...')
    
    // Create socket connection
    const socketInstance = io({
      transports: ['websocket', 'polling'],
      timeout: 20000,
      forceNew: false,
      autoConnect: true
    })

    // Set up connection event listeners
    socketInstance.on('connect', () => {
      console.log('✅ Connected to Socket.IO server:', socketInstance.id)
      setIsConnected(true)
      setConnectionError(null)

      // Auto-authenticate with session data if available
      if (session?.user) {
        const userData = {
          userId: session.user.email,
          email: session.user.email,
          name: session.user.name,
          role: determineUserRole(session.user)
        }
        
        console.log('🔑 Auto-authenticating with session data:', userData)
        socketInstance.emit('user:join', userData)
      }
    })

    socketInstance.on('disconnect', (reason) => {
      console.log('❌ Disconnected from Socket.IO server:', reason)
      setIsConnected(false)
      
      if (reason === 'io server disconnect') {
        // Server disconnected, try to reconnect
        console.log('🔄 Attempting to reconnect...')
        socketInstance.connect()
      }
    })

    socketInstance.on('connect_error', (error) => {
      console.error('❌ Socket.IO connection error:', error)
      setConnectionError(error.message)
    })

    // Listen for offline message delivery notifications
    socketInstance.on('chat:offline_message_delivered', (data) => {
      console.log('📨 Offline message delivered:', data)
      setOfflineMessages(prev => [...prev, data.message])
      
      // Show notification to user
      if (typeof window !== 'undefined' && window.toast) {
        window.toast.info(`New message delivered while you were offline from ${data.message.senderName}`)
      }
    })

    // Listen for message delivery confirmations
    socketInstance.on('chat:message_delivered', (data) => {
      console.log('✅ Message delivered to offline user:', data)
      setDeliveryStatus(prev => ({
        ...prev,
        [data.messageId]: {
          status: 'delivered',
          deliveredTo: data.deliveredTo,
          deliveredAt: data.deliveredAt
        }
      }))
    })

    // Listen for authentication confirmation
    socketInstance.on('user:authenticated', (data) => {
      console.log('🔑 User authenticated:', data)
    })

    // Enhanced error handling
    socketInstance.on('error', (error) => {
      console.error('❌ Socket error:', error)
      if (typeof window !== 'undefined' && window.toast) {
        window.toast.error(`Connection error: ${error.message}`)
      }
    })

    // Connection health monitoring
    const pingInterval = setInterval(() => {
      if (socketInstance.connected) {
        socketInstance.emit('ping')
      }
    }, 30000) // Ping every 30 seconds

    socketInstance.on('pong', (data) => {
      console.log('🏓 Pong received:', data.timestamp)
    })

    setSocket(socketInstance)

    // Cleanup function
    return () => {
      console.log('🧹 Cleaning up Socket.IO connection')
      clearInterval(pingInterval)
      socketInstance.removeAllListeners()
      socketInstance.disconnect()
    }
  }, [session])

  // Re-authenticate when session changes
  useEffect(() => {
    if (socket && isConnected && session?.user) {
      const userData = {
        userId: session.user.email,
        email: session.user.email,
        name: session.user.name,
        role: determineUserRole(session.user)
      }

      console.log('🔄 Session changed, re-authenticating:', userData)
      socket.emit('user:join', userData)
    }
  }, [session, socket, isConnected])

  // Helper function to determine user role
  const determineUserRole = (user) => {
    // ✅ FIXED: Check for proper role values (case-insensitive)
    const userRole = user.role?.toUpperCase()
    if (userRole === 'PROVIDER' || userRole === 'ADMIN' || user.email?.includes('provider')) {
      return 'provider'
    }
    // Default to customer
    return 'customer'
  }

  // Function to clear offline messages
  const clearOfflineMessages = () => {
    setOfflineMessages([])
  }

  // Function to get delivery status for a message
  const getMessageDeliveryStatus = (messageId) => {
    return deliveryStatus[messageId] || { status: 'sent' }
  }

  return {
    socket,
    isConnected,
    connectionError,
    offlineMessages,
    clearOfflineMessages,
    getMessageDeliveryStatus,
    connectionCount,
    connect,
    disconnect,
    reconnectAttempts: reconnectAttempts.current
  }
}

// Booking Chat Hook
export function useBookingChat(bookingId) {
  const { socket, isConnected, offlineMessages, getMessageDeliveryStatus } = useSocket()
  const { data: session } = useSession()
  const [messages, setMessages] = useState([])
  const [typingUsers, setTypingUsers] = useState([])
  const [roomInfo, setRoomInfo] = useState(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)
  const [isJoinedToRoom, setIsJoinedToRoom] = useState(false)
  const [messageHistory, setMessageHistory] = useState([])
  const [unreadCount, setUnreadCount] = useState(0)
  const typingTimeoutRef = useRef(null)

  // Load message history when bookingId changes
  useEffect(() => {
    if (bookingId) {
      loadMessageHistory()
    }
  }, [bookingId])

  // Join booking room when socket is connected and session is available
  useEffect(() => {
    if (socket && session?.user && bookingId && !isJoinedToRoom) {
      console.log(`🚪 Joining booking room: ${bookingId}`)
      
      const userRole = determineUserRole(session.user)
      
      socket.emit('booking:join', {
        bookingId,
        userRole,
        userId: session.user.email,
        userName: session.user.name
      })
    }
  }, [socket, session, bookingId, isJoinedToRoom])

  // Set up socket event listeners
  useEffect(() => {
    if (!socket) return

    const handleNewMessage = (message) => {
      console.log('📨 New message received:', message)
      setMessages(prev => {
        // Check if message already exists (prevent duplicates)
        const exists = prev.some(m => m.messageId === message.messageId)
        if (exists) return prev
        
        return [...prev, message].sort((a, b) => new Date(a.timestamp) - new Date(b.timestamp))
      })
      
      // If message is not from current user, increment unread count
      if (message.senderId !== session?.user?.email) {
        setUnreadCount(prev => prev + 1)
      }
    }

    const handleRoomJoined = (data) => {
      console.log('🎉 Successfully joined booking room:', data)
      setRoomInfo(data)
      setIsJoinedToRoom(true)
      setLoading(false)
    }

    const handleUserJoined = (data) => {
      console.log('👤 User joined room:', data.userName)
    }

    const handleUserLeft = (data) => {
      console.log('👋 User left room:', data.userName)
    }

    const handleTyping = (data) => {
      setTypingUsers(prev => {
        const filtered = prev.filter(user => user.userId !== data.userId)
        if (data.isTyping) {
          return [...filtered, data]
        }
        return filtered
      })
      
      // Clear typing indicator after 3 seconds
      if (data.isTyping) {
        setTimeout(() => {
          setTypingUsers(prev => prev.filter(user => user.userId !== data.userId))
        }, 3000)
      }
    }

    const handleMessageSent = (data) => {
      console.log('✅ Message sent confirmation:', data)
      // Update message status in UI if needed
    }

    const handleMessageRead = (data) => {
      console.log('👁️ Message read:', data)
      // Update read receipts in UI
      setMessages(prev => prev.map(msg => 
        msg.messageId === data.messageId 
          ? { ...msg, isRead: true, readBy: [...(msg.readBy || []), data] }
          : msg
      ))
    }

    const handleRoomStatus = (data) => {
      console.log('📊 Room status:', data)
      setRoomInfo(data)
      setIsJoinedToRoom(data.isJoined)
    }

    // Register event listeners
    socket.on('chat:new_message', handleNewMessage)
    socket.on('booking:room_joined', handleRoomJoined)
    socket.on('booking:user_joined', handleUserJoined)
    socket.on('booking:user_left', handleUserLeft)
    socket.on('chat:user_typing', handleTyping)
    socket.on('chat:message_sent', handleMessageSent)
    socket.on('chat:message_read', handleMessageRead)
    socket.on('room:status_response', handleRoomStatus)

    // Cleanup function
    return () => {
      socket.off('chat:new_message', handleNewMessage)
      socket.off('booking:room_joined', handleRoomJoined)
      socket.off('booking:user_joined', handleUserJoined)
      socket.off('booking:user_left', handleUserLeft)
      socket.off('chat:user_typing', handleTyping)
      socket.off('chat:message_sent', handleMessageSent)
      socket.off('chat:message_read', handleMessageRead)
      socket.off('room:status_response', handleRoomStatus)
    }
  }, [socket, session])

  // Merge offline messages with regular messages
  useEffect(() => {
    if (offlineMessages.length > 0) {
      const relevantOfflineMessages = offlineMessages.filter(msg => msg.bookingId === bookingId)
      if (relevantOfflineMessages.length > 0) {
        setMessages(prev => {
          const combined = [...prev, ...relevantOfflineMessages]
          // Remove duplicates and sort by timestamp
          const unique = combined.filter((msg, index, self) => 
            self.findIndex(m => m.messageId === msg.messageId) === index
          )
          return unique.sort((a, b) => new Date(a.timestamp) - new Date(b.timestamp))
        })
      }
    }
  }, [offlineMessages, bookingId])

  // Load message history from API
  const loadMessageHistory = async () => {
    try {
      setLoading(true)
      console.log(`📥 Loading message history for bookingId: ${bookingId}`)
      const response = await fetch(`/api/chat/${bookingId}`)
      
      if (response.ok) {
        const data = await response.json()
        console.log(`📥 API Response:`, data)
        
        // Extract messages from the nested data structure
        const messages = data.data?.messages || data.messages || []
        const unreadCount = data.data?.unreadCount || data.unreadCount || 0
        
        console.log(`📥 Extracted ${messages.length} messages`)
        setMessageHistory(messages)
        setMessages(messages)
        setUnreadCount(unreadCount)
      } else {
        console.warn('Failed to load message history:', response.statusText)
        const errorData = await response.json()
        console.warn('Error response:', errorData)
      }
    } catch (error) {
      console.error('Error loading message history:', error)
      setError('Failed to load chat history')
    } finally {
      setLoading(false)
    }
  }

  // Send message function with enhanced offline support
  const sendMessage = (messageText, messageType = 'text') => {
    if (!socket || !isJoinedToRoom || !messageText.trim()) {
      console.warn('Cannot send message: socket not ready or message empty')
      return false
    }

    const messageData = {
      bookingId,
      message: messageText.trim(),
      messageType,
      timestamp: new Date()
    }

    console.log('📤 Sending message:', messageData)
    socket.emit('chat:send_message', messageData)
    return true
  }

  // Enhanced typing indicators with debouncing
  const startTyping = () => {
    if (socket && isJoinedToRoom) {
      socket.emit('chat:typing_start', { bookingId })
    }
  }

  const stopTyping = () => {
    if (socket && isJoinedToRoom) {
      socket.emit('chat:typing_stop', { bookingId })
    }
  }

  // Mark message as read
  const markMessageAsRead = (messageId) => {
    if (socket && isJoinedToRoom) {
      socket.emit('chat:mark_read', { messageId, bookingId })
      
      // Update local state
      setMessages(prev => prev.map(msg => 
        msg.messageId === messageId 
          ? { ...msg, isRead: true }
          : msg
      ))
      
      // Decrease unread count
      setUnreadCount(prev => Math.max(0, prev - 1))
    }
  }

  // Check room status
  const checkRoomStatus = () => {
    if (socket) {
      socket.emit('room:status', { bookingId })
    }
  }

  // Helper function to determine user role
  const determineUserRole = (user) => {
    // ✅ FIXED: Check for proper role values (case-insensitive)
    const userRole = user.role?.toUpperCase()
    if (userRole === 'PROVIDER' || userRole === 'ADMIN' || user.email?.includes('provider')) {
      return 'provider'
    }
    return 'customer'
  }

  // Get message delivery status
  const getMessageStatus = (messageId) => {
    return getMessageDeliveryStatus(messageId)
  }

  return {
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
    loadMessageHistory,
    getMessageStatus
  }
}

// Notifications Hook
export function useNotifications() {
  const { socket, isConnected } = useSocket()
  const [notifications, setNotifications] = useState([])

  const subscribeToNotifications = useCallback((notificationTypes = ['all']) => {
    if (!socket || !isConnected) return

    socket.emit('notification:subscribe', { notificationTypes })
  }, [socket, isConnected])

  useEffect(() => {
    if (!socket) return

    const handleNewNotification = (notification) => {
      setNotifications(prev => [notification, ...prev])
    }

    socket.on('notification:new', handleNewNotification)

    return () => {
      socket.off('notification:new', handleNewNotification)
    }
  }, [socket])

  const clearNotifications = useCallback(() => {
    setNotifications([])
  }, [])

  const removeNotification = useCallback((notificationId) => {
    setNotifications(prev => prev.filter(n => n.id !== notificationId))
  }, [])

  return {
    notifications,
    subscribeToNotifications,
    clearNotifications,
    removeNotification
  }
} 