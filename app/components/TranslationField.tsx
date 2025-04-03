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
}

export default function TranslationField({
  entityType,
  entityId,
  field,
  label,
  languageCode = 'en',
  children,
  className = '',
  errorMessage
}: TranslationFieldProps) {
  return (
    <div className={`form-group ${className}`}>
      <label htmlFor={field} className="form-label">
        {label}
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