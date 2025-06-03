'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { useDynamicContext } from '@dynamic-labs/sdk-react-core'
import LoadingSpinner from '@/app/components/LoadingSpinner/LoadingSpinner'
import ArtworkForm from '@/app/(protected)/art/components/ArtworkForm'
import { getAuthCertificateByItemId, getItemById, getBackofficeUserAddresses, getPhysicalCertificateByItemId, getNftCertificateByItemId } from '@/lib/actions/prisma-actions'
import { use } from 'react'
import styles from './editArtwork.module.scss'
import { normalizeString } from '@/lib/utils'
import Button from '@/app/components/Button/Button'
import { Address } from '@/app/(protected)/art/components/ArtworkForm/types'
import { ArtworkMedium, ArtworkStyle, ArtworkTechnique } from '@prisma/client'

interface EditArtworkClientProps {
  params: Promise<{ id: string }>
  mediums: ArtworkMedium[]
  styles: ArtworkStyle[]
  techniques: ArtworkTechnique[]
}

export default function EditArtworkClient({ params, mediums, styles: artStyles, techniques }: EditArtworkClientProps) {
  // Utiliser React.use pour extraire les paramètres de la promesse
  const resolvedParams = use(params)
  
  const [item, setItem] = useState<any>(null)
  const [certificate, setCertificate] = useState<any>(null)
  const [physicalCertificate, setPhysicalCertificate] = useState<any>(null)
  const [nftCertificate, setNftCertificate] = useState<any>(null)
  const [addresses, setAddresses] = useState<Address[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const { user } = useDynamicContext()
  const router = useRouter()

  useEffect(() => {
    if (!user?.email) {
      setError('Utilisateur non connecté')
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

            // Récupérer les certificats en parallèle
            const certificatePromises = []

            // Certificat NFT (pour rétrocompatibilité)
            if (itemData.nftItem) {
              certificatePromises.push(
                getAuthCertificateByItemId(itemData.id).catch(error => {
                  console.error('Erreur lors de la récupération du certificat d\'authenticité:', error)
                  return null
                })
              )
            } else {
              certificatePromises.push(Promise.resolve(null))
            }

            // Certificat d'œuvre physique
            if (itemData.physicalItem) {
              certificatePromises.push(
                getPhysicalCertificateByItemId(itemData.id).catch(error => {
                  console.error('Erreur lors de la récupération du certificat d\'œuvre physique:', error)
                  return null
                })
              )
            } else {
              certificatePromises.push(Promise.resolve(null))
            }

            // Certificat NFT
            if (itemData.nftItem) {
              certificatePromises.push(
                getNftCertificateByItemId(itemData.id).catch(error => {
                  console.error('Erreur lors de la récupération du certificat NFT:', error)
                  return null
                })
              )
            } else {
              certificatePromises.push(Promise.resolve(null))
            }

            try {
              const [authCertificateResult, physicalCertificateResult, nftCertificateResult] = await Promise.all(certificatePromises)
              
              if (authCertificateResult) {
                console.log('Certificat d\'authenticité trouvé:', authCertificateResult)
                setCertificate(authCertificateResult)
              }

              if (physicalCertificateResult) {
                console.log('Certificat d\'œuvre physique trouvé:', physicalCertificateResult)
                setPhysicalCertificate(physicalCertificateResult)
              }

              if (nftCertificateResult) {
                console.log('Certificat NFT trouvé:', nftCertificateResult)
                setNftCertificate(nftCertificateResult)
              }
            } catch (certError) {
              console.error('Erreur lors de la récupération des certificats:', certError)
            }
          } else {
            setError('Œuvre introuvable')
          }
          setIsLoading(false)
        }
      } catch (error: any) {
        console.error('Erreur lors du chargement de l\'item:', error)
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
  }, [user?.email, resolvedParams.id])

  const handleSuccess = () => {
    router.push('/art/collection')
  }

  if (isLoading) {
    return (
      <div className={styles.container}>
        <LoadingSpinner />
      </div>
    )
  }

  return (
    <div className={styles.container}>
      {error ? (
          <div className={styles.error}>{error}</div>
        ) : (
          <ArtworkForm
            mode="edit"
            addresses={addresses}
            mediums={mediums}
            styles={artStyles}
            techniques={techniques}
            initialData={{
              id: item.id,
              title: item.name,
              description: item.description,
              metaTitle: item.metaTitle,
              metaDescription: item.metaDescription,
              slug: item.slug || (item.name ? normalizeString(item.name) : ''),
              imageUrl: item.mainImageUrl,
              secondaryImagesUrl: item.secondaryImagesUrl || [],
              // Nouvelles caractéristiques artistiques depuis Item
              mediumId: item.mediumId,
              styleId: item.styleId,
              techniqueId: item.techniqueId,
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
                status: item.physicalItem.status,
                shippingAddressId: item.physicalItem.shippingAddressId
              } : null,
              // Transmettre les données du nftItem s'il existe
              nftItem: item.nftItem ? {
                id: item.nftItem.id,
                price: item.nftItem.price,
                status: item.nftItem.status
              } : null,
              // Transmettre le certificat d'authenticité s'il existe (pour rétrocompatibilité)
              certificateUrl: certificate?.fileUrl || null,
              // Transmettre les nouveaux certificats
              physicalCertificateUrl: physicalCertificate?.fileUrl || null,
              nftCertificateUrl: nftCertificate?.fileUrl || null
            }}
            onSuccess={handleSuccess}
          />
        )}
    </div>
  )
} 