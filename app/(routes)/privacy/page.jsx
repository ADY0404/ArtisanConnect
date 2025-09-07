import React from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Shield, Eye, Lock, Database, UserCheck, AlertCircle } from 'lucide-react'

export default function PrivacyPolicyPage() {
  const lastUpdated = "January 15, 2024"

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Hero Section */}
      <section className="bg-gradient-to-r from-green-600 to-blue-600 text-white py-16">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center">
            <h1 className="text-4xl md:text-5xl font-bold mb-4">
              Privacy Policy
            </h1>
            <p className="text-xl mb-6 max-w-3xl mx-auto">
              Your privacy is important to us. This policy explains how we collect, use, and protect your personal information.
            </p>
            <Badge variant="secondary" className="text-lg px-4 py-2">
              <Shield className="w-4 h-4 mr-2" />
              Last Updated: {lastUpdated}
            </Badge>
          </div>
        </div>
      </section>

      {/* Privacy Content */}
      <section className="py-16">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
          
          {/* Introduction */}
          <Card className="mb-8">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Eye className="w-5 h-5" />
                1. Introduction
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <p className="text-gray-700">
                Artisan Connect ("we," "our," or "us") is committed to protecting your privacy and personal information. 
                This Privacy Policy explains how we collect, use, disclose, and safeguard your information when you 
                use our platform, website, and mobile application.
              </p>
              <p className="text-gray-700">
                By using our services, you consent to the data practices described in this policy. If you do not 
                agree with this policy, please do not use our services.
              </p>
              <div className="bg-green-50 p-4 rounded-lg border-l-4 border-green-500">
                <p className="text-green-800 font-medium">
                  We are committed to transparency and will always inform you about how your data is used.
                </p>
              </div>
            </CardContent>
          </Card>

          {/* Information We Collect */}
          <Card className="mb-8">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Database className="w-5 h-5" />
                2. Information We Collect
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <h4 className="font-semibold">2.1 Personal Information</h4>
              <p className="text-gray-700">We collect information you provide directly to us, including:</p>
              <ul className="list-disc list-inside space-y-2 text-gray-700 ml-4">
                <li><strong>Account Information:</strong> Name, email address, phone number, password</li>
                <li><strong>Profile Information:</strong> Profile picture, bio, preferences</li>
                <li><strong>Payment Information:</strong> Billing address, payment method details (processed securely)</li>
                <li><strong>Service Information:</strong> Service requests, booking details, reviews and ratings</li>
                <li><strong>Communication:</strong> Messages, support tickets, feedback</li>
              </ul>

              <h4 className="font-semibold mt-6">2.2 Service Provider Additional Information</h4>
              <p className="text-gray-700">For service providers, we also collect:</p>
              <ul className="list-disc list-inside space-y-2 text-gray-700 ml-4">
                <li><strong>Verification Documents:</strong> ID, licenses, certifications, insurance</li>
                <li><strong>Business Information:</strong> Business name, address, services offered</li>
                <li><strong>Financial Information:</strong> Bank account details for payments</li>
                <li><strong>Background Check:</strong> Criminal background verification (where applicable)</li>
              </ul>

              <h4 className="font-semibold mt-6">2.3 Automatically Collected Information</h4>
              <p className="text-gray-700">We automatically collect certain information, including:</p>
              <ul className="list-disc list-inside space-y-2 text-gray-700 ml-4">
                <li><strong>Device Information:</strong> IP address, browser type, operating system</li>
                <li><strong>Usage Data:</strong> Pages visited, time spent, click patterns</li>
                <li><strong>Location Data:</strong> Approximate location for service matching (with permission)</li>
                <li><strong>Cookies and Tracking:</strong> Website preferences and analytics data</li>
              </ul>
            </CardContent>
          </Card>

          {/* How We Use Information */}
          <Card className="mb-8">
            <CardHeader>
              <CardTitle>3. How We Use Your Information</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <p className="text-gray-700">We use your information for the following purposes:</p>
              
              <h4 className="font-semibold">3.1 Service Provision</h4>
              <ul className="list-disc list-inside space-y-2 text-gray-700 ml-4">
                <li>Create and manage your account</li>
                <li>Process bookings and facilitate service connections</li>
                <li>Process payments and handle billing</li>
                <li>Provide customer support and respond to inquiries</li>
                <li>Send service-related notifications and updates</li>
              </ul>

              <h4 className="font-semibold mt-6">3.2 Platform Improvement</h4>
              <ul className="list-disc list-inside space-y-2 text-gray-700 ml-4">
                <li>Analyze usage patterns to improve our services</li>
                <li>Develop new features and functionality</li>
                <li>Conduct research and analytics</li>
                <li>Personalize your experience on our platform</li>
              </ul>

              <h4 className="font-semibold mt-6">3.3 Safety and Security</h4>
              <ul className="list-disc list-inside space-y-2 text-gray-700 ml-4">
                <li>Verify identity and prevent fraud</li>
                <li>Ensure platform safety and security</li>
                <li>Investigate and resolve disputes</li>
                <li>Comply with legal obligations</li>
              </ul>

              <h4 className="font-semibold mt-6">3.4 Marketing and Communication</h4>
              <ul className="list-disc list-inside space-y-2 text-gray-700 ml-4">
                <li>Send promotional offers and updates (with consent)</li>
                <li>Provide relevant service recommendations</li>
                <li>Conduct surveys and gather feedback</li>
              </ul>
            </CardContent>
          </Card>

          {/* Information Sharing */}
          <Card className="mb-8">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <UserCheck className="w-5 h-5" />
                4. How We Share Your Information
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <p className="text-gray-700">We may share your information in the following circumstances:</p>

              <h4 className="font-semibold">4.1 Service Facilitation</h4>
              <ul className="list-disc list-inside space-y-2 text-gray-700 ml-4">
                <li><strong>Between Users:</strong> Contact information shared between customers and service providers for bookings</li>
                <li><strong>Service Providers:</strong> Booking details and customer contact information</li>
                <li><strong>Customers:</strong> Service provider profiles, ratings, and reviews</li>
              </ul>

              <h4 className="font-semibold mt-6">4.2 Service Providers</h4>
              <ul className="list-disc list-inside space-y-2 text-gray-700 ml-4">
                <li><strong>Payment Processors:</strong> Secure payment processing (Paystack, etc.)</li>
                <li><strong>Background Check Services:</strong> Identity and background verification</li>
                <li><strong>Communication Services:</strong> Email and SMS notifications</li>
                <li><strong>Analytics Providers:</strong> Platform usage analytics (anonymized)</li>
              </ul>

              <h4 className="font-semibold mt-6">4.3 Legal Requirements</h4>
              <ul className="list-disc list-inside space-y-2 text-gray-700 ml-4">
                <li>Comply with legal obligations and court orders</li>
                <li>Protect our rights and property</li>
                <li>Investigate fraud or security issues</li>
                <li>Protect user safety and public interest</li>
              </ul>

              <div className="bg-blue-50 p-4 rounded-lg border-l-4 border-blue-500">
                <p className="text-blue-800 font-medium">
                  We never sell your personal information to third parties for marketing purposes.
                </p>
              </div>
            </CardContent>
          </Card>

          {/* Data Security */}
          <Card className="mb-8">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Lock className="w-5 h-5" />
                5. Data Security
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <p className="text-gray-700">
                We implement appropriate technical and organizational security measures to protect your personal information:
              </p>
              <ul className="list-disc list-inside space-y-2 text-gray-700 ml-4">
                <li><strong>Encryption:</strong> Data encrypted in transit and at rest</li>
                <li><strong>Access Controls:</strong> Limited access to personal information on a need-to-know basis</li>
                <li><strong>Secure Infrastructure:</strong> Industry-standard security protocols and monitoring</li>
                <li><strong>Regular Audits:</strong> Security assessments and vulnerability testing</li>
                <li><strong>Staff Training:</strong> Regular privacy and security training for employees</li>
              </ul>
              <p className="text-gray-700">
                However, no method of transmission over the internet is 100% secure. While we strive to protect 
                your information, we cannot guarantee absolute security.
              </p>
            </CardContent>
          </Card>

          {/* Your Rights */}
          <Card className="mb-8">
            <CardHeader>
              <CardTitle>6. Your Privacy Rights</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <p className="text-gray-700">You have the following rights regarding your personal information:</p>
              
              <h4 className="font-semibold">6.1 Access and Portability</h4>
              <ul className="list-disc list-inside space-y-2 text-gray-700 ml-4">
                <li>Request access to your personal information</li>
                <li>Receive a copy of your data in a portable format</li>
                <li>View and update your account information</li>
              </ul>

              <h4 className="font-semibold mt-6">6.2 Correction and Deletion</h4>
              <ul className="list-disc list-inside space-y-2 text-gray-700 ml-4">
                <li>Correct inaccurate or incomplete information</li>
                <li>Request deletion of your personal information</li>
                <li>Deactivate your account at any time</li>
              </ul>

              <h4 className="font-semibold mt-6">6.3 Communication Preferences</h4>
              <ul className="list-disc list-inside space-y-2 text-gray-700 ml-4">
                <li>Opt out of marketing communications</li>
                <li>Manage notification preferences</li>
                <li>Control cookie settings</li>
              </ul>

              <p className="text-gray-700 mt-4">
                To exercise these rights, please contact us at privacy@artisanconnect.com or through your account settings.
              </p>
            </CardContent>
          </Card>

          {/* Data Retention */}
          <Card className="mb-8">
            <CardHeader>
              <CardTitle>7. Data Retention</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <p className="text-gray-700">
                We retain your personal information for as long as necessary to provide our services and fulfill 
                the purposes outlined in this policy:
              </p>
              <ul className="list-disc list-inside space-y-2 text-gray-700 ml-4">
                <li><strong>Account Information:</strong> Until account deletion or 3 years of inactivity</li>
                <li><strong>Transaction Records:</strong> 7 years for financial and legal compliance</li>
                <li><strong>Communication Records:</strong> 2 years for customer support purposes</li>
                <li><strong>Marketing Data:</strong> Until you opt out or 2 years of inactivity</li>
              </ul>
              <p className="text-gray-700">
                Some information may be retained longer if required by law or for legitimate business purposes.
              </p>
            </CardContent>
          </Card>

          {/* Cookies and Tracking */}
          <Card className="mb-8">
            <CardHeader>
              <CardTitle>8. Cookies and Tracking Technologies</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <p className="text-gray-700">
                We use cookies and similar tracking technologies to enhance your experience:
              </p>
              
              <h4 className="font-semibold">8.1 Types of Cookies</h4>
              <ul className="list-disc list-inside space-y-2 text-gray-700 ml-4">
                <li><strong>Essential Cookies:</strong> Required for basic platform functionality</li>
                <li><strong>Performance Cookies:</strong> Help us analyze and improve our services</li>
                <li><strong>Functional Cookies:</strong> Remember your preferences and settings</li>
                <li><strong>Marketing Cookies:</strong> Deliver relevant advertisements (with consent)</li>
              </ul>

              <p className="text-gray-700">
                You can control cookie settings through your browser preferences. Note that disabling certain 
                cookies may affect platform functionality.
              </p>
            </CardContent>
          </Card>

          {/* Children's Privacy */}
          <Card className="mb-8">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <AlertCircle className="w-5 h-5" />
                9. Children's Privacy
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <p className="text-gray-700">
                Our services are not intended for children under 18 years of age. We do not knowingly collect 
                personal information from children under 18. If we become aware that we have collected personal 
                information from a child under 18, we will take steps to delete such information.
              </p>
              <p className="text-gray-700">
                If you are a parent or guardian and believe your child has provided us with personal information, 
                please contact us immediately.
              </p>
            </CardContent>
          </Card>

          {/* International Transfers */}
          <Card className="mb-8">
            <CardHeader>
              <CardTitle>10. International Data Transfers</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <p className="text-gray-700">
                Your information may be transferred to and processed in countries other than Ghana. We ensure 
                that such transfers comply with applicable data protection laws and implement appropriate 
                safeguards to protect your information.
              </p>
            </CardContent>
          </Card>

          {/* Changes to Policy */}
          <Card className="mb-8">
            <CardHeader>
              <CardTitle>11. Changes to This Privacy Policy</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <p className="text-gray-700">
                We may update this Privacy Policy from time to time. We will notify you of any material changes 
                by posting the new policy on our platform and sending you an email notification. Your continued 
                use of our services after such changes constitutes acceptance of the updated policy.
              </p>
            </CardContent>
          </Card>

          {/* Contact Information */}
          <Card className="mb-8">
            <CardHeader>
              <CardTitle>12. Contact Us</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <p className="text-gray-700">
                If you have any questions about this Privacy Policy or our data practices, please contact us:
              </p>
              <div className="bg-gray-50 p-4 rounded-lg">
                <p><strong>Privacy Officer:</strong> privacy@artisanconnect.com</p>
                <p><strong>General Contact:</strong> support@artisanconnect.com</p>
                <p><strong>Phone:</strong> +233 24 123 4567</p>
                <p><strong>Address:</strong> 123 Tech Avenue, East Legon, Accra, Ghana</p>
              </div>
            </CardContent>
          </Card>

          {/* Effective Date */}
          <div className="text-center py-8 border-t border-gray-200">
            <p className="text-gray-600">
              This Privacy Policy is effective as of {lastUpdated}
            </p>
            <p className="text-sm text-gray-500 mt-2">
              Version 1.0 - Artisan Connect Privacy Policy
            </p>
          </div>
        </div>
      </section>
    </div>
  )
}
