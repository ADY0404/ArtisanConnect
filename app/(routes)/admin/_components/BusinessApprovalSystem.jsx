"use client"
import React, { useState, useEffect } from 'react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Textarea } from '@/components/ui/textarea'
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from '@/components/ui/dialog'
import { 
  CheckCircle2, 
  XCircle, 
  Eye, 
  FileText,
  User,
  Building,
  Phone,
  Mail,
  MapPin,
  Clock,
  AlertTriangle,
  Search,
  Filter
} from 'lucide-react'
import { toast } from 'sonner'

function BusinessApprovalSystem() {
  const [businesses, setBusinesses] = useState([])
  const [selectedBusiness, setSelectedBusiness] = useState(null)
  const [loading, setLoading] = useState(true)
  const [actionLoading, setActionLoading] = useState(false)
  const [migrationLoading, setMigrationLoading] = useState(false)
  const [filter, setFilter] = useState('ALL') // ALL, PENDING, NEEDS_REVIEW, REJECTED

  useEffect(() => {
    fetchPendingBusinesses()
  }, [])

  const fetchPendingBusinesses = async () => {
    try {
      setLoading(true)
      console.log('🔄 Fetching pending businesses...')
      const response = await fetch('/api/admin/pending-businesses')
      const data = await response.json()
      
      if (data.success) {
        console.log(`📋 Found ${data.businesses.length} businesses needing review:`, data.businesses.map(b => ({ name: b.name, status: b.approvalStatus })))
        setBusinesses(data.businesses)
      } else {
        throw new Error(data.error)
      }
    } catch (error) {
      console.error('Error fetching pending businesses:', error)
      toast.error('Failed to load pending businesses')
    } finally {
      setLoading(false)
    }
  }

  const handleBusinessAction = async (businessId, action, notes = '') => {
    try {
      setActionLoading(true)
      console.log(`🔄 Processing ${action} for business ${businessId}`)
      
      const response = await fetch('/api/admin/approve-business', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          businessId,
          action,
          adminNotes: notes
        })
      })

      const result = await response.json()
      console.log('📋 API Response:', result)
      
      if (result.success) {
        toast.success(`Business ${action}d successfully`)
        console.log('✅ Refreshing business list...')
        await fetchPendingBusinesses() // Refresh list
        setSelectedBusiness(null)
      } else {
        throw new Error(result.error)
      }
    } catch (error) {
      console.error('Error processing business:', error)
      toast.error(`Failed to ${action} business`)
    } finally {
      setActionLoading(false)
    }
  }

  const runMigration = async () => {
    try {
      setMigrationLoading(true)
      console.log('🔄 Running schema migration...')
      
      const response = await fetch('/api/admin/migrate-schema', {
        method: 'POST'
      })

      const result = await response.json()
      console.log('📋 Migration Result:', result)
      
      if (result.success) {
        toast.success(`Migration completed! Updated ${result.updatedCount} businesses`)
        console.log('✅ Refreshing business list after migration...')
        await fetchPendingBusinesses() // Refresh list
      } else {
        throw new Error(result.error)
      }
    } catch (error) {
      console.error('Error running migration:', error)
      toast.error('Migration failed')
    } finally {
      setMigrationLoading(false)
    }
  }

  const getStatusBadge = (status) => {
    const statusConfig = {
      'PENDING': { color: 'bg-yellow-100 text-yellow-800', label: 'Pending Review' },
      'UNDER_REVIEW': { color: 'bg-blue-100 text-blue-800', label: 'Under Review' },
      'NEEDS_DOCUMENTS': { color: 'bg-orange-100 text-orange-800', label: 'Needs Documents' },
      'NEEDS_REVIEW': { color: 'bg-purple-100 text-purple-800', label: 'Needs Review' },
      'APPROVED': { color: 'bg-green-100 text-green-800', label: 'Approved' },
      'REJECTED': { color: 'bg-red-100 text-red-800', label: 'Rejected' }
    }
    
    const config = statusConfig[status] || statusConfig['PENDING']
    return <Badge className={config.color}>{config.label}</Badge>
  }

  const filteredBusinesses = businesses.filter(business => {
    if (filter === 'ALL') return true
    return business.approvalStatus === filter
  })

  const getFilterCounts = () => {
    const counts = {
      ALL: businesses.length,
      PENDING: businesses.filter(b => b.approvalStatus === 'PENDING').length,
      NEEDS_REVIEW: businesses.filter(b => b.approvalStatus === 'NEEDS_REVIEW').length,
      REJECTED: businesses.filter(b => b.approvalStatus === 'REJECTED').length
    }
    return counts
  }

  const counts = getFilterCounts()

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Building className="w-5 h-5" />
            Business Registration Approvals
          </CardTitle>
          <CardDescription>
            Review and approve service provider business registrations
          </CardDescription>
          {/* Migration Button */}
          <div className="flex justify-end">
            <Button
              variant="outline"
              size="sm"
              onClick={runMigration}
              disabled={migrationLoading}
              className="flex items-center gap-2"
            >
              {migrationLoading ? (
                <>
                  <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-primary"></div>
                  Running Migration...
                </>
              ) : (
                <>
                  <AlertTriangle className="w-4 h-4" />
                  Fix Schema (Run Once)
                </>
              )}
            </Button>
          </div>
        </CardHeader>
        <CardContent>
          {/* Filter Tabs */}
          <div className="flex gap-2 mb-6 flex-wrap">
            <Button
              variant={filter === 'ALL' ? 'default' : 'outline'}
              size="sm"
              onClick={() => setFilter('ALL')}
            >
              All ({counts.ALL})
            </Button>
            <Button
              variant={filter === 'PENDING' ? 'default' : 'outline'}
              size="sm"
              onClick={() => setFilter('PENDING')}
            >
              Pending ({counts.PENDING})
            </Button>
            <Button
              variant={filter === 'NEEDS_REVIEW' ? 'default' : 'outline'}
              size="sm"
              onClick={() => setFilter('NEEDS_REVIEW')}
            >
              Needs Review ({counts.NEEDS_REVIEW})
            </Button>
            <Button
              variant={filter === 'REJECTED' ? 'default' : 'outline'}
              size="sm"
              onClick={() => setFilter('REJECTED')}
            >
              Rejected ({counts.REJECTED})
            </Button>
          </div>

          {loading ? (
            <div className="text-center py-8">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto"></div>
              <p className="mt-2 text-gray-600">Loading businesses...</p>
            </div>
          ) : filteredBusinesses.length === 0 ? (
            <div className="text-center py-8 text-gray-500">
              <Building className="w-12 h-12 mx-auto mb-4 text-gray-300" />
              <p>No businesses found for "{filter}" status</p>
            </div>
          ) : (
            <div className="space-y-4">
              {filteredBusinesses.map((business) => (
                <div key={business.id} className="border rounded-lg p-4 hover:shadow-md transition-shadow">
                  <div className="flex flex-col md:flex-row justify-between items-start gap-4">
                    <div className="flex-1">
                      <div className="flex items-center gap-3 mb-2">
                        <h3 className="font-semibold text-lg">{business.name}</h3>
                        {getStatusBadge(business.approvalStatus)}
                      </div>
                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-x-4 gap-y-2 text-sm text-gray-600">
                        <span className="flex items-center gap-1.5">
                          <User className="w-4 h-4 text-gray-400" />
                          {business.contactPerson || 'Not provided'}
                        </span>
                        <span className="flex items-center gap-1.5">
                          <Mail className="w-4 h-4 text-gray-400" />
                          {business.email}
                        </span>
                        <span className="flex items-center gap-1.5">
                          <Phone className="w-4 h-4 text-gray-400" />
                          {business.phone || 'Not provided'}
                        </span>
                        <span className="flex items-center gap-1.5">
                          <MapPin className="w-4 h-4 text-gray-400" />
                          {business.address || 'Not provided'}
                        </span>
                      </div>
                    </div>
                    <div className="flex items-center gap-2 w-full md:w-auto self-start md:self-center pt-2 md:pt-0">
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => setSelectedBusiness(business)}
                      >
                        <Eye className="w-4 h-4 mr-1" />
                        Review
                      </Button>
                    </div>
                  </div>

                  <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
                    <div>
                      <span className="text-gray-600">Category:</span>
                      <p className="font-medium">{business.category?.name || 'Unknown'}</p>
                    </div>
                    <div>
                      <span className="text-gray-600">Experience:</span>
                      <p className="font-medium">{business.experience || 'Not specified'}</p>
                    </div>
                    <div>
                      <span className="text-gray-600">Documents:</span>
                      <p className="font-medium">{business.documentsUploaded?.length || 0} files</p>
                    </div>
                    <div>
                      <span className="text-gray-600">Submitted:</span>
                      <p className="font-medium">{new Date(business.createdAt).toLocaleDateString()}</p>
                    </div>
                  </div>

                  {business.adminNotes && (
                    <div className="mt-3 p-2 bg-blue-50 rounded text-sm">
                      <strong>Admin Notes:</strong> {business.adminNotes}
                    </div>
                  )}
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Business Review Modal */}
      <Dialog open={!!selectedBusiness} onOpenChange={(open) => !open && setSelectedBusiness(null)}>
        <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto p-0 sm:max-w-[95vw]">
          <div className="p-6 max-h-[85vh] overflow-y-auto">
          {selectedBusiness && (
            <BusinessReviewModal 
              business={selectedBusiness}
              onAction={handleBusinessAction}
              onClose={() => setSelectedBusiness(null)}
              actionLoading={actionLoading}
            />
          )}
          </div>
        </DialogContent>
      </Dialog>
    </div>
  )
}

function BusinessReviewModal({ business, onAction, onClose, actionLoading }) {
  const [adminNotes, setAdminNotes] = useState('')

  return (
    <>
      <DialogHeader>
        <DialogTitle>Review Business Registration</DialogTitle>
        <DialogDescription>
          {business.name} - {business.contactPerson || business.email}
        </DialogDescription>
      </DialogHeader>
      
      <div className="space-y-6 mt-4">
        {/* Business Details */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div>
            <h4 className="font-semibold mb-2">Business Information</h4>
            <div className="space-y-2 text-sm">
              <p><strong>Name:</strong> {business.name}</p>
              <p><strong>Contact:</strong> {business.contactPerson || 'Not provided'}</p>
              <p><strong>Email:</strong> {business.email}</p>
              <p><strong>Phone:</strong> {business.phone || 'Not provided'}</p>
              <p><strong>Address:</strong> {business.address}</p>
              <p><strong>Category:</strong> {business.category?.name || 'Unknown'}</p>
              <p><strong>Provider Email:</strong> {business.providerEmail}</p>
            </div>
          </div>

          <div>
            <h4 className="font-semibold mb-2">Professional Details</h4>
            <div className="space-y-2 text-sm">
              <p><strong>Experience:</strong> {business.experience || 'Not specified'}</p>
              <p><strong>Specializations:</strong> {business.specializations?.join(', ') || 'None listed'}</p>
              <p><strong>Certifications:</strong> {business.certifications?.length || 0} listed</p>
              <p><strong>Current Status:</strong> 
                <span className="ml-2">
                  <Badge className={
                    business.approvalStatus === 'APPROVED' ? 'bg-green-100 text-green-800' :
                    business.approvalStatus === 'REJECTED' ? 'bg-red-100 text-red-800' :
                    'bg-yellow-100 text-yellow-800'
                  }>
                    {business.approvalStatus || 'NEEDS_REVIEW'}
                  </Badge>
                </span>
              </p>
            </div>
          </div>
        </div>

        <div>
          <h4 className="font-semibold mb-2">Business Description</h4>
          <p className="text-sm text-gray-700 bg-gray-50 p-3 rounded">
            {business.about}
          </p>
        </div>

        {/* Guarantor Information */}
        {business.guarantorInfo && Object.keys(business.guarantorInfo).length > 0 && (
          <div>
            <h4 className="font-semibold mb-2">Guarantor Information</h4>
            <div className="bg-gray-50 p-3 rounded space-y-1 text-sm">
              <p><strong>Name:</strong> {business.guarantorInfo.name || 'Not provided'}</p>
              <p><strong>Phone:</strong> {business.guarantorInfo.phone || 'Not provided'}</p>
              <p><strong>Relationship:</strong> {business.guarantorInfo.relationship || 'Not provided'}</p>
              <p><strong>Ghana Card:</strong> {business.guarantorInfo.ghanaCardNumber || 'Not provided'}</p>
            </div>
          </div>
        )}

        {/* Documents */}
        <div>
          <h4 className="font-semibold mb-2">Uploaded Documents ({business.documentsUploaded?.length || 0})</h4>
          {business.documentsUploaded?.length > 0 ? (
            <div className="space-y-3">
              {business.documentsUploaded.map((doc, index) => (
                <div key={index} className="flex items-center justify-between bg-gray-50 p-3 rounded-lg border">
                  <div className="flex items-center gap-3">
                    {doc.format?.toLowerCase() === 'pdf' ? (
                      <FileText className="w-5 h-5 text-red-500" />
                    ) : (
                      <Eye className="w-5 h-5 text-blue-500" />
                    )}
                    <div>
                      <p className="text-sm font-medium capitalize">
                        {doc.type?.replace('_', ' ').replace(/\b\w/g, l => l.toUpperCase())}
                      </p>
                      <p className="text-xs text-gray-500">
                        {doc.fileName} • {Math.round(doc.fileSize / 1024)}KB • 
                        {doc.format?.toUpperCase()} •
                        {new Date(doc.uploadedAt).toLocaleDateString()}
                      </p>
                    </div>
                  </div>
                  <div className="flex gap-2">
                    <Button 
                      size="sm" 
                      variant="outline"
                      onClick={() => window.open(doc.fileUrl, '_blank')}
                    >
                      <Eye className="w-4 h-4 mr-1" />
                      View
                    </Button>
                    <Button
                      size="sm"
                      variant="ghost"
                      onClick={() => {
                        navigator.clipboard.writeText(doc.fileUrl)
                        toast.success('Document URL copied to clipboard')
                      }}
                    >
                      📋
                    </Button>
                  </div>
                </div>
              ))}
              
              {/* Document summary */}
              <div className="mt-4 p-3 bg-blue-50 rounded-lg">
                <h5 className="font-medium text-blue-900 mb-2">Document Verification Checklist:</h5>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-2 text-sm">
                  {['ghana_card', 'business_license', 'tax_certificate', 'insurance', 'portfolio'].map(docType => {
                    const hasDoc = business.documentsUploaded.some(doc => doc.type === docType)
                    const isRequired = ['ghana_card', 'business_license'].includes(docType)
                    return (
                      <div key={docType} className={`flex items-center gap-2 ${hasDoc ? 'text-green-700' : isRequired ? 'text-red-700' : 'text-gray-500'}`}>
                        {hasDoc ? (
                          <CheckCircle2 className="w-4 h-4 text-green-600" />
                        ) : (
                          <XCircle className="w-4 h-4 text-gray-400" />
                        )}
                        <span className="capitalize">
                          {docType.replace('_', ' ')} {isRequired && '(Required)'}
                        </span>
                      </div>
                    )
                  })}
                </div>
              </div>
            </div>
          ) : (
            <div className="text-center py-6 bg-orange-50 rounded-lg border border-orange-200">
              <AlertTriangle className="w-8 h-8 text-orange-500 mx-auto mb-2" />
              <p className="text-sm font-medium text-orange-800">No documents uploaded</p>
              <p className="text-xs text-orange-600">Business requires Ghana Card and Business License</p>
            </div>
          )}
        </div>

        {/* Previous Admin Actions */}
        {business.reviewedBy && (
          <div className="bg-blue-50 border border-blue-200 rounded-lg p-3">
            <h4 className="font-medium text-blue-900 mb-1">Previous Review</h4>
            <p className="text-sm text-blue-800">
              Reviewed by: {business.reviewedBy} on {new Date(business.reviewedAt).toLocaleDateString()}
            </p>
            {business.adminNotes && (
              <p className="text-sm text-blue-800 mt-1">
                <strong>Notes:</strong> {business.adminNotes}
              </p>
            )}
            {business.rejectionReason && (
              <p className="text-sm text-red-800 mt-1">
                <strong>Rejection Reason:</strong> {business.rejectionReason}
              </p>
            )}
          </div>
        )}

        {/* Admin Notes */}
        <div>
          <label className="block text-sm font-medium mb-2">Admin Notes (Optional)</label>
          <Textarea
            value={adminNotes}
            onChange={(e) => setAdminNotes(e.target.value)}
            placeholder="Add notes about this application review..."
            rows={3}
          />
        </div>

        {/* Actions */}
        <div className="flex justify-between">
          <Button variant="outline" onClick={onClose}>
            Close
          </Button>
          
          <div className="flex gap-2">
            <Button
              variant="outline"
              onClick={() => onAction(business.id, 'under_review', adminNotes)}
              disabled={actionLoading}
              className="text-blue-600 border-blue-200 hover:bg-blue-50"
            >
              <Clock className="w-4 h-4 mr-1" />
              Under Review
            </Button>
            <Button
              variant="outline"
              onClick={() => onAction(business.id, 'request_documents', adminNotes)}
              disabled={actionLoading}
              className="text-orange-600 border-orange-200 hover:bg-orange-50"
            >
              <FileText className="w-4 h-4 mr-1" />
              Request Docs
            </Button>
            <Button
              variant="outline"
              onClick={() => onAction(business.id, 'reject', adminNotes)}
              disabled={actionLoading}
              className="text-red-600 border-red-200 hover:bg-red-50"
            >
              <XCircle className="w-4 h-4 mr-1" />
              Reject
            </Button>
            <Button
              onClick={() => onAction(business.id, 'approve', adminNotes)}
              disabled={actionLoading}
              className="bg-green-600 hover:bg-green-700"
            >
              <CheckCircle2 className="w-4 h-4 mr-1" />
              Approve
            </Button>
          </div>
        </div>
      </div>
    </>
  )
}

export default BusinessApprovalSystem 