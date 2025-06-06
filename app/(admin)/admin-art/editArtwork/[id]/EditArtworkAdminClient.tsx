'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import LoadingSpinner from '@/app/components/LoadingSpinner/LoadingSpinner'
import ArtworkForm from '@/app/(protected)/art/components/ArtworkForm'
import { getAuthCertificateByItemId, getBackofficeUserAddresses, getPhysicalCertificateByItemId, getNftCertificateByItemId } from '@/lib/actions/prisma-actions'
import styles from './editArtworkAdmin.module.scss'
import { normalizeString } from '@/lib/utils'
import FormSection from '@/app/(protected)/art/components/ArtworkForm/FormSection'
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
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const router = useRouter()

  // Trouver l'artiste associé à l'item
  const associatedArtist = artists.find(artist => artist.id === item.artistId)

  useEffect(() => {
    let isMounted = true

    const fetchData = async () => {
      try {
        // Récupérer les adresses pour l'administration
        const userAddresses = await getBackofficeUserAddresses('admin@example.com')

        if (isMounted) {
          setAddresses(userAddresses)

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
            // Debug des artistes
            totalArtists: artists.length,
            artistsIds: artists.map(a => a.id),
            // Afficher l'objet complet pour debugging
            itemComplet: item
          })

          // Récupérer les certificats en parallèle
          const certificatePromises = []

          // Certificat NFT (pour rétrocompatibilité)
          if (item.nftItem) {
            certificatePromises.push(
              getAuthCertificateByItemId(item.id).catch(error => {
                console.error('Erreur lors de la récupération du certificat d\'authenticité:', error)
                return null
              })
            )
          } else {
            certificatePromises.push(Promise.resolve(null))
          }

          // Certificat d'œuvre physique
          if (item.physicalItem) {
            certificatePromises.push(
              getPhysicalCertificateByItemId(item.id).catch(error => {
                console.error('Erreur lors de la récupération du certificat d\'œuvre physique:', error)
                return null
              })
            )
          } else {
            certificatePromises.push(Promise.resolve(null))
          }

          // Certificat NFT
          if (item.nftItem) {
            certificatePromises.push(
              getNftCertificateByItemId(item.id).catch(error => {
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
        </>
      )}
    </div>
  )
} 