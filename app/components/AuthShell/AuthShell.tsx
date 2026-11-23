'use client'

import { useId, useState, type InputHTMLAttributes, type ReactNode } from 'react'
import ArtGallery from '../ArtGallery/ArtGallery'
import { useHeroArtworks } from '../ArtGallery/heroArtworks'
import BrandLogo from '../BrandLogo/BrandLogo'
import styles from './AuthShell.module.scss'

interface AuthShellProps {
  title: string
  subtitle?: string
  children: ReactNode
  /** Liens sous le formulaire (inscription, mot de passe oublié…) */
  footer?: ReactNode
}

// Gabarit des pages d'authentification : œuvre à gauche (≥ 900 px), formulaire à droite.
export default function AuthShell({ title, subtitle, children, footer }: AuthShellProps) {
  const { artworks, label } = useHeroArtworks()

  return (
    <main className={styles.shell}>
      <aside className={styles.art}>
        <div className={styles.artGlow} aria-hidden="true" />
        <ArtGallery artworks={artworks} label={label} maxHeight="78vh" priority={false} />
      </aside>

      <section className={styles.panel}>
        <div className={styles.card}>
          <BrandLogo size="lg" caption="Backoffice" className={styles.logo} />
          <h1 className={styles.title}>{title}</h1>
          {subtitle && <p className={styles.subtitle}>{subtitle}</p>}
          {children}
          {footer && <div className={styles.footer}>{footer}</div>}
        </div>
      </section>
    </main>
  )
}

interface AuthFieldProps extends InputHTMLAttributes<HTMLInputElement> {
  id: string
  label: string
  /** Message d'erreur affiché sous le champ (annoncé aux lecteurs d'écran) */
  error?: string | null
  /** Aide affichée sous le champ tant qu'il n'y a pas d'erreur */
  hint?: string
}

export function AuthField({ id, label, error, hint, type, ...inputProps }: AuthFieldProps) {
  const [revealed, setRevealed] = useState(false)
  const messageId = useId()
  const isPassword = type === 'password'
  const message = error || hint

  return (
    <div className={styles.field}>
      <label htmlFor={id} className={styles.label}>
        {label}
      </label>
      <div className={styles.control}>
        <input
          id={id}
          className={`${styles.input} ${isPassword ? styles.inputWithToggle : ''} ${error ? styles.inputError : ''}`}
          type={isPassword && revealed ? 'text' : type}
          aria-invalid={error ? true : undefined}
          aria-describedby={message ? messageId : undefined}
          {...inputProps}
        />
        {isPassword && (
          <button
            type="button"
            className={styles.reveal}
            aria-label='Afficher le mot de passe'
            aria-pressed={revealed}
            onClick={() => setRevealed((value) => !value)}
          >
            <svg viewBox="0 0 24 24" aria-hidden="true" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round">
              {revealed ? (
                <>
                  <path d="M3 3l18 18" />
                  <path d="M10.6 10.6a2 2 0 002.8 2.8" />
                  <path d="M9.9 5.1A10 10 0 0112 5c5 0 8.5 4 9.5 7a13 13 0 01-2.6 3.9M6.3 6.3A13 13 0 002.5 12c1 3 4.5 7 9.5 7a9.7 9.7 0 004-.9" />
                </>
              ) : (
                <>
                  <path d="M2.5 12C3.5 9 7 5 12 5s8.5 4 9.5 7c-1 3-4.5 7-9.5 7s-8.5-4-9.5-7z" />
                  <circle cx="12" cy="12" r="3" />
                </>
              )}
            </svg>
          </button>
        )}
      </div>
      {message && (
        <p id={messageId} className={error ? styles.error : styles.hint} role={error ? 'alert' : undefined}>
          {message}
        </p>
      )}
    </div>
  )
}

/** Erreur générale du formulaire (identifiants refusés, lien expiré…) */
export function AuthAlert({ children }: { children: ReactNode }) {
  return (
    <div role="alert" className={styles.alert}>
      <svg viewBox="0 0 24 24" aria-hidden="true" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
        <circle cx="12" cy="12" r="9" />
        <path d="M12 7.5v5M12 16h.01" />
      </svg>
      <span>{children}</span>
    </div>
  )
}

/** Écran de confirmation (email envoyé, mot de passe réinitialisé) */
export function AuthSuccess({ title, children }: { title: string; children: ReactNode }) {
  return (
    <div className={styles.success} role="status">
      <svg viewBox="0 0 24 24" aria-hidden="true" fill="none" stroke="currentColor" strokeWidth="1.4" strokeLinecap="round" strokeLinejoin="round">
        <circle cx="12" cy="12" r="9.5" />
        <path d="M8 12.3l2.6 2.6L16 9.5" />
      </svg>
      <h2>{title}</h2>
      {children}
    </div>
  )
}

/** Action secondaire discrète (réessayer, renvoyer…) */
export function AuthGhostButton({ children, ...props }: React.ButtonHTMLAttributes<HTMLButtonElement>) {
  return (
    <button type="button" className={styles.ghost} {...props}>
      {children}
    </button>
  )
}
