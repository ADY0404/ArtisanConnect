"use client"
import React, { useState } from 'react'
import Image from 'next/image'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Eye, ExternalLink, Calendar, MapPin, DollarSign, Clock, User } from 'lucide-react'
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"

function PortfolioGallery({ portfolio = [], businessName }) {
  const [selectedProject, setSelectedProject] = useState(null)
  const [imageModalOpen, setImageModalOpen] = useState(false)
  const [selectedImage, setSelectedImage] = useState(null)

  if (!portfolio || portfolio.length === 0) {
    return (
      <div className="text-center py-8 bg-gray-50 rounded-lg">
        <div className="text-gray-400 mb-2">📸</div>
        <h3 className="font-medium text-gray-700 mb-1">No Portfolio Available</h3>
        <p className="text-sm text-gray-500">
          {businessName} hasn't added any portfolio projects yet.
        </p>
      </div>
    )
  }

  const openImageModal = (imageUrl) => {
    setSelectedImage(imageUrl)
    setImageModalOpen(true)
  }

  return (
    <div className="space-y-6">
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {portfolio.map((project, index) => (
          <div key={index} className="bg-white border rounded-lg overflow-hidden hover:shadow-lg transition-shadow">
            {/* Before/After Images */}
            <div className="relative h-48 bg-gray-100">
              {project.beforeImage && project.afterImage ? (
                <div className="flex h-full">
                  {/* Before Image */}
                  <div className="relative w-1/2 border-r border-gray-200">
                    <Image
                      src={project.beforeImage}
                      alt={`${project.title} - Before`}
                      fill
                      className="object-cover cursor-pointer hover:scale-105 transition-transform"
                      onClick={() => openImageModal(project.beforeImage)}
                    />
                    <div className="absolute bottom-1 left-1">
                      <Badge variant="secondary" className="text-xs bg-red-100 text-red-800">
                        Before
                      </Badge>
                    </div>
                  </div>
                  {/* After Image */}
                  <div className="relative w-1/2">
                    <Image
                      src={project.afterImage}
                      alt={`${project.title} - After`}
                      fill
                      className="object-cover cursor-pointer hover:scale-105 transition-transform"
                      onClick={() => openImageModal(project.afterImage)}
                    />
                    <div className="absolute bottom-1 right-1">
                      <Badge variant="secondary" className="text-xs bg-green-100 text-green-800">
                        After
                      </Badge>
                    </div>
                  </div>
                </div>
              ) : (
                // Single image fallback
                <Image
                  src={project.beforeImage || project.afterImage || '/placeholder-project.jpg'}
                  alt={project.title || `Project ${index + 1}`}
                  fill
                  className="object-cover cursor-pointer hover:scale-105 transition-transform"
                  onClick={() => openImageModal(project.beforeImage || project.afterImage)}
                />
              )}
              
              <div className="absolute top-2 right-2">
                <Button
                  size="sm"
                  variant="secondary"
                  className="h-8 w-8 p-1"
                  onClick={() => setSelectedProject(project)}
                >
                  <Eye size={14} />
                </Button>
              </div>
            </div>

            {/* Project Details */}
            <div className="p-4">
              <div className="flex justify-between items-start mb-2">
                <h3 className="font-semibold text-lg line-clamp-1">
                  {project.title || `Project ${index + 1}`}
                </h3>
                {project.category && (
                  <Badge variant="outline" className="text-xs">
                    {project.category}
                  </Badge>
                )}
              </div>

              {project.description && (
                <p className="text-gray-600 text-sm mb-3 line-clamp-2">
                  {project.description}
                </p>
              )}

              {/* Project Meta */}
              <div className="space-y-1 text-xs text-gray-500">
                {project.cost && (
                  <div className="flex items-center gap-1">
                    <DollarSign size={12} />
                    <span>{project.cost}</span>
                  </div>
                )}
                {project.duration && (
                  <div className="flex items-center gap-1">
                    <Clock size={12} />
                    <span>{project.duration}</span>
                  </div>
                )}
                {project.completedDate && (
                  <div className="flex items-center gap-1">
                    <Calendar size={12} />
                    <span>Completed: {new Date(project.completedDate).toLocaleDateString()}</span>
                  </div>
                )}
                {project.customerName && (
                  <div className="flex items-center gap-1">
                    <User size={12} />
                    <span>Client: {project.customerName}</span>
                  </div>
                )}
              </div>

              {/* Tags */}
              {project.tags && project.tags.length > 0 && (
                <div className="flex flex-wrap gap-1 mt-3">
                  {project.tags.slice(0, 3).map((tag, tagIndex) => (
                    <Badge key={tagIndex} variant="secondary" className="text-xs">
                      {tag}
                    </Badge>
                  ))}
                  {project.tags.length > 3 && (
                    <Badge variant="secondary" className="text-xs">
                      +{project.tags.length - 3} more
                    </Badge>
                  )}
                </div>
              )}

              {/* View Details Button */}
              <Button
                variant="outline"
                size="sm"
                className="w-full mt-3"
                onClick={() => setSelectedProject(project)}
              >
                View Full Details
              </Button>
            </div>
          </div>
        ))}
      </div>

      {/* Image Modal */}
      <Dialog open={imageModalOpen} onOpenChange={setImageModalOpen}>
        <DialogContent className="max-w-4xl">
          <DialogHeader>
            <DialogTitle>Portfolio Image</DialogTitle>
          </DialogHeader>
          {selectedImage && (
            <div className="relative w-full h-96">
              <Image
                src={selectedImage}
                alt="Portfolio image"
                fill
                className="object-contain"
              />
            </div>
          )}
        </DialogContent>
      </Dialog>

      {/* Project Details Modal */}
      <Dialog open={!!selectedProject} onOpenChange={() => setSelectedProject(null)}>
        <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>{selectedProject?.title || 'Project Details'}</DialogTitle>
          </DialogHeader>
          {selectedProject && (
            <div className="space-y-6">
              {/* Before/After Images Comparison */}
              {selectedProject.beforeImage && selectedProject.afterImage && (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <h4 className="font-medium mb-2 text-red-700">Before</h4>
                    <div className="relative h-64 bg-gray-100 rounded-lg overflow-hidden">
                      <Image
                        src={selectedProject.beforeImage}
                        alt="Before"
                        fill
                        className="object-cover cursor-pointer hover:scale-105 transition-transform"
                        onClick={() => openImageModal(selectedProject.beforeImage)}
                      />
                    </div>
                  </div>
                  <div>
                    <h4 className="font-medium mb-2 text-green-700">After</h4>
                    <div className="relative h-64 bg-gray-100 rounded-lg overflow-hidden">
                      <Image
                        src={selectedProject.afterImage}
                        alt="After"
                        fill
                        className="object-cover cursor-pointer hover:scale-105 transition-transform"
                        onClick={() => openImageModal(selectedProject.afterImage)}
                      />
                    </div>
                  </div>
                </div>
              )}

              {/* Project Info */}
              <div className="space-y-4">
                {selectedProject.description && (
                  <div>
                    <h4 className="font-medium mb-1">Project Description</h4>
                    <p className="text-gray-600">{selectedProject.description}</p>
                  </div>
                )}

                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div className="space-y-3">
                    {selectedProject.cost && (
                      <div>
                        <span className="font-medium">Project Cost:</span>
                        <p className="text-gray-600">{selectedProject.cost}</p>
                      </div>
                    )}
                    {selectedProject.duration && (
                      <div>
                        <span className="font-medium">Duration:</span>
                        <p className="text-gray-600">{selectedProject.duration}</p>
                      </div>
                    )}
                    {selectedProject.completedDate && (
                      <div>
                        <span className="font-medium">Completed:</span>
                        <p className="text-gray-600">
                          {new Date(selectedProject.completedDate).toLocaleDateString()}
                        </p>
                      </div>
                    )}
                  </div>
                  
                  <div className="space-y-3">
                    {selectedProject.customerName && (
                      <div>
                        <span className="font-medium">Client:</span>
                        <p className="text-gray-600">{selectedProject.customerName}</p>
                      </div>
                    )}
                    {selectedProject.category && (
                      <div>
                        <span className="font-medium">Service Category:</span>
                        <p className="text-gray-600">{selectedProject.category}</p>
                      </div>
                    )}
                    {selectedProject.views && (
                      <div>
                        <span className="font-medium">Views:</span>
                        <p className="text-gray-600">{selectedProject.views}</p>
                      </div>
                    )}
                  </div>
                </div>

                {/* Tags */}
                {selectedProject.tags && selectedProject.tags.length > 0 && (
                  <div>
                    <h4 className="font-medium mb-2">Skills & Technologies</h4>
                    <div className="flex flex-wrap gap-2">
                      {selectedProject.tags.map((tag, index) => (
                        <Badge key={index} variant="secondary">
                          {tag}
                        </Badge>
                      ))}
                    </div>
                  </div>
                )}

                {/* Additional Images */}
                {selectedProject.additionalImages && selectedProject.additionalImages.length > 0 && (
                  <div>
                    <h4 className="font-medium mb-2">Additional Images</h4>
                    <div className="grid grid-cols-3 gap-2">
                      {selectedProject.additionalImages.map((img, index) => (
                        <div key={index} className="relative h-20 bg-gray-100 rounded overflow-hidden">
                          <Image
                            src={img}
                            alt={`Additional ${index + 1}`}
                            fill
                            className="object-cover cursor-pointer hover:scale-105 transition-transform"
                            onClick={() => openImageModal(img)}
                          />
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  )
}

export default PortfolioGallery 