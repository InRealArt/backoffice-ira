'use client'

import { useState, useEffect } from 'react'
import Image from 'next/image'

interface ImageInputProps {
  currentImageUrl: string
  onImageUpload: (url: string) => void
  folderPath?: string
  inputWidthPx?: number
  thumbnailSizePx?: number
}

function ImageThumbnail({ url, size }: { url: string, size: number }) {
  return (
    <div className="mt-2">
      <div
        className="relative border rounded-md overflow-hidden"
        style={{ width: `${size}px`, height: `${size}px` }}
      >
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
  onImageUpload,
  inputWidthPx,
  thumbnailSizePx
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
        className="p-2 border rounded-md"
        style={{ width: inputWidthPx ? `${inputWidthPx}px` : '100%' }}
      />
      
      {showPreview && imageUrl && (
        <div className="mt-2">
          <ImageThumbnail url={imageUrl} size={thumbnailSizePx || 96} />
        </div>
      )}
    </div>
  )
} 