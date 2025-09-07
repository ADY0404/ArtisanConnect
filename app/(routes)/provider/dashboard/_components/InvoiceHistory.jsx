'use client'

import React, { useState, useEffect } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Input } from '@/components/ui/input'
import { 
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { 
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table'
import { 
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import { 
  Receipt, 
  Calendar, 
  DollarSign, 
  Mail,
  Download,
  Search,
  Filter,
  RefreshCw,
  Eye,
  CheckCircle,
  Clock,
  Send,
  FileText,
  TrendingUp,
  Users,
  CreditCard
} from 'lucide-react'
import { toast } from 'sonner'

function InvoiceHistory() {
  const [invoices, setInvoices] = useState([])
  const [summary, setSummary] = useState(null)
  const [isLoading, setIsLoading] = useState(true)
  const [searchTerm, setSearchTerm] = useState('')
  const [statusFilter, setStatusFilter] = useState('all')
  const [selectedInvoice, setSelectedInvoice] = useState(null)
  const [showInvoiceDialog, setShowInvoiceDialog] = useState(false)
  const [currentPage, setCurrentPage] = useState(1)
  const [pagination, setPagination] = useState(null)

  useEffect(() => {
    fetchInvoiceHistory()
  }, [currentPage, statusFilter])

  const fetchInvoiceHistory = async () => {
    try {
      setIsLoading(true)
      const params = new URLSearchParams({
        page: currentPage.toString(),
        limit: '10'
      })

      if (statusFilter && statusFilter !== 'all') params.append('status', statusFilter)
      if (searchTerm) params.append('search', searchTerm)

      const response = await fetch(`/api/provider/invoice-history?${params}`)
      if (response.ok) {
        const data = await response.json()
        setInvoices(data.invoices || [])
        setSummary(data.summary || {})
        setPagination(data.pagination || {})
      } else {
        throw new Error('Failed to fetch invoice history')
      }
    } catch (error) {
      console.error('Error fetching invoice history:', error)
      toast.error('Failed to load invoice history')
    } finally {
      setIsLoading(false)
    }
  }

  const handleSearch = () => {
    setCurrentPage(1)
    fetchInvoiceHistory()
  }

  const handleResendEmail = async (invoiceId) => {
    try {
      const response = await fetch('/api/provider/invoice-history', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          action: 'resend_email',
          invoiceIds: [invoiceId]
        })
      })

      const result = await response.json()
      if (response.ok && result.success) {
        toast.success('Invoice email resent successfully')
        fetchInvoiceHistory() // Refresh the list
      } else {
        throw new Error(result.error || 'Failed to resend email')
      }
    } catch (error) {
      console.error('Error resending email:', error)
      toast.error(error.message || 'Failed to resend invoice email')
    }
  }

  const handleMarkAsPaid = async (invoiceId) => {
    try {
      const response = await fetch('/api/provider/invoice-history', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          action: 'mark_paid',
          invoiceIds: [invoiceId]
        })
      })

      const result = await response.json()
      if (response.ok && result.success) {
        toast.success('Invoice marked as paid')
        fetchInvoiceHistory() // Refresh the list
      } else {
        throw new Error(result.error || 'Failed to mark as paid')
      }
    } catch (error) {
      console.error('Error marking as paid:', error)
      toast.error(error.message || 'Failed to mark invoice as paid')
    }
  }

  const getStatusBadge = (status) => {
    const statusConfig = {
      PAID: { variant: 'default', className: 'bg-green-100 text-green-800', icon: CheckCircle },
      PENDING: { variant: 'secondary', className: 'bg-yellow-100 text-yellow-800', icon: Clock },
      OVERDUE: { variant: 'destructive', className: 'bg-red-100 text-red-800', icon: Clock }
    }

    const config = statusConfig[status] || statusConfig.PENDING
    const Icon = config.icon

    return (
      <Badge className={config.className}>
        <Icon className="w-3 h-3 mr-1" />
        {status}
      </Badge>
    )
  }

  const formatCurrency = (amount) => {
    return `GHS ${(amount || 0).toFixed(2)}`
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

  return (
    <div className="space-y-6">
      {/* Summary Cards */}
      {summary && (
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <Card>
            <CardContent className="p-4">
              <div className="flex items-center gap-2">
                <Receipt className="w-5 h-5 text-blue-600" />
                <div>
                  <p className="text-sm text-muted-foreground">Total Invoices</p>
                  <p className="text-xl font-bold">{summary.totalInvoices || 0}</p>
                </div>
              </div>
            </CardContent>
          </Card>
          
          <Card>
            <CardContent className="p-4">
              <div className="flex items-center gap-2">
                <DollarSign className="w-5 h-5 text-green-600" />
                <div>
                  <p className="text-sm text-muted-foreground">Total Revenue</p>
                  <p className="text-xl font-bold">{formatCurrency(summary.totalRevenue)}</p>
                </div>
              </div>
            </CardContent>
          </Card>
          
          <Card>
            <CardContent className="p-4">
              <div className="flex items-center gap-2">
                <TrendingUp className="w-5 h-5 text-purple-600" />
                <div>
                  <p className="text-sm text-muted-foreground">Net Earnings</p>
                  <p className="text-xl font-bold">{formatCurrency(summary.totalNetAmount)}</p>
                </div>
              </div>
            </CardContent>
          </Card>
          
          <Card>
            <CardContent className="p-4">
              <div className="flex items-center gap-2">
                <CheckCircle className="w-5 h-5 text-green-600" />
                <div>
                  <p className="text-sm text-muted-foreground">Paid Invoices</p>
                  <p className="text-xl font-bold">{summary.paidInvoices || 0}</p>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      )}

      {/* Invoice History Table */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <CardTitle className="flex items-center gap-2">
              <Receipt className="w-5 h-5" />
              Invoice History
            </CardTitle>
            <Button
              variant="outline"
              size="sm"
              onClick={fetchInvoiceHistory}
              disabled={isLoading}
            >
              <RefreshCw className="w-4 h-4 mr-2" />
              Refresh
            </Button>
          </div>
        </CardHeader>
        <CardContent>
          {/* Search and Filter */}
          <div className="flex items-center gap-4 mb-6">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
              <Input
                placeholder="Search invoices, customers, or services..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                onKeyPress={(e) => e.key === 'Enter' && handleSearch()}
                className="pl-10"
              />
            </div>
            <Select value={statusFilter} onValueChange={setStatusFilter}>
              <SelectTrigger className="w-40">
                <SelectValue placeholder="All Status" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Status</SelectItem>
                <SelectItem value="PAID">Paid</SelectItem>
                <SelectItem value="PENDING">Pending</SelectItem>
                <SelectItem value="OVERDUE">Overdue</SelectItem>
              </SelectContent>
            </Select>
            <Button onClick={handleSearch} disabled={isLoading}>
              <Search className="w-4 h-4 mr-2" />
              Search
            </Button>
          </div>

          {/* Invoices Table */}
          <div className="border rounded-lg">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Invoice #</TableHead>
                  <TableHead>Customer</TableHead>
                  <TableHead>Service</TableHead>
                  <TableHead>Amount</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>Date</TableHead>
                  <TableHead>Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {invoices.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={7} className="text-center py-8">
                      <Receipt className="w-12 h-12 text-gray-400 mx-auto mb-4" />
                      <p className="text-gray-500">
                        {searchTerm || statusFilter ? 'No invoices match your search' : 'No invoices found'}
                      </p>
                    </TableCell>
                  </TableRow>
                ) : (
                  invoices.map((invoice) => (
                    <TableRow key={invoice.id}>
                      <TableCell className="font-medium">
                        {invoice.invoiceNumber}
                      </TableCell>
                      <TableCell>
                        <div>
                          <p className="font-medium">{invoice.customerName}</p>
                          <p className="text-sm text-gray-500">{invoice.customerEmail}</p>
                        </div>
                      </TableCell>
                      <TableCell>
                        <div>
                          <p className="font-medium">{invoice.serviceDescription}</p>
                          <p className="text-sm text-gray-500">
                            {new Date(invoice.serviceDate).toLocaleDateString()}
                          </p>
                        </div>
                      </TableCell>
                      <TableCell>
                        <div>
                          <p className="font-medium">{formatCurrency(invoice.totalAmount)}</p>
                          <p className="text-sm text-green-600">
                            Net: {formatCurrency(invoice.netAmount)}
                          </p>
                        </div>
                      </TableCell>
                      <TableCell>
                        {getStatusBadge(invoice.paymentStatus)}
                      </TableCell>
                      <TableCell>
                        {new Date(invoice.generatedAt).toLocaleDateString()}
                      </TableCell>
                      <TableCell>
                        <div className="flex items-center gap-2">
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => {
                              setSelectedInvoice(invoice)
                              setShowInvoiceDialog(true)
                            }}
                          >
                            <Eye className="w-4 h-4" />
                          </Button>
                          
                          {invoice.paymentStatus === 'PENDING' && (
                            <Button
                              variant="outline"
                              size="sm"
                              onClick={() => handleMarkAsPaid(invoice.id)}
                            >
                              <CheckCircle className="w-4 h-4" />
                            </Button>
                          )}
                          
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => handleResendEmail(invoice.id)}
                          >
                            <Send className="w-4 h-4" />
                          </Button>
                        </div>
                      </TableCell>
                    </TableRow>
                  ))
                )}
              </TableBody>
            </Table>
          </div>

          {/* Pagination */}
          {pagination && pagination.totalPages > 1 && (
            <div className="flex items-center justify-between mt-6">
              <p className="text-sm text-gray-500">
                Showing {((currentPage - 1) * 10) + 1} to {Math.min(currentPage * 10, pagination.total)} of {pagination.total} invoices
              </p>
              <div className="flex items-center gap-2">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setCurrentPage(prev => Math.max(1, prev - 1))}
                  disabled={!pagination.hasPrev}
                >
                  Previous
                </Button>
                <span className="text-sm">
                  Page {currentPage} of {pagination.totalPages}
                </span>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setCurrentPage(prev => prev + 1)}
                  disabled={!pagination.hasNext}
                >
                  Next
                </Button>
              </div>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Invoice Detail Dialog */}
      <Dialog open={showInvoiceDialog} onOpenChange={setShowInvoiceDialog}>
        <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <FileText className="w-5 h-5" />
              Invoice Details
            </DialogTitle>
            <DialogDescription>
              Invoice #{selectedInvoice?.invoiceNumber}
            </DialogDescription>
          </DialogHeader>
          
          {selectedInvoice && (
            <div className="space-y-6">
              {/* Customer Information */}
              <div>
                <h3 className="font-semibold mb-3">Customer Information</h3>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <p className="text-sm text-gray-500">Name</p>
                    <p className="font-medium">{selectedInvoice.customerName}</p>
                  </div>
                  <div>
                    <p className="text-sm text-gray-500">Email</p>
                    <p className="font-medium">{selectedInvoice.customerEmail}</p>
                  </div>
                </div>
              </div>

              {/* Service Information */}
              <div>
                <h3 className="font-semibold mb-3">Service Information</h3>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <p className="text-sm text-gray-500">Service</p>
                    <p className="font-medium">{selectedInvoice.serviceDescription}</p>
                  </div>
                  <div>
                    <p className="text-sm text-gray-500">Service Date</p>
                    <p className="font-medium">{new Date(selectedInvoice.serviceDate).toLocaleDateString()}</p>
                  </div>
                </div>
              </div>

              {/* Payment Information */}
              <div>
                <h3 className="font-semibold mb-3">Payment Information</h3>
                <div className="bg-gray-50 p-4 rounded-lg space-y-2">
                  <div className="flex justify-between">
                    <span>Total Amount:</span>
                    <span className="font-medium">{formatCurrency(selectedInvoice.totalAmount)}</span>
                  </div>
                  <div className="flex justify-between">
                    <span>Commission:</span>
                    <span className="font-medium">{formatCurrency(selectedInvoice.commissionAmount)}</span>
                  </div>
                  <div className="flex justify-between border-t pt-2">
                    <span className="font-semibold">Net Amount:</span>
                    <span className="font-semibold text-green-600">{formatCurrency(selectedInvoice.netAmount)}</span>
                  </div>
                </div>
                
                <div className="grid grid-cols-2 gap-4 mt-4">
                  <div>
                    <p className="text-sm text-gray-500">Payment Method</p>
                    <p className="font-medium">{selectedInvoice.paymentMethod}</p>
                  </div>
                  <div>
                    <p className="text-sm text-gray-500">Status</p>
                    <div className="mt-1">
                      {getStatusBadge(selectedInvoice.paymentStatus)}
                    </div>
                  </div>
                </div>
              </div>

              {/* Email Information */}
              <div>
                <h3 className="font-semibold mb-3">Email Status</h3>
                <div className="flex items-center gap-2">
                  {selectedInvoice.emailSent ? (
                    <>
                      <CheckCircle className="w-4 h-4 text-green-600" />
                      <span className="text-green-600">Email sent successfully</span>
                      {selectedInvoice.emailSentAt && (
                        <span className="text-sm text-gray-500">
                          on {new Date(selectedInvoice.emailSentAt).toLocaleString()}
                        </span>
                      )}
                    </>
                  ) : (
                    <>
                      <Clock className="w-4 h-4 text-yellow-600" />
                      <span className="text-yellow-600">Email not sent</span>
                    </>
                  )}
                </div>
              </div>

              {/* Additional Notes */}
              {selectedInvoice.additionalNotes && (
                <div>
                  <h3 className="font-semibold mb-3">Additional Notes</h3>
                  <p className="text-gray-700 bg-gray-50 p-3 rounded-lg">
                    {selectedInvoice.additionalNotes}
                  </p>
                </div>
              )}

              {/* Action Buttons */}
              <div className="flex items-center gap-2 pt-4 border-t">
                {selectedInvoice.paymentStatus === 'PENDING' && (
                  <Button
                    onClick={() => {
                      handleMarkAsPaid(selectedInvoice.id)
                      setShowInvoiceDialog(false)
                    }}
                    className="flex items-center gap-2"
                  >
                    <CheckCircle className="w-4 h-4" />
                    Mark as Paid
                  </Button>
                )}
                
                <Button
                  variant="outline"
                  onClick={() => {
                    handleResendEmail(selectedInvoice.id)
                    setShowInvoiceDialog(false)
                  }}
                  className="flex items-center gap-2"
                >
                  <Send className="w-4 h-4" />
                  Resend Email
                </Button>
                
                <Button
                  variant="outline"
                  onClick={() => {
                    // TODO: Implement PDF download
                    toast.info('PDF download feature coming soon')
                  }}
                  className="flex items-center gap-2"
                >
                  <Download className="w-4 h-4" />
                  Download PDF
                </Button>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  )
}

export default InvoiceHistory
