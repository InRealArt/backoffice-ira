'use client'

import { useState, useEffect } from 'react'
import { format } from 'date-fns'
import { fr } from 'date-fns/locale'

interface DatePickerFieldProps {
  id: string
  name: string
  label: string
  value?: Date
  onChange: (date: Date) => void
  error?: string
  required?: boolean
  placeholder?: string
  showErrorsOnlyAfterSubmit?: boolean
  className?: string
}

export default function DatePickerField({
  id,
  name,
  label,
  value,
  onChange,
  error,
  required = false,
  placeholder = 'Sélectionner une date',
  showErrorsOnlyAfterSubmit = false,
  className = '',
}: DatePickerFieldProps) {
  const [displayValue, setDisplayValue] = useState<string>('')
  const [isFocused, setIsFocused] = useState<boolean>(false)
  const [showError, setShowError] = useState<boolean>(!showErrorsOnlyAfterSubmit)

  useEffect(() => {
    if (value) {
      setDisplayValue(format(value, 'dd/MM/yyyy', { locale: fr }))
    } else {
      setDisplayValue('')
    }
  }, [value])

  // Mettre à jour showError une fois soumis si on utilise showErrorsOnlyAfterSubmit
  useEffect(() => {
    if (showErrorsOnlyAfterSubmit && error) {
      setShowError(true)
    }
  }, [error, showErrorsOnlyAfterSubmit])

  // Convertir la date au format ISO pour l'input
  const getISODate = (date?: Date): string => {
    if (!date) return ''
    return date.toISOString().split('T')[0]
  }

  // Gérer le changement de date
  const handleDateChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const dateValue = e.target.value
    if (dateValue) {
      const [year, month, day] = dateValue.split('-').map(Number)
      const newDate = new Date(year, month - 1, day)
      onChange(newDate)
    } else {
      // Si l'input est vidé, on peut soit mettre undefined soit une date par défaut
      onChange(new Date())
    }
  }

  return (
    <div className={`form-group ${className}`}>
      <label htmlFor={id} className="form-label">
        {label}
        {required && <span className="text-red-500 ml-1">*</span>}
      </label>
      <div className="relative">
        <input
          type="date"
          id={id}
          name={name}
          value={getISODate(value)}
          onChange={handleDateChange}
          onFocus={() => setIsFocused(true)}
          onBlur={() => setIsFocused(false)}
          className={`
            form-input w-full transition-all duration-200
            ${isFocused ? 'border-blue-400 shadow-sm ring-1 ring-blue-200' : 'border-gray-300'}
            ${error && showError ? 'border-red-500' : ''}
          `}
          placeholder={placeholder}
          required={required}
        />
        {/* Icône calendrier (optionnel) */}
        <div className="absolute right-2 top-1/2 transform -translate-y-1/2 text-gray-400 pointer-events-none">
          <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <rect x="3" y="4" width="18" height="18" rx="2" ry="2"></rect>
            <line x1="16" y1="2" x2="16" y2="6"></line>
            <line x1="8" y1="2" x2="8" y2="6"></line>
            <line x1="3" y1="10" x2="21" y2="10"></line>
          </svg>
        </div>
      </div>
      {error && showError && (
        <p className="form-error">{error}</p>
      )}
    </div>
  )
} 