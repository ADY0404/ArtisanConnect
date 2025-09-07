'use client';

import { useSearchParams } from 'next/navigation';
import Link from 'next/link';
import { Suspense, useEffect, useState } from 'react';
import { CheckCircle, XCircle, AlertTriangle, Clock } from 'lucide-react';

function VerificationStatus() {
  const searchParams = useSearchParams();
  const token = searchParams.get('token');

  const [status, setStatus] = useState({
    icon: <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary"></div>,
    title: 'Verifying your email...',
    message: 'Please wait a moment.',
    isError: false,
  });

  useEffect(() => {
    if (!token) {
      setStatus({
        icon: <XCircle className="h-16 w-16 text-red-500" />,
        title: 'Missing Verification Token',
        message: 'The verification link is incomplete. Please check the link and try again.',
        isError: true,
      });
      return;
    }

    const verifyToken = async () => {
      try {
        const response = await fetch('/api/auth/verify-email', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({ token }),
        });

        const data = await response.json();

        if (data.success) {
          setStatus({
            icon: <CheckCircle className="h-16 w-16 text-green-500" />,
            title: 'Email Verified Successfully!',
            message: 'Your account is now active. You can now sign in to access all features.',
            isError: false,
          });
        } else {
          // Handle specific errors from the backend
          let errorMessage;
          switch (data.error) {
            case 'invalidtoken':
              errorMessage = 'This verification link is not valid or has already been used.';
              break;
            case 'expiredtoken': // Although handled in findByToken, good to have
              errorMessage = 'This verification link has expired.';
              break;
            default:
              errorMessage = 'An unexpected error occurred. Please try again later.';
          }
          setStatus({
            icon: <XCircle className="h-16 w-16 text-red-500" />,
            title: 'Verification Failed',
            message: errorMessage,
            isError: true,
          });
        }
      } catch (err) {
        setStatus({
          icon: <AlertTriangle className="h-16 w-16 text-red-500" />,
          title: 'Verification Failed',
          message: 'Could not connect to the server. Please check your connection and try again.',
          isError: true,
        });
      }
    };

    verifyToken();
  }, [token]);

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50">
      <div className="max-w-md w-full text-center bg-white p-8 shadow-lg rounded-lg">
        <div className="flex justify-center mb-6">{status.icon}</div>
        <h1 className="text-2xl font-bold mb-2">{status.title}</h1>
        <p className="text-gray-600 mb-8">{status.message}</p>
        <Link
          href="/auth/signin"
          className="w-full inline-block bg-primary text-white font-bold py-3 px-4 rounded hover:bg-primary/90 transition-colors"
        >
          Proceed to Sign In
        </Link>
      </div>
    </div>
  );
}

export default function VerifyEmailPage() {
    return (
        <Suspense fallback={<div>Loading...</div>}>
            <VerificationStatus />
        </Suspense>
    )
} 