'use client'

import { useEffect, useState } from 'react'
import { Users, ImageIcon, CalendarDays } from 'lucide-react'
import { MetricCard } from './MetricCard'
import {
  getGalleryLjArtistMetrics,
  getGalleryLjArtworkMetrics,
  getGalleryLjExhibitionMetrics,
  type GalleryLjArtistMetrics,
  type GalleryLjArtworkMetrics,
  type GalleryLjExhibitionMetrics,
} from '@/lib/actions/gallery-lj-dashboard-actions'

export function GalleryLjDashboard() {
  const [artistMetrics, setArtistMetrics] = useState<GalleryLjArtistMetrics>({
    total: 0,
    visible: 0,
    hidden: 0,
  })
  const [artworkMetrics, setArtworkMetrics] = useState<GalleryLjArtworkMetrics>({
    total: 0,
    visible: 0,
    hidden: 0,
  })
  const [exhibitionMetrics, setExhibitionMetrics] = useState<GalleryLjExhibitionMetrics>({
    total: 0,
    upcoming: 0,
    ongoing: 0,
    past: 0,
  })

  const [isLoadingArtists, setIsLoadingArtists] = useState(true)
  const [isLoadingArtworks, setIsLoadingArtworks] = useState(true)
  const [isLoadingExhibitions, setIsLoadingExhibitions] = useState(true)

  useEffect(() => {
    let isMounted = true

    const fetchAll = async () => {
      const [artists, artworks, exhibitions] = await Promise.allSettled([
        getGalleryLjArtistMetrics(),
        getGalleryLjArtworkMetrics(),
        getGalleryLjExhibitionMetrics(),
      ])

      if (!isMounted) return

      if (artists.status === 'fulfilled') setArtistMetrics(artists.value)
      setIsLoadingArtists(false)

      if (artworks.status === 'fulfilled') setArtworkMetrics(artworks.value)
      setIsLoadingArtworks(false)

      if (exhibitions.status === 'fulfilled') setExhibitionMetrics(exhibitions.value)
      setIsLoadingExhibitions(false)
    }

    fetchAll()

    return () => {
      isMounted = false
    }
  }, [])

  return (
    <div className="dashboard-container">
      <h2 className="dashboard-title">Gallery LJ — Tableau de bord</h2>

      <div className="dashboard-stats">
        {/* Card 1 — Artistes */}
        <div className="metric-card">
          <div className="metric-card-header">
            <div
              className="metric-icon"
              style={{ backgroundColor: '#3b82f615', color: '#3b82f6' }}
            >
              <Users size={24} />
            </div>
            <h4 className="metric-title">Artistes</h4>
          </div>
          <div className="metric-value-container">
            {isLoadingArtists ? (
              <div className="metric-loading">
                <div className="metric-loading-bar"></div>
              </div>
            ) : (
              <span className="metric-value" style={{ color: '#3b82f6' }}>
                {artistMetrics.total.toLocaleString('fr-FR')}
              </span>
            )}
          </div>
          {!isLoadingArtists && (
            <div className="dashboard-small-text">
              <span style={{ color: '#10b981' }}>{artistMetrics.visible} visible{artistMetrics.visible > 1 ? 's' : ''}</span>
              {artistMetrics.hidden > 0 && (
                <span style={{ color: '#6b7280', marginLeft: '0.5rem' }}>
                  · {artistMetrics.hidden} masqu{artistMetrics.hidden > 1 ? 'és' : 'é'}
                </span>
              )}
            </div>
          )}
          <div className="metric-card-button">
            <a href="/fr/galleryLj/artists" className="btn btn-sm btn-primary">
              Voir les artistes
            </a>
          </div>
        </div>

        {/* Card 2 — Oeuvres */}
        <div className="metric-card">
          <div className="metric-card-header">
            <div
              className="metric-icon"
              style={{ backgroundColor: '#8b5cf615', color: '#8b5cf6' }}
            >
              <ImageIcon size={24} />
            </div>
            <h4 className="metric-title">Oeuvres</h4>
          </div>
          <div className="metric-value-container">
            {isLoadingArtworks ? (
              <div className="metric-loading">
                <div className="metric-loading-bar"></div>
              </div>
            ) : (
              <span className="metric-value" style={{ color: '#8b5cf6' }}>
                {artworkMetrics.total.toLocaleString('fr-FR')}
              </span>
            )}
          </div>
          {!isLoadingArtworks && (
            <div className="dashboard-small-text">
              <span style={{ color: '#10b981' }}>{artworkMetrics.visible} visible{artworkMetrics.visible > 1 ? 's' : ''}</span>
              {artworkMetrics.hidden > 0 && (
                <span style={{ color: '#6b7280', marginLeft: '0.5rem' }}>
                  · {artworkMetrics.hidden} masqu{artworkMetrics.hidden > 1 ? 'ées' : 'ée'}
                </span>
              )}
            </div>
          )}
          <div className="metric-card-button">
            <a href="/fr/galleryLj/artworks" className="btn btn-sm btn-primary">
              Voir les oeuvres
            </a>
          </div>
        </div>

        {/* Card 3 — Expositions */}
        <div className="metric-card">
          <div className="metric-card-header">
            <div
              className="metric-icon"
              style={{ backgroundColor: '#f59e0b15', color: '#f59e0b' }}
            >
              <CalendarDays size={24} />
            </div>
            <h4 className="metric-title">Expositions</h4>
          </div>
          <div className="metric-value-container">
            {isLoadingExhibitions ? (
              <div className="metric-loading">
                <div className="metric-loading-bar"></div>
              </div>
            ) : (
              <span className="metric-value" style={{ color: '#f59e0b' }}>
                {exhibitionMetrics.total.toLocaleString('fr-FR')}
              </span>
            )}
          </div>
          {!isLoadingExhibitions && (
            <div className="dashboard-small-text">
              {exhibitionMetrics.ongoing > 0 && (
                <span style={{ color: '#10b981' }}>
                  {exhibitionMetrics.ongoing} en cours
                </span>
              )}
              {exhibitionMetrics.upcoming > 0 && (
                <span style={{ color: '#3b82f6', marginLeft: exhibitionMetrics.ongoing > 0 ? '0.5rem' : 0 }}>
                  {exhibitionMetrics.ongoing > 0 ? '· ' : ''}{exhibitionMetrics.upcoming} à venir
                </span>
              )}
              {exhibitionMetrics.past > 0 && (
                <span style={{ color: '#6b7280', marginLeft: (exhibitionMetrics.ongoing > 0 || exhibitionMetrics.upcoming > 0) ? '0.5rem' : 0 }}>
                  {(exhibitionMetrics.ongoing > 0 || exhibitionMetrics.upcoming > 0) ? '· ' : ''}{exhibitionMetrics.past} passée{exhibitionMetrics.past > 1 ? 's' : ''}
                </span>
              )}
            </div>
          )}
          <div className="metric-card-button">
            <a href="/fr/galleryLj/exhibitions" className="btn btn-sm btn-primary">
              Voir les expositions
            </a>
          </div>
        </div>
      </div>
    </div>
  )
}
