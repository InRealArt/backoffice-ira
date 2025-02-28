'use client'

import styles from './LoadingSpinner.module.scss'

interface LoadingSpinnerProps {
  message?: string
  size?: 'small' | 'medium' | 'large'
  fullPage?: boolean
  inline?: boolean
  color?: 'primary' | 'light' | 'dark'
}

export default function LoadingSpinner({ 
  message = 'Chargement...', 
  size = 'medium',
  fullPage = false,
  inline = false,
  color = 'primary'
}: LoadingSpinnerProps) {
  return (
    <div className={`
      ${styles.spinnerContainer} 
      ${fullPage ? styles.fullPage : ''} 
      ${inline ? styles.inline : ''}
      ${styles[size]}
    `}>
      <div className={`${styles.spinner} ${styles[color]}`}>
        <div className={styles.dot1}></div>
        <div className={styles.dot2}></div>
      </div>
      {message && <p className={styles.message}>{message}</p>}
    </div>
  )
} 