/**
 * Notification Service for sending emails and SMS
 * Handles commission reminders, payment confirmations, and system notifications
 */

export class NotificationService {
  
  /**
   * Send commission reminder email
   */
  static async sendCommissionReminder(providerData, commissionData) {
    try {
      const emailData = {
        to: providerData.email,
        subject: 'Commission Payment Reminder - ArtisanConnect',
        template: 'commission_reminder',
        data: {
          providerName: providerData.name,
          totalOwed: commissionData.totalOwed,
          transactionCount: commissionData.transactionCount,
          dueDate: commissionData.dueDate,
          paymentUrl: `${process.env.NEXTAUTH_URL}/provider/commission-payment`
        }
      }
      
      const result = await this.sendEmail(emailData)
      
      if (result.success) {
        console.log(`✅ Commission reminder sent to ${providerData.email}`)
        return { success: true, messageId: result.messageId }
      } else {
        throw new Error(result.error)
      }
      
    } catch (error) {
      console.error('❌ Error sending commission reminder:', error)
      throw error
    }
  }
  
  /**
   * Send payment confirmation email
   */
  static async sendPaymentConfirmation(providerData, paymentData) {
    try {
      const emailData = {
        to: providerData.email,
        subject: 'Payment Confirmation - ArtisanConnect',
        template: 'payment_confirmation',
        data: {
          providerName: providerData.name,
          amount: paymentData.amount,
          paymentMethod: paymentData.method,
          reference: paymentData.reference,
          date: new Date().toLocaleDateString(),
          receiptUrl: `${process.env.NEXTAUTH_URL}/provider/receipts/${paymentData.reference}`
        }
      }
      
      const result = await this.sendEmail(emailData)
      
      if (result.success) {
        console.log(`✅ Payment confirmation sent to ${providerData.email}`)
        return { success: true, messageId: result.messageId }
      } else {
        throw new Error(result.error)
      }
      
    } catch (error) {
      console.error('❌ Error sending payment confirmation:', error)
      throw error
    }
  }
  
  /**
   * Send overdue commission alert
   */
  static async sendOverdueAlert(providerData, commissionData) {
    try {
      const emailData = {
        to: providerData.email,
        subject: 'URGENT: Overdue Commission Payment - ArtisanConnect',
        template: 'overdue_commission',
        data: {
          providerName: providerData.name,
          totalOwed: commissionData.totalOwed,
          daysPastDue: commissionData.daysPastDue,
          penaltyAmount: commissionData.penaltyAmount || 0,
          paymentUrl: `${process.env.NEXTAUTH_URL}/provider/commission-payment`
        }
      }
      
      const result = await this.sendEmail(emailData)
      
      if (result.success) {
        console.log(`🚨 Overdue alert sent to ${providerData.email}`)
        return { success: true, messageId: result.messageId }
      } else {
        throw new Error(result.error)
      }
      
    } catch (error) {
      console.error('❌ Error sending overdue alert:', error)
      throw error
    }
  }
  
  /**
   * Send invoice generated notification
   */
  static async sendInvoiceNotification(customerData, invoiceData) {
    try {
      const emailData = {
        to: customerData.email,
        subject: 'Service Invoice - ArtisanConnect',
        template: 'invoice_notification',
        data: {
          customerName: customerData.name,
          providerName: invoiceData.providerName,
          serviceDescription: invoiceData.serviceDescription,
          amount: invoiceData.amount,
          invoiceId: invoiceData.invoiceId,
          serviceDate: invoiceData.serviceDate,
          invoiceUrl: `${process.env.NEXTAUTH_URL}/invoices/${invoiceData.invoiceId}`
        }
      }
      
      const result = await this.sendEmail(emailData)
      
      if (result.success) {
        console.log(`📧 Invoice notification sent to ${customerData.email}`)
        return { success: true, messageId: result.messageId }
      } else {
        throw new Error(result.error)
      }
      
    } catch (error) {
      console.error('❌ Error sending invoice notification:', error)
      throw error
    }
  }

  /**
   * Send business revocation notification
   */
  static async sendBusinessRevocationNotification(providerData, revocationData) {
    try {
      const emailData = {
        to: providerData.email,
        subject: 'Business Listing Revoked - ArtisanConnect',
        template: 'business_revocation',
        data: {
          providerName: providerData.name,
          businessName: revocationData.businessName,
          reason: revocationData.reason,
          revokedAt: revocationData.revokedAt,
          revokedBy: revocationData.revokedBy,
          supportEmail: 'support@artisanconnect.com',
          appealUrl: `${process.env.NEXTAUTH_URL}/provider/appeal`
        }
      }

      const result = await this.sendEmail(emailData)

      if (result.success) {
        console.log(`✅ Business revocation notification sent to ${providerData.email}`)
        return { success: true, messageId: result.messageId }
      } else {
        throw new Error(result.error)
      }

    } catch (error) {
      console.error('❌ Error sending business revocation notification:', error)
      throw error
    }
  }

  /**
   * Send SMS notification
   */
  static async sendSMS(phoneNumber, message) {
    try {
      // Mock SMS implementation - replace with actual SMS service
      console.log(`📱 SMS to ${phoneNumber}: ${message}`)
      
      // In a real implementation, you would integrate with services like:
      // - Twilio
      // - AWS SNS
      // - Africa's Talking
      // - Hubtel (for Ghana)
      
      return {
        success: true,
        messageId: `SMS_${Date.now()}`,
        message: 'SMS sent successfully (mock)'
      }
      
    } catch (error) {
      console.error('❌ Error sending SMS:', error)
      throw error
    }
  }
  
  /**
   * Send email using email service
   */
  static async sendEmail(emailData) {
    try {
      // ✅ FIXED: Use actual EmailService instead of mock
      const { EmailService } = await import('./EmailService')

      // Generate email content based on template
      const emailContent = this.generateEmailContent(emailData.template, emailData.data)

      const emailOptions = {
        to: emailData.to,
        subject: emailData.subject,
        html: emailContent
      }

      console.log(`📧 Sending ${emailData.template} email to ${emailData.to}`)

      const result = await EmailService.sendEmail(emailOptions)

      if (result.success) {
        console.log(`✅ Email sent successfully to ${emailData.to}`)
        return {
          success: true,
          messageId: result.messageId,
          message: 'Email sent successfully'
        }
      } else {
        throw new Error(result.error || 'Failed to send email')
      }

    } catch (error) {
      console.error('❌ Error sending email:', error)
      throw error
    }
  }

  /**
   * Generate email content based on template
   */
  static generateEmailContent(template, data) {
    switch (template) {
      case 'business_revocation':
        return this.generateBusinessRevocationEmail(data)
      case 'commission_reminder':
        return this.generateCommissionReminderEmail(data)
      case 'payment_confirmation':
        return this.generatePaymentConfirmationEmail(data)
      case 'overdue_commission':
        return this.generateOverdueCommissionEmail(data)
      case 'invoice_notification':
        return this.generateInvoiceNotificationEmail(data)
      default:
        return this.generateGenericEmail(data)
    }
  }

  /**
   * Generate business revocation email template
   */
  static generateBusinessRevocationEmail(data) {
    return `
      <!DOCTYPE html>
      <html>
      <head>
        <meta charset="utf-8">
        <title>Business Listing Revoked</title>
        <style>
          body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
          .container { max-width: 600px; margin: 0 auto; padding: 20px; }
          .header { background-color: #dc3545; color: white; padding: 20px; text-align: center; }
          .content { padding: 20px; background-color: #f8f9fa; }
          .footer { padding: 20px; text-align: center; color: #666; }
          .button { display: inline-block; padding: 12px 24px; background-color: #007bff; color: white; text-decoration: none; border-radius: 4px; }
        </style>
      </head>
      <body>
        <div class="container">
          <div class="header">
            <h1>Business Listing Revoked</h1>
          </div>
          <div class="content">
            <p>Dear ${data.providerName},</p>

            <p>We regret to inform you that your business listing "<strong>${data.businessName}</strong>" has been revoked from ArtisanConnect.</p>

            <p><strong>Reason for revocation:</strong><br>
            ${data.reason}</p>

            <p><strong>Revoked on:</strong> ${new Date(data.revokedAt).toLocaleDateString()}<br>
            <strong>Revoked by:</strong> ${data.revokedBy}</p>

            <p>If you believe this action was taken in error, you can appeal this decision by contacting our support team.</p>

            <p style="text-align: center; margin: 30px 0;">
              <a href="${data.appealUrl}" class="button">Appeal Decision</a>
            </p>

            <p>For any questions or concerns, please contact us at <a href="mailto:${data.supportEmail}">${data.supportEmail}</a>.</p>

            <p>Best regards,<br>
            The ArtisanConnect Team</p>
          </div>
          <div class="footer">
            <p>&copy; ${new Date().getFullYear()} ArtisanConnect. All rights reserved.</p>
          </div>
        </div>
      </body>
      </html>
    `
  }

  /**
   * Generate generic email template
   */
  static generateGenericEmail(data) {
    return `
      <!DOCTYPE html>
      <html>
      <head>
        <meta charset="utf-8">
        <title>Notification from ArtisanConnect</title>
        <style>
          body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
          .container { max-width: 600px; margin: 0 auto; padding: 20px; }
          .header { background-color: #007bff; color: white; padding: 20px; text-align: center; }
          .content { padding: 20px; background-color: #f8f9fa; }
          .footer { padding: 20px; text-align: center; color: #666; }
        </style>
      </head>
      <body>
        <div class="container">
          <div class="header">
            <h1>ArtisanConnect Notification</h1>
          </div>
          <div class="content">
            <p>Hello,</p>
            <p>You have received a notification from ArtisanConnect.</p>
            <p>Best regards,<br>The ArtisanConnect Team</p>
          </div>
          <div class="footer">
            <p>&copy; ${new Date().getFullYear()} ArtisanConnect. All rights reserved.</p>
          </div>
        </div>
      </body>
      </html>
    `
  }

  /**
   * Schedule commission reminder notifications
   */
  static async scheduleCommissionReminders() {
    try {
      console.log('🔄 Scheduling commission reminders...')
      
      // This would typically run as a cron job or scheduled task
      // Get all providers with outstanding commissions
      const providersWithOwedCommission = await this.getProvidersWithOwedCommission()
      
      for (const provider of providersWithOwedCommission) {
        const daysSinceLastReminder = this.calculateDaysSinceLastReminder(provider)
        
        if (daysSinceLastReminder >= 7) { // Send reminder every 7 days
          await this.sendCommissionReminder(provider, provider.commissionData)
          
          // Update last reminder date
          await this.updateLastReminderDate(provider.email)
        }
        
        // Send overdue alerts for commissions past due
        if (provider.commissionData.daysPastDue > 0) {
          await this.sendOverdueAlert(provider, provider.commissionData)
        }
      }
      
      console.log(`✅ Commission reminders processed for ${providersWithOwedCommission.length} providers`)
      
    } catch (error) {
      console.error('❌ Error scheduling commission reminders:', error)
      throw error
    }
  }
  
  /**
   * Get providers with owed commission (mock implementation)
   */
  static async getProvidersWithOwedCommission() {
    // Mock data - replace with actual database query
    return [
      {
        email: 'provider1@example.com',
        name: 'John Doe',
        phone: '+233123456789',
        commissionData: {
          totalOwed: 285.50,
          transactionCount: 3,
          daysPastDue: 5,
          dueDate: new Date(Date.now() - 5 * 24 * 60 * 60 * 1000)
        },
        lastReminderDate: new Date(Date.now() - 8 * 24 * 60 * 60 * 1000)
      },
      {
        email: 'provider2@example.com',
        name: 'Jane Smith',
        phone: '+233987654321',
        commissionData: {
          totalOwed: 156.75,
          transactionCount: 2,
          daysPastDue: 0,
          dueDate: new Date(Date.now() + 2 * 24 * 60 * 60 * 1000)
        },
        lastReminderDate: new Date(Date.now() - 10 * 24 * 60 * 60 * 1000)
      }
    ]
  }
  
  /**
   * Calculate days since last reminder
   */
  static calculateDaysSinceLastReminder(provider) {
    if (!provider.lastReminderDate) return 999 // Never sent
    
    const now = new Date()
    const lastReminder = new Date(provider.lastReminderDate)
    const diffTime = Math.abs(now - lastReminder)
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24))
    
    return diffDays
  }
  
  /**
   * Update last reminder date (mock implementation)
   */
  static async updateLastReminderDate(providerEmail) {
    console.log(`📅 Updated last reminder date for ${providerEmail}`)
    // In real implementation, update database record
  }
  
  /**
   * Send bulk notifications
   */
  static async sendBulkNotifications(notifications) {
    try {
      const results = []
      
      for (const notification of notifications) {
        try {
          let result
          
          if (notification.type === 'email') {
            result = await this.sendEmail(notification.data)
          } else if (notification.type === 'sms') {
            result = await this.sendSMS(notification.phone, notification.message)
          }
          
          results.push({
            id: notification.id,
            success: result.success,
            messageId: result.messageId
          })
          
        } catch (error) {
          results.push({
            id: notification.id,
            success: false,
            error: error.message
          })
        }
      }
      
      console.log(`📬 Bulk notifications sent: ${results.filter(r => r.success).length}/${results.length} successful`)
      return results
      
    } catch (error) {
      console.error('❌ Error sending bulk notifications:', error)
      throw error
    }
  }
}
