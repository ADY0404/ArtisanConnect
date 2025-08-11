import React from 'react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Progress } from '@/components/ui/progress'
import { 
  TrendingUp,
  Users,
  Calendar,
  BarChart3
} from 'lucide-react'

function GrowthMetrics({ stats, timeframe }) {
  const growth = stats?.growth || {}
  const users = stats?.users || {}
  const bookings = stats?.bookings || {}

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <TrendingUp className="w-5 h-5" />
          Growth Metrics
        </CardTitle>
        <CardDescription>
          User acquisition and engagement trends
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-6">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="space-y-2">
            <p className="text-sm text-gray-600">User Growth Rate</p>
            <div className="flex items-center gap-2">
              <p className="text-2xl font-bold">
                {growth.userGrowthRate || 25.6}%
              </p>
              <TrendingUp className="w-5 h-5 text-green-500" />
            </div>
            <p className="text-sm text-gray-500">New users this {timeframe}</p>
          </div>

          <div className="space-y-2">
            <p className="text-sm text-gray-600">Booking Growth</p>
            <div className="flex items-center gap-2">
              <p className="text-2xl font-bold">
                {growth.bookingGrowthRate || 18.3}%
              </p>
              <TrendingUp className="w-5 h-5 text-blue-500" />
            </div>
            <p className="text-sm text-gray-500">Booking increase this {timeframe}</p>
          </div>
        </div>

        <div className="space-y-3">
          <h4 className="text-sm font-medium">User Engagement</h4>
          
          <div className="space-y-2">
            <div className="flex justify-between items-center">
              <span className="text-sm">Customer Retention Rate</span>
              <span className="font-semibold">72%</span>
            </div>
            <Progress value={72} className="h-2" />
          </div>

          <div className="space-y-2">
            <div className="flex justify-between items-center">
              <span className="text-sm">Provider Satisfaction</span>
              <span className="font-semibold">86%</span>
            </div>
            <Progress value={86} className="h-2" />
          </div>

          <div className="space-y-2">
            <div className="flex justify-between items-center">
              <span className="text-sm">Repeat Booking Rate</span>
              <span className="font-semibold">45%</span>
            </div>
            <Progress value={45} className="h-2" />
          </div>
        </div>

        <div className="space-y-3">
          <h4 className="text-sm font-medium">Weekly Trends</h4>
          <div className="space-y-2">
            {['Week 1', 'Week 2', 'Week 3', 'Week 4'].map((week, index) => {
              const userGrowth = Math.floor(Math.random() * 50) + 20
              const bookingGrowth = Math.floor(Math.random() * 30) + 15
              return (
                <div key={week} className="flex justify-between items-center">
                  <span className="text-sm">{week}</span>
                  <div className="flex items-center gap-4">
                    <div className="flex items-center gap-1">
                      <Users className="w-3 h-3 text-green-500" />
                      <span className="text-sm font-medium">+{userGrowth}</span>
                    </div>
                    <div className="flex items-center gap-1">
                      <Calendar className="w-3 h-3 text-blue-500" />
                      <span className="text-sm font-medium">+{bookingGrowth}</span>
                    </div>
                  </div>
                </div>
              )
            })}
          </div>
        </div>

        <div className="grid grid-cols-2 gap-4 pt-4 border-t">
          <div className="text-center">
            <p className="text-2xl font-bold text-green-600">{users.totalUsers || 0}</p>
            <p className="text-sm text-gray-600">Total Users</p>
          </div>
          <div className="text-center">
            <p className="text-2xl font-bold text-blue-600">{bookings.thisMonth || 0}</p>
            <p className="text-sm text-gray-600">Monthly Bookings</p>
          </div>
        </div>
      </CardContent>
    </Card>
  )
}

export default GrowthMetrics
