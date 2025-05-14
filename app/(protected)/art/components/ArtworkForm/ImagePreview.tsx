'use client'

import { ImagePreviewProps } from './types'
import styles from '../ArtworkForm.module.scss'

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
        <div className={styles.imageMainLabel}>
          <p><strong>{label}</strong></p>
        </div>
      )}
      <div className={styles.imagePreviewContainer}>
        {images.map((src, index) => src && (
          <div 
            key={index} 
            className={`${styles.imagePreview} ${isExistingImage(src) ? styles.existingImagePreview : ''}`}
          >
            <img src={src} alt={`Image ${index + 1}`} />
            {onRemove && (
              <button
                type="button"
                onClick={() => onRemove(index)}
                className={styles.removeImageBtn}
                aria-label="Supprimer cette image"
              >
                ×
              </button>
            )}
          </div>
        ))}
      </div>
    </>
  )
}

export default ImagePreview 