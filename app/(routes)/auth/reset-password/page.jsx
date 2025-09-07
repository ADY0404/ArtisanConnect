"use client"
import { useState, useEffect, Suspense } from 'react'
import { useSearchParams, useRouter } from 'next/navigation'
import { Input } from '@/components/ui/input'
import { Button } from '@/components/ui/button'

function ResetPasswordContent() {
  const searchParams = useSearchParams()
  const router = useRouter()
  const token = searchParams.get('token')
  const [step, setStep] = useState('init') // init -> verify -> done
  const [otp, setOtp] = useState('')
  const [newPassword, setNewPassword] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [message, setMessage] = useState('')

  useEffect(() => {
    if (!token) {
      setError('Invalid reset link')
    }
  }, [token])

  const handleInit = async (e) => {
    e.preventDefault()
    if (!token) return
    setLoading(true)
    setError('')
    setMessage('')
    try {
      const res = await fetch('/api/auth/reset-password/init', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ token })
      })
      const data = await res.json()
      if (!res.ok) throw new Error(data.error || 'Failed to initialize reset')
      setMessage('Verification code sent to your email')
      setStep('verify')
    } catch (err) {
      setError(err.message)
    } finally {
      setLoading(false)
    }
  }

  const handleComplete = async (e) => {
    e.preventDefault()
    if (!token || !otp || !newPassword) return
    setLoading(true)
    setError('')
    setMessage('')
    try {
      const res = await fetch('/api/auth/reset-password/complete', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ token, otp, newPassword })
      })
      const data = await res.json()
      if (!res.ok) throw new Error(data.error || 'Failed to reset password')
      setStep('done')
    } catch (err) {
      setError(err.message)
    } finally {
      setLoading(false)
    }
  }

  if (!token) {
    return (
      <div className="min-h-screen flex items-center justify-center">Invalid reset link</div>
    )
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50 py-12 px-4">
      <div className="w-full max-w-md bg-white p-6 rounded-lg shadow">
        <h1 className="text-xl font-semibold mb-2">Reset password</h1>
        {message && <div className="mb-3 text-green-600 text-sm">{message}</div>}
        {error && <div className="mb-3 text-red-600 text-sm">{error}</div>}

        {step === 'init' && (
          <form onSubmit={handleInit} className="space-y-4">
            <p className="text-sm text-gray-600">Click the button to receive a verification code in your email.</p>
            <Button type="submit" disabled={loading} className="w-full">{loading ? 'Sending...' : 'Send code'}</Button>
          </form>
        )}

        {step === 'verify' && (
          <form onSubmit={handleComplete} className="space-y-4">
            <div>
              <label className="block text-sm mb-1">Verification code</label>
              <Input value={otp} onChange={(e) => setOtp(e.target.value)} placeholder="Enter the 6-digit code" required />
            </div>
            <div>
              <label className="block text-sm mb-1">New password</label>
              <Input type="password" value={newPassword} onChange={(e) => setNewPassword(e.target.value)} required />
            </div>
            <Button type="submit" disabled={loading} className="w-full">{loading ? 'Resetting...' : 'Reset password'}</Button>
          </form>
        )}

        {step === 'done' && (
          <div className="space-y-3">
            <p className="text-sm">Your password has been reset successfully.</p>
            <Button className="w-full" onClick={() => router.push('/auth/signin')}>Go to sign in</Button>
          </div>
        )}
      </div>
    </div>
  )
}

function ResetPasswordPageLoading() {
  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50 py-12 px-4">
      <div className="w-full max-w-md bg-white p-6 rounded-lg shadow">
        <p className="text-sm text-gray-600">Loading reset form…</p>
      </div>
    </div>
  )
}

export default function ResetPasswordPage() {
  return (
    <Suspense fallback={<ResetPasswordPageLoading />}> 
      <ResetPasswordContent />
    </Suspense>
  )
}


