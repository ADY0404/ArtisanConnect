'use client'

import React, { useState, useEffect } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Progress } from '@/components/ui/progress'
import { 
  AlertTriangle, 
  CheckCircle, 
  Users, 
  Database,
  RefreshCw,
  Play,
  BarChart3
} from 'lucide-react'
import { toast } from 'sonner'

function ProviderTierMigration() {
  const [migrationStatus, setMigrationStatus] = useState(null)
  const [isLoading, setIsLoading] = useState(true)
  const [isMigrating, setIsMigrating] = useState(false)
  const [migrationResults, setMigrationResults] = useState(null)

  useEffect(() => {
    checkMigrationStatus()
  }, [])

  const checkMigrationStatus = async () => {
    try {
      setIsLoading(true)
      const response = await fetch('/api/admin/migrate-provider-tiers')
      if (response.ok) {
        const data = await response.json()
        setMigrationStatus(data)
      } else {
        throw new Error('Failed to check migration status')
      }
    } catch (error) {
      console.error('Error checking migration status:', error)
      toast.error('Failed to check migration status')
    } finally {
      setIsLoading(false)
    }
  }

  const runMigration = async () => {
    try {
      setIsMigrating(true)
      const response = await fetch('/api/admin/migrate-provider-tiers', {
        method: 'POST'
      })

      if (response.ok) {
        const data = await response.json()
        setMigrationResults(data.results)
        toast.success(`Migration completed! ${data.results.migrated} providers migrated successfully.`)
        
        // Refresh status
        await checkMigrationStatus()
      } else {
        const error = await response.json()
        throw new Error(error.error || 'Migration failed')
      }
    } catch (error) {
      console.error('Migration error:', error)
      toast.error(error.message || 'Migration failed')
    } finally {
      setIsMigrating(false)
    }
  }

  if (isLoading) {
    return (
      <Card>
        <CardContent className="p-6">
          <div className="animate-pulse space-y-4">
            <div className="h-4 bg-gray-200 rounded w-1/2"></div>
            <div className="h-8 bg-gray-200 rounded"></div>
            <div className="h-4 bg-gray-200 rounded w-3/4"></div>
          </div>
        </CardContent>
      </Card>
    )
  }

  if (!migrationStatus) {
    return (
      <Card>
        <CardContent className="p-6">
          <p className="text-gray-500">Unable to load migration status</p>
        </CardContent>
      </Card>
    )
  }

  const { migration, tierDistribution } = migrationStatus
  const migrationProgress = migration.totalProviders > 0 
    ? (migration.migratedProviders / migration.totalProviders) * 100 
    : 0

  return (
    <div className="space-y-6">
      {/* Migration Status Card */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <CardTitle className="flex items-center gap-2">
              <Database className="w-5 h-5" />
              Provider Tier Migration Status
            </CardTitle>
            <Button
              variant="outline"
              size="sm"
              onClick={checkMigrationStatus}
              disabled={isLoading}
            >
              <RefreshCw className="w-4 h-4 mr-2" />
              Refresh
            </Button>
          </div>
        </CardHeader>
        <CardContent className="space-y-6">
          {/* Migration Progress */}
          <div>
            <div className="flex items-center justify-between mb-2">
              <span className="text-sm font-medium">Migration Progress</span>
              <span className="text-sm text-gray-600">
                {migration.migratedProviders} / {migration.totalProviders} providers
              </span>
            </div>
            <Progress value={migrationProgress} className="mb-2" />
            <p className="text-xs text-gray-500">
              {migrationProgress.toFixed(1)}% of providers have tier properties assigned
            </p>
          </div>

          {/* Status Summary */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="text-center p-4 bg-blue-50 rounded-lg">
              <Users className="w-8 h-8 text-blue-600 mx-auto mb-2" />
              <p className="text-2xl font-bold text-blue-600">{migration.totalProviders}</p>
              <p className="text-sm text-blue-600">Total Providers</p>
            </div>
            
            <div className="text-center p-4 bg-green-50 rounded-lg">
              <CheckCircle className="w-8 h-8 text-green-600 mx-auto mb-2" />
              <p className="text-2xl font-bold text-green-600">{migration.migratedProviders}</p>
              <p className="text-sm text-green-600">Migrated</p>
            </div>
            
            <div className="text-center p-4 bg-orange-50 rounded-lg">
              <AlertTriangle className="w-8 h-8 text-orange-600 mx-auto mb-2" />
              <p className="text-2xl font-bold text-orange-600">{migration.needsMigration}</p>
              <p className="text-sm text-orange-600">Needs Migration</p>
            </div>
          </div>

          {/* Migration Action */}
          {migration.needsMigration > 0 ? (
            <div className="p-4 bg-yellow-50 border border-yellow-200 rounded-lg">
              <div className="flex items-start gap-3">
                <AlertTriangle className="w-5 h-5 text-yellow-600 mt-0.5" />
                <div className="flex-1">
                  <h4 className="font-medium text-yellow-800">Migration Required</h4>
                  <p className="text-sm text-yellow-700 mt-1">
                    {migration.needsMigration} providers don't have tier properties assigned. 
                    Run the migration to assign tiers based on their current performance.
                  </p>
                  <Button
                    onClick={runMigration}
                    disabled={isMigrating}
                    className="mt-3"
                  >
                    {isMigrating ? (
                      <>
                        <RefreshCw className="w-4 h-4 mr-2 animate-spin" />
                        Migrating...
                      </>
                    ) : (
                      <>
                        <Play className="w-4 h-4 mr-2" />
                        Run Migration
                      </>
                    )}
                  </Button>
                </div>
              </div>
            </div>
          ) : (
            <div className="p-4 bg-green-50 border border-green-200 rounded-lg">
              <div className="flex items-center gap-3">
                <CheckCircle className="w-5 h-5 text-green-600" />
                <div>
                  <h4 className="font-medium text-green-800">Migration Complete</h4>
                  <p className="text-sm text-green-700">
                    All providers have tier properties assigned. No migration needed.
                  </p>
                </div>
              </div>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Tier Distribution */}
      {Object.keys(tierDistribution).length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <BarChart3 className="w-5 h-5" />
              Current Tier Distribution
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              {Object.entries(tierDistribution).map(([tier, count]) => {
                const tierColors = {
                  NEW: 'bg-gray-100 text-gray-800',
                  VERIFIED: 'bg-blue-100 text-blue-800',
                  PREMIUM: 'bg-purple-100 text-purple-800',
                  ENTERPRISE: 'bg-green-100 text-green-800'
                }
                
                return (
                  <div key={tier} className="text-center">
                    <Badge className={`${tierColors[tier]} text-lg px-3 py-1 mb-2`}>
                      {tier}
                    </Badge>
                    <p className="text-2xl font-bold">{count}</p>
                    <p className="text-sm text-gray-600">providers</p>
                  </div>
                )
              })}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Migration Results */}
      {migrationResults && (
        <Card>
          <CardHeader>
            <CardTitle>Last Migration Results</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <span>Total Processed:</span>
                <Badge variant="secondary">{migrationResults.total}</Badge>
              </div>
              <div className="flex items-center justify-between">
                <span>Successfully Migrated:</span>
                <Badge className="bg-green-100 text-green-800">{migrationResults.migrated}</Badge>
              </div>
              <div className="flex items-center justify-between">
                <span>Errors:</span>
                <Badge variant={migrationResults.errors.length > 0 ? "destructive" : "secondary"}>
                  {migrationResults.errors.length}
                </Badge>
              </div>

              {migrationResults.errors.length > 0 && (
                <div className="mt-4">
                  <h4 className="font-medium text-red-800 mb-2">Migration Errors:</h4>
                  <div className="space-y-2">
                    {migrationResults.errors.map((error, index) => (
                      <div key={index} className="p-2 bg-red-50 border border-red-200 rounded text-sm">
                        <strong>{error.providerEmail}:</strong> {error.error}
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {migrationResults.details.length > 0 && (
                <div className="mt-4">
                  <h4 className="font-medium mb-2">Migration Details:</h4>
                  <div className="max-h-40 overflow-y-auto space-y-1">
                    {migrationResults.details.slice(0, 10).map((detail, index) => (
                      <div key={index} className="flex items-center justify-between text-sm p-2 bg-gray-50 rounded">
                        <span>{detail.providerEmail}</span>
                        <Badge className={`${
                          detail.assignedTier === 'NEW' ? 'bg-gray-100 text-gray-800' :
                          detail.assignedTier === 'VERIFIED' ? 'bg-blue-100 text-blue-800' :
                          detail.assignedTier === 'PREMIUM' ? 'bg-purple-100 text-purple-800' :
                          'bg-green-100 text-green-800'
                        }`}>
                          {detail.assignedTier}
                        </Badge>
                      </div>
                    ))}
                    {migrationResults.details.length > 10 && (
                      <p className="text-xs text-gray-500 text-center">
                        ... and {migrationResults.details.length - 10} more
                      </p>
                    )}
                  </div>
                </div>
              )}
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  )
}

export default ProviderTierMigration
