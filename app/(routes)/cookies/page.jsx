import React from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Cookie, Settings, Shield, BarChart, Target, Info } from 'lucide-react'

export default function CookiePolicyPage() {
  const lastUpdated = "January 15, 2024"

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Hero Section */}
      <section className="bg-gradient-to-r from-orange-600 to-red-600 text-white py-16">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center">
            <h1 className="text-4xl md:text-5xl font-bold mb-4">
              Cookie Policy
            </h1>
            <p className="text-xl mb-6 max-w-3xl mx-auto">
              Learn how we use cookies and similar technologies to improve your experience on Artisan Connect.
            </p>
            <Badge variant="secondary" className="text-lg px-4 py-2">
              <Cookie className="w-4 h-4 mr-2" />
              Last Updated: {lastUpdated}
            </Badge>
          </div>
        </div>
      </section>

      {/* Cookie Policy Content */}
      <section className="py-16">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
          
          {/* Introduction */}
          <Card className="mb-8">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Info className="w-5 h-5" />
                1. What Are Cookies?
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <p className="text-gray-700">
                Cookies are small text files that are stored on your device (computer, tablet, or mobile) when you 
                visit our website. They help us provide you with a better experience by remembering your preferences 
                and understanding how you use our platform.
              </p>
              <p className="text-gray-700">
                Similar technologies include web beacons, pixels, and local storage, which serve similar purposes 
                to cookies. When we refer to "cookies" in this policy, we include these similar technologies.
              </p>
              <div className="bg-orange-50 p-4 rounded-lg border-l-4 border-orange-500">
                <p className="text-orange-800 font-medium">
                  Cookies do not contain any information that personally identifies you, but personal information 
                  we store about you may be linked to information stored in and obtained from cookies.
                </p>
              </div>
            </CardContent>
          </Card>

          {/* Types of Cookies */}
          <Card className="mb-8">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Settings className="w-5 h-5" />
                2. Types of Cookies We Use
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-6">
              
              {/* Essential Cookies */}
              <div className="border-l-4 border-blue-500 pl-4">
                <h4 className="font-semibold text-lg mb-2 flex items-center gap-2">
                  <Shield className="w-5 h-5 text-blue-600" />
                  Essential Cookies
                </h4>
                <p className="text-gray-700 mb-3">
                  These cookies are necessary for our website to function properly. They enable core functionality 
                  such as security, network management, and accessibility.
                </p>
                <div className="bg-blue-50 p-3 rounded-lg">
                  <p className="text-sm text-blue-800">
                    <strong>Examples:</strong> Authentication cookies, security cookies, load balancing cookies
                  </p>
                  <p className="text-sm text-blue-800 mt-1">
                    <strong>Duration:</strong> Session cookies (deleted when you close your browser) or up to 1 year
                  </p>
                  <p className="text-sm text-blue-800 mt-1">
                    <strong>Can be disabled:</strong> No - these are required for the website to function
                  </p>
                </div>
              </div>

              {/* Performance Cookies */}
              <div className="border-l-4 border-green-500 pl-4">
                <h4 className="font-semibold text-lg mb-2 flex items-center gap-2">
                  <BarChart className="w-5 h-5 text-green-600" />
                  Performance Cookies
                </h4>
                <p className="text-gray-700 mb-3">
                  These cookies help us understand how visitors interact with our website by collecting and 
                  reporting information anonymously. This helps us improve our website performance.
                </p>
                <div className="bg-green-50 p-3 rounded-lg">
                  <p className="text-sm text-green-800">
                    <strong>Examples:</strong> Google Analytics, page load times, error tracking
                  </p>
                  <p className="text-sm text-green-800 mt-1">
                    <strong>Duration:</strong> Up to 2 years
                  </p>
                  <p className="text-sm text-green-800 mt-1">
                    <strong>Can be disabled:</strong> Yes - through browser settings or our cookie preferences
                  </p>
                </div>
              </div>

              {/* Functional Cookies */}
              <div className="border-l-4 border-purple-500 pl-4">
                <h4 className="font-semibold text-lg mb-2 flex items-center gap-2">
                  <Settings className="w-5 h-5 text-purple-600" />
                  Functional Cookies
                </h4>
                <p className="text-gray-700 mb-3">
                  These cookies allow our website to remember choices you make and provide enhanced, more personal features.
                </p>
                <div className="bg-purple-50 p-3 rounded-lg">
                  <p className="text-sm text-purple-800">
                    <strong>Examples:</strong> Language preferences, location settings, remembered login details
                  </p>
                  <p className="text-sm text-purple-800 mt-1">
                    <strong>Duration:</strong> Up to 1 year
                  </p>
                  <p className="text-sm text-purple-800 mt-1">
                    <strong>Can be disabled:</strong> Yes - but may affect website functionality
                  </p>
                </div>
              </div>

              {/* Marketing Cookies */}
              <div className="border-l-4 border-red-500 pl-4">
                <h4 className="font-semibold text-lg mb-2 flex items-center gap-2">
                  <Target className="w-5 h-5 text-red-600" />
                  Marketing Cookies
                </h4>
                <p className="text-gray-700 mb-3">
                  These cookies track your online activity to help advertisers deliver more relevant advertising 
                  or to limit how many times you see an ad.
                </p>
                <div className="bg-red-50 p-3 rounded-lg">
                  <p className="text-sm text-red-800">
                    <strong>Examples:</strong> Facebook Pixel, Google Ads, retargeting cookies
                  </p>
                  <p className="text-sm text-red-800 mt-1">
                    <strong>Duration:</strong> Up to 2 years
                  </p>
                  <p className="text-sm text-red-800 mt-1">
                    <strong>Can be disabled:</strong> Yes - through browser settings or our cookie preferences
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Third-Party Cookies */}
          <Card className="mb-8">
            <CardHeader>
              <CardTitle>3. Third-Party Cookies</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <p className="text-gray-700">
                We work with third-party companies that may place cookies on your device. These companies have 
                their own privacy policies and cookie policies:
              </p>
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="bg-gray-50 p-4 rounded-lg">
                  <h4 className="font-semibold mb-2">Google Analytics</h4>
                  <p className="text-sm text-gray-600 mb-2">
                    Helps us understand website usage and improve user experience.
                  </p>
                  <a 
                    href="https://policies.google.com/privacy" 
                    target="_blank" 
                    rel="noopener noreferrer"
                    className="text-blue-600 hover:underline text-sm"
                  >
                    Google Privacy Policy →
                  </a>
                </div>

                <div className="bg-gray-50 p-4 rounded-lg">
                  <h4 className="font-semibold mb-2">Paystack</h4>
                  <p className="text-sm text-gray-600 mb-2">
                    Secure payment processing and fraud prevention.
                  </p>
                  <a 
                    href="https://paystack.com/privacy" 
                    target="_blank" 
                    rel="noopener noreferrer"
                    className="text-blue-600 hover:underline text-sm"
                  >
                    Paystack Privacy Policy →
                  </a>
                </div>

                <div className="bg-gray-50 p-4 rounded-lg">
                  <h4 className="font-semibold mb-2">Facebook</h4>
                  <p className="text-sm text-gray-600 mb-2">
                    Social media integration and targeted advertising.
                  </p>
                  <a 
                    href="https://www.facebook.com/privacy/explanation" 
                    target="_blank" 
                    rel="noopener noreferrer"
                    className="text-blue-600 hover:underline text-sm"
                  >
                    Facebook Privacy Policy →
                  </a>
                </div>

                <div className="bg-gray-50 p-4 rounded-lg">
                  <h4 className="font-semibold mb-2">Cloudinary</h4>
                  <p className="text-sm text-gray-600 mb-2">
                    Image and media management services.
                  </p>
                  <a 
                    href="https://cloudinary.com/privacy" 
                    target="_blank" 
                    rel="noopener noreferrer"
                    className="text-blue-600 hover:underline text-sm"
                  >
                    Cloudinary Privacy Policy →
                  </a>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Managing Cookies */}
          <Card className="mb-8">
            <CardHeader>
              <CardTitle>4. Managing Your Cookie Preferences</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <p className="text-gray-700">
                You have several options for managing cookies:
              </p>

              <h4 className="font-semibold">4.1 Browser Settings</h4>
              <p className="text-gray-700">
                Most web browsers allow you to control cookies through their settings. You can:
              </p>
              <ul className="list-disc list-inside space-y-2 text-gray-700 ml-4">
                <li>Block all cookies</li>
                <li>Block third-party cookies only</li>
                <li>Delete existing cookies</li>
                <li>Set cookies to expire when you close your browser</li>
                <li>Receive notifications when cookies are set</li>
              </ul>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mt-4">
                <div className="bg-blue-50 p-3 rounded-lg">
                  <h5 className="font-medium mb-2">Chrome</h5>
                  <p className="text-sm text-gray-600">
                    Settings → Privacy and security → Cookies and other site data
                  </p>
                </div>
                <div className="bg-blue-50 p-3 rounded-lg">
                  <h5 className="font-medium mb-2">Firefox</h5>
                  <p className="text-sm text-gray-600">
                    Options → Privacy & Security → Cookies and Site Data
                  </p>
                </div>
                <div className="bg-blue-50 p-3 rounded-lg">
                  <h5 className="font-medium mb-2">Safari</h5>
                  <p className="text-sm text-gray-600">
                    Preferences → Privacy → Manage Website Data
                  </p>
                </div>
                <div className="bg-blue-50 p-3 rounded-lg">
                  <h5 className="font-medium mb-2">Edge</h5>
                  <p className="text-sm text-gray-600">
                    Settings → Cookies and site permissions → Cookies and site data
                  </p>
                </div>
              </div>

              <h4 className="font-semibold mt-6">4.2 Our Cookie Preferences</h4>
              <p className="text-gray-700">
                You can manage your cookie preferences for our website using our cookie preference center:
              </p>
              <div className="bg-gray-50 p-4 rounded-lg">
                <Button className="w-full sm:w-auto">
                  <Settings className="w-4 h-4 mr-2" />
                  Manage Cookie Preferences
                </Button>
                <p className="text-sm text-gray-600 mt-2">
                  Note: This feature will be available in a future update
                </p>
              </div>

              <h4 className="font-semibold mt-6">4.3 Opt-Out Links</h4>
              <p className="text-gray-700">
                You can opt out of certain third-party cookies:
              </p>
              <ul className="list-disc list-inside space-y-2 text-gray-700 ml-4">
                <li>
                  <a 
                    href="https://tools.google.com/dlpage/gaoptout" 
                    target="_blank" 
                    rel="noopener noreferrer"
                    className="text-blue-600 hover:underline"
                  >
                    Google Analytics Opt-out
                  </a>
                </li>
                <li>
                  <a 
                    href="https://www.facebook.com/settings?tab=ads" 
                    target="_blank" 
                    rel="noopener noreferrer"
                    className="text-blue-600 hover:underline"
                  >
                    Facebook Ad Preferences
                  </a>
                </li>
                <li>
                  <a 
                    href="http://optout.networkadvertising.org/" 
                    target="_blank" 
                    rel="noopener noreferrer"
                    className="text-blue-600 hover:underline"
                  >
                    Network Advertising Initiative Opt-out
                  </a>
                </li>
              </ul>
            </CardContent>
          </Card>

          {/* Impact of Disabling Cookies */}
          <Card className="mb-8">
            <CardHeader>
              <CardTitle>5. Impact of Disabling Cookies</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <p className="text-gray-700">
                Disabling cookies may affect your experience on our website:
              </p>
              
              <div className="space-y-4">
                <div className="bg-yellow-50 p-4 rounded-lg border-l-4 border-yellow-500">
                  <h4 className="font-semibold text-yellow-800 mb-2">Essential Cookies Disabled</h4>
                  <ul className="list-disc list-inside space-y-1 text-yellow-700 text-sm ml-4">
                    <li>Unable to log in or maintain login sessions</li>
                    <li>Security features may not work properly</li>
                    <li>Some pages may not load correctly</li>
                  </ul>
                </div>

                <div className="bg-blue-50 p-4 rounded-lg border-l-4 border-blue-500">
                  <h4 className="font-semibold text-blue-800 mb-2">Functional Cookies Disabled</h4>
                  <ul className="list-disc list-inside space-y-1 text-blue-700 text-sm ml-4">
                    <li>Need to re-enter preferences each visit</li>
                    <li>Language and location settings not remembered</li>
                    <li>Personalized features may not work</li>
                  </ul>
                </div>

                <div className="bg-green-50 p-4 rounded-lg border-l-4 border-green-500">
                  <h4 className="font-semibold text-green-800 mb-2">Performance Cookies Disabled</h4>
                  <ul className="list-disc list-inside space-y-1 text-green-700 text-sm ml-4">
                    <li>We cannot improve website performance</li>
                    <li>Unable to identify and fix issues</li>
                    <li>Less personalized experience</li>
                  </ul>
                </div>

                <div className="bg-purple-50 p-4 rounded-lg border-l-4 border-purple-500">
                  <h4 className="font-semibold text-purple-800 mb-2">Marketing Cookies Disabled</h4>
                  <ul className="list-disc list-inside space-y-1 text-purple-700 text-sm ml-4">
                    <li>May see less relevant advertisements</li>
                    <li>May see the same ads repeatedly</li>
                    <li>Social media features may not work</li>
                  </ul>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Updates to Policy */}
          <Card className="mb-8">
            <CardHeader>
              <CardTitle>6. Updates to This Cookie Policy</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <p className="text-gray-700">
                We may update this Cookie Policy from time to time to reflect changes in our practices or 
                for other operational, legal, or regulatory reasons. We will notify you of any material 
                changes by posting the updated policy on our website.
              </p>
              <p className="text-gray-700">
                We encourage you to review this Cookie Policy periodically to stay informed about how we 
                use cookies.
              </p>
            </CardContent>
          </Card>

          {/* Contact Information */}
          <Card className="mb-8">
            <CardHeader>
              <CardTitle>7. Contact Us</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <p className="text-gray-700">
                If you have any questions about this Cookie Policy or our use of cookies, please contact us:
              </p>
              <div className="bg-gray-50 p-4 rounded-lg">
                <p><strong>Email:</strong> privacy@artisanconnect.com</p>
                <p><strong>Phone:</strong> +233 24 123 4567</p>
                <p><strong>Address:</strong> 123 Tech Avenue, East Legon, Accra, Ghana</p>
              </div>
            </CardContent>
          </Card>

          {/* Effective Date */}
          <div className="text-center py-8 border-t border-gray-200">
            <p className="text-gray-600">
              This Cookie Policy is effective as of {lastUpdated}
            </p>
            <p className="text-sm text-gray-500 mt-2">
              Version 1.0 - Artisan Connect Cookie Policy
            </p>
          </div>
        </div>
      </section>
    </div>
  )
}
