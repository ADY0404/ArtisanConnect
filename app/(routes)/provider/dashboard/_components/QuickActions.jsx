import React from 'react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { 
  Plus,
  Calendar,
  MessageCircle,
  FileText,
  Settings,
  Camera,
  Star,
  Users,
  TrendingUp,
  Clock,
  Bell,
  DollarSign,
  Package,
  User,
  Shield
} from 'lucide-react'
import Link from 'next/link'

function QuickActions({ stats, recentActivity }) {
  const {
    pendingBookings = 0,
    unreadMessages = 0,
    todayBookings = 0,
    pendingReviews = 0
  } = stats || {}

  const quickActionItems = [
    {
      id: 'enhanced-registration',
      title: 'Enhanced Registration',
      description: 'Advanced verification & auto-fill',
      icon: <Shield className="w-5 h-5" />,
      href: '/provider/register?tab=enhanced',
      color: 'bg-purple-500 hover:bg-purple-600',
      badge: 'Beta'
    },
    {
      id: 'business-profile',
      title: 'Business Profile',
      description: 'Edit business info & images',
      icon: <User className="w-5 h-5" />,
      href: '/provider/profile',
      color: 'bg-orange-500 hover:bg-orange-600'
    },
    {
      id: 'work-progress',
      title: 'Work Progress',
      description: 'Track active jobs',
      icon: <Clock className="w-5 h-5" />,
      href: '/provider/work-progress',
      color: 'bg-green-500 hover:bg-green-600',
      count: stats?.activeJobs || 0,
      countLabel: 'active'
    },
    {
      id: 'quotes',
      title: 'Create Quote',
      description: 'Digital estimates',
      icon: <FileText className="w-5 h-5" />,
      href: '/provider/quotes',
      color: 'bg-blue-500 hover:bg-blue-600'
    },
    {
      id: 'services',
      title: 'Service Packages',
      description: 'Manage pricing & bundles',
      icon: <Settings className="w-5 h-5" />,
      href: '/provider/services',
      color: 'bg-cyan-500 hover:bg-cyan-600'
    },
    {
      id: 'customers',
      title: 'Customer CRM',
      description: 'Manage relationships',
      icon: <Users className="w-5 h-5" />,
      href: '/provider/customers',
      color: 'bg-teal-500 hover:bg-teal-600'
    },
    {
      id: 'marketing',
      title: 'Portfolio & Marketing',
      description: 'Showcase & promote',
      icon: <Camera className="w-5 h-5" />,
      href: '/provider/marketing',
      color: 'bg-pink-500 hover:bg-pink-600'
    },
    {
      id: 'view-bookings',
      title: 'Bookings',
      description: 'Manage appointments',
      icon: <Calendar className="w-5 h-5" />,
      href: '#bookings',
      color: 'bg-indigo-500 hover:bg-indigo-600',
      count: pendingBookings,
      countLabel: 'pending'
    },
    {
      id: 'messages',
      title: 'Messages',
      description: 'Chat with customers',
      icon: <MessageCircle className="w-5 h-5" />,
      href: '/provider/messages',
      color: 'bg-purple-500 hover:bg-purple-600',
      count: unreadMessages,
      countLabel: 'unread'
    },
    {
      id: 'earnings',
      title: 'Earnings',
      description: 'View income',
      icon: <DollarSign className="w-5 h-5" />,
      href: '/provider/earnings',
      color: 'bg-emerald-500 hover:bg-emerald-600'
    }
  ]

  return (
    <div className="space-y-6">
      {/* Quick Action Buttons */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Plus className="w-5 h-5" />
            Quick Actions
          </CardTitle>
          <CardDescription>
            Common tasks and shortcuts for your business
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-3 gap-4">
            {quickActionItems.map((action) => (
              <Link key={action.id} href={action.href}>
                <div className="group cursor-pointer">
                  <div className={`
                    ${action.color} text-white p-4 rounded-lg text-center
                    transition-all duration-200 hover:shadow-lg hover:scale-105
                    relative overflow-hidden
                  `}>
                    {/* Notification Badge */}
                    {action.count > 0 && (
                      <Badge className="absolute -top-2 -right-2 bg-red-500 text-white min-w-[20px] h-5 flex items-center justify-center text-xs">
                        {action.count > 99 ? '99+' : action.count}
                      </Badge>
                    )}
                    
                    {/* Beta Badge for Enhanced Registration */}
                    {action.badge && (
                      <Badge className="absolute -top-2 -right-2 bg-purple-500 text-white min-w-[20px] h-5 flex items-center justify-center text-xs">
                        {action.badge}
                      </Badge>
                    )}
                    
                    <div className="mb-2">{action.icon}</div>
                    <h3 className="font-semibold text-sm mb-1">{action.title}</h3>
                    <p className="text-xs opacity-90">{action.description}</p>
                    
                    {action.count > 0 && (
                      <p className="text-xs mt-1 font-medium">
                        {action.count} {action.countLabel}
                      </p>
                    )}
                  </div>
                </div>
              </Link>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Today's Schedule */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Clock className="w-5 h-5" />
            Today's Schedule
          </CardTitle>
          <CardDescription>
            Your appointments for today
          </CardDescription>
        </CardHeader>
        <CardContent>
          {todayBookings > 0 ? (
            <div className="space-y-3">
              <div className="flex items-center justify-between p-3 bg-blue-50 rounded-lg">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 bg-blue-600 rounded-full flex items-center justify-center text-white font-medium">
                    <Calendar className="w-5 h-5" />
                  </div>
                  <div>
                    <h4 className="font-medium">Today's Bookings</h4>
                    <p className="text-sm text-gray-600">
                      You have {todayBookings} appointment{todayBookings !== 1 ? 's' : ''} scheduled
                    </p>
                  </div>
                </div>
                <Link href="#bookings">
                  <Button size="sm">View All</Button>
                </Link>
              </div>
              
              {/* Sample upcoming booking */}
              <div className="flex items-center justify-between p-3 border rounded-lg">
                <div className="flex items-center gap-3">
                  <div className="w-8 h-8 bg-gray-200 rounded-full flex items-center justify-center text-sm font-medium">
                    JD
                  </div>
                  <div>
                    <h5 className="font-medium text-sm">Next: John Doe</h5>
                    <p className="text-xs text-gray-600">10:00 AM - Plumbing repair</p>
                  </div>
                </div>
                <Badge variant="outline" className="text-xs">
                  In 30 min
                </Badge>
              </div>
            </div>
          ) : (
            <div className="text-center py-6 text-gray-500">
              <Calendar className="w-12 h-12 mx-auto mb-3 text-gray-300" />
              <h3 className="text-lg font-medium">No appointments today</h3>
              <p className="text-sm">Enjoy your free day or promote your services!</p>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Performance Tips */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <TrendingUp className="w-5 h-5" />
            Growth Tips
          </CardTitle>
          <CardDescription>
            Recommendations to improve your business
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-3">
            <div className="p-3 border-l-4 border-blue-400 bg-blue-50 rounded-r-lg">
              <h4 className="text-sm font-medium text-blue-900">Update Your Portfolio</h4>
              <p className="text-xs text-blue-700 mt-1">
                Providers with photos get 40% more bookings. Add recent work photos!
              </p>
            </div>
            
            <div className="p-3 border-l-4 border-green-400 bg-green-50 rounded-r-lg">
              <h4 className="text-sm font-medium text-green-900">Quick Response Time</h4>
              <p className="text-xs text-green-700 mt-1">
                Respond to messages within 1 hour to improve your ranking.
              </p>
            </div>
            
            <div className="p-3 border-l-4 border-purple-400 bg-purple-50 rounded-r-lg">
              <h4 className="text-sm font-medium text-purple-900">Service Availability</h4>
              <p className="text-xs text-purple-700 mt-1">
                Keep your calendar updated to receive more booking requests.
              </p>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}

export default QuickActions 