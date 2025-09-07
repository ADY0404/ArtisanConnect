"use client"
import React, { useState } from 'react'
import Image from 'next/image'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { 
  Award, 
  Calendar, 
  ExternalLink, 
  Download, 
  Shield,
  CheckCircle,
  AlertCircle 
} from 'lucide-react'
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"

function CertificationsList({ certifications = [], specializations = [], businessName }) {
  const [selectedCert, setSelectedCert] = useState(null)

  // Parse certifications if they come as strings (legacy support)
  const parsedCertifications = certifications.map(cert => {
    if (typeof cert === 'string') {
      return { name: cert, type: 'Professional', verified: false }
    }
    return cert
  })

  const getCertificationIcon = (type) => {
    switch (type?.toLowerCase()) {
      case 'license':
        return <Shield className="text-blue-600" size={20} />
      case 'certification':
        return <Award className="text-yellow-600" size={20} />
      case 'insurance':
        return <Shield className="text-green-600" size={20} />
      default:
        return <Award className="text-gray-600" size={20} />
    }
  }

  const getCertificationColor = (type) => {
    switch (type?.toLowerCase()) {
      case 'license':
        return 'bg-blue-50 border-blue-200 text-blue-800'
      case 'certification':
        return 'bg-yellow-50 border-yellow-200 text-yellow-800'
      case 'insurance':
        return 'bg-green-50 border-green-200 text-green-800'
      default:
        return 'bg-gray-50 border-gray-200 text-gray-800'
    }
  }

  if (parsedCertifications.length === 0 && specializations.length === 0) {
    return (
      <div className="text-center py-8 bg-gray-50 rounded-lg">
        <div className="text-gray-400 mb-2">🏆</div>
        <h3 className="font-medium text-gray-700 mb-1">No Certifications Available</h3>
        <p className="text-sm text-gray-500">
          {businessName} hasn't added any certifications or credentials yet.
        </p>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      {/* Specializations Section */}
      {specializations.length > 0 && (
        <div>
          <h3 className="font-semibold text-lg mb-4 flex items-center gap-2">
            <Award className="text-primary" size={20} />
            Specializations
          </h3>
          <div className="flex flex-wrap gap-2">
            {specializations.map((specialization, index) => (
              <Badge 
                key={index} 
                variant="secondary" 
                className="px-3 py-1 text-sm"
              >
                {specialization}
              </Badge>
            ))}
          </div>
        </div>
      )}

      {/* Certifications Section */}
      {parsedCertifications.length > 0 && (
        <div>
          <h3 className="font-semibold text-lg mb-4 flex items-center gap-2">
            <Shield className="text-primary" size={20} />
            Certifications & Credentials
          </h3>
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {parsedCertifications.map((cert, index) => (
              <div 
                key={index} 
                className={`p-4 border rounded-lg transition-all hover:shadow-md ${getCertificationColor(cert.type)}`}
              >
                <div className="flex items-start gap-3">
                  <div className="flex-shrink-0 mt-1">
                    {getCertificationIcon(cert.type)}
                  </div>
                  
                  <div className="flex-1 min-w-0">
                    <div className="flex items-start justify-between">
                      <div className="flex-1">
                        <h4 className="font-medium mb-1 leading-tight">
                          {cert.name}
                        </h4>
                        
                        {cert.issuer && (
                          <p className="text-sm opacity-75 mb-2">
                            Issued by: {cert.issuer}
                          </p>
                        )}
                        
                        <div className="flex items-center gap-4 text-xs opacity-75">
                          {cert.issuedDate && (
                            <div className="flex items-center gap-1">
                              <Calendar size={12} />
                              <span>Issued: {new Date(cert.issuedDate).getFullYear()}</span>
                            </div>
                          )}
                          
                          {cert.expiryDate && (
                            <div className="flex items-center gap-1">
                              <Calendar size={12} />
                              <span>
                                Expires: {new Date(cert.expiryDate).getFullYear()}
                              </span>
                            </div>
                          )}
                        </div>
                      </div>
                      
                      <div className="flex flex-col items-end gap-2 ml-2">
                        {cert.verified && (
                          <div className="flex items-center gap-1">
                            <CheckCircle className="text-green-600" size={16} />
                            <span className="text-xs text-green-600 font-medium">Verified</span>
                          </div>
                        )}
                        
                        {cert.type && (
                          <Badge variant="outline" className="text-xs">
                            {cert.type}
                          </Badge>
                        )}
                      </div>
                    </div>

                    {/* Action Buttons */}
                    <div className="flex gap-2 mt-3">
                      {cert.credentialUrl && (
                        <Button
                          size="sm"
                          variant="outline"
                          className="h-7 text-xs"
                          onClick={() => window.open(cert.credentialUrl, '_blank')}
                        >
                          <ExternalLink size={12} className="mr-1" />
                          View Credential
                        </Button>
                      )}
                      
                      {cert.certificateImage && (
                        <Button
                          size="sm"
                          variant="outline"
                          className="h-7 text-xs"
                          onClick={() => setSelectedCert(cert)}
                        >
                          View Certificate
                        </Button>
                      )}
                    </div>

                    {/* Expiry Warning */}
                    {cert.expiryDate && new Date(cert.expiryDate) < new Date() && (
                      <div className="flex items-center gap-1 mt-2 text-xs text-red-600">
                        <AlertCircle size={12} />
                        <span>This certification has expired</span>
                      </div>
                    )}
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Professional Verification Badge */}
      <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
        <div className="flex items-center gap-3">
          <div className="flex-shrink-0">
            <CheckCircle className="text-blue-600" size={24} />
          </div>
          <div>
            <h4 className="font-medium text-blue-900 mb-1">Professional Verification</h4>
            <p className="text-sm text-blue-700">
              All certifications and credentials are subject to verification by our platform team. 
              Verified credentials display a green checkmark.
            </p>
          </div>
        </div>
      </div>

      {/* Certificate Modal */}
      <Dialog open={!!selectedCert} onOpenChange={() => setSelectedCert(null)}>
        <DialogContent className="max-w-3xl">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Award className="text-primary" size={20} />
              {selectedCert?.name}
            </DialogTitle>
          </DialogHeader>
          {selectedCert && (
            <div className="space-y-4">
              {selectedCert.certificateImage && (
                <div className="relative w-full h-96 bg-gray-100 rounded-lg overflow-hidden">
                  <Image
                    src={selectedCert.certificateImage}
                    alt={`${selectedCert.name} Certificate`}
                    fill
                    className="object-contain"
                  />
                </div>
              )}
              
              <div className="grid grid-cols-2 gap-4 text-sm">
                {selectedCert.issuer && (
                  <div>
                    <span className="font-medium">Issued by:</span>
                    <p className="text-gray-600">{selectedCert.issuer}</p>
                  </div>
                )}
                
                {selectedCert.issuedDate && (
                  <div>
                    <span className="font-medium">Issue Date:</span>
                    <p className="text-gray-600">
                      {new Date(selectedCert.issuedDate).toLocaleDateString()}
                    </p>
                  </div>
                )}
                
                {selectedCert.expiryDate && (
                  <div>
                    <span className="font-medium">Expiry Date:</span>
                    <p className="text-gray-600">
                      {new Date(selectedCert.expiryDate).toLocaleDateString()}
                    </p>
                  </div>
                )}
                
                {selectedCert.credentialId && (
                  <div>
                    <span className="font-medium">Credential ID:</span>
                    <p className="text-gray-600 font-mono text-xs">{selectedCert.credentialId}</p>
                  </div>
                )}
              </div>

              {selectedCert.description && (
                <div>
                  <h4 className="font-medium mb-1">Description</h4>
                  <p className="text-gray-600">{selectedCert.description}</p>
                </div>
              )}

              {selectedCert.credentialUrl && (
                <div className="flex gap-2">
                  <Button
                    onClick={() => window.open(selectedCert.credentialUrl, '_blank')}
                    className="flex items-center gap-2"
                  >
                    <ExternalLink size={16} />
                    Verify Online
                  </Button>
                </div>
              )}
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  )
}

export default CertificationsList 