'use client'

import { X } from 'lucide-react'

interface ProgressStep {
  id: string
  label: string
  status: 'pending' | 'in-progress' | 'completed' | 'error'
}

interface ProgressModalProps {
  isOpen: boolean
  steps: ProgressStep[]
  currentError?: string
  onClose?: () => void
  title?: string
}

export default function ProgressModal({ isOpen, steps, currentError, onClose, title = 'Création du profil artiste' }: ProgressModalProps) {
  if (!isOpen) return null

  return (
    <div
      style={{
        position: 'fixed',
        top: 0,
        left: 0,
        right: 0,
        bottom: 0,
        backgroundColor: 'rgba(0, 0, 0, 0.5)',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        zIndex: 9999
      }}
    >
      <div
        style={{
          backgroundColor: 'white',
          borderRadius: '8px',
          padding: '2rem',
          maxWidth: '500px',
          width: '90%',
          boxShadow: '0 4px 6px rgba(0, 0, 0, 0.1)',
          position: 'relative'
        }}
      >
        {currentError && onClose && (
          <button
            onClick={onClose}
            style={{
              position: 'absolute',
              top: '1rem',
              right: '1rem',
              background: 'transparent',
              border: 'none',
              cursor: 'pointer',
              padding: '0.5rem',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              borderRadius: '4px',
              transition: 'background-color 0.2s'
            }}
            onMouseEnter={(e) => {
              e.currentTarget.style.backgroundColor = '#f3f4f6'
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.backgroundColor = 'transparent'
            }}
            aria-label="Fermer"
          >
            <X size={20} color="#6b7280" />
          </button>
        )}
        <h2 style={{ margin: '0 0 1.5rem 0', fontSize: '1.5rem', fontWeight: 'bold' }}>
          {title}
        </h2>

        <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
          {steps.map((step) => (
            <div
              key={step.id}
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: '0.75rem',
                padding: '0.75rem',
                borderRadius: '6px',
                backgroundColor: step.status === 'error' ? '#fee' : step.status === 'completed' ? '#efe' : '#f5f5f5'
              }}
            >
              {/* Icône de statut */}
              <div
                style={{
                  width: '24px',
                  height: '24px',
                  borderRadius: '50%',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  flexShrink: 0,
                  backgroundColor:
                    step.status === 'completed'
                      ? '#22c55e'
                      : step.status === 'in-progress'
                      ? '#3b82f6'
                      : step.status === 'error'
                      ? '#ef4444'
                      : '#d1d5db',
                  color: 'white',
                  fontSize: '0.875rem',
                  fontWeight: 'bold'
                }}
              >
                {step.status === 'completed' ? '✓' : step.status === 'error' ? '✕' : step.status === 'in-progress' ? '...' : ''}
              </div>

              {/* Label */}
              <span
                style={{
                  flex: 1,
                  fontSize: '0.95rem',
                  color: step.status === 'error' ? '#dc2626' : step.status === 'completed' ? '#16a34a' : '#374151'
                }}
              >
                {step.label}
              </span>

              {/* Spinner pour in-progress */}
              {step.status === 'in-progress' && (
                <div
                  style={{
                    width: '16px',
                    height: '16px',
                    border: '2px solid #e5e7eb',
                    borderTopColor: '#3b82f6',
                    borderRadius: '50%',
                    animation: 'spin 1s linear infinite'
                  }}
                />
              )}
            </div>
          ))}
        </div>

        {currentError && (
          <div
            style={{
              marginTop: '1.5rem',
              padding: '1rem',
              backgroundColor: '#fee',
              borderRadius: '6px',
              color: '#dc2626',
              fontSize: '0.875rem'
            }}
          >
            <strong>Erreur :</strong> {currentError}
            {onClose && (
              <button
                onClick={onClose}
                style={{
                  marginTop: '1rem',
                  padding: '0.5rem 1rem',
                  backgroundColor: '#dc2626',
                  color: 'white',
                  border: 'none',
                  borderRadius: '4px',
                  cursor: 'pointer',
                  fontSize: '0.875rem',
                  fontWeight: '500',
                  width: '100%',
                  transition: 'background-color 0.2s'
                }}
                onMouseEnter={(e) => {
                  e.currentTarget.style.backgroundColor = '#b91c1c'
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.backgroundColor = '#dc2626'
                }}
              >
                Fermer
              </button>
            )}
          </div>
        )}

        <style jsx>{`
          @keyframes spin {
            to {
              transform: rotate(360deg);
            }
          }
        `}</style>
      </div>
    </div>
  )
}
