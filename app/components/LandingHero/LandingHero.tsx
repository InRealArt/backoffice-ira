'use client'

import { useEffect, useRef } from 'react'
import { Cormorant_Garamond } from 'next/font/google'
import styles from './LandingHero.module.scss'

// Même mot-symbole que inrealart.com : Cormorant Garamond léger, majuscules, interlettrage large.
const cormorant = Cormorant_Garamond({
  subsets: ['latin'],
  display: 'swap',
  weight: ['300', '400'],
})

const WORDMARK = 'INREALART'

interface LandingHeroProps {
  /** Titre complet, lu par les lecteurs d'écran à la place des lettres animées */
  title: string
  caption: string
  tagline: string
  showActions: boolean
  signInLabel: string
  signUpLabel: string
  onSignIn: () => void
  onSignUp: () => void
}

export default function LandingHero({
  title,
  caption,
  tagline,
  showActions,
  signInLabel,
  signUpLabel,
  onSignIn,
  onSignUp,
}: LandingHeroProps) {
  const heroRef = useRef<HTMLElement>(null)

  // Parallaxe douce de la lueur : le pointeur déplace deux calques à des vitesses différentes.
  // Désactivée avec « réduire les animations » et sur écran tactile.
  useEffect(() => {
    const hero = heroRef.current
    if (!hero) return

    const reduceMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches
    const finePointer = window.matchMedia('(pointer: fine)').matches
    if (reduceMotion || !finePointer) return

    let frame = 0
    let nextX = 0.5
    let nextY = 0.5

    const apply = () => {
      frame = 0
      hero.style.setProperty('--px', nextX.toFixed(3))
      hero.style.setProperty('--py', nextY.toFixed(3))
    }

    const onMove = (event: PointerEvent) => {
      const rect = hero.getBoundingClientRect()
      nextX = Math.min(1, Math.max(0, (event.clientX - rect.left) / rect.width))
      nextY = Math.min(1, Math.max(0, (event.clientY - rect.top) / rect.height))
      if (!frame) frame = requestAnimationFrame(apply)
    }

    hero.addEventListener('pointermove', onMove, { passive: true })
    return () => {
      hero.removeEventListener('pointermove', onMove)
      if (frame) cancelAnimationFrame(frame)
    }
  }, [])

  return (
    <section ref={heroRef} className={styles.hero}>
      {/* Décor : tout est masqué aux technologies d'assistance */}
      <div className={styles.glowWide} aria-hidden="true" />
      <div className={styles.glowCore} aria-hidden="true" />
      <div className={styles.lines} aria-hidden="true">
        <span style={{ ['--i' as string]: 0 }} />
        <span style={{ ['--i' as string]: 1 }} />
      </div>
      <div className={styles.grain} aria-hidden="true" />

      <div className={styles.content}>
        <h1 className={`${styles.wordmark} ${cormorant.className}`} aria-label={title}>
          {WORDMARK.split('').map((letter, index) => (
            <span
              key={`${letter}-${index}`}
              className={styles.letter}
              style={{ ['--i' as string]: index }}
              aria-hidden="true"
            >
              {letter}
            </span>
          ))}
        </h1>

        <span className={styles.rule} aria-hidden="true" />
        <p className={styles.caption} aria-hidden="true">
          {caption}
        </p>

        {showActions && (
          <>
            <p className={styles.tagline}>{tagline}</p>
            <div className={styles.actions}>
              <button type="button" onClick={onSignIn} className="btn btn-primary btn-medium">
                {signInLabel}
              </button>
              <button type="button" onClick={onSignUp} className="btn btn-medium">
                {signUpLabel}
              </button>
            </div>
          </>
        )}
      </div>
    </section>
  )
}
