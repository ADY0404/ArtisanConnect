import React, { useState } from 'react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Switch } from '@/components/ui/switch'
import { 
  Settings,
  DollarSign,
  Bell,
  Shield,
  Globe,
  Save,
  AlertCircle,
  CheckCircle2
} from 'lucide-react'
import { toast } from 'sonner'

function PlatformSettings({ stats, timeframe }) {
  const [settings, setSettings] = useState({
    // Commission & Pricing
    commissionRate: 15,
    currency: 'GHS',
    
    // Notifications
    emailNotifications: true,
    smsNotifications: false,
    pushNotifications: true,
    bookingAlerts: true,
    paymentAlerts: true,
    reviewAlerts: false,
    
    // Security
    twoFactorAuth: false,
    sessionTimeout: 30,
    
    // General
    platformName: 'ArtisanConnect',
    timezone: 'UTC',
    maintenanceMode: false
  })

  const [saving, setSaving] = useState(false)

  const handleSetting = (key, value) => {
    setSettings(prev => ({
      ...prev,
      [key]: value
    }))
  }

  const handleSave = async () => {
    try {
      setSaving(true)
      
      // Simulate API call
      await new Promise(resolve => setTimeout(resolve, 1000))
      
      // In real implementation, save to backend
      // const response = await fetch('/api/admin/settings', {
      //   method: 'PUT',
      //   headers: { 'Content-Type': 'application/json' },
      //   body: JSON.stringify(settings)
      // })
      
      toast.success('Settings saved successfully!')
    } catch (error) {
      console.error('Error saving settings:', error)
      toast.error('Failed to save settings')
    } finally {
      setSaving(false)
    }
  }

  return (
    <div className="space-y-6">
      {/* Commission & Pricing Settings */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <DollarSign className="w-5 h-5" />
            Commission & Pricing
          </CardTitle>
          <CardDescription>
            Configure platform commission rates and pricing settings
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <label className="text-sm font-medium">Commission Rate (%)</label>
              <Input
                type="number"
                value={settings.commissionRate}
                onChange={(e) => handleSetting('commissionRate', parseFloat(e.target.value))}
                min="0"
                max="50"
                step="0.1"
              />
              <p className="text-xs text-gray-500">
                Current rate: {settings.commissionRate}% per transaction
              </p>
            </div>
            
            <div className="space-y-2">
              <label className="text-sm font-medium">Currency</label>
              <select
                value={settings.currency}
                onChange={(e) => handleSetting('currency', e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-md text-sm"
              >
                <option value="GHS">GHS - Ghana Cedi</option>
                <option value="USD">USD - US Dollar</option>
                <option value="EUR">EUR - Euro</option>
                <option value="GBP">GBP - British Pound</option>
              </select>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Notification Settings */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Bell className="w-5 h-5" />
            Notification Settings
          </CardTitle>
          <CardDescription>
            Configure how the platform sends notifications
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="font-medium">Email Notifications</p>
                <p className="text-sm text-gray-500">Send notifications via email</p>
              </div>
              <Switch
                checked={settings.emailNotifications}
                onCheckedChange={(checked) => handleSetting('emailNotifications', checked)}
              />
            </div>

            <div className="flex items-center justify-between">
              <div>
                <p className="font-medium">SMS Notifications</p>
                <p className="text-sm text-gray-500">Send notifications via SMS</p>
              </div>
              <Switch
                checked={settings.smsNotifications}
                onCheckedChange={(checked) => handleSetting('smsNotifications', checked)}
              />
            </div>

            <div className="flex items-center justify-between">
              <div>
                <p className="font-medium">Push Notifications</p>
                <p className="text-sm text-gray-500">Send browser push notifications</p>
              </div>
              <Switch
                checked={settings.pushNotifications}
                onCheckedChange={(checked) => handleSetting('pushNotifications', checked)}
              />
            </div>
          </div>

          <div className="border-t pt-4">
            <h4 className="text-sm font-medium mb-3">Notification Types</h4>
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <span className="text-sm">Booking Alerts</span>
                <Switch
                  checked={settings.bookingAlerts}
                  onCheckedChange={(checked) => handleSetting('bookingAlerts', checked)}
                />
              </div>
              <div className="flex items-center justify-between">
                <span className="text-sm">Payment Alerts</span>
                <Switch
                  checked={settings.paymentAlerts}
                  onCheckedChange={(checked) => handleSetting('paymentAlerts', checked)}
                />
              </div>
              <div className="flex items-center justify-between">
                <span className="text-sm">Review Alerts</span>
                <Switch
                  checked={settings.reviewAlerts}
                  onCheckedChange={(checked) => handleSetting('reviewAlerts', checked)}
                />
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Security Settings */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Shield className="w-5 h-5" />
            Security Settings
          </CardTitle>
          <CardDescription>
            Configure platform security and authentication settings
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex items-center justify-between">
            <div>
              <p className="font-medium">Two-Factor Authentication</p>
              <p className="text-sm text-gray-500">Require 2FA for admin accounts</p>
            </div>
            <Switch
              checked={settings.twoFactorAuth}
              onCheckedChange={(checked) => handleSetting('twoFactorAuth', checked)}
            />
          </div>

          <div className="space-y-2">
            <label className="text-sm font-medium">Session Timeout (minutes)</label>
            <select
              value={settings.sessionTimeout}
              onChange={(e) => handleSetting('sessionTimeout', parseInt(e.target.value))}
              className="w-full px-3 py-2 border border-gray-300 rounded-md text-sm"
            >
              <option value={15}>15 minutes</option>
              <option value={30}>30 minutes</option>
              <option value={60}>1 hour</option>
              <option value={120}>2 hours</option>
              <option value={480}>8 hours</option>
            </select>
          </div>
        </CardContent>
      </Card>

      {/* General Settings */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Globe className="w-5 h-5" />
            General Settings
          </CardTitle>
          <CardDescription>
            General platform configuration and preferences
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-2">
            <label className="text-sm font-medium">Platform Name</label>
            <Input
              value={settings.platformName}
              onChange={(e) => handleSetting('platformName', e.target.value)}
              placeholder="Enter platform name"
            />
          </div>

          <div className="space-y-2">
            <label className="text-sm font-medium">Timezone</label>
            <select
              value={settings.timezone}
              onChange={(e) => handleSetting('timezone', e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-md text-sm"
            >
              <option value="UTC">UTC</option>
              <option value="America/New_York">Eastern Time</option>
              <option value="America/Chicago">Central Time</option>
              <option value="America/Denver">Mountain Time</option>
              <option value="America/Los_Angeles">Pacific Time</option>
              <option value="Europe/London">London</option>
              <option value="Europe/Paris">Paris</option>
            </select>
          </div>

          <div className="flex items-center justify-between">
            <div>
              <p className="font-medium">Maintenance Mode</p>
              <p className="text-sm text-gray-500">Temporarily disable platform access</p>
            </div>
            <Switch
              checked={settings.maintenanceMode}
              onCheckedChange={(checked) => handleSetting('maintenanceMode', checked)}
            />
          </div>

          {settings.maintenanceMode && (
            <div className="flex items-center gap-2 p-3 bg-yellow-50 border border-yellow-200 rounded-md">
              <AlertCircle className="w-4 h-4 text-yellow-600" />
              <p className="text-sm text-yellow-800">
                Platform is currently in maintenance mode. Users will see a maintenance page.
              </p>
            </div>
          )}
        </CardContent>
      </Card>

      {/* System Information */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Settings className="w-5 h-5" />
            System Information
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-3">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <p className="text-sm text-gray-600">Platform Version</p>
              <p className="font-medium">v1.0.0</p>
            </div>
            <div>
              <p className="text-sm text-gray-600">Database Status</p>
              <div className="flex items-center gap-2">
                <CheckCircle2 className="w-4 h-4 text-green-500" />
                <span className="text-sm">Connected</span>
              </div>
            </div>
            <div>
              <p className="text-sm text-gray-600">Last Update</p>
              <p className="font-medium">Dec 22, 2024</p>
            </div>
            <div>
              <p className="text-sm text-gray-600">Uptime</p>
              <p className="font-medium">99.9%</p>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Save Button */}
      <div className="flex justify-end">
        <Button 
          onClick={handleSave} 
          disabled={saving}
          className="min-w-32"
        >
          {saving ? (
            <>
              <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
              Saving...
            </>
          ) : (
            <>
              <Save className="w-4 h-4 mr-2" />
              Save Settings
            </>
          )}
        </Button>
      </div>
    </div>
  )
}

export default PlatformSettings

