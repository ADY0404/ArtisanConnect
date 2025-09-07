import React from 'react'
import { useSession } from 'next-auth/react'
import { AlertTriangle, Shield, User } from 'lucide-react'

function RoleAccessMessage({ 
  allowedRoles = ['CUSTOMER'], 
  feature = 'this feature',
  showIcon = true 
}) {
  const { data: session } = useSession()
  
  if (!session?.user) {
    return (
      <div className="text-center p-4 bg-gray-50 rounded-lg border border-gray-200">
        <div className="flex items-center justify-center gap-2 mb-2">
          {showIcon && <User className="h-5 w-5 text-gray-400" />}
          <p className="text-gray-600 text-sm font-medium">Authentication Required</p>
        </div>
        <p className="text-gray-500 text-xs">
          Please sign in to access {feature}.
        </p>
      </div>
    )
  }
  
  if (!allowedRoles.includes(session.user.role)) {
    const getMessageByRole = () => {
      switch (session.user.role) {
        case 'ADMIN':
          return {
            icon: <Shield className="h-5 w-5 text-blue-500" />,
            title: 'Admin Access Restriction',
            message: `As an administrator, you have management privileges but cannot access ${feature}. This is restricted to ${allowedRoles.join(' and ').toLowerCase()}s only.`
          }
        case 'PROVIDER':
          return {
            icon: <AlertTriangle className="h-5 w-5 text-orange-500" />,
            title: 'Provider Account Limitation',
            message: `Your provider account allows you to manage services but not to ${feature.replace('book appointments', 'book services')}. Only customers can ${feature}.`
          }
        default:
          return {
            icon: <User className="h-5 w-5 text-gray-400" />,
            title: 'Access Restricted',
            message: `Your account type (${session.user.role}) cannot access ${feature}.`
          }
      }
    }
    
    const { icon, title, message } = getMessageByRole()
    
    return (
      <div className="text-center p-4 bg-gray-50 rounded-lg border border-gray-200">
        <div className="flex items-center justify-center gap-2 mb-2">
          {showIcon && icon}
          <p className="text-gray-700 text-sm font-medium">{title}</p>
        </div>
        <p className="text-gray-600 text-xs leading-relaxed">
          {message}
        </p>
      </div>
    )
  }
  
  return null // User has access, don't show anything
}

export default RoleAccessMessage 