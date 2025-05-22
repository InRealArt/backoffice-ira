'use client'

import React from 'react'
import TranslationIcon from './TranslationIcon'

interface TranslationFieldProps {
  entityType: string
  entityId: number | null
  field: string
  label: React.ReactNode
  languageCode?: string
  children: React.ReactNode
  className?: string
  errorMessage?: string
  required?: boolean
}

export default function TranslationField({
  entityType,
  entityId,
  field,
  label,
  languageCode = 'en',
  children,
  className = '',
  errorMessage,
  required = false
}: TranslationFieldProps) {
  return (
    <div className={`form-group ${className}`}>
      <label htmlFor={field} className="form-label" style={{ display: 'inline-flex', alignItems: 'center', gap: '4px' }}>
        {label}
        {required && <span className="text-red-500">*</span>}
        {entityId && (
          <TranslationIcon 
            entityType={entityType} 
            entityId={entityId} 
            field={field} 
            languageCode={languageCode}
          />
        )}
      </label>
      {children}
      {errorMessage && (
        <p className="form-error">{errorMessage}</p>
      )}
    </div>
  )
} 