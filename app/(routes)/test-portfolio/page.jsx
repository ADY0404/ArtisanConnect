"use client"
import React from 'react'
import PortfolioGallery from '@/app/_components/PortfolioGallery'
import CertificationsList from '@/app/_components/CertificationsList'

// Sample data for testing
const samplePortfolio = [
  {
    title: 'Smart Home Automation System',
    description: 'Complete smart home setup including automated lighting, security system, and climate control for a modern 3-bedroom home.',
    image: 'https://images.unsplash.com/photo-1558618666-fcd25c85cd64?w=800&h=600&fit=crop',
    category: 'Smart Home',
    location: 'Tech District',
    completedDate: '2024-01-20',
    duration: '2 weeks',
    client: 'Johnson Family',
    tags: ['Smart Lighting', 'Security System', 'Climate Control', 'Home Automation'],
    additionalImages: [
      'https://images.unsplash.com/photo-1563013544-824ae1b704d3?w=400&h=300&fit=crop',
      'https://images.unsplash.com/photo-1556909114-79ad0bf93b23?w=400&h=300&fit=crop'
    ]
  },
  {
    title: 'Commercial Electrical Panel Upgrade',
    description: 'Upgraded electrical panels for a 20,000 sq ft warehouse to handle increased power demands.',
    image: 'https://images.unsplash.com/photo-1621905252507-b35492cc74b4?w=800&h=600&fit=crop',
    category: 'Commercial',
    location: 'Industrial Area',
    completedDate: '2023-12-15',
    duration: '1 week',
    tags: ['Panel Upgrade', 'Commercial', 'High Voltage', 'Industrial']
  },
  {
    title: 'Emergency Electrical Repair',
    description: 'Emergency repair of electrical system after storm damage, restoring power to residential complex.',
    image: 'https://images.unsplash.com/photo-1581094794329-c8112a89af12?w=800&h=600&fit=crop',
    category: 'Emergency',
    location: 'Residential Complex',
    completedDate: '2024-02-28',
    duration: '24 hours',
    tags: ['Emergency Repair', 'Storm Damage', 'Power Restoration']
  }
]

const sampleCertifications = [
  {
    name: 'Licensed Electrician',
    issuer: 'State Electrical Board',
    issuedDate: '2018-06-15',
    expiryDate: '2026-06-15',
    type: 'license',
    verified: true,
    credentialId: 'EL-2018-4578'
  },
  {
    name: 'Smart Home Specialist',
    issuer: 'Home Automation Institute',
    issuedDate: '2022-09-10',
    type: 'certification',
    verified: true
  },
  {
    name: 'Solar Installation Certified',
    issuer: 'Solar Energy Association',
    issuedDate: '2023-02-05',
    type: 'certification',
    verified: true
  },
  {
    name: 'General Liability Insurance',
    issuer: 'SafeWork Insurance',
    issuedDate: '2024-01-01',
    expiryDate: '2025-01-01',
    type: 'insurance',
    verified: true
  }
]

const sampleSpecializations = [
  'Wiring Installation',
  'Panel Upgrades', 
  'Smart Home Setup',
  'Solar Installation',
  'Emergency Electrical'
]

function TestPortfolioPage() {
  return (
    <div className="min-h-screen bg-gray-50 py-8">
      <div className="max-w-6xl mx-auto px-4">
        <div className="text-center mb-8">
          <h1 className="text-3xl font-bold text-gray-900 mb-2">
            Portfolio & Certifications Demo
          </h1>
          <p className="text-gray-600">
            Testing the new portfolio and certifications components
          </p>
        </div>

        <div className="space-y-12">
          {/* Portfolio Section */}
          <div className="bg-white rounded-lg shadow-sm p-6">
            <h2 className="text-2xl font-semibold mb-6">Portfolio Gallery</h2>
            <PortfolioGallery 
              portfolio={samplePortfolio}
              businessName="PowerGrid Electric"
            />
          </div>

          {/* Certifications Section */}
          <div className="bg-white rounded-lg shadow-sm p-6">
            <h2 className="text-2xl font-semibold mb-6">Certifications & Credentials</h2>
            <CertificationsList 
              certifications={sampleCertifications}
              specializations={sampleSpecializations}
              businessName="PowerGrid Electric"
            />
          </div>

          {/* Empty State Tests */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="bg-white rounded-lg shadow-sm p-6">
              <h3 className="text-xl font-semibold mb-4">Empty Portfolio</h3>
              <PortfolioGallery 
                portfolio={[]}
                businessName="New Business"
              />
            </div>
            
            <div className="bg-white rounded-lg shadow-sm p-6">
              <h3 className="text-xl font-semibold mb-4">Empty Certifications</h3>
              <CertificationsList 
                certifications={[]}
                specializations={[]}
                businessName="New Business"
              />
            </div>
          </div>
        </div>

        <div className="text-center mt-12">
          <p className="text-gray-500">
            Visit{' '}
            <a href="/" className="text-blue-600 hover:underline">
              Home Page
            </a>
            {' '}to see the integration in business detail pages
          </p>
        </div>
      </div>
    </div>
  )
}

export default TestPortfolioPage 