'use client'

import styles from './LoadingSpinner.module.scss'

interface LoadingSpinnerProps {
  message?: string
}

export default function LoadingSpinner({ message = 'Chargement...' }: LoadingSpinnerProps) {
  return (
    <div className={styles.spinnerContainer}>
      <div className={styles.spinner}>
        <div className={styles.dot1}></div>
        <div className={styles.dot2}></div>
      </div>
      {message && <p className={styles.message}>{message}</p>}
    </div>
  )
} 