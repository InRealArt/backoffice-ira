'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { useToast } from '@/app/components/Toast/ToastContext' 
import Image from 'next/image'
import { z } from 'zod'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { X, Plus } from 'lucide-react'
import { updateLandingArtistAction } from '@/lib/actions/landing-artist-actions'
import TranslationField from '@/app/components/TranslationField'
import { handleEntityTranslations } from '@/lib/actions/translation-actions'
import { generateSlug } from '@/lib/utils'
import CountrySelect from '@/app/components/Common/CountrySelect'
import MediumMultiSelect from '@/app/components/Common/MediumMultiSelect'
import CategoryMultiSelect from '@/app/components/Common/CategoryMultiSelect'
import type { ArtistCategory } from '@prisma/client'

// Schéma de validation
const formSchema = z.object({
  intro: z.string().nullable().optional(),
  description: z.string().nullable().optional(),
  artworkStyle: z.string().nullable().optional(),
  artistsPage: z.boolean().default(false),
  imageUrl: z.string().url('URL d\'image invalide'),
  secondaryImageUrl: z.string().refine(
    val => val === '' || /^https?:\/\//.test(val),
    { message: 'URL d\'image secondaire invalide' }
  ).optional().transform(val => val === '' ? null : val),
  countryCode: z.string().optional().refine(
    val => val === undefined || val === '' || /^[A-Za-z]{2}$/.test(val),
    { message: 'Code pays (ISO 3166-1 alpha-2) invalide' }
  ),
  birthYear: z.string().optional()
    .transform(v => (v || '').trim())
    .refine(v => v === '' || /^\d{4}$/.test(v), { message: 'Année invalide (YYYY)' }),
  websiteUrl: z.string().refine(
    val => val === '' || /^https?:\/\//.test(val),
    { message: 'URL invalide' }
  ).optional().transform(val => val === '' ? null : val),
  facebookUrl: z.string().refine(
    val => val === '' || /^https?:\/\//.test(val),
    { message: 'URL Facebook invalide' }
  ).optional().transform(val => val === '' ? null : val),
  instagramUrl: z.string().refine(
    val => val === '' || /^https?:\/\//.test(val),
    { message: 'URL Instagram invalide' }
  ).optional().transform(val => val === '' ? null : val),
  twitterUrl: z.string().refine(
    val => val === '' || /^https?:\/\//.test(val),
    { message: 'URL Twitter invalide' }
  ).optional().transform(val => val === '' ? null : val),
  linkedinUrl: z.string().refine(
    val => val === '' || /^https?:\/\//.test(val),
    { message: 'URL LinkedIn invalide' }
  ).optional().transform(val => val === '' ? null : val),
  slug: z.string().optional(),
  mediumTags: z.array(z.string()).default([]),
  quoteFromInRealArt: z.string().optional(),
  biographyHeader1: z.string().optional(),
  biographyText1: z.string().optional(),
  biographyHeader2: z.string().optional(),
  biographyText2: z.string().optional(),
  biographyHeader3: z.string().optional(),
  biographyText3: z.string().optional(),
  biographyHeader4: z.string().optional(),
  biographyText4: z.string().optional(),
})

type FormValues = z.infer<typeof formSchema>

interface LandingArtistWithArtist {
  id: number
  intro: string | null
  description: string | null
  artworkImages: any
  artworkStyle: string | null
  artistsPage: boolean | null
  imageUrl: string
  secondaryImageUrl?: string | null
  artistId: number
  artistCategories?: { categoryId: number }[]
    quoteFromInRealArt?: string | null
    biographyHeader1?: string | null
    biographyText1?: string | null
    biographyHeader2?: string | null
    biographyText2?: string | null
    biographyHeader3?: string | null
    biographyText3?: string | null
    biographyHeader4?: string | null
    biographyText4?: string | null
    mediumTags?: string[]
  artist: {
    id: number
    name: string
    surname: string
    pseudo: string
    websiteUrl: string | null
    facebookUrl: string | null
    instagramUrl: string | null
    twitterUrl: string | null
    linkedinUrl: string | null
    countryCode?: string | null
    birthYear?: number | null
  }
  slug?: string
}

interface CountryOption { code: string, name: string }

interface LandingArtistEditFormProps {
  landingArtist: LandingArtistWithArtist
  countries: CountryOption[]
  mediums: string[]
  categories: ArtistCategory[]
}

export default function LandingArtistEditForm({ landingArtist, countries, mediums, categories }: LandingArtistEditFormProps) {
  const router = useRouter()
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [artworkImages, setArtworkImages] = useState<{name: string, url: string}[]>(() => {
    // Parse le champ artworkImages qui peut être une chaîne JSON ou un tableau
    if (!landingArtist.artworkImages) {
      return [];
    }
    
    if (typeof landingArtist.artworkImages === 'string') {
      try {
        const parsed = JSON.parse(landingArtist.artworkImages);
        // Conversion d'anciens formats (simples URLs) vers le nouveau format {name, url}
        if (Array.isArray(parsed)) {
          return parsed.map(item => {
            if (typeof item === 'string') {
              return { name: '', url: item };
            } else if (typeof item === 'object' && item.url) {
              return item;
            }
            return { name: '', url: '' };
          });
        }
        return [];
      } catch (e) {
        console.error("Erreur lors du parsing des images:", e);
        return [];
      }
    }
    
    // Si c'est déjà un tableau (cast depuis any)
    const images = landingArtist.artworkImages as any[];
    return images.map(item => {
      if (typeof item === 'string') {
        return { name: '', url: item };
      } else if (typeof item === 'object' && item.url) {
        return item;
      }
      return { name: '', url: '' };
    });
  })
  const [newImageUrl, setNewImageUrl] = useState('')
  const [newImageName, setNewImageName] = useState('')
  const [slug, setSlug] = useState('')
  const { success, error } = useToast()
  const {
    register,
    handleSubmit,
    watch,
    setValue,
    formState: { errors }
  } = useForm<FormValues>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      intro: landingArtist.intro || '',
      description: landingArtist.description || '',
      artworkStyle: landingArtist.artworkStyle || '',
      artistsPage: landingArtist.artistsPage || false,
      imageUrl: landingArtist.imageUrl,
      secondaryImageUrl: landingArtist.secondaryImageUrl || '',
      countryCode: landingArtist.artist.countryCode || '',
      birthYear: landingArtist.artist.birthYear ? String(landingArtist.artist.birthYear) : '',
      websiteUrl: landingArtist.artist.websiteUrl || '',
      facebookUrl: landingArtist.artist.facebookUrl || '',
      instagramUrl: landingArtist.artist.instagramUrl || '',
      twitterUrl: landingArtist.artist.twitterUrl || '',
      linkedinUrl: landingArtist.artist.linkedinUrl || '',
      slug: landingArtist.slug || '',
      mediumTags: landingArtist.mediumTags || [],
      quoteFromInRealArt: landingArtist.quoteFromInRealArt || '',
      biographyHeader1: landingArtist.biographyHeader1 || '',
      biographyText1: landingArtist.biographyText1 || '',
      biographyHeader2: landingArtist.biographyHeader2 || '',
      biographyText2: landingArtist.biographyText2 || '',
      biographyHeader3: landingArtist.biographyHeader3 || '',
      biographyText3: landingArtist.biographyText3 || '',
      biographyHeader4: landingArtist.biographyHeader4 || '',
      biographyText4: landingArtist.biographyText4 || '',
    }
  })

  const imageUrl = watch('imageUrl')
  const secondaryImageUrl = watch('secondaryImageUrl')
  const artistsPage = watch('artistsPage')
  const mediumTags = watch('mediumTags')
  const [categoryIds, setCategoryIds] = useState<number[]>(
    Array.isArray(landingArtist.artistCategories)
      ? (landingArtist.artistCategories as { categoryId: number }[]).map(c => c.categoryId)
      : []
  )
  
  useEffect(() => {
    // Générer le slug à partir des informations de l'artiste
    const generatedSlug = generateSlug(landingArtist.artist.name + ' ' + landingArtist.artist.surname)
    setSlug(generatedSlug)
    setValue('slug', generatedSlug)
  }, [landingArtist.artist.name, landingArtist.artist.surname, setValue])

  const onSubmit = async (data: FormValues) => {
    setIsSubmitting(true)
    
    try {
      // Transformer undefined en null pour intro et artworkStyle
      const formattedData = {
        ...data,
        intro: data.intro || null,
        description: data.description || null,
        mediumTags: Array.isArray(data.mediumTags) ? data.mediumTags : [],
        slug: data.slug || slug,
        quoteFromInRealArt: (data.quoteFromInRealArt ?? '').trim() === '' ? null : (data.quoteFromInRealArt ?? '').trim(),
        biographyHeader1: (data.biographyHeader1 ?? '').trim() === '' ? null : (data.biographyHeader1 ?? '').trim(),
        biographyText1: (data.biographyText1 ?? '').trim() === '' ? null : (data.biographyText1 ?? '').trim(),
        biographyHeader2: (data.biographyHeader2 ?? '').trim() === '' ? null : (data.biographyHeader2 ?? '').trim(),
        biographyText2: (data.biographyText2 ?? '').trim() === '' ? null : (data.biographyText2 ?? '').trim(),
        biographyHeader3: (data.biographyHeader3 ?? '').trim() === '' ? null : (data.biographyHeader3 ?? '').trim(),
        biographyText3: (data.biographyText3 ?? '').trim() === '' ? null : (data.biographyText3 ?? '').trim(),
        biographyHeader4: (data.biographyHeader4 ?? '').trim() === '' ? null : (data.biographyHeader4 ?? '').trim(),
        biographyText4: (data.biographyText4 ?? '').trim() === '' ? null : (data.biographyText4 ?? '').trim(),
      }
      
      // Préparer les données d'artworkImages pour le format attendu par l'API
      const landingArtistDataWithImages = {
        ...formattedData,
        artworkImages: JSON.stringify(artworkImages)
      }
      
      // Appel à la server action pour mettre à jour l'artiste
      const result = await updateLandingArtistAction(landingArtist.id, { ...landingArtistDataWithImages, categoryIds })
      
      if (result.success) {
        success('Artiste mis à jour avec succès')
        
        // Gestion des traductions pour intro, description et style artistique
        try {
          await handleEntityTranslations('LandingArtist', landingArtist.id, {
            intro: data.intro || null,
            description: data.description || null,
            artworkStyle: data.artworkStyle || null
          })
        } catch (translationError) {
          console.error('Erreur lors de la gestion des traductions LandingArtist:', translationError)
          // On ne bloque pas la mise à jour en cas d'erreur de traduction
        }

        // Gestion des traductions pour les champs de citations et biographies (LandingArtist)
        try {
          await handleEntityTranslations('LandingArtist', landingArtist.id, {
            quoteFromInRealArt: data.quoteFromInRealArt || null,
            biographyHeader1: data.biographyHeader1 || null,
            biographyText1: data.biographyText1 || null,
            biographyHeader2: data.biographyHeader2 || null,
            biographyText2: data.biographyText2 || null,
            biographyHeader3: data.biographyHeader3 || null,
            biographyText3: data.biographyText3 || null,
            biographyHeader4: data.biographyHeader4 || null,
            biographyText4: data.biographyText4 || null
          })
        } catch (translationError) {
          console.error('Erreur lors de la gestion des traductions LandingArtist:', translationError)
          // On ne bloque pas la mise à jour en cas d'erreur de traduction
        }
        
        // Rediriger après 1 seconde
        setTimeout(() => {
          router.push('/landing/landingArtists')
          router.refresh()
        }, 1000)
      } else {
        error(result.message || 'Une erreur est survenue')
      }
    } catch (error: any) {
      error('Une erreur est survenue lors de la mise à jour')
      console.error(error)
    } finally {
      setIsSubmitting(false)
    }
  }
  
  const handleCancel = () => {
    router.push('/landing/landingArtists')
  }
  
  const handleAddImage = () => {
    if (newImageUrl.trim() === '') return;
    
    // Ajouter la nouvelle image à la liste
    setArtworkImages([...artworkImages, { name: newImageName, url: newImageUrl }]);
    
    // Réinitialiser les champs
    setNewImageUrl('');
    setNewImageName('');
  }
  
  const handleRemoveImage = (index: number) => {
    const updatedImages = [...artworkImages];
    updatedImages.splice(index, 1);
    setArtworkImages(updatedImages);
  }

  return (
    <div className="page-container">
      <div className="page-header">
        <div className="header-top-section">
          <h1 className="page-title">Modifier l'artiste de la landing page</h1>
        </div>
        <p className="page-subtitle">
          Modifier les informations de {landingArtist.artist.name} {landingArtist.artist.surname} pour le site corpo et la marketplace
        </p>
      </div>

      <form onSubmit={handleSubmit(onSubmit)} className="form-container">
        <div className="form-card">
          <div className="card-content">
            
            
            <div className="form-section mt-lg">
              <h2 className="section-title">Catégorie, Images & description</h2>
              <div className="form-group mb-lg">
                <label htmlFor="slug" className="form-label">Slug (Généré automatiquement à partir du nom de l'artiste)</label>
                <input
                  id="slug"
                  type="text"
                  value={slug}
                  readOnly
                  className="form-input"
                  style={{ backgroundColor: '#f9f9f9' }}
                />
                
              </div>
              <div className="d-flex gap-lg">
                <div className="d-flex flex-column gap-md" style={{ width: '200px' }}>
                  <div>
                    <label className="form-label" style={{ marginBottom: '8px' }}>Image principale</label>
                    {imageUrl ? (
                      <div style={{ position: 'relative', width: '200px', height: '200px', borderRadius: '8px', overflow: 'hidden' }}>
                        <Image
                          src={imageUrl}
                          alt={`${landingArtist.artist.name} ${landingArtist.artist.surname}`}
                          fill
                          style={{ objectFit: 'cover' }}
                        />
                      </div>
                    ) : (
                      <div style={{ width: '200px', height: '200px', borderRadius: '8px', backgroundColor: '#e0e0e0', color: '#666', display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: '600', fontSize: '1.5rem' }}>
                        {landingArtist.artist.name.charAt(0)}{landingArtist.artist.surname.charAt(0)}
                      </div>
                    )}
                    <div className="form-group" style={{ marginTop: '8px' }}>
                      <label htmlFor="imageUrl" className="form-label">URL de l'image</label>
                      <input
                        id="imageUrl"
                        type="text"
                        {...register('imageUrl')}
                        className={`form-input ${errors.imageUrl ? 'input-error' : ''}`}
                        placeholder="https://example.com/image.jpg"
                      />
                      {errors.imageUrl && (
                        <p className="form-error">{errors.imageUrl.message}</p>
                      )}
                    </div>
                  </div>
                  
                  <div>
                    <label className="form-label" style={{ marginBottom: '8px' }}>Image secondaire</label>
                    {secondaryImageUrl ? (
                      <div style={{ position: 'relative', width: '200px', height: '200px', borderRadius: '8px', overflow: 'hidden' }}>
                        <Image
                          src={secondaryImageUrl}
                          alt={`${landingArtist.artist.name} ${landingArtist.artist.surname} - Image secondaire`}
                          fill
                          style={{ objectFit: 'cover' }}
                        />
                      </div>
                    ) : (
                      <div style={{ width: '200px', height: '200px', borderRadius: '8px', backgroundColor: '#f5f5f5', color: '#999', display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: '500', fontSize: '0.9rem', border: '2px dashed #ddd' }}>
                        Aucune image secondaire
                      </div>
                    )}
                    <div className="form-group" style={{ marginTop: '8px' }}>
                      <label htmlFor="secondaryImageUrl" className="form-label">URL de l'image secondaire (optionnel)</label>
                      <input
                        id="secondaryImageUrl"
                        type="text"
                        {...register('secondaryImageUrl')}
                        className={`form-input ${errors.secondaryImageUrl ? 'input-error' : ''}`}
                        placeholder="https://example.com/secondary-image.jpg"
                      />
                      {errors.secondaryImageUrl && (
                        <p className="form-error">{errors.secondaryImageUrl.message}</p>
                      )}
                    </div>
                  </div>
                </div>
                
                <div style={{ flex: 1 }}>
                  <div className="form-group">
                    <label className="form-label">Catégories</label>
                    <CategoryMultiSelect
                      options={categories.map(c => ({ id: c.id, name: c.name }))}
                      selected={categoryIds}
                      onChange={setCategoryIds}
                    />
                  </div>
                  <div className="form-group">
                    <label className="form-label">Supports/Mediums</label>
                    <MediumMultiSelect
                      options={mediums}
                      selected={mediumTags}
                      onChange={(values) => setValue('mediumTags', values, { shouldValidate: true })}
                    />
                  </div>
                  <div className="form-group">
                    <div className="d-flex align-items-center gap-md" style={{ marginBottom: '20px' }}>
                      <span className={!artistsPage ? 'text-primary' : 'text-muted'} style={{ fontWeight: !artistsPage ? 'bold' : 'normal' }}>Non affiché</span>
                      <label className="d-flex align-items-center" style={{ position: 'relative', display: 'inline-block', width: '60px', height: '30px' }}>
                        <input
                          type="checkbox"
                          {...register('artistsPage')}
                          style={{ opacity: 0, width: 0, height: 0 }}
                        />
                        <span style={{ position: 'absolute', cursor: 'pointer', top: 0, left: 0, right: 0, bottom: 0, backgroundColor: artistsPage ? '#4f46e5' : '#ccc', borderRadius: '34px', transition: '0.4s' }}>
                          <span style={{ position: 'absolute', content: '""', height: '22px', width: '22px', left: '4px', bottom: '4px', backgroundColor: 'white', borderRadius: '50%', transition: '0.4s', transform: artistsPage ? 'translateX(30px)' : 'translateX(0)' }}></span>
                        </span>
                      </label>
                      <span className={artistsPage ? 'text-primary' : 'text-muted'} style={{ fontWeight: artistsPage ? 'bold' : 'normal' }}>Affiché</span>
                    </div>
                  </div>
                  
                  <TranslationField
                    entityType="LandingArtist"
                    entityId={landingArtist.id}
                    field="intro"
                    label="Introduction"
                    errorMessage={errors.intro?.message}
                  >
                    <textarea
                      id="intro"
                      {...register('intro')}
                      className={`form-textarea ${errors.intro ? 'input-error' : ''}`}
                      rows={3}
                      placeholder="Courte introduction de l'artiste qui sera affichée sur la page d'accueil"
                    />
                  </TranslationField>
                  
                  <TranslationField
                    entityType="LandingArtist"
                    entityId={landingArtist.id}
                    field="description"
                    label="Description"
                    errorMessage={errors.description?.message}
                  >
                    <textarea
                      id="description"
                      {...register('description')}
                      className={`form-textarea ${errors.description ? 'input-error' : ''}`}
                      rows={5}
                      placeholder="Description complète de l'artiste"
                    />
                  </TranslationField>
                  
                  <TranslationField
                    entityType="LandingArtist"
                    entityId={landingArtist.id}
                    field="artworkStyle"
                    label="Style artistique"
                    errorMessage={errors.artworkStyle?.message}
                  >
                    <input
                      id="artworkStyle"
                      type="text"
                      {...register('artworkStyle')}
                      className={`form-input ${errors.artworkStyle ? 'input-error' : ''}`}
                      placeholder="Style artistique (ex: Peinture contemporaine, Photographie, etc.)"
                    />
                  </TranslationField>
                </div>
              </div>
            </div>

            <div className="form-section mt-lg">
              <h2 className="section-title">Citations et Biographies</h2>
              <TranslationField
                entityType="LandingArtist"
                entityId={landingArtist.id}
                field="quoteFromInRealArt"
                label="Mots d'InRealArt sur l'artiste"
              >
                <input
                  id="quoteFromInRealArt"
                  type="text"
                  {...register('quoteFromInRealArt')}
                  className="form-input"
                  placeholder="Citation courte affichée sur la page"
                />
              </TranslationField>
              <div className="d-flex gap-md mt-md">
                <div style={{ flex: 1 }}>
                  <TranslationField
                    entityType="LandingArtist"
                    entityId={landingArtist.id}
                    field="biographyHeader1"
                    label="Biographie section 1 - Titre"
                  >
                    <input
                      id="biographyHeader1"
                      type="text"
                      {...register('biographyHeader1')}
                      className="form-input"
                      placeholder="Titre section 1"
                    />
                  </TranslationField>
                </div>
                <div style={{ flex: 1 }}>
                  <TranslationField
                    entityType="LandingArtist"
                    entityId={landingArtist.id}
                    field="biographyText1"
                    label="Biographie section 1 - Texte"
                  >
                    <textarea
                      id="biographyText1"
                      {...register('biographyText1')}
                      className="form-textarea"
                      rows={4}
                      placeholder="Texte section 1"
                    />
                  </TranslationField>
                </div>
              </div>
              <div className="d-flex gap-md mt-md">
                <div style={{ flex: 1 }}>
                  <TranslationField
                    entityType="LandingArtist"
                    entityId={landingArtist.id}
                    field="biographyHeader2"
                    label="Biographie section 2 - Titre"
                  >
                    <input
                      id="biographyHeader2"
                      type="text"
                      {...register('biographyHeader2')}
                      className="form-input"
                      placeholder="Titre section 2"
                    />
                  </TranslationField>
                </div>
                <div style={{ flex: 1 }}>
                  <TranslationField
                    entityType="LandingArtist"
                    entityId={landingArtist.id}
                    field="biographyText2"
                    label="Biographie section 2 - Texte"
                  >
                    <textarea
                      id="biographyText2"
                      {...register('biographyText2')}
                      className="form-textarea"
                      rows={4}
                      placeholder="Texte section 2"
                    />
                  </TranslationField>
                </div>
              </div>
              <div className="d-flex gap-md mt-md">
                <div style={{ flex: 1 }}>
                  <TranslationField
                    entityType="LandingArtist"
                    entityId={landingArtist.id}
                    field="biographyHeader3"
                    label="Biographie section 3 - Titre"
                  >
                    <input
                      id="biographyHeader3"
                      type="text"
                      {...register('biographyHeader3')}
                      className="form-input"
                      placeholder="Titre section 3"
                    />
                  </TranslationField>
                </div>
                <div style={{ flex: 1 }}>
                  <TranslationField
                    entityType="LandingArtist"
                    entityId={landingArtist.id}
                    field="biographyText3"
                    label="Biographie section 3 - Texte"
                  >
                    <textarea
                      id="biographyText3"
                      {...register('biographyText3')}
                      className="form-textarea"
                      rows={4}
                      placeholder="Texte section 3"
                    />
                  </TranslationField>
                </div>
              </div>
              <div className="d-flex gap-md mt-md">
                <div style={{ flex: 1 }}>
                  <TranslationField
                    entityType="LandingArtist"
                    entityId={landingArtist.id}
                    field="biographyHeader4"
                    label="Biographie section 4 - Titre"
                  >
                    <input
                      id="biographyHeader4"
                      type="text"
                      {...register('biographyHeader4')}
                      className="form-input"
                      placeholder="Titre section 4"
                    />
                  </TranslationField>
                </div>
                <div style={{ flex: 1 }}>
                  <TranslationField
                    entityType="LandingArtist"
                    entityId={landingArtist.id}
                    field="biographyText4"
                    label="Biographie section 4 - Texte"
                  >
                    <textarea
                      id="biographyText4"
                      {...register('biographyText4')}
                      className="form-textarea"
                      rows={4}
                      placeholder="Texte section 4"
                    />
                  </TranslationField>
                </div>
              </div>
            </div>
            
            <div className="form-section mt-lg">
              <h2 className="section-title">Images des œuvres</h2>
              <p className="section-subtitle">Ajoutez les images des œuvres qui seront affichées sur la page d'accueil</p>
              
              <div className="form-group mt-md">
                <div className="d-flex gap-md mb-md">
                  <div style={{ flex: 2 }}>
                    <label htmlFor="newImageName" className="form-label">Nom de l'œuvre</label>
                    <input
                      id="newImageName"
                      type="text"
                      value={newImageName}
                      onChange={(e) => setNewImageName(e.target.value)}
                      className="form-input"
                      placeholder="Nom de l'œuvre (optionnel)"
                    />
                  </div>
                  <div style={{ flex: 3 }}>
                    <label htmlFor="newImageUrl" className="form-label">URL de l'image</label>
                    <div className="d-flex gap-sm">
                      <input
                        id="newImageUrl"
                        type="text"
                        value={newImageUrl}
                        onChange={(e) => setNewImageUrl(e.target.value)}
                        className="form-input"
                        placeholder="https://example.com/image.jpg"
                      />
                      <button
                        type="button"
                        onClick={handleAddImage}
                        disabled={!newImageUrl}
                        className="btn btn-primary btn-medium"
                        aria-label="Ajouter une image"
                      >
                        <Plus size={16} />
                      </button>
                    </div>
                  </div>
                </div>
                
                <div className="image-list mt-md" style={{ overflow: 'auto', maxWidth: '100%' }}>
                  {artworkImages.length === 0 ? (
                    <p className="text-muted">Aucune image ajoutée</p>
                  ) : (
                    <div className="d-flex gap-md" style={{ flexWrap: 'nowrap', paddingBottom: '10px' }}>
                      {artworkImages.map((image, index) => (
                        <div key={index} className="image-item" style={{ position: 'relative', width: '150px', flexShrink: 0 }}>
                          <div style={{ position: 'relative', width: '150px', height: '150px', borderRadius: '8px', overflow: 'hidden' }}>
                            <Image
                              src={image.url}
                              alt={image.name || `Image ${index + 1}`}
                              fill
                              style={{ objectFit: 'cover' }}
                            />
                          </div>
                          <button
                            type="button"
                            onClick={() => handleRemoveImage(index)}
                            className="btn btn-danger btn-small"
                            style={{ position: 'absolute', top: '5px', right: '5px', padding: '4px', borderRadius: '50%' }}
                            aria-label="Supprimer l'image"
                          >
                            <X size={16} />
                          </button>
                          {image.name && (
                            <p className="image-name mt-xs" style={{ fontSize: '0.9rem', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                              {image.name}
                            </p>
                          )}
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              </div>
            </div>

            
          </div>
          
          <div className="form-actions">
              <button
                type="button"
                onClick={handleCancel}
                className="btn btn-secondary btn-medium"
                disabled={isSubmitting}
              >
                Annuler
              </button>
              <button
                type="submit"
                className="btn btn-primary btn-medium"
                disabled={isSubmitting}
              >
                {isSubmitting ? 'Enregistrement...' : 'Enregistrer'}
              </button>
          </div>
        </div>
      </form>
    </div>
  )
} 