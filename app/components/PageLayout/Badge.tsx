'use client'

import React from 'react'

interface BadgeProps {
  variant: 'success' | 'warning' | 'danger' | 'info' | 'primary' | 'secondary'
  text: string
  size?: 'small' | 'medium' | 'large'
}

export default function Badge({ variant, text, size = 'small' }: BadgeProps) {
  const getVariantStyles = () => {
    switch (variant) {
      case 'success':
        return 'bg-green-100 text-green-800 border-green-200'
      case 'warning':
        return 'bg-amber-100 text-amber-800 border-amber-200'
      case 'danger':
        return 'bg-red-100 text-red-800 border-red-200'
      case 'info':
        return 'bg-blue-100 text-blue-800 border-blue-200'
      case 'primary':
        return 'bg-indigo-100 text-indigo-800 border-indigo-200'
      case 'secondary':
        return 'bg-gray-100 text-gray-800 border-gray-200'
      default:
        return 'bg-gray-100 text-gray-800 border-gray-200'
    }
  }

  const getSizeStyles = () => {
    switch (size) {
      case 'small':
        return 'text-xs px-2 py-0.5'
      case 'medium':
        return 'text-sm px-2.5 py-1'
      case 'large':
        return 'text-base px-3 py-1.5'
      default:
        return 'text-xs px-2 py-0.5'
    }
  }

  return (
    <span 
      className={`inline-flex items-center rounded-full border ${getVariantStyles()} ${getSizeStyles()} font-medium`}
    >
      {text}
    </span>
  )
} 