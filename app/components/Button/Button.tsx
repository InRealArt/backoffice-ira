'use client'

import { ComponentPropsWithoutRef, ReactNode } from 'react'
import styles from './Button.module.scss'
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
  return (
    <button
      className={`
        ${styles.button} 
        ${styles[variant]} 
        ${styles[size]}
        ${fullWidth ? styles.fullWidth : ''}
        ${className || ''}
      `}
      disabled={isLoading || disabled}
      {...props}
    >
      {isLoading ? (
        <span className={styles.loadingContainer}>
          <LoadingSpinner 
            message="" 
            size="small" 
            inline={true} 
            color={variant === 'primary' ? 'light' : 'primary'} 
          />
          <span className={styles.loadingText}>{loadingText}</span>
        </span>
      ) : (
        children
      )}
    </button>
  )
} 