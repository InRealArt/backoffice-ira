'use client'

export interface LoadingSpinnerProps {
  message?: string
  size?: 'small' | 'medium' | 'large'
  fullPage?: boolean
  inline?: boolean
  color?: 'primary' | 'light' | 'dark'
}

export default function LoadingSpinner({ 
  message = 'Chargement...', 
  size = 'medium',
  fullPage = false,
  inline = false,
  color = 'primary'
}: LoadingSpinnerProps) {
  return (
    <div className={`
      spinner-container 
      ${fullPage ? 'full-page' : ''} 
      ${inline ? 'inline' : ''}
      ${size}
    `}>
      <div className={`spinner ${color}`}>
        <div className="dot1"></div>
        <div className="dot2"></div>
      </div>
      {message && <p className="spinner-message">{message}</p>}
    </div>
  )
} 