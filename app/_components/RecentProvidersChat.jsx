"use client"

import { useState, useEffect } from 'react'
import { MessageCircle, X, ChevronUp } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog'
import { useSession } from 'next-auth/react'
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar'
import ChatWindow from './ChatWindow'

export default function RecentProvidersChat() {
  const [isOpen, setIsOpen] = useState(false)
  const [isExpanded, setIsExpanded] = useState(false)
  const [recentProviders, setRecentProviders] = useState([])
  const [selectedProvider, setSelectedProvider] = useState(null)
  const [chatOpen, setChatOpen] = useState(false)
  const { data: session } = useSession()

  useEffect(() => {
    // Get recent providers from localStorage
    const getRecentProviders = () => {
      try {
        const recent = localStorage.getItem('recentProviders')
        if (recent) {
          const providers = JSON.parse(recent)
          // Keep only last 5 providers
          setRecentProviders(providers.slice(0, 5))
        }
      } catch (error) {
        console.error('Error loading recent providers:', error)
      }
    }

    getRecentProviders()
    
    // Listen for updates to recent providers
    const handleStorageChange = () => getRecentProviders()
    window.addEventListener('storage', handleStorageChange)
    
    return () => window.removeEventListener('storage', handleStorageChange)
  }, [])

  const startChat = (provider) => {
    setSelectedProvider(provider)
    setChatOpen(true)
    setIsOpen(false)
  }

  // Don't show if no session, no recent providers, or if user is admin/provider
  if (!session || recentProviders.length === 0 || 
      session.user.role === 'ADMIN' || session.user.role === 'PROVIDER') {
    return null
  }

  const directMessageId = selectedProvider 
    ? `dm_${selectedProvider.id}_${session?.user?.email?.replace(/[^a-zA-Z0-9]/g, '_')}`
    : null

  const directMessageBooking = selectedProvider ? {
    id: directMessageId,
    date: new Date().toISOString().split('T')[0],
    time: "Direct Message",
    status: "inquiry",
    userEmail: session?.user?.email,
    userName: session?.user?.name
  } : null

  return (
    <>
      {/* Recent Providers Quick Chat Button */}
      <div className="fixed bottom-24 right-6 z-40 hidden md:block">
        <Card className={`transition-all duration-300 ${isOpen ? 'w-80' : 'w-16'} ${isOpen ? 'h-auto' : 'h-16'}`}>
          {!isOpen ? (
            <Button
              onClick={() => setIsOpen(true)}
              className="w-14 h-14 rounded-full bg-blue-600 hover:bg-blue-700 text-white"
              title="Quick message recent providers"
            >
              <MessageCircle className="w-6 h-6" />
            </Button>
          ) : (
            <>
              <CardHeader className="pb-2">
                <div className="flex items-center justify-between">
                  <CardTitle className="text-sm">Quick Message</CardTitle>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => setIsOpen(false)}
                    className="h-6 w-6 p-0"
                  >
                    <X className="w-4 h-4" />
                  </Button>
                </div>
              </CardHeader>
              
              <CardContent className="pt-0">
                <div className="space-y-2">
                  {recentProviders.slice(0, isExpanded ? 5 : 3).map((provider) => (
                    <div
                      key={provider.id}
                      className="flex items-center gap-2 p-2 rounded-lg hover:bg-gray-50 cursor-pointer transition-colors"
                      onClick={() => startChat(provider)}
                    >
                      <Avatar className="w-8 h-8">
                        <AvatarImage src={provider.images?.[0]} />
                        <AvatarFallback className="text-xs">
                          {provider.name.charAt(0)}
                        </AvatarFallback>
                      </Avatar>
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-medium truncate">{provider.name}</p>
                        <p className="text-xs text-gray-500 truncate">{provider.category?.name}</p>
                      </div>
                      <MessageCircle className="w-4 h-4 text-blue-600" />
                    </div>
                  ))}
                  
                  {recentProviders.length > 3 && (
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => setIsExpanded(!isExpanded)}
                      className="w-full text-xs"
                    >
                      {isExpanded ? (
                        <>Show Less <ChevronUp className="w-3 h-3 ml-1" /></>
                      ) : (
                        <>Show More ({recentProviders.length - 3} more)</>
                      )}
                    </Button>
                  )}
                </div>
              </CardContent>
            </>
          )}
        </Card>
      </div>

      {/* Chat Dialog */}
      <Dialog open={chatOpen} onOpenChange={setChatOpen}>
        <DialogContent className="max-w-4xl max-h-[80vh] p-0">
          <DialogHeader className="px-6 py-4 border-b">
            <DialogTitle className="flex items-center gap-2">
              <MessageCircle className="w-5 h-5" />
              Chat with {selectedProvider?.name}
            </DialogTitle>
          </DialogHeader>
          
          <div className="h-[600px]">
            {chatOpen && selectedProvider && (
              <ChatWindow
                bookingId={directMessageId}
                businessInfo={selectedProvider}
                bookingDetails={directMessageBooking}
              />
            )}
          </div>
        </DialogContent>
      </Dialog>
    </>
  )
} 