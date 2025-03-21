'use client'

import React, { createContext, useContext, useState, ReactNode, useCallback } from 'react'
import toast, { Toast as HotToast, Toaster as HotToaster } from 'react-hot-toast'

type ToastType = 'success' | 'error' | 'warning' | 'info'

interface ToastOptions {
  duration?: number
  position?: 'top-right' | 'top-center' | 'top-left' | 'bottom-right' | 'bottom-center' | 'bottom-left'
  icon?: React.ReactNode
}

interface ToastContextType {
  success: (message: string, options?: ToastOptions) => void
  error: (message: string, options?: ToastOptions) => void
  warning: (message: string, options?: ToastOptions) => void
  info: (message: string, options?: ToastOptions) => void
  dismiss: (toastId?: string) => void
}

const ToastContext = createContext<ToastContextType | undefined>(undefined)

export const useToast = () => {
  const context = useContext(ToastContext)
  if (!context) {
    throw new Error('useToast doit être utilisé à l\'intérieur d\'un ToastProvider')
  }
  return context
}

interface ToastProviderProps {
  children: ReactNode
}

export function ToastProvider({ children }: ToastProviderProps) {
  // Fonction pour afficher un toast avec le style approprié
  const showToast = useCallback((message: string, type: ToastType, options?: ToastOptions) => {
    return toast.custom(
      (t) => (
        <div 
          className={`toast-notification toast-${type} ${t.visible ? 'animate-enter' : 'animate-leave'}`}
          onClick={() => toast.dismiss(t.id)}
        >
          {message}
        </div>
      ),
      {
        duration: options?.duration || 3000,
        position: options?.position || 'top-center',
      }
    )
  }, [])

  const success = useCallback((message: string, options?: ToastOptions) => {
    return showToast(message, 'success', options)
  }, [showToast])

  const error = useCallback((message: string, options?: ToastOptions) => {
    return showToast(message, 'error', options)
  }, [showToast])

  const warning = useCallback((message: string, options?: ToastOptions) => {
    return showToast(message, 'warning', options)
  }, [showToast])

  const info = useCallback((message: string, options?: ToastOptions) => {
    return showToast(message, 'info', options)
  }, [showToast])

  const dismiss = useCallback((toastId?: string) => {
    if (toastId) {
      toast.dismiss(toastId)
    } else {
      toast.dismiss()
    }
  }, [])

  const value = {
    success,
    error,
    warning,
    info,
    dismiss
  }

  return (
    <ToastContext.Provider value={value}>
      {children}
    </ToastContext.Provider>
  )
}

export function CustomToaster() {
  return (
    <HotToaster
      position="top-center"
      reverseOrder={false}
      gutter={8}
      containerStyle={{}}
      toastOptions={{
        duration: 3000,
        style: {
          background: 'transparent',
          boxShadow: 'none',
          padding: 0,
        },
      }}
    />
  )
} 