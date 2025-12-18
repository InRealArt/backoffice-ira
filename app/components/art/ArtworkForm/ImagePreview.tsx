'use client'

import { ImagePreviewProps } from './types'

function ImagePreview({ 
  images, 
  label = '', 
  onRemove,
  isExistingImage = () => false
}: ImagePreviewProps) {
  
  if (images.length === 0) return null
  
  return (
    <>
      {label && (
        <div className="mt-4 mb-1 px-2 py-1 bg-[#e6f0ff] border-l-4 border-[#4a6cf7] rounded">
          <p className="m-0"><strong>{label}</strong></p>
        </div>
      )}
      <div className="flex flex-wrap gap-[10px] mt-[10px]">
        {images.map((src, index) => src && (
          <div 
            key={index} 
            className={[
              'relative m-[5px] border border-border rounded overflow-hidden',
              isExistingImage(src) ? '' : ''
            ].join(' ')}
          >
            <img src={src} alt={`Image ${index + 1}`} className="max-w-[150px] max-h-[150px] object-cover" />
            {onRemove && (
              <button
                type="button"
                onClick={() => onRemove(index)}
                className="absolute top-[5px] right-[5px] bg-red-600/70 text-white rounded-full w-[25px] h-[25px] text-[16px] flex items-center justify-center transition-colors hover:bg-red-600/90"
                aria-label="Supprimer cette image"
              >
                ×
              </button>
            )}
          </div>
        ))}
      </div>
    </>
  )}

export default ImagePreview 