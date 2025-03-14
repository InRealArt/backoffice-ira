'use client'

import { useState, useEffect } from 'react'
import { getShopifyProductById } from '@/app/actions/shopify/shopifyActions'
import {
    getAuthCertificateByItemId,
    getItemByShopifyId,
    getUserByItemId,
    getNftResourceByItemId,
    getActiveCollections
} from '@/app/actions/prisma/prismaActions'

type UserType = {
    email?: string
}

type ProductDataType = {
    isLoading: boolean
    error: string | null
    product: any
    certificate: any
    productOwner: any
    item: any
    nftResource: any
    collections: any[]
    formData: {
        name: string
        description: string
        collection: string
        image: File | null
        certificate: File | null
        intellectualProperty: boolean
    }
    fetchCollections: () => Promise<void>
}

export function useNftProductData(
    params: { id: string },
    user: UserType | null
): ProductDataType {
    const [isLoading, setIsLoading] = useState<boolean>(true)
    const [product, setProduct] = useState<any>(null)
    const [error, setError] = useState<string | null>(null)
    const [certificate, setCertificate] = useState<any>(null)
    const [productOwner, setProductOwner] = useState<any>(null)
    const [item, setItem] = useState<any>(null)
    const [nftResource, setNftResource] = useState<any>(null)
    const [collections, setCollections] = useState<any[]>([])
    const [formData, setFormData] = useState({
        name: '',
        description: '',
        collection: '',
        image: null as File | null,
        certificate: null as File | null,
        intellectualProperty: false
    })

    const fetchCollections = async () => {
        try {
            const collectionsData = await getActiveCollections()
            if (collectionsData && Array.isArray(collectionsData)) {
                setCollections(collectionsData)
            }
        } catch (error) {
            console.error('Erreur lors du chargement des collections:', error)
        }
    }

    useEffect(() => {
        if (!user?.email) {
            setError('Vous devez être connecté pour visualiser ce produit')
            setIsLoading(false)
            return
        }

        let isMounted = true

        const fetchProduct = async () => {
            try {
                // Extraire l'ID numérique si l'ID est au format GID
                const productId = params.id.includes('gid://shopify/Product/')
                    ? params.id.split('/').pop()
                    : params.id

                const result = await getShopifyProductById(productId as string)

                if (isMounted) {
                    if (result.success && result.product) {
                        setProduct(result.product)

                        // Convertir result.product.id en nombre
                        const shopifyProductId = typeof result.product.id === 'string'
                            ? BigInt(result.product.id.replace('gid://shopify/Product/', ''))
                            : BigInt(result.product.id)

                        // Rechercher l'Item associé 
                        const itemResult = await getItemByShopifyId(shopifyProductId)

                        if (itemResult?.id) {
                            setItem(itemResult)
                            try {
                                // Récupérer le certificat d'authenticité
                                const certificateResult = await getAuthCertificateByItemId(itemResult.id)
                                if (certificateResult && certificateResult.id) {
                                    setCertificate(certificateResult)
                                }

                                // Récupérer l'utilisateur associé à cet item
                                const ownerResult = await getUserByItemId(itemResult.id)
                                if (ownerResult) {
                                    setProductOwner(ownerResult)
                                }

                                // Récupérer le nftResource associé à cet item
                                console.log('itemResult : ', itemResult)
                                const nftResourceResult = await getNftResourceByItemId(itemResult.id)
                                fetchCollections()

                                if (nftResourceResult) {
                                    setNftResource(nftResourceResult)
                                    // Pré-remplir le formulaire avec les données existantes
                                    if (nftResourceResult.status === 'UPLOADIPFS') {
                                        setFormData(prevData => ({
                                            ...prevData,
                                            name: nftResourceResult.name || '',
                                            description: nftResourceResult.description || '',
                                            collection: nftResourceResult.collectionId?.toString() || ''
                                        }))
                                    }
                                }
                            } catch (certError) {
                                console.error('Erreur lors de la récupération des données:', certError)
                            }
                        }
                    } else {
                        setError(result.message || 'Impossible de charger ce produit')
                    }
                    setIsLoading(false)
                }
            } catch (error: any) {
                console.error('Erreur lors du chargement du produit:', error)
                if (isMounted) {
                    setError(error.message || 'Une erreur est survenue')
                    setIsLoading(false)
                }
            }
        }

        fetchProduct()

        return () => {
            isMounted = false
        }
    }, [params.id, user?.email])

    return {
        isLoading,
        error,
        product,
        certificate,
        productOwner,
        item,
        nftResource,
        collections,
        formData,
        fetchCollections
    }
} 