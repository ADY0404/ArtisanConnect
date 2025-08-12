import React from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { FileText, Shield, Users, AlertTriangle } from 'lucide-react'

export default function TermsOfServicePage() {
  const lastUpdated = "January 15, 2024"

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Hero Section */}
      <section className="bg-gradient-to-r from-blue-600 to-purple-600 text-white py-16">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center">
            <h1 className="text-4xl md:text-5xl font-bold mb-4">
              Terms of Service
            </h1>
            <p className="text-xl mb-6 max-w-3xl mx-auto">
              Please read these terms and conditions carefully before using Artisan Connect services.
            </p>
            <Badge variant="secondary" className="text-lg px-4 py-2">
              <FileText className="w-4 h-4 mr-2" />
              Last Updated: {lastUpdated}
            </Badge>
          </div>
        </div>
      </section>

      {/* Terms Content */}
      <section className="py-16">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
          
          {/* Introduction */}
          <Card className="mb-8">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <FileText className="w-5 h-5" />
                1. Introduction and Acceptance
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <p className="text-gray-700">
                Welcome to Artisan Connect ("we," "our," or "us"). These Terms of Service ("Terms") 
                govern your use of our website, mobile application, and services (collectively, the "Platform").
              </p>
              <p className="text-gray-700">
                By accessing or using our Platform, you agree to be bound by these Terms. If you do not 
                agree to these Terms, please do not use our services.
              </p>
              <div className="bg-blue-50 p-4 rounded-lg border-l-4 border-blue-500">
                <p className="text-blue-800 font-medium">
                  Important: These Terms constitute a legally binding agreement between you and Artisan Connect.
                </p>
              </div>
            </CardContent>
          </Card>

          {/* Definitions */}
          <Card className="mb-8">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Users className="w-5 h-5" />
                2. Definitions
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-3">
                <div>
                  <strong>"Customer"</strong> - Any individual who uses our Platform to book home services.
                </div>
                <div>
                  <strong>"Service Provider" or "Artisan"</strong> - Verified professionals who offer services through our Platform.
                </div>
                <div>
                  <strong>"Services"</strong> - Home maintenance, repair, cleaning, and other services offered by Service Providers.
                </div>
                <div>
                  <strong>"Booking"</strong> - A confirmed appointment between a Customer and Service Provider.
                </div>
                <div>
                  <strong>"Platform"</strong> - Artisan Connect website, mobile app, and related services.
                </div>
              </div>
            </CardContent>
          </Card>

          {/* User Accounts */}
          <Card className="mb-8">
            <CardHeader>
              <CardTitle>3. User Accounts and Registration</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <h4 className="font-semibold">3.1 Account Creation</h4>
              <p className="text-gray-700">
                To use certain features of our Platform, you must create an account. You agree to:
              </p>
              <ul className="list-disc list-inside space-y-2 text-gray-700 ml-4">
                <li>Provide accurate, current, and complete information</li>
                <li>Maintain and update your account information</li>
                <li>Keep your login credentials secure and confidential</li>
                <li>Notify us immediately of any unauthorized account access</li>
              </ul>

              <h4 className="font-semibold mt-6">3.2 Account Responsibility</h4>
              <p className="text-gray-700">
                You are responsible for all activities that occur under your account. We reserve the right 
                to suspend or terminate accounts that violate these Terms.
              </p>
            </CardContent>
          </Card>

          {/* Service Provider Terms */}
          <Card className="mb-8">
            <CardHeader>
              <CardTitle>4. Service Provider Terms</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <h4 className="font-semibold">4.1 Verification Process</h4>
              <p className="text-gray-700">
                All Service Providers must complete our verification process, including:
              </p>
              <ul className="list-disc list-inside space-y-2 text-gray-700 ml-4">
                <li>Identity verification and background checks</li>
                <li>Skill assessment and certification review</li>
                <li>Insurance and licensing verification (where applicable)</li>
                <li>Reference checks and portfolio review</li>
              </ul>

              <h4 className="font-semibold mt-6">4.2 Service Standards</h4>
              <p className="text-gray-700">
                Service Providers agree to:
              </p>
              <ul className="list-disc list-inside space-y-2 text-gray-700 ml-4">
                <li>Provide services professionally and competently</li>
                <li>Arrive punctually for scheduled appointments</li>
                <li>Communicate clearly with customers</li>
                <li>Maintain appropriate insurance coverage</li>
                <li>Follow all applicable laws and regulations</li>
              </ul>

              <h4 className="font-semibold mt-6">4.3 Commission and Payments</h4>
              <p className="text-gray-700">
                Service Providers agree to pay platform commission fees as outlined in their provider agreement. 
                Commission rates vary based on provider tier and service type.
              </p>
            </CardContent>
          </Card>

          {/* Customer Terms */}
          <Card className="mb-8">
            <CardHeader>
              <CardTitle>5. Customer Terms</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <h4 className="font-semibold">5.1 Booking and Payment</h4>
              <p className="text-gray-700">
                Customers agree to:
              </p>
              <ul className="list-disc list-inside space-y-2 text-gray-700 ml-4">
                <li>Provide accurate service requirements and location details</li>
                <li>Be present or arrange access for scheduled services</li>
                <li>Pay for services as agreed upon booking</li>
                <li>Treat Service Providers with respect and professionalism</li>
              </ul>

              <h4 className="font-semibold mt-6">5.2 Cancellation Policy</h4>
              <p className="text-gray-700">
                Customers may cancel bookings according to our cancellation policy:
              </p>
              <ul className="list-disc list-inside space-y-2 text-gray-700 ml-4">
                <li>Free cancellation up to 24 hours before scheduled service</li>
                <li>50% charge for cancellations within 24 hours</li>
                <li>Full charge for no-shows or same-day cancellations</li>
              </ul>
            </CardContent>
          </Card>

          {/* Platform Usage */}
          <Card className="mb-8">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Shield className="w-5 h-5" />
                6. Platform Usage and Restrictions
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <h4 className="font-semibold">6.1 Permitted Use</h4>
              <p className="text-gray-700">
                You may use our Platform only for lawful purposes and in accordance with these Terms.
              </p>

              <h4 className="font-semibold mt-6">6.2 Prohibited Activities</h4>
              <p className="text-gray-700">You agree not to:</p>
              <ul className="list-disc list-inside space-y-2 text-gray-700 ml-4">
                <li>Use the Platform for any illegal or unauthorized purpose</li>
                <li>Attempt to circumvent our payment system</li>
                <li>Post false, misleading, or defamatory content</li>
                <li>Interfere with or disrupt the Platform's operation</li>
                <li>Attempt to gain unauthorized access to our systems</li>
                <li>Use automated tools to access or interact with the Platform</li>
              </ul>
            </CardContent>
          </Card>

          {/* Liability and Disclaimers */}
          <Card className="mb-8">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <AlertTriangle className="w-5 h-5" />
                7. Liability and Disclaimers
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <h4 className="font-semibold">7.1 Platform Role</h4>
              <p className="text-gray-700">
                Artisan Connect acts as an intermediary platform connecting customers with service providers. 
                We do not directly provide home services and are not responsible for the quality, safety, 
                or legality of services provided by third-party providers.
              </p>

              <h4 className="font-semibold mt-6">7.2 Limitation of Liability</h4>
              <p className="text-gray-700">
                To the maximum extent permitted by law, Artisan Connect shall not be liable for any indirect, 
                incidental, special, consequential, or punitive damages arising from your use of the Platform.
              </p>

              <div className="bg-yellow-50 p-4 rounded-lg border-l-4 border-yellow-500">
                <p className="text-yellow-800 font-medium">
                  Important: While we verify our service providers, customers should exercise reasonable 
                  caution and judgment when engaging services.
                </p>
              </div>
            </CardContent>
          </Card>

          {/* Privacy and Data */}
          <Card className="mb-8">
            <CardHeader>
              <CardTitle>8. Privacy and Data Protection</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <p className="text-gray-700">
                Your privacy is important to us. Our collection, use, and protection of your personal 
                information is governed by our Privacy Policy, which is incorporated into these Terms by reference.
              </p>
              <p className="text-gray-700">
                By using our Platform, you consent to the collection and use of your information as 
                described in our Privacy Policy.
              </p>
            </CardContent>
          </Card>

          {/* Dispute Resolution */}
          <Card className="mb-8">
            <CardHeader>
              <CardTitle>9. Dispute Resolution</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <h4 className="font-semibold">9.1 Customer-Provider Disputes</h4>
              <p className="text-gray-700">
                We provide mediation services for disputes between customers and service providers. 
                Our support team will work to resolve issues fairly and promptly.
              </p>

              <h4 className="font-semibold mt-6">9.2 Platform Disputes</h4>
              <p className="text-gray-700">
                Any disputes with Artisan Connect should first be addressed through our customer support. 
                Unresolved disputes may be subject to arbitration under Ghanaian law.
              </p>
            </CardContent>
          </Card>

          {/* Termination */}
          <Card className="mb-8">
            <CardHeader>
              <CardTitle>10. Termination</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <p className="text-gray-700">
                We reserve the right to suspend or terminate your account and access to the Platform 
                at our sole discretion, without notice, for conduct that we believe violates these 
                Terms or is harmful to other users, us, or third parties.
              </p>
              <p className="text-gray-700">
                You may terminate your account at any time by contacting our support team. Upon 
                termination, your right to use the Platform will cease immediately.
              </p>
            </CardContent>
          </Card>

          {/* Changes to Terms */}
          <Card className="mb-8">
            <CardHeader>
              <CardTitle>11. Changes to Terms</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <p className="text-gray-700">
                We reserve the right to modify these Terms at any time. We will notify users of 
                significant changes via email or platform notifications. Continued use of the 
                Platform after changes constitutes acceptance of the new Terms.
              </p>
            </CardContent>
          </Card>

          {/* Governing Law */}
          <Card className="mb-8">
            <CardHeader>
              <CardTitle>12. Governing Law</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <p className="text-gray-700">
                These Terms are governed by and construed in accordance with the laws of Ghana. 
                Any legal action or proceeding arising under these Terms will be brought exclusively 
                in the courts of Ghana.
              </p>
            </CardContent>
          </Card>

          {/* Contact Information */}
          <Card className="mb-8">
            <CardHeader>
              <CardTitle>13. Contact Information</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <p className="text-gray-700">
                If you have any questions about these Terms of Service, please contact us:
              </p>
              <div className="bg-gray-50 p-4 rounded-lg">
                <p><strong>Email:</strong> legal@artisanconnect.com</p>
                <p><strong>Phone:</strong> +233 24 123 4567</p>
                <p><strong>Address:</strong> 123 Tech Avenue, East Legon, Accra, Ghana</p>
              </div>
            </CardContent>
          </Card>

          {/* Effective Date */}
          <div className="text-center py-8 border-t border-gray-200">
            <p className="text-gray-600">
              These Terms of Service are effective as of {lastUpdated}
            </p>
            <p className="text-sm text-gray-500 mt-2">
              Version 1.0 - Artisan Connect Terms of Service
            </p>
          </div>
        </div>
      </section>
    </div>
  )
}
