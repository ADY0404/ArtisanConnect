import { EmailService } from './EmailService'

export class InvoiceEmailService {
  /**
   * Send invoice email to customer
   */
  static async sendInvoiceEmail(customerData, invoiceData, attachmentData = null) {
    try {
      console.log(`📧 Sending invoice email to ${customerData.email}`)

      const emailTemplate = this.generateInvoiceEmailTemplate(customerData, invoiceData)
      
      const emailOptions = {
        to: customerData.email,
        subject: `Invoice #${invoiceData.invoiceNumber} - ${invoiceData.businessName}`,
        html: emailTemplate,
        attachments: attachmentData ? [
          {
            filename: `invoice-${invoiceData.invoiceNumber}.pdf`,
            content: attachmentData,
            type: 'application/pdf',
            disposition: 'attachment'
          }
        ] : []
      }

      // Send email using the existing EmailService
      const result = await EmailService.sendEmail(emailOptions)

      if (result.success) {
        console.log(`✅ Invoice email sent successfully to ${customerData.email}`)
        
        // Log the email send event
        await this.logInvoiceEmailSent(invoiceData.id, customerData.email)
        
        return {
          success: true,
          messageId: result.messageId,
          sentAt: new Date()
        }
      } else {
        throw new Error(result.error || 'Failed to send invoice email')
      }

    } catch (error) {
      console.error('❌ Error sending invoice email:', error)
      
      // Log the email failure
      await this.logInvoiceEmailFailed(invoiceData.id, customerData.email, error.message)
      
      return {
        success: false,
        error: error.message
      }
    }
  }

  /**
   * Generate HTML email template for invoice
   */
  static generateInvoiceEmailTemplate(customerData, invoiceData) {
    const {
      invoiceNumber,
      businessName,
      providerName,
      serviceDescription,
      serviceDate,
      totalAmount,
      commissionAmount,
      netAmount,
      paymentMethod,
      generatedAt,
      dueDate
    } = invoiceData

    // Safety checks for numeric values
    const safeTotalAmount = Number(totalAmount) || 0
    const safeCommissionAmount = Number(commissionAmount) || 0
    const safeNetAmount = Number(netAmount) || 0

    return `
    <!DOCTYPE html>
    <html lang="en">
    <head>
        <meta charset="UTF-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
        <title>Invoice #${invoiceNumber}</title>
        <style>
            body {
                font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif;
                line-height: 1.6;
                color: #333;
                max-width: 600px;
                margin: 0 auto;
                padding: 20px;
                background-color: #f8f9fa;
            }
            .container {
                background: white;
                border-radius: 10px;
                padding: 30px;
                box-shadow: 0 2px 10px rgba(0,0,0,0.1);
            }
            .header {
                text-align: center;
                border-bottom: 3px solid #007bff;
                padding-bottom: 20px;
                margin-bottom: 30px;
            }
            .logo {
                font-size: 28px;
                font-weight: bold;
                color: #007bff;
                margin-bottom: 10px;
            }
            .invoice-title {
                font-size: 24px;
                color: #333;
                margin: 0;
            }
            .invoice-number {
                font-size: 18px;
                color: #666;
                margin: 5px 0;
            }
            .section {
                margin-bottom: 25px;
            }
            .section-title {
                font-size: 18px;
                font-weight: bold;
                color: #007bff;
                margin-bottom: 10px;
                border-bottom: 1px solid #eee;
                padding-bottom: 5px;
            }
            .info-grid {
                display: grid;
                grid-template-columns: 1fr 1fr;
                gap: 20px;
                margin-bottom: 20px;
            }
            .info-item {
                background: #f8f9fa;
                padding: 15px;
                border-radius: 5px;
                border-left: 4px solid #007bff;
            }
            .info-label {
                font-weight: bold;
                color: #555;
                font-size: 14px;
                margin-bottom: 5px;
            }
            .info-value {
                color: #333;
                font-size: 16px;
            }
            .service-details {
                background: #f8f9fa;
                padding: 20px;
                border-radius: 8px;
                margin: 15px 0;
            }
            .amount-breakdown {
                background: linear-gradient(135deg, #007bff 0%, #0056b3 100%);
                color: white;
                padding: 20px;
                border-radius: 8px;
                margin: 20px 0;
            }
            .amount-row {
                display: flex;
                justify-content: space-between;
                margin-bottom: 10px;
                padding: 5px 0;
            }
            .amount-row.total {
                border-top: 2px solid rgba(255,255,255,0.3);
                padding-top: 15px;
                margin-top: 15px;
                font-size: 18px;
                font-weight: bold;
            }
            .payment-info {
                background: #e8f5e8;
                border: 1px solid #28a745;
                padding: 15px;
                border-radius: 5px;
                margin: 15px 0;
            }
            .footer {
                text-align: center;
                margin-top: 30px;
                padding-top: 20px;
                border-top: 1px solid #eee;
                color: #666;
                font-size: 14px;
            }
            .button {
                display: inline-block;
                background: #007bff;
                color: white;
                padding: 12px 25px;
                text-decoration: none;
                border-radius: 5px;
                margin: 10px 0;
                font-weight: bold;
            }
            .status-badge {
                display: inline-block;
                padding: 5px 12px;
                border-radius: 20px;
                font-size: 12px;
                font-weight: bold;
                text-transform: uppercase;
            }
            .status-paid {
                background: #d4edda;
                color: #155724;
            }
            .status-pending {
                background: #fff3cd;
                color: #856404;
            }
            @media (max-width: 600px) {
                .info-grid {
                    grid-template-columns: 1fr;
                }
                .amount-row {
                    font-size: 14px;
                }
            }
        </style>
    </head>
    <body>
        <div class="container">
            <div class="header">
                <div class="logo">ArtisanConnect</div>
                <h1 class="invoice-title">Service Invoice</h1>
                <div class="invoice-number">Invoice #${invoiceNumber}</div>
                <span class="status-badge ${paymentMethod === 'CASH' ? 'status-pending' : 'status-paid'}">
                    ${paymentMethod === 'CASH' ? 'Payment Pending' : 'Paid via App'}
                </span>
            </div>

            <div class="section">
                <div class="section-title">Customer Information</div>
                <div class="info-grid">
                    <div class="info-item">
                        <div class="info-label">Customer Name</div>
                        <div class="info-value">${customerData.name}</div>
                    </div>
                    <div class="info-item">
                        <div class="info-label">Email Address</div>
                        <div class="info-value">${customerData.email}</div>
                    </div>
                </div>
            </div>

            <div class="section">
                <div class="section-title">Service Provider</div>
                <div class="info-grid">
                    <div class="info-item">
                        <div class="info-label">Business Name</div>
                        <div class="info-value">${businessName}</div>
                    </div>
                    <div class="info-item">
                        <div class="info-label">Provider</div>
                        <div class="info-value">${providerName}</div>
                    </div>
                </div>
            </div>

            <div class="section">
                <div class="section-title">Service Details</div>
                <div class="service-details">
                    <div class="info-label">Service Description</div>
                    <div class="info-value" style="margin-bottom: 15px;">${serviceDescription}</div>
                    
                    <div class="info-grid">
                        <div>
                            <div class="info-label">Service Date</div>
                            <div class="info-value">${new Date(serviceDate).toLocaleDateString()}</div>
                        </div>
                        <div>
                            <div class="info-label">Invoice Date</div>
                            <div class="info-value">${new Date(generatedAt).toLocaleDateString()}</div>
                        </div>
                    </div>
                </div>
            </div>

            <div class="section">
                <div class="section-title">Payment Breakdown</div>
                <div class="amount-breakdown">
                    <div class="amount-row">
                        <span>Service Amount:</span>
                        <span>GHS ${safeTotalAmount.toFixed(2)}</span>
                    </div>
                    <div class="amount-row">
                        <span>Platform Commission:</span>
                        <span>GHS ${safeCommissionAmount.toFixed(2)}</span>
                    </div>
                    <div class="amount-row total">
                        <span>Provider Receives:</span>
                        <span>GHS ${safeNetAmount.toFixed(2)}</span>
                    </div>
                </div>
            </div>

            ${paymentMethod === 'CASH' ? `
            <div class="payment-info">
                <strong>💰 Cash Payment Required</strong><br>
                Please pay GHS ${safeTotalAmount.toFixed(2)} directly to the service provider.
                This invoice serves as your receipt for the completed service.
            </div>
            ` : `
            <div class="payment-info">
                <strong>✅ Payment Completed</strong><br>
                Payment of GHS ${safeTotalAmount.toFixed(2)} was successfully processed through the ArtisanConnect app.
                Thank you for using our platform!
            </div>
            `}

            <div class="section">
                <div class="section-title">Need Help?</div>
                <p>If you have any questions about this invoice or the service provided, please contact us:</p>
                <ul>
                    <li>Email: support@artisanconnect.com</li>
                    <li>Phone: +233 XX XXX XXXX</li>
                    <li>Website: www.artisanconnect.com</li>
                </ul>
            </div>

            <div class="footer">
                <p><strong>ArtisanConnect</strong> - Connecting Homes with Trusted Hands</p>
                <p>This is an automated email. Please do not reply directly to this message.</p>
                <p>Generated on ${new Date(generatedAt).toLocaleString()}</p>
            </div>
        </div>
    </body>
    </html>
    `
  }

  /**
   * Log successful invoice email send
   */
  static async logInvoiceEmailSent(invoiceId, customerEmail) {
    try {
      const { connectToDatabase } = await import('@/lib/mongodb')
      const { db } = await connectToDatabase()

      await db.collection('invoice_email_logs').insertOne({
        invoiceId,
        customerEmail,
        status: 'SENT',
        sentAt: new Date(),
        attempts: 1
      })
    } catch (error) {
      console.error('Error logging invoice email sent:', error)
    }
  }

  /**
   * Log failed invoice email send
   */
  static async logInvoiceEmailFailed(invoiceId, customerEmail, errorMessage) {
    try {
      const { connectToDatabase } = await import('@/lib/mongodb')
      const { db } = await connectToDatabase()

      await db.collection('invoice_email_logs').insertOne({
        invoiceId,
        customerEmail,
        status: 'FAILED',
        error: errorMessage,
        failedAt: new Date(),
        attempts: 1
      })
    } catch (error) {
      console.error('Error logging invoice email failure:', error)
    }
  }

  /**
   * Resend failed invoice email
   */
  static async resendInvoiceEmail(invoiceId) {
    try {
      // Get invoice data from database
      const { connectToDatabase } = await import('@/lib/mongodb')
      const { ObjectId } = await import('mongodb')
      const { db } = await connectToDatabase()

      // ✅ FIXED: The invoiceId is actually a booking ID (invoice data is stored in bookings collection)
      let bookingObjectId
      try {
        bookingObjectId = typeof invoiceId === 'string' ? new ObjectId(invoiceId) : invoiceId
      } catch (error) {
        throw new Error(`Invalid booking/invoice ID format: ${invoiceId}`)
      }

      console.log(`🔍 Looking for booking with invoice data, ID: ${bookingObjectId}`)

      // ✅ FIXED: Look in bookings collection for invoice data
      const booking = await db.collection('bookings').findOne({
        _id: bookingObjectId,
        invoiceGenerated: true,
        invoiceId: { $exists: true, $ne: null }
      })

      if (!booking) {
        console.log(`❌ Booking with invoice not found, ID: ${bookingObjectId}`)
        throw new Error('Invoice not found')
      }

      console.log(`✅ Found booking with invoice: ${booking.invoiceId}`)

      // ✅ Customer data is already in the booking
      const customerData = {
        name: booking.userName,
        email: booking.userEmail
      }

      // ✅ Create invoice data structure from booking
      const invoiceData = {
        id: booking.invoiceId,
        invoiceNumber: booking.invoiceId,
        invoiceId: booking.invoiceId,
        businessName: booking.businessName || 'Service Provider',
        customerName: booking.userName,
        customerEmail: booking.userEmail,
        serviceDescription: booking.serviceDetails || booking.note || 'Service',
        serviceDate: booking.date,
        totalAmount: booking.totalAmount || 0,
        commissionAmount: booking.platformCommission || 0,
        netAmount: booking.providerPayout || 0,
        paymentMethod: booking.paymentMethod || 'CASH',
        paymentStatus: booking.paymentStatus || 'PENDING',
        generatedAt: booking.serviceCompletionDate || booking.updatedAt,
        dueDate: booking.dueDate,
        additionalNotes: booking.additionalNotes || booking.note
      }

      // Resend the email
      const result = await this.sendInvoiceEmail(customerData, invoiceData)

      if (result.success) {
        // ✅ Update the log with retry attempt using correct invoice ID
        await db.collection('invoice_email_logs').updateOne(
          { invoiceId: invoiceData.invoiceId, status: 'FAILED' },
          {
            $set: {
              status: 'SENT',
              sentAt: new Date()
            },
            $inc: { attempts: 1 }
          }
        )
        console.log(`✅ Updated email log for invoice: ${invoiceData.invoiceId}`)

        // ✅ Also update the booking to mark email as sent
        await db.collection('bookings').updateOne(
          { _id: bookingObjectId },
          {
            $set: {
              emailSent: true,
              emailSentAt: new Date()
            }
          }
        )
      }

      return result
    } catch (error) {
      console.error('Error resending invoice email:', error)
      return {
        success: false,
        error: error.message
      }
    }
  }
}
