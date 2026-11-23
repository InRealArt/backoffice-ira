'use client'

import { useCallback, useEffect, useRef, useState } from 'react'
import Image from 'next/image'
import { useTranslations } from 'next-intl'
import styles from './ArtGallery.module.scss'

export interface HeroArtwork {
  src: string
  width: number
  height: number
  artist: string
  title: string
  year: string
  alt: string
}

const SLIDE_DURATION_MS = 8000

interface ArtGalleryProps {
  artworks: HeroArtwork[]
  /** Nom accessible du carrousel */
  label: string
  /** Décalage de l'apparition, ex. « 0.9s » */
  delay?: string
  /** Hauteur maximale du cadre (unité CSS), ex. « 62vh » */
  maxHeight?: string
  /** Précharge la première image (à désactiver si le carrousel peut être masqué) */
  priority?: boolean
}

export default function ArtGallery({ artworks, label, delay, maxHeight, priority = true }: ArtGalleryProps) {
  const t = useTranslations('home.gallery')
  const frameRef = useRef<HTMLDivElement>(null)
  const [active, setActive] = useState(0)
  const [autoPlay, setAutoPlay] = useState(false)
  const [userPaused, setUserPaused] = useState(false)
  const [hovered, setHovered] = useState(false)
  const [focused, setFocused] = useState(false)
  const running = autoPlay && !userPaused && !hovered && !focused

  // Rotation automatique : coupée avec « réduire les animations » et quand l'onglet est masqué.
  // `active` dans les dépendances : un clic sur un indicateur relance le minuteur.
  useEffect(() => {
    setAutoPlay(!window.matchMedia('(prefers-reduced-motion: reduce)').matches)
  }, [])

  useEffect(() => {
    if (!running || artworks.length < 2) return
    const timer = window.setTimeout(() => {
      // offsetParent est null quand le carrousel est masqué (display: none) : on n'avance pas pour rien
      if (!document.hidden && frameRef.current?.offsetParent) {
        setActive((current) => (current + 1) % artworks.length)
      }
    }, SLIDE_DURATION_MS)
    return () => window.clearTimeout(timer)
  }, [running, active, artworks.length])

  // Spot de galerie : la lumière suit le pointeur sur le cadre
  const onFrameMove = useCallback((event: React.PointerEvent<HTMLDivElement>) => {
    if (event.pointerType !== 'mouse') return
    const frame = frameRef.current
    if (!frame) return
    const rect = frame.getBoundingClientRect()
    frame.style.setProperty('--fx', ((event.clientX - rect.left) / rect.width).toFixed(3))
    frame.style.setProperty('--fy', ((event.clientY - rect.top) / rect.height).toFixed(3))
  }, [])

  if (artworks.length === 0) return null

  const style = {
    ...(delay ? { ['--gallery-delay' as string]: delay } : {}),
    ...(maxHeight ? { ['--gallery-height' as string]: maxHeight } : {}),
  }

  return (
    <figure
      className={styles.gallery}
      style={style}
      role="group"
      aria-roledescription="carrousel"
      aria-label={label}
      onPointerEnter={(event) => event.pointerType === 'mouse' && setHovered(true)}
      onPointerLeave={() => setHovered(false)}
      onFocus={() => setFocused(true)}
      onBlur={() => setFocused(false)}
    >
      <div ref={frameRef} className={styles.frame} onPointerMove={onFrameMove}>
        {artworks.map((art, index) => (
          <div
            key={art.src}
            className={`${styles.slide} ${index === active ? styles.slideActive : ''}`}
            aria-hidden={index === active ? undefined : true}
          >
            <Image
              src={art.src}
              alt={art.alt}
              fill
              sizes="(max-width: 900px) 80vw, 40vw"
              priority={priority && index === 0}
              className={styles.art}
            />
          </div>
        ))}
        <div className={styles.spot} aria-hidden="true" />
      </div>

      <figcaption className={styles.cartel} aria-live={running ? 'off' : 'polite'}>
        <span className={styles.cartelArtist}>{artworks[active].artist}</span>
        <span className={styles.cartelTitle}>
          <em>{artworks[active].title}</em>, {artworks[active].year}
        </span>
      </figcaption>

      {artworks.length > 1 && (
        <div className={styles.dots}>
          {artworks.map((art, index) => (
            <button
              key={art.src}
              type="button"
              className={`${styles.dot} ${index === active ? styles.dotActive : ''}`}
              aria-label={`${art.artist} — ${art.title}`}
              aria-current={index === active}
              onClick={() => setActive(index)}
            />
          ))}
          {autoPlay && (
            <button
              type="button"
              className={styles.toggle}
              aria-pressed={userPaused}
              aria-label={userPaused ? t('play') : t('pause')}
              onClick={() => setUserPaused((paused) => !paused)}
            >
              {userPaused ? (
                <svg viewBox="0 0 12 12" aria-hidden="true"><path d="M2 1l9 5-9 5z" /></svg>
              ) : (
                <svg viewBox="0 0 12 12" aria-hidden="true"><path d="M2 1h3v10H2zM7 1h3v10H7z" /></svg>
              )}
            </button>
          )}
        </div>
      )}
    </figure>
  )
}
