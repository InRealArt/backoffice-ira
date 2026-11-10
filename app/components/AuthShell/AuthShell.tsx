'use client'

import type { InputHTMLAttributes, ReactNode } from 'react'
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
        <ArtGallery artworks={artworks} label={label} maxHeight="66vh" priority={false} />
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
}

export function AuthField({ id, label, ...inputProps }: AuthFieldProps) {
  return (
    <div className={styles.field}>
      <label htmlFor={id} className={styles.label}>
        {label}
      </label>
      <input id={id} className={styles.input} {...inputProps} />
    </div>
  )
}
