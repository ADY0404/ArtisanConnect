"use client"
import { useSession } from 'next-auth/react'
import { useState, useEffect, useRef } from 'react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import Image from 'next/image'
import Link from 'next/link'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer } from 'recharts';
import { Camera, Loader2 } from 'lucide-react';
import { toast } from 'sonner';
import { useAvatarCache } from '@/app/_hooks/useAvatarCache';

export default function Profile() {
  const { data: session, status, update } = useSession()
  const { getAvatarUrl, forceRefresh } = useAvatarCache()
  const [isEditing, setIsEditing] = useState(false)
  const [avatarRemoved, setAvatarRemoved] = useState(false)
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    phone: '',
    address: ''
  })
  const [loading, setLoading] = useState(false)
  const [message, setMessage] = useState('')
  const [analytics, setAnalytics] = useState(null);
  const [uploadingAvatar, setUploadingAvatar] = useState(false);
  const [removingAvatar, setRemovingAvatar] = useState(false);
  const fileInputRef = useRef(null);

  useEffect(() => {
    if (session?.user) {
      setFormData({
        name: session.user.name || '',
        email: session.user.email || '',
        phone: session.user.phone || '',
        address: session.user.address || ''
      })
    }
  }, [session])

  useEffect(() => {
    if (session?.user?.id) {
      fetchAnalytics();
    }
  }, [session]);

  const fetchAnalytics = async () => {
    try {
      const response = await fetch(`/api/users/${session.user.id}/analytics`);
      const data = await response.json();
      setAnalytics(data);
    } catch (error) {
      console.error('Error fetching analytics:', error);
    }
  };

  const handleSave = async () => {
    setLoading(true)
    setMessage('')
    
    try {
      const response = await fetch(`/api/users/${session.user.id}`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          name: formData.name,
          phone: formData.phone,
          address: formData.address
        }),
      });
      
      const data = await response.json();
      
      if (data.success) {
        setMessage('Profile updated successfully!')
        setIsEditing(false)
        
        // Update the session
        await update({ 
          name: formData.name,
          phone: formData.phone,
          address: formData.address
        });
      } else {
        setMessage(data.error || 'Failed to update profile. Please try again.')
      }
    } catch (error) {
      setMessage('Failed to update profile. Please try again.')
    } finally {
      setLoading(false)
    }
  }

  const handleCancel = () => {
    setFormData({
      name: session?.user?.name || '',
      email: session?.user?.email || '',
      phone: session?.user?.phone || '',
      address: session?.user?.address || ''
    })
    setIsEditing(false)
    setMessage('')
  }

  const handleAvatarUpload = async (event) => {
    const file = event.target.files[0];
    if (!file) return;
    
    // Validate file type
    const validTypes = ['image/jpeg', 'image/png', 'image/gif', 'image/webp'];
    if (!validTypes.includes(file.type)) {
      toast.error('Please select a valid image file (JPEG, PNG, GIF, WEBP)');
      return;
    }
    
    // Validate file size (max 5MB)
    if (file.size > 5 * 1024 * 1024) {
      toast.error('Image size should be less than 5MB');
      return;
    }
    
    setUploadingAvatar(true);
    
    try {
      // Create FormData for Cloudinary upload
      const formData = new FormData();
      formData.append('file', file);
      formData.append('documentType', 'avatar');
      formData.append('businessId', session.user.email);
      
      // Upload to Cloudinary
      const uploadResponse = await fetch('/api/cloudinary/upload', {
        method: 'POST',
        body: formData,
      });
      
      const uploadResult = await uploadResponse.json();
      
      if (!uploadResponse.ok || !uploadResult.success) {
        throw new Error(uploadResult.error || 'Failed to upload avatar');
      }
      
      // Update user profile with new avatar URL
      const updateResponse = await fetch(`/api/users/${session.user.id}`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          avatar: uploadResult.url
        }),
      });
      
      const updateResult = await updateResponse.json();
      
      if (!updateResponse.ok || !updateResult.success) {
        throw new Error(updateResult.error || 'Failed to update profile');
      }
      
      // Update session
      await update({ 
        image: uploadResult.url
      });
      
      // Trigger a custom event to notify other components of the avatar change
      window.dispatchEvent(new CustomEvent('avatarUpdated', { 
        detail: { newAvatarUrl: uploadResult.url } 
      }));
      
      toast.success('Profile picture updated successfully!');
    } catch (error) {
      console.error('Error uploading avatar:', error);
      toast.error(error.message || 'Failed to update profile picture');
    } finally {
      setUploadingAvatar(false);
    }
  };

  const triggerFileInput = () => {
    fileInputRef.current.click();
  };

  const handleRemoveAvatar = async () => {
    if (!session?.user?.id) return;
    
    const confirmRemoval = window.confirm('Are you sure you want to remove your profile picture?');
    if (!confirmRemoval) return;
    
    setRemovingAvatar(true);
    
    try {
      const response = await fetch(`/api/users/${session.user.id}/remove-avatar`, {
        method: 'DELETE',
      });
      
      const result = await response.json();
      
      if (!response.ok || !result.success) {
        throw new Error(result.error || 'Failed to remove profile picture');
      }
      
      // Immediately hide the avatar in UI
      setAvatarRemoved(true);
      
      // Update session to remove the image
      await update({ 
        image: null
      });
      
      // Force avatar cache refresh
      forceRefresh();
      
      // Clear any cached images
      if ('caches' in window) {
        try {
          const cacheNames = await caches.keys()
          await Promise.all(
            cacheNames.map(cacheName => caches.delete(cacheName))
          )
        } catch (error) {
          console.log('Cache clearing failed:', error)
        }
      }
      
      toast.success('Profile picture removed successfully!');
    } catch (error) {
      console.error('Error removing avatar:', error);
      toast.error(error.message || 'Failed to remove profile picture');
    } finally {
      setRemovingAvatar(false);
    }
  };

  if (status === 'loading') {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-primary"></div>
      </div>
    )
  }

  if (!session) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <h1 className="text-2xl font-bold mb-4">Please Sign In</h1>
          <Link href="/auth/signin">
            <Button>Sign In</Button>
          </Link>
        </div>
      </div>
    )
  }

  const getUserInitials = (name, email) => {
    if (name) {
      return name.split(' ').map(n => n[0]).join('').toUpperCase().slice(0, 2)
    }
    return email ? email[0].toUpperCase() : 'U'
  }

  return (
    <div className="min-h-screen bg-gray-50 py-8">
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="bg-white shadow rounded-lg">
          {/* Header */}
          <div className="px-6 py-4 border-b border-gray-200">
            <h1 className="text-2xl font-bold text-gray-900">My Profile</h1>
            <p className="mt-1 text-sm text-gray-600">
              Manage your account information and preferences
            </p>
          </div>

          {/* Profile Content */}
          <div className="px-6 py-6">
            <div className="flex items-start space-x-6">
              {/* Profile Picture */}
              <div className="flex-shrink-0 relative group">
                {session.user.image && !avatarRemoved ? (
                  <div className="relative">
                    <Image
                      src={`${session.user.image}?v=${Date.now()}&cb=${Math.random()}`}
                      alt="Profile"
                      width={100}
                      height={100}
                      className="rounded-full object-cover w-24 h-24"
                      unoptimized
                      onError={(e) => {
                        // If image fails to load, hide it
                        e.target.style.display = 'none'
                      }}
                    />
                    <button 
                      onClick={triggerFileInput}
                      disabled={uploadingAvatar || removingAvatar}
                      className="absolute inset-0 flex items-center justify-center bg-black bg-opacity-50 rounded-full opacity-0 group-hover:opacity-100 transition-opacity"
                    >
                      {uploadingAvatar ? (
                        <Loader2 className="h-6 w-6 text-white animate-spin" />
                      ) : (
                        <Camera className="h-6 w-6 text-white" />
                      )}
                    </button>
                  </div>
                ) : (
                  <div className="relative">
                    <div className="w-24 h-24 bg-primary rounded-full flex items-center justify-center text-white text-2xl font-bold">
                      {getUserInitials(session.user.name, session.user.email)}
                    </div>
                    <button 
                      onClick={triggerFileInput}
                      disabled={uploadingAvatar || removingAvatar}
                      className="absolute inset-0 flex items-center justify-center bg-black bg-opacity-50 rounded-full opacity-0 group-hover:opacity-100 transition-opacity"
                    >
                      {uploadingAvatar ? (
                        <Loader2 className="h-6 w-6 text-white animate-spin" />
                      ) : (
                        <Camera className="h-6 w-6 text-white" />
                      )}
                    </button>
                  </div>
                )}
                <input
                  type="file"
                  ref={fileInputRef}
                  onChange={handleAvatarUpload}
                  accept="image/jpeg,image/png,image/gif,image/webp"
                  className="hidden"
                />
                <div className="mt-2 space-y-1">
                  <div className="text-xs text-center text-gray-500">
                    Click to change
                  </div>
                  {session.user.image && (
                    <button
                      onClick={handleRemoveAvatar}
                      disabled={uploadingAvatar || removingAvatar}
                      className="text-xs text-red-600 hover:text-red-800 disabled:opacity-50 block mx-auto"
                    >
                      {removingAvatar ? 'Removing...' : 'Remove Photo'}
                    </button>
                  )}
                </div>
              </div>

              {/* Profile Info */}
              <div className="flex-1 min-w-0">
                <div className="flex items-center justify-between mb-4">
                  <div>
                    <h2 className="text-xl font-bold text-gray-900">
                      {session.user.name || 'User'}
                    </h2>
                    <p className="text-sm text-gray-600 capitalize">
                      {session.user.role?.toLowerCase()} Account
                    </p>
                  </div>
                  {!isEditing && (
                    <Button onClick={() => setIsEditing(true)} variant="outline">
                      Edit Profile
                    </Button>
                  )}
                </div>

                {message && (
                  <div className={`mb-4 p-3 rounded ${
                    message.includes('successfully') 
                      ? 'bg-green-100 text-green-700 border border-green-200' 
                      : 'bg-red-100 text-red-700 border border-red-200'
                  }`}>
                    {message}
                  </div>
                )}

                {/* Form Fields */}
                <div className="space-y-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Full Name
                    </label>
                    {isEditing ? (
                      <Input
                        type="text"
                        value={formData.name}
                        onChange={(e) => setFormData({...formData, name: e.target.value})}
                        placeholder="Enter your full name"
                      />
                    ) : (
                      <p className="text-gray-900">{formData.name || 'Not provided'}</p>
                    )}
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Email Address
                    </label>
                    <p className="text-gray-900">{formData.email}</p>
                    <p className="text-xs text-gray-500 mt-1">Email cannot be changed</p>
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Phone Number
                    </label>
                    {isEditing ? (
                      <Input
                        type="tel"
                        value={formData.phone}
                        onChange={(e) => setFormData({...formData, phone: e.target.value})}
                        placeholder="Enter your phone number"
                      />
                    ) : (
                      <p className="text-gray-900">{formData.phone || 'Not provided'}</p>
                    )}
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Address
                    </label>
                    {isEditing ? (
                      <Input
                        type="text"
                        value={formData.address}
                        onChange={(e) => setFormData({...formData, address: e.target.value})}
                        placeholder="Enter your address"
                      />
                    ) : (
                      <p className="text-gray-900">{formData.address || 'Not provided'}</p>
                    )}
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Account Type
                    </label>
                    <p className="text-gray-900 capitalize">{session.user.role?.toLowerCase()}</p>
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Member Since
                    </label>
                    <p className="text-gray-900">
                      {new Date(session.user.createdAt || Date.now()).toLocaleDateString()}
                    </p>
                  </div>
                </div>

                {/* Action Buttons */}
                {isEditing && (
                  <div className="flex space-x-3 mt-6">
                    <Button onClick={handleSave} disabled={loading}>
                      {loading ? 'Saving...' : 'Save Changes'}
                    </Button>
                    <Button variant="outline" onClick={handleCancel} disabled={loading}>
                      Cancel
                    </Button>
                  </div>
                )}
              </div>
            </div>

            {/* Analytics Section */}
            {analytics && (
              <div className="mt-8 border-t border-gray-200 pt-6">
                <h3 className="text-lg font-medium text-gray-900 mb-4">Your Activity</h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <Card>
                    <CardHeader>
                      <CardTitle>Booking History</CardTitle>
                    </CardHeader>
                    <CardContent>
                      <div className="h-64">
                        <ResponsiveContainer width="100%" height="100%">
                          <BarChart data={analytics.bookingHistory || []}>
                            <XAxis dataKey="month" />
                            <YAxis />
                            <Tooltip />
                            <Bar dataKey="count" fill="#3B82F6" />
                          </BarChart>
                        </ResponsiveContainer>
                      </div>
                    </CardContent>
                  </Card>
                  
                  <Card>
                    <CardHeader>
                      <CardTitle>Service Usage</CardTitle>
                    </CardHeader>
                    <CardContent>
                      <div className="h-64">
                        <ResponsiveContainer width="100%" height="100%">
                          <BarChart data={analytics.serviceUsage || []}>
                            <XAxis dataKey="service" />
                            <YAxis />
                            <Tooltip />
                            <Bar dataKey="count" fill="#10B981" />
                          </BarChart>
                        </ResponsiveContainer>
                      </div>
                    </CardContent>
                  </Card>
                </div>
              </div>
            )}

            {/* Account Links */}
            <div className="mt-8 border-t border-gray-200 pt-6">
              <h3 className="text-lg font-medium text-gray-900 mb-4">Account Management</h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {session.user.role === 'CUSTOMER' && (
                  <Link href="/mybooking">
                    <Button variant="outline" className="w-full justify-start">
                      <span className="mr-2">📅</span> My Bookings
                    </Button>
                  </Link>
                )}
                
                {session.user.role === 'PROVIDER' && (
                  <Link href="/provider/dashboard">
                    <Button variant="outline" className="w-full justify-start">
                      <span className="mr-2">🏢</span> Provider Dashboard
                    </Button>
                  </Link>
                )}
                
                {session.user.role === 'ADMIN' && (
                  <Link href="/admin">
                    <Button variant="outline" className="w-full justify-start">
                      <span className="mr-2">👑</span> Admin Dashboard
                    </Button>
                  </Link>
                )}
                
                <Link href="/profile/change-password">
                  <Button variant="outline" className="w-full justify-start">
                    <span className="mr-2">🔒</span> Change Password
                  </Button>
                </Link>
                
                <Link href="/profile/delete-account">
                  <Button variant="outline" className="w-full justify-start text-red-600 hover:text-red-700 hover:bg-red-50">
                    <span className="mr-2">⚠️</span> Delete Account
                  </Button>
                </Link>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
} 