import React from 'react'
import Image from 'next/image'
import { Card, CardContent } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { CheckCircle, Users, Target, Heart, Award, Shield } from 'lucide-react'

export default function AboutPage() {
  return (
    <div className="min-h-screen bg-gray-50">
      {/* Hero Section */}
      <section className="bg-gradient-to-r from-blue-600 to-purple-600 text-white py-20">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center">
            <h1 className="text-4xl md:text-6xl font-bold mb-6">
              About Artisan Connect
            </h1>
            <p className="text-xl md:text-2xl mb-8 max-w-3xl mx-auto">
              Connecting homeowners with skilled artisans for all your home service needs. 
              Building trust, quality, and convenience in every connection.
            </p>
            <Badge variant="secondary" className="text-lg px-6 py-2">
              Trusted by 10,000+ Customers
            </Badge>
          </div>
        </div>
      </section>

      {/* Mission & Vision */}
      <section className="py-16">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-12">
            <Card className="p-8">
              <CardContent className="space-y-4">
                <div className="flex items-center space-x-3">
                  <Target className="w-8 h-8 text-blue-600" />
                  <h2 className="text-3xl font-bold">Our Mission</h2>
                </div>
                <p className="text-lg text-gray-600">
                  To revolutionize the home services industry by creating a trusted platform 
                  that seamlessly connects homeowners with skilled artisans, ensuring quality 
                  work, fair pricing, and exceptional customer experiences.
                </p>
              </CardContent>
            </Card>

            <Card className="p-8">
              <CardContent className="space-y-4">
                <div className="flex items-center space-x-3">
                  <Heart className="w-8 h-8 text-purple-600" />
                  <h2 className="text-3xl font-bold">Our Vision</h2>
                </div>
                <p className="text-lg text-gray-600">
                  To become the leading home services marketplace in Ghana and beyond, 
                  where every homeowner can easily find reliable artisans and every 
                  skilled professional can build a thriving business.
                </p>
              </CardContent>
            </Card>
          </div>
        </div>
      </section>

      {/* Our Story */}
      <section className="py-16 bg-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-12">
            <h2 className="text-4xl font-bold mb-4">Our Story</h2>
            <p className="text-xl text-gray-600 max-w-3xl mx-auto">
              Born from the need to solve real problems in the home services industry
            </p>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 items-center">
            <div className="space-y-6">
              <p className="text-lg text-gray-600">
                Artisan Connect was founded in 2024 with a simple yet powerful vision: 
                to bridge the gap between homeowners seeking quality services and skilled 
                artisans looking to grow their businesses.
              </p>
              <p className="text-lg text-gray-600">
                As a final year project that evolved into a real-world solution, we 
                recognized the challenges both sides faced - homeowners struggling to 
                find reliable service providers, and skilled artisans having difficulty 
                reaching potential customers.
              </p>
              <p className="text-lg text-gray-600">
                Today, we're proud to serve thousands of customers and hundreds of 
                service providers, creating a thriving ecosystem of trust, quality, 
                and mutual success.
              </p>
            </div>
            <div className="relative">
              <div className="bg-gradient-to-r from-blue-100 to-purple-100 rounded-lg p-8 text-center">
                <div className="space-y-4">
                  <Users className="w-16 h-16 text-blue-600 mx-auto" />
                  <h3 className="text-2xl font-bold">Building Communities</h3>
                  <p className="text-gray-600">
                    Connecting skilled professionals with homeowners to build stronger communities
                  </p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Core Values */}
      <section className="py-16">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-12">
            <h2 className="text-4xl font-bold mb-4">Our Core Values</h2>
            <p className="text-xl text-gray-600">
              The principles that guide everything we do
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            <Card className="text-center p-6">
              <CardContent className="space-y-4">
                <Shield className="w-12 h-12 text-blue-600 mx-auto" />
                <h3 className="text-xl font-bold">Trust & Safety</h3>
                <p className="text-gray-600">
                  We verify all service providers and ensure secure transactions 
                  to build lasting trust between customers and artisans.
                </p>
              </CardContent>
            </Card>

            <Card className="text-center p-6">
              <CardContent className="space-y-4">
                <Award className="w-12 h-12 text-purple-600 mx-auto" />
                <h3 className="text-xl font-bold">Quality Excellence</h3>
                <p className="text-gray-600">
                  We maintain high standards through our rating system, 
                  quality assurance processes, and continuous improvement.
                </p>
              </CardContent>
            </Card>

            <Card className="text-center p-6">
              <CardContent className="space-y-4">
                <Heart className="w-12 h-12 text-red-600 mx-auto" />
                <h3 className="text-xl font-bold">Customer First</h3>
                <p className="text-gray-600">
                  Every decision we make prioritizes the satisfaction and 
                  success of both our customers and service providers.
                </p>
              </CardContent>
            </Card>
          </div>
        </div>
      </section>

      {/* Statistics */}
      <section className="py-16 bg-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-12">
            <h2 className="text-4xl font-bold mb-4">Our Impact</h2>
            <p className="text-xl text-gray-600">
              Numbers that tell our story
            </p>
          </div>

          <div className="grid grid-cols-2 md:grid-cols-4 gap-8">
            <div className="text-center">
              <div className="text-4xl font-bold text-blue-600 mb-2">10,000+</div>
              <div className="text-gray-600">Happy Customers</div>
            </div>
            <div className="text-center">
              <div className="text-4xl font-bold text-purple-600 mb-2">500+</div>
              <div className="text-gray-600">Verified Artisans</div>
            </div>
            <div className="text-center">
              <div className="text-4xl font-bold text-green-600 mb-2">25,000+</div>
              <div className="text-gray-600">Services Completed</div>
            </div>
            <div className="text-center">
              <div className="text-4xl font-bold text-orange-600 mb-2">4.8/5</div>
              <div className="text-gray-600">Average Rating</div>
            </div>
          </div>
        </div>
      </section>

      {/* Why Choose Us */}
      <section className="py-16">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-12">
            <h2 className="text-4xl font-bold mb-4">Why Choose Artisan Connect?</h2>
            <p className="text-xl text-gray-600">
              What makes us different from other platforms
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
            <div className="space-y-6">
              <div className="flex items-start space-x-4">
                <CheckCircle className="w-6 h-6 text-green-600 mt-1" />
                <div>
                  <h3 className="text-lg font-semibold mb-2">Verified Professionals</h3>
                  <p className="text-gray-600">
                    All our artisans are thoroughly vetted, verified, and insured for your peace of mind.
                  </p>
                </div>
              </div>

              <div className="flex items-start space-x-4">
                <CheckCircle className="w-6 h-6 text-green-600 mt-1" />
                <div>
                  <h3 className="text-lg font-semibold mb-2">Transparent Pricing</h3>
                  <p className="text-gray-600">
                    No hidden fees. Clear, upfront pricing with detailed quotes before work begins.
                  </p>
                </div>
              </div>

              <div className="flex items-start space-x-4">
                <CheckCircle className="w-6 h-6 text-green-600 mt-1" />
                <div>
                  <h3 className="text-lg font-semibold mb-2">Quality Guarantee</h3>
                  <p className="text-gray-600">
                    We stand behind every service with our satisfaction guarantee and dispute resolution.
                  </p>
                </div>
              </div>
            </div>

            <div className="space-y-6">
              <div className="flex items-start space-x-4">
                <CheckCircle className="w-6 h-6 text-green-600 mt-1" />
                <div>
                  <h3 className="text-lg font-semibold mb-2">Easy Booking</h3>
                  <p className="text-gray-600">
                    Book services in minutes with our user-friendly platform and mobile app.
                  </p>
                </div>
              </div>

              <div className="flex items-start space-x-4">
                <CheckCircle className="w-6 h-6 text-green-600 mt-1" />
                <div>
                  <h3 className="text-lg font-semibold mb-2">24/7 Support</h3>
                  <p className="text-gray-600">
                    Our customer support team is always ready to help with any questions or concerns.
                  </p>
                </div>
              </div>

              <div className="flex items-start space-x-4">
                <CheckCircle className="w-6 h-6 text-green-600 mt-1" />
                <div>
                  <h3 className="text-lg font-semibold mb-2">Secure Payments</h3>
                  <p className="text-gray-600">
                    Safe and secure payment processing with multiple payment options available.
                  </p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Call to Action */}
      <section className="py-16 bg-gradient-to-r from-blue-600 to-purple-600 text-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <h2 className="text-4xl font-bold mb-4">Ready to Get Started?</h2>
          <p className="text-xl mb-8 max-w-2xl mx-auto">
            Join thousands of satisfied customers who trust Artisan Connect for their home service needs.
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <a 
              href="/search/cleaning" 
              className="bg-white text-blue-600 px-8 py-3 rounded-lg font-semibold hover:bg-gray-100 transition-colors"
            >
              Find Services
            </a>
            <a 
              href="/provider/register" 
              className="border-2 border-white text-white px-8 py-3 rounded-lg font-semibold hover:bg-white hover:text-blue-600 transition-colors"
            >
              Become a Provider
            </a>
          </div>
        </div>
      </section>
    </div>
  )
}
