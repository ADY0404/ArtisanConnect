"use client"
import React, { useState, useEffect } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { 
  UserCheck,
  FileText,
  Shield,
  CheckCircle2,
  XCircle,
  Eye,
  Clock,
  Star,
  MapPin,
  FileCheck,
  Download
} from "lucide-react"
import { toast } from "sonner"
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog"
import { Textarea } from "@/components/ui/textarea"

function ProviderApplications() {
  const [applications, setApplications] = useState([])
  const [loading, setLoading] = useState(true)
  const [filter, setFilter] = useState("pending")
  const [selectedApplication, setSelectedApplication] = useState(null)
  const [actionLoading, setActionLoading] = useState(false)
  const [moderationNote, setModerationNote] = useState("")
  const [applicationCounts, setApplicationCounts] = useState({
    pending: 0,
    approved: 0,
    rejected: 0,
    all: 0
  })

  useEffect(() => {
    fetchApplications()
  }, [filter])

  const fetchApplications = async () => {
    try {
      setLoading(true)
      
      // In a real implementation, this would fetch from your API
      // const response = await fetch(`/api/admin/provider-applications?status=${filter}`)
      // const data = await response.json()
      
      // For now, using mock data
      const mockApplications = [
        {
          id: 1,
          name: "John Smith",
          email: "john@email.com", 
          businessName: "Smith Electrical Services",
          category: "Electric",
          experience: "5 years",
          status: "pending",
          applicationDate: "2024-01-15",
          documents: [
            { name: "license.pdf", url: "#", type: "license" },
            { name: "insurance.pdf", url: "#", type: "insurance" }
          ],
          location: "New York, NY",
          about: "Professional electrician with experience in residential and commercial projects.",
          phone: "+1234567890"
        },
        {
          id: 2,
          name: "Maria Garcia",
          email: "maria@email.com",
          businessName: "Garcia Cleaning Co",
          category: "Cleaning", 
          experience: "3 years",
          status: "pending",
          applicationDate: "2024-01-14",
          documents: [
            { name: "business_reg.pdf", url: "#", type: "registration" }
          ],
          location: "Los Angeles, CA",
          about: "Eco-friendly cleaning services for homes and offices.",
          phone: "+0987654321"
        },
        {
          id: 3,
          name: "Robert Johnson",
          email: "robert@email.com",
          businessName: "Johnson Plumbing",
          category: "Plumbing",
          experience: "10+ years",
          status: "approved",
          applicationDate: "2024-01-10",
          approvedDate: "2024-01-12",
          documents: [
            { name: "license.pdf", url: "#", type: "license" },
            { name: "certification.pdf", url: "#", type: "certification" },
            { name: "insurance.pdf", url: "#", type: "insurance" }
          ],
          location: "Chicago, IL",
          about: "Expert plumbing services with 24/7 emergency support.",
          phone: "+1122334455"
        },
        {
          id: 4,
          name: "David Lee",
          email: "david@email.com",
          businessName: "Lee's Painting",
          category: "Painting",
          experience: "2 years",
          status: "rejected",
          applicationDate: "2024-01-08",
          rejectedDate: "2024-01-11",
          rejectionReason: "Incomplete documentation",
          documents: [
            { name: "portfolio.pdf", url: "#", type: "portfolio" }
          ],
          location: "Seattle, WA",
          about: "Interior and exterior painting services.",
          phone: "+5566778899"
        }
      ]
      
      // Filter applications based on selected filter
      const filteredApplications = filter === "all" 
        ? mockApplications 
        : mockApplications.filter(app => app.status === filter)
      
      setApplications(filteredApplications)
      
      // Calculate counts for each status
      const counts = {
        pending: mockApplications.filter(a => a.status === "pending").length,
        approved: mockApplications.filter(a => a.status === "approved").length,
        rejected: mockApplications.filter(a => a.status === "rejected").length,
        all: mockApplications.length
      }
      setApplicationCounts(counts)
      
    } catch (error) {
      console.error("Error fetching applications:", error)
      toast.error("Failed to load provider applications")
    } finally {
      setLoading(false)
    }
  }

  const handleApplicationAction = async (applicationId, action) => {
    try {
      setActionLoading(true)
      
      // In a real implementation, this would call your API
      // const response = await fetch('/api/admin/provider-applications/process', {
      //   method: 'POST',
      //   headers: { 'Content-Type': 'application/json' },
      //   body: JSON.stringify({
      //     applicationId,
      //     action,
      //     moderationNote
      //   })
      // })
      // const result = await response.json()
      
      // Simulate API call
      await new Promise(resolve => setTimeout(resolve, 800))
      
      toast.success(`Application ${action}d successfully`)
      
      // Update local state
      setApplications(prev => 
        prev.filter(app => app.id !== applicationId)
      )
      
      // Close modal
      setSelectedApplication(null)
      setModerationNote("")
      
      // Refresh counts
      fetchApplications()
      
    } catch (error) {
      console.error("Error processing application:", error)
      toast.error("Failed to process application")
    } finally {
      setActionLoading(false)
    }
  }

  const getStatusBadge = (status) => {
    switch (status) {
      case "approved":
        return <Badge className="bg-green-100 text-green-800">Approved</Badge>
      case "rejected":
        return <Badge variant="destructive">Rejected</Badge>
      default:
        return <Badge variant="secondary">Pending</Badge>
    }
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <UserCheck className="w-5 h-5" />
          Provider Applications
        </CardTitle>
        <CardDescription>
          Review and approve new service provider applications
        </CardDescription>
      </CardHeader>
      <CardContent>
        <div className="space-y-4">
          {/* Filter buttons */}
          <div className="flex gap-2 flex-wrap">
            {Object.entries(applicationCounts).map(([filterType, count]) => (
              <Button
                key={filterType}
                variant={filter === filterType ? "default" : "outline"}
                size="sm"
                onClick={() => setFilter(filterType)}
                className="capitalize"
              >
                {filterType} ({count})
              </Button>
            ))}
          </div>

          {/* Applications list */}
          {loading ? (
            <div className="text-center py-8">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto"></div>
              <p className="mt-2 text-gray-600">Loading applications...</p>
            </div>
          ) : applications.length === 0 ? (
            <div className="text-center py-8 text-gray-500">
              <UserCheck className="w-12 h-12 mx-auto mb-4 text-gray-300" />
              <p>No provider applications found with "{filter}" status</p>
            </div>
          ) : (
            <div className="space-y-4">
              {applications.map((application) => (
                <div key={application.id} className="border rounded-lg p-4 space-y-3">
                  <div className="flex flex-col md:flex-row justify-between items-start gap-4">
                    <div className="flex-1 space-y-2">
                      <div className="flex items-center gap-3">
                        <h3 className="font-semibold text-lg">{application.name}</h3>
                        {getStatusBadge(application.status)}
                      </div>
                      <p className="text-sm text-gray-600">{application.email}</p>
                      <div className="flex flex-col sm:flex-row sm:items-center gap-x-4 gap-y-1 text-sm text-gray-500">
                        <span className="flex items-center gap-1.5">
                          <Shield className="w-4 h-4 text-gray-400" />
                          {application.businessName}
                        </span>
                        <span className="flex items-center gap-1.5">
                          <MapPin className="w-4 h-4 text-gray-400" />
                          {application.location}
                        </span>
                      </div>
                      
                      {application.rejectedDate && (
                        <div className="flex items-center gap-1 text-sm text-red-600">
                          <XCircle className="w-4 h-4" />
                          Rejected on {new Date(application.rejectedDate).toLocaleDateString()}
                          {application.rejectionReason && `: ${application.rejectionReason}`}
                        </div>
                      )}
                      
                      {application.approvedDate && (
                        <div className="flex items-center gap-1 text-sm text-green-600">
                          <CheckCircle2 className="w-4 h-4" />
                          Approved on {new Date(application.approvedDate).toLocaleDateString()}
                        </div>
                      )}
                    </div>

                    <div className="flex flex-row md:flex-col items-start md:items-end gap-2 self-start pt-2 md:pt-0">
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => setSelectedApplication(application)}
                        className="text-blue-600 hover:text-blue-700 w-full justify-start"
                      >
                        <Eye className="w-4 h-4 mr-2" /> View
                      </Button>
                      {application.status !== "approved" && (
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() => setSelectedApplication({...application, action: "approve"})}
                          className="text-green-600 hover:text-green-700 w-full justify-start"
                        >
                          <CheckCircle2 className="w-4 h-4 mr-2" /> Approve
                        </Button>
                      )}
                      {application.status !== "rejected" && (
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() => setSelectedApplication({...application, action: "reject"})}
                          className="text-red-600 hover:text-red-700 w-full justify-start"
                        >
                          <XCircle className="w-4 h-4 mr-2" /> Reject
                        </Button>
                      )}
                    </div>
                  </div>

                  <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm pt-3 border-t">
                    <div>
                      <span className="text-gray-500 text-xs">Category</span>
                      <p className="font-medium">{application.category}</p>
                    </div>
                    <div>
                      <span className="text-gray-500 text-xs">Experience</span>
                      <p className="font-medium">{application.experience}</p>
                    </div>
                    <div>
                      <span className="text-gray-500 text-xs">Documents</span>
                      <p className="font-medium">{application.documents.length} files</p>
                    </div>
                    <div>
                      <span className="text-gray-500 text-xs">Applied</span>
                      <p className="font-medium">{new Date(application.applicationDate).toLocaleDateString()}</p>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </CardContent>
      
      {/* Application Detail/Action Modal */}
      {selectedApplication && (
        <Dialog open={!!selectedApplication} onOpenChange={() => setSelectedApplication(null)}>
          <DialogContent className="max-w-2xl">
            <DialogHeader>
              <DialogTitle>
                {selectedApplication.action 
                  ? `${selectedApplication.action === "approve" ? "Approve" : "Reject"} Application` 
                  : "Application Details"}
              </DialogTitle>
              <DialogDescription>
                {selectedApplication.action 
                  ? `Are you sure you want to ${selectedApplication.action} this provider application?` 
                  : `Application for ${selectedApplication.businessName}`}
              </DialogDescription>
            </DialogHeader>
            
            <div className="space-y-4 py-2">
              <div className="flex items-center justify-between">
                <h3 className="text-lg font-semibold">{selectedApplication.businessName}</h3>
                {getStatusBadge(selectedApplication.status)}
              </div>
              
              <div className="bg-gray-50 p-4 rounded-md border">
                <p>{selectedApplication.about || "No business description provided."}</p>
              </div>
              
              <div className="grid grid-cols-2 gap-4 text-sm">
                <div>
                  <p className="text-gray-500">Provider Name</p>
                  <p className="font-medium">{selectedApplication.name}</p>
                </div>
                <div>
                  <p className="text-gray-500">Email</p>
                  <p className="font-medium">{selectedApplication.email}</p>
                </div>
                <div>
                  <p className="text-gray-500">Phone</p>
                  <p className="font-medium">{selectedApplication.phone || "Not provided"}</p>
                </div>
                <div>
                  <p className="text-gray-500">Location</p>
                  <p className="font-medium">{selectedApplication.location}</p>
                </div>
                <div>
                  <p className="text-gray-500">Category</p>
                  <p className="font-medium">{selectedApplication.category}</p>
                </div>
                <div>
                  <p className="text-gray-500">Experience</p>
                  <p className="font-medium">{selectedApplication.experience}</p>
                </div>
                <div>
                  <p className="text-gray-500">Applied On</p>
                  <p className="font-medium">{new Date(selectedApplication.applicationDate).toLocaleDateString()}</p>
                </div>
              </div>
              
              {/* Documents */}
              <div>
                <p className="text-gray-500 text-sm font-medium mb-2">Documents ({selectedApplication.documents.length})</p>
                <div className="space-y-2">
                  {selectedApplication.documents.map((doc, index) => (
                    <div key={index} className="flex items-center justify-between p-2 bg-gray-50 rounded border">
                      <div className="flex items-center gap-2">
                        <FileText className="w-4 h-4 text-gray-400" />
                        <span className="text-sm">{doc.name}</span>
                        <Badge variant="outline" className="text-xs capitalize">{doc.type}</Badge>
                      </div>
                      <Button variant="ghost" size="sm">
                        <Download className="w-4 h-4 mr-1" /> View
                      </Button>
                    </div>
                  ))}
                </div>
              </div>
              
              {selectedApplication.action && (
                <div>
                  <label className="text-sm font-medium">
                    Decision Note
                    <span className="text-gray-500 font-normal"> (optional)</span>
                  </label>
                  <Textarea
                    value={moderationNote}
                    onChange={(e) => setModerationNote(e.target.value)}
                    placeholder={selectedApplication.action === "approve" 
                      ? "Add any notes about this approval..." 
                      : "Please provide a reason for rejection..."}
                    className="mt-1"
                  />
                </div>
              )}
            </div>
            
            <DialogFooter>
              <Button
                variant="outline"
                onClick={() => setSelectedApplication(null)}
              >
                Cancel
              </Button>
              
              {selectedApplication.action && (
                <Button
                  variant={selectedApplication.action === "approve" ? "default" : "destructive"}
                  onClick={() => handleApplicationAction(selectedApplication.id, selectedApplication.action)}
                  disabled={actionLoading}
                >
                  {actionLoading && (
                    <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                  )}
                  {selectedApplication.action === "approve" ? "Approve Application" : "Reject Application"}
                </Button>
              )}
            </DialogFooter>
          </DialogContent>
        </Dialog>
      )}
    </Card>
  )
}

export default ProviderApplications 