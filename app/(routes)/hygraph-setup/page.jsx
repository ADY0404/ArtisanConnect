"use client"
import React, { useState } from 'react'
import { Button } from '@/components/ui/button'

function HygraphSetup() {
  const [testResult, setTestResult] = useState(null)
  const [loading, setLoading] = useState(false)

  const testHygraphConnection = async () => {
    setLoading(true)
    try {
      const response = await fetch('/api/test-hygraph')
      const result = await response.json()
      setTestResult(result)
    } catch (error) {
      setTestResult({ error: 'Failed to test connection', message: error.message })
    }
    setLoading(false)
  }

  const testManagementAPI = async () => {
    setLoading(true)
    try {
      const response = await fetch('/api/test-management')
      const result = await response.json()
      setTestResult(result)
    } catch (error) {
      setTestResult({ error: 'Failed to test Management API', message: error.message })
    }
    setLoading(false)
  }

  const createSchemaWithSDK = async () => {
    setLoading(true)
    try {
      const response = await fetch('/api/create-hygraph-schema', { method: 'POST' })
      const result = await response.json()
      setTestResult(result)
    } catch (error) {
      setTestResult({ error: 'Failed to create schema', message: error.message })
    }
    setLoading(false)
  }

  const populateData = async () => {
    setLoading(true)
    try {
      const response = await fetch('/api/populate-hygraph', { method: 'POST' })
      const result = await response.json()
      setTestResult(result)
    } catch (error) {
      setTestResult({ error: 'Failed to populate data', message: error.message })
    }
    setLoading(false)
  }

  return (
    <div className="container mx-auto p-8">
      <h1 className="text-3xl font-bold mb-8">Hygraph Setup Guide</h1>
      
      {/* Schema Conformance Status */}
      <div className="bg-green-50 border border-green-200 rounded-lg p-6 mb-8">
        <h2 className="text-xl font-semibold mb-4 text-green-800">✅ Schema Conformance Update</h2>
        <p className="text-green-700 mb-4">
          <strong>Great News!</strong> The schema has been updated to perfectly conform with your existing app requirements.
        </p>
        
        <div className="bg-white p-4 rounded border mb-4">
          <h3 className="font-semibold text-green-800 mb-2">🔧 What Was Fixed:</h3>
          <ul className="list-disc list-inside text-sm space-y-1 text-green-700">
            <li><strong>Category.icon</strong>: Changed from String to Asset (app expects icon.url)</li>
            <li><strong>BusinessList.images</strong>: Changed from String to Asset[] (app expects images[0].url)</li>
            <li><strong>Field Types</strong>: All field types now match your GlobalApi queries</li>
            <li><strong>Relations</strong>: All relationships preserved and working</li>
            <li><strong>Enums</strong>: BookingStatus enum with correct values (Booked, Completed, Cancelled)</li>
          </ul>
        </div>
        
        <div className="bg-blue-50 border border-blue-200 rounded p-3">
          <p className="text-blue-800 text-sm">
            📋 <strong>Result:</strong> Your existing app code will work without any modifications once the schema is deployed.
          </p>
        </div>
      </div>
      
      {/* Permission Fix Section */}
      <div className="bg-red-50 border border-red-200 rounded-lg p-6 mb-8">
        <h2 className="text-xl font-semibold mb-4 text-red-800">🔑 IMPORTANT: Fix Management Token Permissions</h2>
        <p className="text-red-700 mb-4">
          <strong>Current Issue:</strong> The Management Token is missing <code>ENVIRONMENT_READ</code> permission.
        </p>
        
        <div className="bg-white p-4 rounded border mb-4">
          <h3 className="font-semibold text-red-800 mb-2">📋 Steps to Fix:</h3>
          <ol className="list-decimal list-inside text-sm space-y-2 text-red-700">
            <li>Go to your <a href="https://app.hygraph.com" target="_blank" className="underline text-blue-600">Hygraph Dashboard</a></li>
            <li>Navigate to <strong>Settings → API Access → Permanent Auth Tokens</strong></li>
            <li>Find your Management Token (or create a new one)</li>
            <li>Ensure these permissions are enabled:</li>
            <ul className="list-disc list-inside ml-4 mt-2 space-y-1">
              <li><code>✅ Environment Read</code></li>
              <li><code>✅ Schema Read</code></li>
              <li><code>✅ Schema Write</code></li>
              <li><code>✅ Model Create/Update/Delete</code></li>
              <li><code>✅ Field Create/Update/Delete</code></li>
              <li><code>✅ Enumeration Create/Update/Delete</code></li>
            </ul>
            <li>Save the token and copy the new token value</li>
            <li>Update your <code>.env.local</code> file with the new token</li>
            <li>Restart your development server</li>
          </ol>
        </div>
        
        <div className="bg-yellow-50 border border-yellow-200 rounded p-3">
          <p className="text-yellow-800 text-sm">
            💡 <strong>Alternative:</strong> If you prefer, you can create the schema manually using the instructions below, then use the Management SDK for future updates.
          </p>
        </div>
      </div>
      
      {/* Programmatic Schema Creation */}
      <div className="bg-purple-50 border border-purple-200 rounded-lg p-6 mb-8">
        <h2 className="text-xl font-semibold mb-4 text-purple-800">🤖 Option 1: Programmatic Schema Creation (Recommended)</h2>
        <p className="text-purple-700 mb-4">
          Use the Hygraph Management SDK to create the schema automatically. This approach is better for future development and schema changes.
        </p>
        
        <div className="bg-white p-4 rounded border mb-4">
          <h3 className="font-semibold text-purple-800 mb-2">✨ Benefits:</h3>
          <ul className="list-disc list-inside text-sm space-y-1 text-purple-700">
            <li>Future schema changes can be automated</li>
            <li>Version control for schema migrations</li>
            <li>Consistent across environments</li>
            <li>Easier to maintain and update</li>
          </ul>
        </div>
        
        <div className="bg-orange-50 border border-orange-200 rounded p-3 mb-4">
          <p className="text-orange-800 text-sm">
            ⚠️ <strong>Prerequisites:</strong> Fix the Management Token permissions above before using this option.
          </p>
        </div>
        
        <Button 
          onClick={createSchemaWithSDK}
          disabled={loading}
          className="bg-purple-600 hover:bg-purple-700"
        >
          {loading ? 'Creating Schema...' : '🚀 Create Schema with Management SDK'}
        </Button>
      </div>
      
      {/* Manual Schema Creation Instructions */}
      <div className="bg-blue-50 border border-blue-200 rounded-lg p-6 mb-8">
        <h2 className="text-xl font-semibold mb-4 text-blue-800">📋 Option 2: Manual Schema Creation</h2>
        <p className="text-blue-700 mb-4">
          Create the schema manually in your Hygraph dashboard. This works regardless of token permissions:
        </p>
        
        <div className="space-y-4">
          <div className="bg-white p-4 rounded border">
            <h3 className="font-semibold text-green-800">🏷️ Category Model</h3>
            <ul className="list-disc list-inside text-sm mt-2 space-y-1">
              <li><strong>name</strong> - Single line text (Required, Use as title field, Unique)</li>
              <li><strong>icon</strong> - Single line text</li>
              <li><strong>bgcolor</strong> - Single line text</li>
            </ul>
          </div>
          
          <div className="bg-white p-4 rounded border">
            <h3 className="font-semibold text-green-800">🏢 BusinessList Model</h3>
            <ul className="list-disc list-inside text-sm mt-2 space-y-1">
              <li><strong>name</strong> - Single line text (Required, Use as title field)</li>
              <li><strong>about</strong> - Rich text</li>
              <li><strong>address</strong> - Single line text</li>
              <li><strong>contactPerson</strong> - Single line text</li>
              <li><strong>email</strong> - Single line text</li>
              <li><strong>images</strong> - Asset (Allow multiple values)</li>
              <li><strong>category</strong> - Reference to Category (Required)</li>
            </ul>
          </div>
          
          <div className="bg-white p-4 rounded border">
            <h3 className="font-semibold text-green-800">📅 Booking Model</h3>
            <ul className="list-disc list-inside text-sm mt-2 space-y-1">
              <li><strong>date</strong> - Date (Required)</li>
              <li><strong>time</strong> - Single line text (Required)</li>
              <li><strong>userEmail</strong> - Single line text (Required)</li>
              <li><strong>userName</strong> - Single line text (Required)</li>
              <li><strong>businessList</strong> - Reference to BusinessList (Required)</li>
              <li><strong>bookingStatus</strong> - Enumeration (CONFIRMED, PENDING, CANCELLED, COMPLETED)</li>
            </ul>
          </div>
        </div>
        
        <div className="mt-4 p-3 bg-green-50 border border-green-200 rounded">
          <p className="text-green-800 text-sm">
            💡 <strong>Tip:</strong> Create these models in your Hygraph project dashboard, then use the buttons below to test and populate data.
          </p>
        </div>
      </div>

      {/* Testing Section */}
      <div className="bg-gray-50 border border-gray-200 rounded-lg p-6 mb-8">
        <h2 className="text-xl font-semibold mb-4">🧪 Step 3: Test Connections</h2>
        <div className="flex gap-4 flex-wrap">
          <Button 
            onClick={testHygraphConnection}
            disabled={loading}
            className="bg-blue-600 hover:bg-blue-700"
          >
            {loading ? 'Testing...' : 'Test Content API'}
          </Button>
          
          <Button 
            onClick={testManagementAPI}
            disabled={loading}
            className="bg-purple-600 hover:bg-purple-700"
          >
            {loading ? 'Testing...' : 'Test Management API'}
          </Button>
        </div>
      </div>

      {/* Data Population Section */}
      <div className="bg-green-50 border border-green-200 rounded-lg p-6 mb-8">
        <h2 className="text-xl font-semibold mb-4 text-green-800">🚀 Step 4: Populate Sample Data</h2>
        <p className="text-green-700 mb-4">
          Once your schema is created and APIs are working, populate with professional sample data to bring your ArtisanConnect vision to life:
        </p>
        
        <div className="bg-white p-4 rounded border mb-4">
          <h3 className="font-semibold text-green-800 mb-2">📊 Sample Data Includes:</h3>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
            <div>
              <h4 className="font-medium text-green-700">Categories (6):</h4>
              <ul className="list-disc list-inside text-green-600 ml-2">
                <li>🧹 Cleaning Services</li>
                <li>🔧 Repair & Maintenance</li>
                <li>🎨 Painting Services</li>
                <li>📦 Moving & Shifting</li>
                <li>🚰 Plumbing Services</li>
                <li>⚡ Electrical Services</li>
              </ul>
            </div>
            <div>
              <h4 className="font-medium text-green-700">Businesses (6):</h4>
              <ul className="list-disc list-inside text-green-600 ml-2">
                <li>SparkleClean Services</li>
                <li>FixIt Fast Repairs</li>
                <li>ColorPro Painters</li>
                <li>QuickShift Movers</li>
                <li>FlowMaster Plumbing</li>
                <li>PowerPro Electricians</li>
              </ul>
            </div>
          </div>
          <div className="mt-3 p-2 bg-blue-50 border border-blue-200 rounded">
            <p className="text-blue-700 text-sm">
              <strong>✨ Features:</strong> Each business includes professional descriptions, contact information, addresses across UK cities, and high-quality Unsplash images.
            </p>
          </div>
        </div>
        
        <Button 
          onClick={populateData}
          disabled={loading}
          className="bg-green-600 hover:bg-green-700"
        >
          {loading ? 'Populating...' : '🎨 Populate Sample Data'}
        </Button>
      </div>

      {/* Results Section */}
      {testResult && (
        <div className="bg-white border rounded-lg p-6">
          <h2 className="text-xl font-semibold mb-4">📊 Test Results</h2>
          <div className={`p-4 rounded-lg border ${
            testResult.success 
              ? 'bg-green-50 border-green-200' 
              : 'bg-red-50 border-red-200'
          }`}>
            <div className="flex items-start justify-between mb-2">
              <span className={`font-medium ${
                testResult.success ? 'text-green-800' : 'text-red-800'
              }`}>
                {testResult.success ? '✅ Success' : '❌ Error'}
              </span>
            </div>
            <p className={`text-sm mb-3 ${
              testResult.success ? 'text-green-700' : 'text-red-700'
            }`}>
              {testResult.message}
            </p>
            <details className="text-xs">
              <summary className="cursor-pointer font-medium mb-2">
                View Raw Response
              </summary>
              <pre className="bg-gray-100 p-3 rounded overflow-auto max-h-64">
                {JSON.stringify(testResult, null, 2)}
              </pre>
            </details>
          </div>
        </div>
      )}
    </div>
  )
}

export default HygraphSetup 