'use client'

import { useState, useEffect } from 'react'
import Image from 'next/image'

interface ImageInputProps {
  currentImageUrl: string
  onImageUpload: (url: string) => void
  folderPath?: string
}

function ImageThumbnail({ url }: { url: string }) {
  return (
    <div className="inline-flex items-center mt-2">
      <div className="relative w-24 h-24 border rounded-md overflow-hidden">
        <Image
          src={url}
          alt="Prévisualisation"
          fill
          className="object-cover"
          onError={(e) => {
            e.currentTarget.style.display = 'none'
          }}
        />
      </div>
    </div>
  )
}

export default function ImageInput({
  currentImageUrl,
  onImageUpload
}: ImageInputProps) {
  const [imageUrl, setImageUrl] = useState(currentImageUrl || '')
  const [showPreview, setShowPreview] = useState(!!currentImageUrl)

  useEffect(() => {
    setImageUrl(currentImageUrl || '')
    setShowPreview(!!currentImageUrl)
  }, [currentImageUrl])

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const newUrl = e.target.value
    setImageUrl(newUrl)
    onImageUpload(newUrl)
    setShowPreview(!!newUrl)
  }

  return (
    <div className="space-y-2">
      <input
        type="url"
        value={imageUrl}
        onChange={handleInputChange}
        placeholder="https://example.com/image.jpg"
        className="w-full p-2 border rounded-md"
      />
      
      {showPreview && imageUrl && (
        <div className="mt-2">
          <ImageThumbnail url={imageUrl} />
        </div>
      )}
    </div>
  )
} 