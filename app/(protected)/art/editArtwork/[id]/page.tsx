'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { useDynamicContext } from '@dynamic-labs/sdk-react-core'
import LoadingSpinner from '@/app/components/LoadingSpinner/LoadingSpinner'
import ArtworkForm from '@/app/(protected)/art/components/ArtworkForm'
import { getAuthCertificateByItemId, getItemById } from '@/lib/actions/prisma-actions'
import toast, { Toaster } from 'react-hot-toast'
import { use } from 'react'
import styles from './editArtwork.module.scss'
import { normalizeString } from '@/lib/utils'

export default function EditArtworkPage({ params }: { params: Promise<{ id: string }> }) {
  // Utiliser React.use pour extraire les paramètres de la promesse
  const resolvedParams = use(params)
  const router = useRouter()
  const { user } = useDynamicContext()
  const [isLoading, setIsLoading] = useState(true)
  const [item, setItem] = useState<any>(null)
  const [error, setError] = useState<string | null>(null)
  const [certificate, setCertificate] = useState<any>(null)

  useEffect(() => {
    if (!user?.email) {
      setError('Vous devez être connecté pour éditer une œuvre')
      setIsLoading(false)
      return
    }

    let isMounted = true

    const fetchItem = async () => {
      try {
        const itemId = parseInt(resolvedParams.id)

        if (isNaN(itemId)) {
          throw new Error('ID d\'item invalide')
        }

        // Récupérer l'item par son ID
        const itemData = await getItemById(itemId)

        if (isMounted) {
          if (itemData) {
            setItem(itemData)

            // Vérifier les valeurs reçues
            console.log('Item chargé pour l\'édition:', {
              id: itemData.id,
              name: itemData.name, // Titre de l'oeuvre
              description: itemData.description, // Description de l'oeuvre
              mainImageUrl: itemData.mainImageUrl,
              secondaryImagesUrl: itemData.secondaryImagesUrl,
              // Afficher l'objet complet pour debugging
              itemComplet: itemData
            })

            try {
              // Rechercher le certificat d'authenticité associé
              const certificateResult = await getAuthCertificateByItemId(itemData.id)
              if (certificateResult && certificateResult.id) {
                setCertificate(certificateResult)
              }
            } catch (certError) {
              console.error('Erreur lors de la récupération du certificat:', certError)
            }
          } else {
            setError('Œuvre introuvable')
          }
          setIsLoading(false)
        }
      } catch (error: any) {
        console.error('Erreur lors du chargement de l\'œuvre:', error)
        if (isMounted) {
          setError(error.message || 'Une erreur est survenue')
          setIsLoading(false)
        }
      }
    }

    fetchItem()

    return () => {
      isMounted = false
    }
  }, [resolvedParams.id, user?.email])

  const handleSuccess = () => {
    router.push('/art/ection')
  }

  return (
    <>
      <div className={styles.container}>
        <h1 className={styles.pageTitle}>Éditer l'œuvre</h1>

        {isLoading ? (
          <LoadingSpinner message="Chargement de l'œuvre..." />
        ) : error ? (
          <div className={styles.error}>{error}</div>
        ) : (
          <ArtworkForm
            mode="edit"
            initialData={{
              id: item.id,
              title: item.name,
              description: item.description,
              price: item.price,
              metaTitle: item.metaTitle,
              metaDescription: item.metaDescription,
              medium: item.artworkSupport,
              width: item.width?.toString(),
              height: item.height?.toString(),
              weight: item.weight?.toString(),
              year: item.year?.toString(),
              creationYear: item.creationYear?.toString(),
              intellectualProperty: item.intellectualProperty,
              intellectualPropertyEndDate: item.intellectualPropertyEndDate
                ? new Date(item.intellectualPropertyEndDate).toISOString().split('T')[0]
                : undefined,
              imageUrl: item.mainImageUrl,
              hasPhysicalOnly: item.pricePhysicalBeforeTax > 0,
              hasNftOnly: item.priceNftBeforeTax > 0,
              hasNftPlusPhysical: item.priceNftPlusPhysicalBeforeTax > 0,
              pricePhysicalBeforeTax: item.pricePhysicalBeforeTax?.toString(),
              priceNftBeforeTax: item.priceNftBeforeTax?.toString(),
              priceNftPlusPhysicalBeforeTax: item.priceNftPlusPhysicalBeforeTax?.toString(),
              slug: item.name ? normalizeString(item.name) : '',
              certificateUrl: certificate?.fileUrl,
              secondaryImagesUrl: item.secondaryImagesUrl || []
            }}
            onSuccess={handleSuccess}
          />
        )}
      </div>
    </>
  )
} 