'use client'

import { useState, useEffect } from 'react'
import { useDynamicContext } from '@dynamic-labs/sdk-react-core'
import LoadingSpinner from '@/app/components/LoadingSpinner/LoadingSpinner'
import { useRouter } from 'next/navigation'
import { getBackofficeUserByEmail } from '@/lib/actions/prisma-actions'
import { createAddress } from '@/lib/actions/address-actions'
import AddressForm from '../components/AddressForm'
import { BackofficeUser } from '@prisma/client'

export default function CreateAddressPage() {
  const { user } = useDynamicContext()
  const [isLoading, setIsLoading] = useState(true)
  const [backofficeUser, setBackofficeUser] = useState<BackofficeUser | null>(null)
  const [error, setError] = useState<string | null>(null)
  const router = useRouter()
  
  useEffect(() => {
    if (!user?.email) {
      setIsLoading(false)
      setError('Vous devez être connecté pour créer une adresse')
      return
    }

    const loadData = async () => {
      const email = user.email as string
      const userDBResult = await getBackofficeUserByEmail(email)
      
      if (!userDBResult) {
        setError('Votre profil utilisateur n\'a pas été trouvé')
      } else {
        setBackofficeUser(userDBResult)
      }
      
      setIsLoading(false)
    }

    loadData()
  }, [user?.email])

  const handleSubmit = async (formData: {
    firstName: string
    lastName: string
    streetAddress: string
    postalCode: string
    city: string
    country: string
    vatNumber?: string
  }) => {
    if (!backofficeUser) {
      setError('Impossible de créer une adresse, utilisateur non identifié')
      return
    }
    
    setIsLoading(true)
    
    try {
      const result = await createAddress({
        ...formData,
        backofficeUserId: backofficeUser.id
      })
      
      if (result.success) {
        router.push('/shopify/addresses')
      } else {
        setError(result.error || 'Une erreur est survenue lors de la création de l\'adresse')
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

  return (
    <div className="page-container">
      <h1 className="page-title">Ajouter une adresse</h1>
      
      <div className="card">
        <AddressForm 
          onSubmit={handleSubmit} 
          defaultFirstName={backofficeUser?.firstName || ''}
          defaultLastName={backofficeUser?.lastName || ''}
        />
      </div>
    </div>
  )
} 