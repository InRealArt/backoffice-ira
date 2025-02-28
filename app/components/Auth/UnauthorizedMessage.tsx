'use client'

import { useState, useEffect } from 'react'
import styles from './UnauthorizedMessage.module.scss'
import { useDynamicContext } from '@dynamic-labs/sdk-react-core'

export default function UnauthorizedMessage() {
  const { user } = useDynamicContext()
  const [email, setEmail] = useState<string | null>(null)

  useEffect(() => {
    if (user?.email) {
      setEmail(user.email)
    }
  }, [user])

  return (
    <div className={styles.unauthorizedContainer}>
      <div className={styles.errorCard}>
        <div className={styles.iconWrapper}>
          <svg width="64" height="64" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
            <path d="M12 22C17.5228 22 22 17.5228 22 12C22 6.47715 17.5228 2 12 2C6.47715 2 2 6.47715 2 12C2 17.5228 6.47715 22 12 22Z" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
            <path d="M15 9L9 15" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
            <path d="M9 9L15 15" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
          </svg>
        </div>
        <h1 className={styles.title}>Accès non autorisé</h1>
        <p className={styles.message}>
          Votre compte ({email || 'non identifié'}) n'est pas autorisé à accéder à cette application.
        </p>
        <p className={styles.contactInfo}>
          Veuillez contacter InRealArt pour obtenir l'accès ou vérifier que vous utilisez le bon compte de connexion.
        </p>
        <a href="mailto:contact@inrealart.com" className={styles.contactButton}>
          Contacter InRealArt
        </a>
      </div>
    </div>
  )
} 