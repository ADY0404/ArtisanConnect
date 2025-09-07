"use client"
import React, { useState, useEffect } from 'react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { 
  Activity, 
  Server, 
  Database, 
  Wifi,
  AlertCircle,
  CheckCircle2,
  Clock,
  HardDrive,
  RefreshCw
} from 'lucide-react'
import { toast } from 'sonner'

function PlatformHealth({ health: initialHealth }) {
  const [health, setHealth] = useState(initialHealth)
  const [loading, setLoading] = useState(false)
  const [lastRefresh, setLastRefresh] = useState(new Date())

  // Auto-refresh every 30 seconds
  useEffect(() => {
    const interval = setInterval(() => {
      refreshHealth()
    }, 30000)

    return () => clearInterval(interval)
  }, [])

  const refreshHealth = async () => {
    try {
      setLoading(true)
      const response = await fetch('/api/admin/health')
      const data = await response.json()
      
      if (data.success) {
        setHealth(data.health)
        setLastRefresh(new Date())
      } else {
        throw new Error(data.error || 'Failed to fetch health data')
      }
    } catch (error) {
      console.error('Health refresh error:', error)
      toast.error('Failed to refresh health data')
    } finally {
      setLoading(false)
    }
  }
  if (!health) {
    return (
      <Card>
        <CardContent className="p-6">
          <div className="text-center text-gray-500">
            <Activity className="w-8 h-8 mx-auto mb-2 text-gray-300" />
            <p>Health data not available</p>
          </div>
        </CardContent>
      </Card>
    )
  }

  const formatUptime = (seconds) => {
    const days = Math.floor(seconds / 86400)
    const hours = Math.floor((seconds % 86400) / 3600)
    const minutes = Math.floor((seconds % 3600) / 60)
    
    if (days > 0) return `${days}d ${hours}h ${minutes}m`
    if (hours > 0) return `${hours}h ${minutes}m`
    return `${minutes}m`
  }

  const formatMemory = (bytes) => {
    const mb = bytes / 1024 / 1024
    return `${mb.toFixed(1)} MB`
  }

  const getStatusIcon = (status) => {
    switch (status) {
      case 'healthy':
        return <CheckCircle2 className="w-5 h-5 text-green-500" />
      case 'unhealthy':
      case 'error':
        return <AlertCircle className="w-5 h-5 text-red-500" />
      default:
        return <Activity className="w-5 h-5 text-yellow-500" />
    }
  }

  const getStatusColor = (status) => {
    switch (status) {
      case 'healthy':
        return 'bg-green-100 text-green-800 border-green-200'
      case 'unhealthy':
      case 'error':
        return 'bg-red-100 text-red-800 border-red-200'
      default:
        return 'bg-yellow-100 text-yellow-800 border-yellow-200'
    }
  }

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
          <div>
            <CardTitle className="flex items-center gap-2">
              <Activity className="w-5 h-5" />
              Platform Health
            </CardTitle>
            <CardDescription>
              Real-time system health and performance metrics
            </CardDescription>
          </div>
          <Button 
            variant="outline" 
            size="sm" 
            onClick={refreshHealth}
            disabled={loading}
          >
            <RefreshCw className={`w-4 h-4 mr-2 ${loading ? 'animate-spin' : ''}`} />
            Refresh
          </Button>
        </div>
      </CardHeader>
      <CardContent className="space-y-6">
        {/* Overall Status */}
        <div className="flex items-center justify-between p-4 bg-gray-50 rounded-lg">
          <div className="flex items-center gap-3">
            {getStatusIcon(health.status)}
            <div>
              <h3 className="font-semibold">Overall Status</h3>
              <p className="text-sm text-gray-600">
                {health.status === 'healthy' ? 'All systems operational' : 'Issues detected'}
              </p>
            </div>
          </div>
          <Badge className={getStatusColor(health.status)}>
            {health.status.toUpperCase()}
          </Badge>
        </div>

        {/* Issues List */}
        {health.issues && health.issues.length > 0 && (
          <div className="space-y-2">
            <h4 className="font-medium text-red-600">Active Issues</h4>
            {health.issues.map((issue, index) => (
              <div key={index} className="flex items-center gap-2 p-3 bg-red-50 border border-red-200 rounded-lg">
                <AlertCircle className="w-4 h-4 text-red-500 flex-shrink-0" />
                <span className="text-sm text-red-700">{issue}</span>
              </div>
            ))}
          </div>
        )}

        {/* System Metrics */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {/* Server Uptime */}
          <div className="space-y-2">
            <div className="flex items-center gap-2">
              <Clock className="w-4 h-4 text-gray-500" />
              <span className="text-sm font-medium">Server Uptime</span>
            </div>
            <div className="text-lg font-semibold text-gray-900">
              {formatUptime(health.uptime)}
            </div>
            <div className="text-xs text-gray-500">
              Started {new Date(Date.now() - health.uptime * 1000).toLocaleString()}
            </div>
          </div>

          {/* Memory Usage */}
          {health.memoryUsage && (
            <div className="space-y-2">
              <div className="flex items-center gap-2">
                <HardDrive className="w-4 h-4 text-gray-500" />
                <span className="text-sm font-medium">Memory Usage</span>
              </div>
              <div className="space-y-1">
                <div className="flex justify-between text-sm">
                  <span>Used:</span>
                  <span className="font-medium">{formatMemory(health.memoryUsage.used)}</span>
                </div>
                <div className="flex justify-between text-sm">
                  <span>Total:</span>
                  <span className="font-medium">{formatMemory(health.memoryUsage.total)}</span>
                </div>
                <div className="flex justify-between text-sm">
                  <span>Heap Used:</span>
                  <span className="font-medium">{formatMemory(health.memoryUsage.heapUsed)}</span>
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Database Status */}
        <div className="space-y-2">
          <div className="flex items-center gap-2">
            <Database className="w-4 h-4 text-gray-500" />
            <span className="text-sm font-medium">Database Connection</span>
          </div>
          <div className="flex items-center gap-2">
            {health.status === 'healthy' ? (
              <>
                <CheckCircle2 className="w-4 h-4 text-green-500" />
                <span className="text-sm text-green-600">Connected and operational</span>
              </>
            ) : (
              <>
                <AlertCircle className="w-4 h-4 text-red-500" />
                <span className="text-sm text-red-600">Connection issues detected</span>
              </>
            )}
          </div>
        </div>

        {/* API Status */}
        <div className="space-y-2">
          <div className="flex items-center gap-2">
            <Wifi className="w-4 h-4 text-gray-500" />
            <span className="text-sm font-medium">API Services</span>
          </div>
          <div className="grid grid-cols-2 gap-2 text-sm">
            <div className="flex items-center gap-2">
              <div className="w-2 h-2 bg-green-500 rounded-full"></div>
              <span>Authentication</span>
            </div>
            <div className="flex items-center gap-2">
              <div className="w-2 h-2 bg-green-500 rounded-full"></div>
              <span>Booking API</span>
            </div>
            <div className="flex items-center gap-2">
              <div className="w-2 h-2 bg-green-500 rounded-full"></div>
              <span>Chat System</span>
            </div>
            <div className="flex items-center gap-2">
              <div className="w-2 h-2 bg-green-500 rounded-full"></div>
              <span>File Upload</span>
            </div>
          </div>
        </div>

        {/* Last Updated */}
        <div className="pt-4 border-t border-gray-200">
          <div className="flex items-center justify-between text-xs text-gray-500">
            <span>Last updated: {lastRefresh.toLocaleTimeString()}</span>
            <span>Auto-refresh: 30s</span>
          </div>
        </div>
      </CardContent>
    </Card>
  )
}

export default PlatformHealth
