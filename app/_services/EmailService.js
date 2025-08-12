import nodemailer from 'nodemailer';

const { SMTP_HOST, SMTP_PORT, SMTP_USER, SMTP_PASS, SMTP_FROM_EMAIL } = process.env;

if (!SMTP_HOST || !SMTP_PORT || !SMTP_USER || !SMTP_PASS || !SMTP_FROM_EMAIL) {
  console.warn(
    '⚠️ SMTP environment variables not fully configured. Email sending will be disabled.'
  );
}

const transporter = nodemailer.createTransport({
  host: SMTP_HOST,
  port: parseInt(SMTP_PORT, 10),
  secure: parseInt(SMTP_PORT, 10) === 465, // true for 465, false for other ports
  auth: {
    user: SMTP_USER,
    pass: SMTP_PASS,
  },
});

const sendVerificationEmail = async (to, token) => {
  const verificationUrl = `${process.env.NEXTAUTH_URL}/auth/verify-email?token=${token}`;

  const mailOptions = {
    from: `"Artisan Connect" <${SMTP_FROM_EMAIL}>`,
    to: to,
    subject: 'Verify Your Email Address',
    html: `
      <div style="font-family: Arial, sans-serif; line-height: 1.6;">
        <h2>Welcome to Artisan Connect!</h2>
        <p>Please click the button below to verify your email address and complete your registration.</p>
        <a href="${verificationUrl}" style="background-color: #7c3aed; color: white; padding: 14px 25px; text-align: center; text-decoration: none; display: inline-block; border-radius: 8px; font-size: 16px;">
          Verify Email
        </a>
        <p>If you cannot click the button, copy and paste this link into your browser:</p>
        <p><a href="${verificationUrl}">${verificationUrl}</a></p>
        <p>This link will expire in 24 hours.</p>
        <hr/>
        <p>If you did not sign up for an account, you can safely ignore this email.</p>
      </div>
    `,
  };

  try {
    if (!SMTP_HOST) {
      console.log('📦 Email sending is disabled. Verification URL:');
      console.log(verificationUrl);
      return;
    }
    await transporter.sendMail(mailOptions);
    console.log(`✅ Verification email sent to ${to}`);
  } catch (error) {
    console.error(`❌ Failed to send verification email to ${to}:`, error);
    // In a real app, you might want to handle this more gracefully
    // For now, we'll log the URL to the console as a fallback
    console.log(`📦 Fallback verification URL for ${to}: ${verificationUrl}`);
    throw new Error('Failed to send verification email.');
  }
};

const sendBookingConfirmationEmail = async (bookingDetails) => {
  const { customerEmail, customerName, providerName, serviceName, date, time } = bookingDetails;
  
  const mailOptions = {
    from: `"Artisan Connect" <${SMTP_FROM_EMAIL}>`,
    to: customerEmail,
    subject: `Your Booking is Confirmed! - ${serviceName}`,
    html: `
      <div style="font-family: Arial, sans-serif; line-height: 1.6;">
        <h2>Booking Confirmed!</h2>
        <p>Hello ${customerName},</p>
        <p>Great news! Your booking with <strong>${providerName}</strong> has been confirmed.</p>
        <h3>Booking Details:</h3>
        <ul>
          <li><strong>Service:</strong> ${serviceName}</li>
          <li><strong>Date:</strong> ${new Date(date).toLocaleDateString()}</li>
          <li><strong>Time:</strong> ${time}</li>
        </ul>
        <p>Your provider will contact you shortly if they have any questions. You can view your booking details by clicking the button below.</p>
        <a href="${process.env.NEXTAUTH_URL}/mybooking" style="background-color: #7c3aed; color: white; padding: 14px 25px; text-align: center; text-decoration: none; display: inline-block; border-radius: 8px; font-size: 16px;">
          View My Bookings
        </a>
        <hr/>
        <p>Thank you for using Artisan Connect!</p>
      </div>
    `,
  };

  try {
    if (!SMTP_HOST) {
      console.log(`📦 Email sending is disabled. Confirmation for ${customerEmail} would be sent here.`);
      return;
    }
    await transporter.sendMail(mailOptions);
    console.log(`✅ Booking confirmation email sent to ${customerEmail}`);
  } catch (error) {
    console.error(`❌ Failed to send booking confirmation email to ${customerEmail}:`, error);
    // Even if email fails, the booking is confirmed. We should not throw an error here
    // to avoid breaking the main application flow.
  }
};

// NEW: Send notification to provider when customer books
const sendProviderBookingNotification = async (bookingDetails) => {
  const { 
    providerEmail, 
    providerName, 
    customerName, 
    customerEmail, 
    customerPhone,
    serviceName, 
    date, 
    time, 
    notes,
    bookingId 
  } = bookingDetails;

  if (!providerEmail) {
    console.log('⚠️ No provider email provided for booking notification');
    return;
  }
  
  const mailOptions = {
    from: `"Artisan Connect" <${SMTP_FROM_EMAIL}>`,
    to: providerEmail,
    subject: `New Booking Request - ${serviceName}`,
    html: `
      <div style="font-family: Arial, sans-serif; line-height: 1.6;">
        <h2>🎉 New Booking Request!</h2>
        <p>Hello ${providerName},</p>
        <p>You have received a new booking request on Artisan Connect!</p>
        
        <div style="background-color: #f8f9fa; padding: 20px; border-radius: 8px; margin: 20px 0;">
          <h3 style="color: #7c3aed; margin-top: 0;">Booking Details:</h3>
          <ul style="list-style: none; padding: 0;">
            <li style="margin: 8px 0;"><strong>📋 Service:</strong> ${serviceName}</li>
            <li style="margin: 8px 0;"><strong>📅 Date:</strong> ${new Date(date).toLocaleDateString('en-US', { 
              weekday: 'long', 
              year: 'numeric', 
              month: 'long', 
              day: 'numeric' 
            })}</li>
            <li style="margin: 8px 0;"><strong>🕐 Time:</strong> ${time}</li>
            <li style="margin: 8px 0;"><strong>👤 Customer:</strong> ${customerName}</li>
            <li style="margin: 8px 0;"><strong>📧 Email:</strong> ${customerEmail}</li>
            ${customerPhone ? `<li style="margin: 8px 0;"><strong>📞 Phone:</strong> ${customerPhone}</li>` : ''}
            ${notes ? `<li style="margin: 8px 0;"><strong>📝 Notes:</strong> ${notes}</li>` : ''}
          </ul>
        </div>

        <div style="margin: 30px 0;">
          <a href="${process.env.NEXTAUTH_URL}/provider/dashboard" 
             style="background-color: #7c3aed; color: white; padding: 14px 25px; text-align: center; text-decoration: none; display: inline-block; border-radius: 8px; font-size: 16px; margin-right: 10px;">
            View Dashboard
          </a>
          <a href="${process.env.NEXTAUTH_URL}/provider/bookings" 
             style="background-color: #059669; color: white; padding: 14px 25px; text-align: center; text-decoration: none; display: inline-block; border-radius: 8px; font-size: 16px;">
            Manage Bookings
          </a>
        </div>

        <div style="background-color: #fef3c7; padding: 15px; border-radius: 8px; border-left: 4px solid #f59e0b;">
          <p style="margin: 0;"><strong>💡 Next Steps:</strong></p>
          <ul style="margin: 10px 0 0 0;">
            <li>Contact the customer to confirm details</li>
            <li>Update the booking status in your dashboard</li>
            <li>Prepare for the scheduled service</li>
          </ul>
        </div>

        <hr style="margin: 30px 0;"/>
        <p style="color: #6b7280; font-size: 14px;">
          This email was sent because you received a new booking on Artisan Connect. 
          You can manage your notification preferences in your 
          <a href="${process.env.NEXTAUTH_URL}/provider/profile" style="color: #7c3aed;">provider dashboard</a>.
        </p>
      </div>
    `,
  };

  try {
    if (!SMTP_HOST) {
      console.log(`📦 Email sending is disabled. Provider notification for ${providerEmail} would be sent here.`);
      return;
    }
    await transporter.sendMail(mailOptions);
    console.log(`✅ Provider booking notification sent to ${providerEmail}`);
  } catch (error) {
    console.error(`❌ Failed to send provider notification to ${providerEmail}:`, error);
    // Don't throw error to avoid breaking booking flow
  }
};

/**
 * Generic email sending method
 */
const sendEmail = async (emailOptions) => {
  try {
    if (!SMTP_HOST) {
      console.log(`📦 Email sending is disabled. Email to ${emailOptions.to} would be sent here.`);
      return {
        success: true,
        messageId: `MOCK_${Date.now()}`,
        message: 'Email sending disabled - mock success'
      };
    }

    const mailOptions = {
      from: `"ArtisanConnect" <${SMTP_FROM_EMAIL}>`,
      to: emailOptions.to,
      subject: emailOptions.subject,
      html: emailOptions.html,
      attachments: emailOptions.attachments || []
    };

    const result = await transporter.sendMail(mailOptions);
    console.log(`✅ Email sent successfully to ${emailOptions.to}`);

    return {
      success: true,
      messageId: result.messageId,
      message: 'Email sent successfully'
    };

  } catch (error) {
    console.error(`❌ Failed to send email to ${emailOptions.to}:`, error);
    return {
      success: false,
      error: error.message
    };
  }
};

export const EmailService = {
  sendVerificationEmail,
  sendBookingConfirmationEmail,
  sendProviderBookingNotification,
  sendEmail,
};