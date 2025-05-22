'use client'

import React from 'react'

interface ActionButtonProps {
  label: string
  onClick: () => void
  icon?: React.ReactNode
  variant?: 'primary' | 'secondary' | 'danger' | 'success' | 'warning'
  size?: 'small' | 'medium' | 'large'
  isLoading?: boolean
  disabled?: boolean
  className?: string
  type?: 'button' | 'submit' | 'reset'
}

export function ActionButton({
  label,
  onClick,
  icon,
  variant = 'primary',
  size = 'medium',
  isLoading = false,
  disabled = false,
  className = '',
  type = 'button'
}: ActionButtonProps) {
  return (
    <button
      type={type}
      onClick={onClick}
      className={`btn btn-${variant} btn-${size} ${className}`}
      disabled={disabled || isLoading}
    >
      {isLoading ? (
        <span className="loading-spinner-inline"></span>
      ) : (
        <>
          {icon && <span className="btn-icon">{icon}</span>}
          {label}
        </>
      )}
    </button>
  )
}

export default ActionButton 