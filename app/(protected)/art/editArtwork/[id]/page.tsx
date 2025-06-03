'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { useDynamicContext } from '@dynamic-labs/sdk-react-core'
import LoadingSpinner from '@/app/components/LoadingSpinner/LoadingSpinner'
import ArtworkForm from '@/app/(protected)/art/components/ArtworkForm'
import { getAuthCertificateByItemId, getItemById, getBackofficeUserAddresses } from '@/lib/actions/prisma-actions'
import { use } from 'react'
import styles from './editArtwork.module.scss'
import { normalizeString } from '@/lib/utils'
import Button from '@/app/components/Button/Button'
import { Address } from '@/app/(protected)/art/components/ArtworkForm/types'

export default function EditArtworkPage({ params }: { params: Promise<{ id: string }> }) {
  // Utiliser React.use pour extraire les paramètres de la promesse
  const resolvedParams = use(params)
  const router = useRouter()
  const { user } = useDynamicContext()
  const [isLoading, setIsLoading] = useState(true)
  const [item, setItem] = useState<any>(null)
  const [error, setError] = useState<string | null>(null)
  const [certificate, setCertificate] = useState<any>(null)
  const [addresses, setAddresses] = useState<Address[]>([])

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

        // Récupérer l'item et les adresses en parallèle
        const [itemData, userAddresses] = await Promise.all([
          getItemById(itemId),
          getBackofficeUserAddresses(user.email!)
        ])

        if (isMounted) {
          if (itemData) {
            setItem(itemData)
            setAddresses(userAddresses)

            // Vérifier les valeurs reçues
            console.log('Item chargé pour l\'édition:', {
              id: itemData.id,
              name: itemData.name,
              description: itemData.description,
              mainImageUrl: itemData.mainImageUrl,
              secondaryImagesUrl: itemData.secondaryImagesUrl,
              // Vérifier si l'item a des relations
              hasPhysicalItem: !!itemData.physicalItem,
              hasNftItem: !!itemData.nftItem,
              // Afficher l'objet complet pour debugging
              itemComplet: itemData
            })

            try {
              if (itemData.nftItem) {
                // Rechercher le certificat d'authenticité associé au NftItem
                console.log('Recherche du certificat pour le NftItem avec id:', itemData.nftItem.id)
                const certificateResult = await getAuthCertificateByItemId(itemData.id)
                
                if (certificateResult && certificateResult.id) {
                  console.log('Certificat trouvé:', certificateResult)
                  setCertificate(certificateResult)
                } else {
                  console.log('Aucun certificat trouvé')
                }
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
    router.push('/art/collection')
  }

  return (
    <>
      <div className={styles.container}>
        <div className={styles.backButtonWrapper}>
          <Button variant='secondary' onClick={() => router.push('/art/collection')}>
            {'← Back to collection'}
          </Button>
        </div>
        <h1 className={styles.pageTitle}>Éditer l'œuvre</h1>

        {isLoading ? (
          <LoadingSpinner message="Chargement de l'œuvre..." />
        ) : error ? (
          <div className={styles.error}>{error}</div>
        ) : (
          <ArtworkForm
            mode="edit"
            addresses={addresses}
            initialData={{
              id: item.id,
              title: item.name,
              description: item.description,
              metaTitle: item.metaTitle,
              metaDescription: item.metaDescription,
              slug: item.slug || (item.name ? normalizeString(item.name) : ''),
              imageUrl: item.mainImageUrl,
              secondaryImagesUrl: item.secondaryImagesUrl || [],
              // Transmettre les données du physicalItem s'il existe
              physicalItem: item.physicalItem ? {
                id: item.physicalItem.id,
                price: item.physicalItem.price,
                initialQty: item.physicalItem.initialQty,
                stockQty: item.physicalItem.stockQty,
                height: item.physicalItem.height,
                width: item.physicalItem.width,
                weight: item.physicalItem.weight,
                creationYear: item.physicalItem.creationYear,
                artworkSupport: item.physicalItem.artworkSupport,
                status: item.physicalItem.status
              } : null,
              // Transmettre les données du nftItem s'il existe
              nftItem: item.nftItem ? {
                id: item.nftItem.id,
                price: item.nftItem.price,
                status: item.nftItem.status
              } : null,
              // Transmettre le certificat d'authenticité s'il existe
              certificateUrl: certificate?.fileUrl || null
            }}
            onSuccess={handleSuccess}
          />
        )}
      </div>
    </>
  )
} 