'use client'

import { useTranslations } from 'next-intl'
import type { HeroArtwork } from './ArtGallery'

// Œuvres de démonstration du domaine public (Wikimedia Commons).
// À remplacer par des œuvres d'artistes représentés, avec leur accord.
const HERO_ARTWORKS = [
  { key: 'klimt', src: '/img/hero/klimt-le-baiser.webp', width: 1200, height: 1201, artist: 'Gustav Klimt', title: 'Le Baiser', year: '1908' },
  { key: 'monet', src: '/img/hero/monet-impression-soleil-levant.webp', width: 1200, height: 934, artist: 'Claude Monet', title: 'Impression, soleil levant', year: '1872' },
  { key: 'vangogh', src: '/img/hero/van-gogh-nuit-etoilee.webp', width: 1200, height: 950, artist: 'Vincent van Gogh', title: 'La Nuit étoilée', year: '1889' },
  { key: 'turner', src: '/img/hero/turner-le-temeraire.webp', width: 1200, height: 891, artist: 'J. M. W. Turner', title: 'Le Téméraire', year: '1839' },
] as const

/** Œuvres avec leur texte alternatif traduit, plus le nom accessible du carrousel */
export function useHeroArtworks(): { artworks: HeroArtwork[]; label: string } {
  const t = useTranslations('home')
  return {
    artworks: HERO_ARTWORKS.map(({ key, ...art }) => ({ ...art, alt: t(`artworks.${key}`) })),
    label: t('artworksLabel'),
  }
}
