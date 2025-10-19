'use client'

export interface LoadingSpinnerProps {
  message?: string
  size?: 'small' | 'medium' | 'large'
  fullPage?: boolean
  inline?: boolean
  color?: 'primary' | 'light' | 'dark'
}

const sizeClass: Record<NonNullable<LoadingSpinnerProps['size']>, string> = {
  small: 'w-4 h-4',
  medium: 'w-6 h-6',
  large: 'w-8 h-8',
}

const colorClass: Record<NonNullable<LoadingSpinnerProps['color']>, string> = {
  primary: 'border-primary',
  light: 'border-white',
  dark: 'border-gray-900',
}

export default function LoadingSpinner({ 
  message = 'Chargement...', 
  size = 'medium',
  fullPage = false,
  inline = false,
  color = 'primary'
}: LoadingSpinnerProps) {
  return (
    <div className={[
      'flex items-center justify-center gap-2',
      fullPage ? 'h-screen w-full' : '',
      inline ? 'inline-flex h-auto' : 'flex-col',
    ].filter(Boolean).join(' ')}>
      <div className={[
        'relative rounded-full animate-spin',
        'border-2 border-t-transparent',
        sizeClass[size],
        colorClass[color],
      ].join(' ')} />
      {message && (
        <p className="text-text-secondary m-0 text-[0.95rem]">
          {message}
        </p>
      )}
    </div>
  )
} 