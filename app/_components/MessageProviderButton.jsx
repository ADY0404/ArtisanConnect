"use client"

import { useState } from "react"
import { MessageCircle } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog"
import { useSession } from "next-auth/react"
import { toast } from "sonner"
import ChatWindow from "./ChatWindow"

export default function MessageProviderButton({ business }) {
  const [isOpen, setIsOpen] = useState(false)
  const { data: session } = useSession()

  const handleOpenChat = () => {
    if (!session) {
      toast.error("Please sign in to message providers", {
        action: {
          label: "Sign In",
          onClick: () => window.location.href = '/api/auth/signin'
        }
      })
      return
    }

    if (!business?.id) {
      toast.error("Business information not available")
      return
    }

    setIsOpen(true)
  }

  // Create a virtual booking ID for direct messaging (not tied to actual bookings)
  const directMessageId = `dm_${business?.id}_${session?.user?.email?.replace(/[^a-zA-Z0-9]/g, '_')}`

  // Virtual booking details for direct messaging
  const directMessageBooking = {
    id: directMessageId,
    date: new Date().toISOString().split('T')[0],
    time: "Direct Message",
    status: "inquiry",
    userEmail: session?.user?.email,
    userName: session?.user?.name
  }

  return (
    <>
      <Button 
        variant="outline" 
        className="w-full hover:bg-primary hover:text-white transition-colors"
        onClick={handleOpenChat}
      >
        <MessageCircle className="w-4 h-4 mr-2" />
        Message Provider
      </Button>

      <Dialog open={isOpen} onOpenChange={setIsOpen}>
        <DialogContent className="max-w-4xl max-h-[80vh] p-0">
          <DialogHeader className="px-6 py-4 border-b">
            <DialogTitle className="flex items-center gap-2">
              <MessageCircle className="w-5 h-5" />
              Chat with {business?.name}
            </DialogTitle>
          </DialogHeader>
          
          <div className="h-[600px]">
            {isOpen && (
              <ChatWindow
                bookingId={directMessageId}
                businessInfo={business}
                bookingDetails={directMessageBooking}
              />
            )}
          </div>
        </DialogContent>
      </Dialog>
    </>
  )
}
