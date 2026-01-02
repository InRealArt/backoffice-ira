'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import LoadingSpinner from '@/app/components/LoadingSpinner/LoadingSpinner'
import ArtworkForm from '@/app/components/art/ArtworkForm'
import { getPhysicalCertificateByItemId } from '@/lib/actions/prisma-actions'
import { getAllAddressesForAdmin } from '@/lib/actions/address-actions'
import styles from './editArtworkAdmin.module.scss'
import { normalizeString } from '@/lib/utils'
import FormSection from '@/app/components/art/ArtworkForm/FormSection'
import { ArtworkMedium, ArtworkStyle, ArtworkTechnique } from '@prisma/client'

interface EditArtworkAdminClientProps {
  mediums: ArtworkMedium[]
  styles: ArtworkStyle[]
  techniques: ArtworkTechnique[]
  artists: any[]
  item: any
}

export default function EditArtworkAdminClient({ mediums, styles: artStyles, techniques, artists, item }: EditArtworkAdminClientProps) {
  const [certificate, setCertificate] = useState<any>(null)
  const [physicalCertificate, setPhysicalCertificate] = useState<any>(null)
  const [nftCertificate, setNftCertificate] = useState<any>(null)
  const [addresses, setAddresses] = useState<any[]>([])
  const [imagesByType, setImagesByType] = useState<Record<string, string[]>>({})
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const router = useRouter()

  // Trouver l'artiste associé à l'item
  const associatedArtist = artists.find(artist => artist.id === item.artistId)

  useEffect(() => {
    let isMounted = true

    const fetchData = async () => {
      try {
        // Récupérer toutes les adresses pour l'administration
        const userAddresses = await getAllAddressesForAdmin()

        if (isMounted) {
          setAddresses(userAddresses)

          // Transformer les images par type pour le formulaire
          const formattedImagesByType: Record<string, string[]> = {}
          if (item.physicalItem?.images && Array.isArray(item.physicalItem.images)) {
            // Créer un tableau avec les images et leur ordre pour faciliter le tri
            const imagesWithOrder = item.physicalItem.images.map((image: any) => ({
              imageUrl: image.imageUrl,
              imageType: image.imageType,
              order: image.order ?? 0
            }))
            
            // Trier d'abord par type, puis par ordre
            imagesWithOrder.sort((a, b) => {
              if (a.imageType !== b.imageType) {
                return a.imageType.localeCompare(b.imageType)
              }
              return a.order - b.order
            })
            
            // Grouper par type
            imagesWithOrder.forEach((image) => {
              if (!formattedImagesByType[image.imageType]) {
                formattedImagesByType[image.imageType] = []
              }
              formattedImagesByType[image.imageType].push(image.imageUrl)
            })
          }
          
          // Stocker dans le state
          setImagesByType(formattedImagesByType)

          // Vérifier les valeurs reçues
          console.log('Item chargé pour l\'édition admin:', {
            id: item.id,
            name: item.name,
            description: item.description,
            mainImageUrl: item.mainImageUrl,
            secondaryImagesUrl: item.secondaryImagesUrl,
            artistId: item.artistId,
            associatedArtist: associatedArtist,
            // Vérifier si l'item a des relations
            hasPhysicalItem: !!item.physicalItem,
            hasNftItem: !!item.nftItem,
            // Vérifier les images par type
            imagesByType: formattedImagesByType,
            physicalItemImages: item.physicalItem?.images,
            // Debug des artistes
            totalArtists: artists.length,
            artistsIds: artists.map(a => a.id),
            // Afficher l'objet complet pour debugging
            itemComplet: item
          })

          // Récupérer les certificats en parallèle
          const certificatePromises = []

          // Certificat d'œuvre physique
          if (item.physicalItem) {
            certificatePromises.push(
              getPhysicalCertificateByItemId(item.id).catch(error => {
                console.error('Erreur lors de la récupération du certificat d\'œuvre physique:', error)
                return null
              })
            )
          } 

          try {
            const [physicalCertificateResult] = await Promise.all(certificatePromises)
            
            if (physicalCertificateResult) {
              console.log('Certificat d\'œuvre physique trouvé:', physicalCertificateResult)
              setPhysicalCertificate(physicalCertificateResult)
            }

          } catch (certError) {
            console.error('Erreur lors de la récupération des certificats:', certError)
          }

          setIsLoading(false)
        }
      } catch (error: any) {
        console.error('Erreur lors du chargement des données:', error)
        if (isMounted) {
          setError(error.message || 'Une erreur est survenue')
          setIsLoading(false)
        }
      }
    }

    fetchData()

    return () => {
      isMounted = false
    }
  }, [item.id, associatedArtist])

  const handleSuccess = () => {
    router.push('/admin-art')
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
      <h1 className={styles.pageTitle}>Édition d'œuvre d'art (Administration)</h1>
      
      {error ? (
        <div className={styles.error}>{error}</div>
      ) : (
        <>
          {/* Section Artiste */}
          <FormSection title="Artiste">
            <div className={styles.artistSection}>
              {associatedArtist ? (
                <div className={styles.artistInfo}>
                  <div className={styles.artistDetail}>
                    <strong>Nom :</strong> {associatedArtist.name}
                  </div>
                  {associatedArtist.description && (
                    <div className={styles.artistDetail}>
                      <strong>Description :</strong>
                      <p className={styles.artistBio}>{associatedArtist.description}</p>
                    </div>
                  )}
                  {associatedArtist.pseudo && (
                    <div className={styles.artistDetail}>
                      <strong>Pseudo :</strong> {associatedArtist.pseudo}
                    </div>
                  )}
                  {associatedArtist.surname && (
                    <div className={styles.artistDetail}>
                      <strong>Nom de famille :</strong> {associatedArtist.surname}
                    </div>
                  )}
                </div>
              ) : (
                <div className={styles.noArtist}>
                  Aucun artiste associé à cette œuvre
                </div>
              )}
            </div>
          </FormSection>

          {/* Formulaire d'artwork existant */}
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
              // Caractéristiques artistiques depuis PhysicalItem
              mediumId: item.physicalItem?.mediumId,
              styleIds: item.physicalItem?.itemStyles?.map((is: any) => is.styleId) || [],
              techniqueIds: item.physicalItem?.itemTechniques?.map((it: any) => it.techniqueId) || [],
              themeIds: item.physicalItem?.itemThemes?.map((ith: any) => ith.themeId) || [],
              // Adresse d'expédition depuis PhysicalItem
              shippingAddressId: item.physicalItem?.shippingAddressId,
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
                shippingAddressId: item.physicalItem.shippingAddressId,
                mediumId: item.physicalItem.mediumId,
                itemStyles: item.physicalItem.itemStyles || [],
                itemTechniques: item.physicalItem.itemTechniques || [],
                itemThemes: item.physicalItem.itemThemes || []
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
              nftCertificateUrl: nftCertificate?.fileUrl || null,
              // Transmettre les images par type
              imagesByType: imagesByType
            }}
            onSuccess={handleSuccess}
          />
        </>
      )}
    </div>
  )
} 