'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { useForm } from 'react-hook-form'
import { z } from 'zod'
import { zodResolver } from '@hookform/resolvers/zod'
import Image from 'next/image'
import { GripVertical, X, Plus, Search } from 'lucide-react'
import { useToast } from '@/app/components/Toast/ToastContext'
import { upsertLandingArtistSeoAction } from '@/lib/actions/landing-artist-seo-actions'

const MAX_KEY_WORKS = 3

const seoSchema = z.object({
  seoTitle: z.string().nullable().optional(),
  stylesInfluences: z.string().nullable().optional(),
  artisticApproach: z.string().nullable().optional(),
  artitudeUrl: z.string().nullable().optional(),
  interviewUrl: z.string().nullable().optional(),
})

type SeoFormValues = z.infer<typeof seoSchema>

interface PresaleArtworkOption {
  id: number
  name: string
  imageUrl: string
  price: number | null
  width: number | null
  height: number | null
}

interface KeyWork {
  presaleArtworkId: number
  order: number
  presaleArtwork: PresaleArtworkOption
}

interface ArtistSeoFormProps {
  landingArtistId: number
  initialSeo: {
    seoTitle: string | null
    stylesInfluences: string | null
    artisticApproach: string | null
    artitudeUrl: string | null
    interviewUrl: string | null
    keyWorks: KeyWork[]
  } | null
  presaleArtworks: PresaleArtworkOption[]
}

export default function ArtistSeoForm({
  landingArtistId,
  initialSeo,
  presaleArtworks,
}: ArtistSeoFormProps) {
  const router = useRouter()
  const { success, error } = useToast()
  const [isSaving, setIsSaving] = useState(false)
  const [searchQuery, setSearchQuery] = useState('')
  const [selectedKeyWorks, setSelectedKeyWorks] = useState<PresaleArtworkOption[]>(
    () =>
      (initialSeo?.keyWorks ?? [])
        .sort((a, b) => a.order - b.order)
        .map((kw) => kw.presaleArtwork)
  )
  const [dragIndex, setDragIndex] = useState<number | null>(null)

  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<SeoFormValues>({
    resolver: zodResolver(seoSchema),
    defaultValues: {
      seoTitle: initialSeo?.seoTitle ?? '',
      stylesInfluences: initialSeo?.stylesInfluences ?? '',
      artisticApproach: initialSeo?.artisticApproach ?? '',
      artitudeUrl: initialSeo?.artitudeUrl ?? '',
      interviewUrl: initialSeo?.interviewUrl ?? '',
    },
  })

  // --- KeyWorks helpers ---

  const selectedIds = new Set(selectedKeyWorks.map((kw) => kw.id))

  const filteredArtworks = presaleArtworks.filter(
    (a) =>
      !selectedIds.has(a.id) &&
      a.name.toLowerCase().includes(searchQuery.toLowerCase())
  )

  const addKeyWork = (artwork: PresaleArtworkOption) => {
    if (selectedKeyWorks.length >= MAX_KEY_WORKS) return
    setSelectedKeyWorks((prev) => [...prev, artwork])
  }

  const removeKeyWork = (id: number) => {
    setSelectedKeyWorks((prev) => prev.filter((kw) => kw.id !== id))
  }

  // Drag & drop pour réordonner
  const handleDragStart = (index: number) => setDragIndex(index)

  const handleDragOver = (e: React.DragEvent, index: number) => {
    e.preventDefault()
    if (dragIndex === null || dragIndex === index) return
    const updated = [...selectedKeyWorks]
    const [moved] = updated.splice(dragIndex, 1)
    updated.splice(index, 0, moved)
    setSelectedKeyWorks(updated)
    setDragIndex(index)
  }

  const handleDragEnd = () => setDragIndex(null)

  // --- Submit ---

  const onSubmit = async (data: SeoFormValues) => {
    setIsSaving(true)
    try {
      const result = await upsertLandingArtistSeoAction(landingArtistId, {
        seoTitle: data.seoTitle || null,
        stylesInfluences: data.stylesInfluences || null,
        artisticApproach: data.artisticApproach || null,
        artitudeUrl: data.artitudeUrl || null,
        interviewUrl: data.interviewUrl || null,
        keyWorkIds: selectedKeyWorks.map((kw) => kw.id),
      })

      if (result.success) {
        success('Données SEO enregistrées')
      } else {
        error(result.message ?? 'Erreur lors de la sauvegarde')
      }
    } catch (err) {
      error('Une erreur inattendue est survenue')
    } finally {
      setIsSaving(false)
    }
  }

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="mt-lg">
      {/* ── Section SEO ─────────────────────────────────────────── */}
      <div className="form-section">
        <h2 className="section-title flex items-center gap-2">
          <span className="w-1 h-6 bg-primary rounded-full inline-block" />
          SEO &amp; Référencement
        </h2>
        <p className="section-subtitle">
          Données utilisées pour le référencement naturel de la page artiste
        </p>

        <div className="form-group mt-md">
          <label htmlFor="seoTitle" className="form-label">
            Titre SEO (H1 / title)
          </label>
          <input
            id="seoTitle"
            type="text"
            {...register('seoTitle')}
            className="form-input"
            placeholder="Titre optimisé pour les moteurs de recherche"
          />
        </div>

        <div className="form-group mt-md">
          <label htmlFor="artitudeUrl" className="form-label">
            Lien Artitude
          </label>
          <input
            id="artitudeUrl"
            type="text"
            {...register('artitudeUrl')}
            className="form-input"
            placeholder="https://artitude.fr/artiste/…"
          />
        </div>

        <div className="form-group mt-md">
          <label htmlFor="interviewUrl" className="form-label">
            URL de l'interview
          </label>
          <input
            id="interviewUrl"
            type="text"
            {...register('interviewUrl')}
            className="form-input"
            placeholder="https://…"
          />
          <p className="form-hint mt-1 text-xs text-gray-500 dark:text-gray-400">
            Indiquer l'URL absolue (ex : https://www.exemple.com/interview-artiste)
          </p>
        </div>

        <div className="d-flex gap-md mt-md" style={{ flexWrap: 'wrap' }}>
          <div className="form-group" style={{ flex: '1 1 300px' }}>
            <label htmlFor="stylesInfluences" className="form-label">
              Styles &amp; influences
            </label>
            <textarea
              id="stylesInfluences"
              {...register('stylesInfluences')}
              className="form-textarea"
              rows={5}
              placeholder="Décrire les styles artistiques, mouvements et influences…"
            />
          </div>

          <div className="form-group" style={{ flex: '1 1 300px' }}>
            <label htmlFor="artisticApproach" className="form-label">
              Démarche artistique
            </label>
            <textarea
              id="artisticApproach"
              {...register('artisticApproach')}
              className="form-textarea"
              rows={5}
              placeholder="Décrire la démarche, la vision et l'univers de l'artiste…"
            />
          </div>
        </div>
      </div>

      {/* ── Œuvres phares ───────────────────────────────────────── */}
      <div className="form-section mt-lg">
        <h2 className="section-title flex items-center gap-2">
          <span className="w-1 h-6 bg-primary rounded-full inline-block" />
          Œuvres phares
          <span className="badge badge-neutral ml-2 text-sm font-normal">
            {selectedKeyWorks.length} / {MAX_KEY_WORKS}
          </span>
        </h2>
        <p className="section-subtitle">
          Sélectionnez jusqu'à {MAX_KEY_WORKS} œuvres à mettre en avant sur la page de l'artiste.
          Glissez-déposez pour réordonner.
        </p>

        {/* Liste des œuvres sélectionnées */}
        {selectedKeyWorks.length > 0 ? (
          <div className="mt-md d-flex flex-column gap-sm">
            {selectedKeyWorks.map((kw, index) => (
              <div
                key={kw.id}
                draggable
                onDragStart={() => handleDragStart(index)}
                onDragOver={(e) => handleDragOver(e, index)}
                onDragEnd={handleDragEnd}
                className={`d-flex align-items-center gap-md p-sm rounded-lg border transition-all cursor-grab ${
                  dragIndex === index
                    ? 'border-primary bg-primary/5 shadow-md scale-[1.01]'
                    : 'border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 hover:border-primary/40 hover:shadow-sm'
                }`}
                style={{ userSelect: 'none' }}
              >
                {/* Drag handle */}
                <div className="text-gray-400 flex-shrink-0">
                  <GripVertical size={18} />
                </div>

                {/* Numéro d'ordre */}
                <div
                  className="flex-shrink-0 w-7 h-7 rounded-full bg-primary text-white flex items-center justify-center text-sm font-semibold"
                  style={{ minWidth: 28 }}
                >
                  {index + 1}
                </div>

                {/* Vignette */}
                <div
                  className="relative flex-shrink-0 rounded overflow-hidden border border-gray-200 dark:border-gray-700"
                  style={{ width: 56, height: 56 }}
                >
                  <Image
                    src={kw.imageUrl}
                    alt={kw.name}
                    fill
                    style={{ objectFit: 'cover' }}
                    sizes="56px"
                  />
                </div>

                {/* Infos */}
                <div className="flex-1 min-w-0">
                  <p className="font-medium text-sm text-gray-900 dark:text-gray-100 truncate">
                    {kw.name}
                  </p>
                  {(kw.width || kw.height || kw.price) && (
                    <p className="text-xs text-gray-500 dark:text-gray-400 mt-0.5">
                      {kw.width && kw.height ? `${kw.width} × ${kw.height} cm` : ''}
                      {kw.width && kw.height && kw.price ? ' · ' : ''}
                      {kw.price ? `${kw.price.toLocaleString('fr-FR')} €` : ''}
                    </p>
                  )}
                </div>

                {/* Supprimer */}
                <button
                  type="button"
                  onClick={() => removeKeyWork(kw.id)}
                  className="flex-shrink-0 p-1 rounded-full text-gray-400 hover:text-red-500 hover:bg-red-50 dark:hover:bg-red-900/20 transition-colors"
                  aria-label={`Retirer ${kw.name}`}
                >
                  <X size={16} />
                </button>
              </div>
            ))}
          </div>
        ) : (
          <div className="mt-md p-lg text-center rounded-lg border-2 border-dashed border-gray-200 dark:border-gray-700 text-gray-400 dark:text-gray-500">
            Aucune œuvre sélectionnée — choisissez ci-dessous
          </div>
        )}

        {/* Picker d'œuvres */}
        {selectedKeyWorks.length < MAX_KEY_WORKS && (
          <div className="mt-md">
            <div className="d-flex align-items-center gap-sm mb-sm">
              <span className="form-label mb-0">
                Ajouter une œuvre
              </span>
              <span className="text-xs text-gray-500 dark:text-gray-400">
                ({presaleArtworks.length} disponible{presaleArtworks.length !== 1 ? 's' : ''})
              </span>
            </div>

            {/* Recherche */}
            <div className="relative mb-sm">
              <Search
                size={14}
                className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400"
              />
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="form-input pl-8"
                placeholder="Rechercher une œuvre…"
              />
            </div>

            {filteredArtworks.length === 0 ? (
              <p className="text-sm text-gray-400 dark:text-gray-500 text-center py-4">
                {searchQuery
                  ? 'Aucune œuvre ne correspond à votre recherche'
                  : 'Aucune œuvre disponible pour cet artiste'}
              </p>
            ) : (
              <div
                className="d-flex flex-column gap-xs overflow-auto rounded-lg border border-gray-200 dark:border-gray-700"
                style={{ maxHeight: 280 }}
              >
                {filteredArtworks.map((artwork) => (
                  <button
                    key={artwork.id}
                    type="button"
                    onClick={() => addKeyWork(artwork)}
                    className="d-flex align-items-center gap-md p-sm text-left hover:bg-primary/5 dark:hover:bg-primary/10 transition-colors border-b border-gray-100 dark:border-gray-700 last:border-b-0 group"
                  >
                    {/* Vignette */}
                    <div
                      className="relative flex-shrink-0 rounded overflow-hidden border border-gray-200 dark:border-gray-700"
                      style={{ width: 44, height: 44 }}
                    >
                      <Image
                        src={artwork.imageUrl}
                        alt={artwork.name}
                        fill
                        style={{ objectFit: 'cover' }}
                        sizes="44px"
                      />
                    </div>

                    {/* Infos */}
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium text-gray-800 dark:text-gray-200 truncate group-hover:text-primary transition-colors">
                        {artwork.name}
                      </p>
                      {(artwork.width || artwork.height || artwork.price) && (
                        <p className="text-xs text-gray-500 dark:text-gray-400">
                          {artwork.width && artwork.height
                            ? `${artwork.width} × ${artwork.height} cm`
                            : ''}
                          {artwork.width && artwork.height && artwork.price ? ' · ' : ''}
                          {artwork.price
                            ? `${artwork.price.toLocaleString('fr-FR')} €`
                            : ''}
                        </p>
                      )}
                    </div>

                    {/* Icône d'ajout */}
                    <Plus
                      size={16}
                      className="flex-shrink-0 text-gray-300 group-hover:text-primary transition-colors"
                    />
                  </button>
                ))}
              </div>
            )}
          </div>
        )}
      </div>

      {/* ── Footer ──────────────────────────────────────────────── */}
      <div className="card-footer mt-lg">
        <div className="d-flex justify-content-end gap-sm">
          <button
            type="button"
            className="btn btn-ghost btn-medium"
            onClick={() => router.push('/landing/landingArtists')}
            disabled={isSaving}
          >
            Annuler
          </button>
          <button
            type="submit"
            className="btn btn-primary btn-medium"
            disabled={isSaving}
          >
            {isSaving ? 'Enregistrement…' : 'Enregistrer le SEO'}
          </button>
        </div>
      </div>
    </form>
  )
}
