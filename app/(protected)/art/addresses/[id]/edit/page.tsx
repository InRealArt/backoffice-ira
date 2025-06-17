'use client'

import { useState, useEffect, use } from 'react'
import { useDynamicContext } from '@dynamic-labs/sdk-react-core'
import LoadingSpinner from '@/app/components/LoadingSpinner/LoadingSpinner'
import { useRouter } from 'next/navigation'
import { getBackofficeUserByEmail } from '@/lib/actions/prisma-actions'
import { getAddressById, updateAddress } from '@/lib/actions/address-actions'
import AddressForm from '../../components/AddressForm'

interface EditAddressPageProps {
  params: Promise<{
    id: string
  }>
}

interface Address {
  id: number
  customerId: string | null
  firstName: string
  lastName: string
  streetAddress: string
  postalCode: string
  city: string
  country: string
  countryCode: string
  vatNumber: string | null
  backofficeUserId: number | null
  name: string
}

export default function EditAddressPage({ params }: EditAddressPageProps) {
  const { user } = useDynamicContext()
  const [isLoading, setIsLoading] = useState<boolean>(true)
  const [address, setAddress] = useState<Address | null>(null)
  const [error, setError] = useState<string | null>(null)
  const router = useRouter()
  const resolvedParams = use(params)
  
  useEffect(() => {
    if (!user?.email) {
      setIsLoading(false)
      setError('Vous devez être connecté pour modifier une adresse')
      return
    }

    const loadData = async (): Promise<void> => {
      try {
        const email = user.email
        const userDBResult = await getBackofficeUserByEmail(email as string)
        
        if (!userDBResult) {
          setError('Votre profil utilisateur n\'a pas été trouvé')
          setIsLoading(false)
          return
        }
        
        const addressId = parseInt(resolvedParams.id)
        const addressResult = await getAddressById(addressId)
        
        if (!addressResult.success || !addressResult.data) {
          setError(addressResult.error || 'Adresse non trouvée')
          setIsLoading(false)
          return
        }
        
        // Vérifier que l'adresse appartient bien à l'utilisateur connecté
        if (addressResult.data.backofficeUserId !== userDBResult.id) {
          setError('Vous n\'êtes pas autorisé à modifier cette adresse')
          setIsLoading(false)
          return
        }
        
        setAddress(addressResult.data)
        setIsLoading(false)
      } catch (error) {
        setError('Une erreur est survenue lors du chargement de l\'adresse')
        setIsLoading(false)
      }
    }

    loadData()
  }, [user?.email, resolvedParams.id])

  const handleSubmit = async (formData: {
    name: string
    firstName: string
    lastName: string
    streetAddress: string
    postalCode: string
    city: string
    country: string
    countryCode: string
    vatNumber?: string
  }): Promise<void> => {
    if (!address) {
      setError('Impossible de modifier l\'adresse')
      return
    }
    
    setIsLoading(true)
    
    try {
      const result = await updateAddress(address.id, formData)
      
      if (result.success) {
        router.push('/art/addresses')
      } else {
        setError(result.error || 'Une erreur est survenue lors de la mise à jour de l\'adresse')
        setIsLoading(false)
      }
    } catch (e) {
      setError('Une erreur inattendue est survenue')
      setIsLoading(false)
    }
  }

  if (isLoading) {
    return <LoadingSpinner message="Chargement..." />
  }

  if (error) {
    return (
      <div className="page-container">
        <div className="alert alert-error">
          {error}
        </div>
      </div>
    )
  }

  if (!address) {
    return (
      <div className="page-container">
        <div className="alert alert-error">
          Adresse non trouvée
        </div>
      </div>
    )
  }

  return (
    <div className="page-container">
      <h1 className="page-title">Modifier une adresse</h1>
      
      <div className="card">
        <AddressForm onSubmit={handleSubmit} address={address} />
      </div>
    </div>
  )
} 