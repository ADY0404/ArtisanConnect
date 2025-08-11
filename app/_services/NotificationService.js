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
      // Mock email implementation - replace with actual email service
      console.log(`📧 Email to ${emailData.to}:`, emailData)
      
      // In a real implementation, you would integrate with services like:
      // - SendGrid
      // - AWS SES
      // - Mailgun
      // - Resend
      
      return {
        success: true,
        messageId: `EMAIL_${Date.now()}`,
        message: 'Email sent successfully (mock)'
      }
      
    } catch (error) {
      console.error('❌ Error sending email:', error)
      throw error
    }
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
