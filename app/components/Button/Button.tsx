'use client'

import { ComponentPropsWithoutRef, ReactNode } from 'react'
import LoadingSpinner from '../LoadingSpinner/LoadingSpinner'

interface ButtonProps extends ComponentPropsWithoutRef<'button'> {
  children: ReactNode
  variant?: 'primary' | 'secondary' | 'danger' | 'success'
  size?: 'small' | 'medium' | 'large'
  isLoading?: boolean
  loadingText?: string
  fullWidth?: boolean
}

export default function Button({
  children,
  variant = 'primary',
  size = 'medium',
  isLoading = false,
  loadingText = 'Chargement...',
  fullWidth = false,
  disabled,
  className,
  ...props
}: ButtonProps) {
  const buttonClasses = [
    'btn',
    `btn-${variant}`,
    `btn-${size}`,
    fullWidth ? 'btn-full-width' : '',
    className || ''
  ].filter(Boolean).join(' ');

  return (
    <button
      className={buttonClasses}
      disabled={isLoading || disabled}
      {...props}
    >
      {isLoading ? (
        <span className="btn-loading-container">
          <LoadingSpinner 
            message="" 
            size="small" 
            inline={true} 
            color={variant === 'primary' ? 'light' : 'primary'} 
          />
          <span className="btn-loading-text">{loadingText}</span>
        </span>
      ) : (
        children
      )}
    </button>
  )
} 