'use client'

import { useState, useEffect } from 'react'
import { useDynamicContext } from '@dynamic-labs/sdk-react-core'
import LoadingSpinner from '@/app/components/LoadingSpinner/LoadingSpinner'
import ProductCard from '@/app/components/ProductCard/ProductCard'
import { fetchItemsData, ItemData } from '@/app/utils/items/itemsData'
import styles from './collection.module.scss'
import { getBackofficeUserByEmail } from '@/lib/actions/prisma-actions'
import { BackofficeUser } from '@prisma/client'

export default function CollectionPage() {
  const { user } = useDynamicContext()
  const [isLoading, setIsLoading] = useState(true)
  const [itemsData, setItemsData] = useState<ItemData[] | null>(null)
  const [error, setError] = useState<string | null>(null)
  const [userDB, setUserDB] = useState<BackofficeUser | null>(null)
  
  useEffect(() => {
    // Ne rien faire si l'utilisateur n'est pas connecté
    if (!user?.email) {
      setIsLoading(false)
      setError('Vous devez être connecté pour voir votre collection')
      return
    }

    let isMounted = true

    // Récupérer les données des items
    const loadData = async () => {
      // Garantir que email n'est jamais undefined
      const email = user.email as string
      const userDB = await getBackofficeUserByEmail(email)
      
      if (!userDB) {
        setError('Votre profil utilisateur n\'a pas été trouvé')
        setIsLoading(false)
        return
      }
      
      setUserDB(userDB)
      
      const result = await fetchItemsData(email)
      
      if (isMounted) {
        if (!result.success) {
          setError(result.error || null)
        } else {
          setItemsData(result.data || [])
        }
        setIsLoading(false)
      }
    }

    loadData()

    return () => {
      isMounted = false
    }
  }, [user?.email]) // Dépendance uniquement sur l'email

  if (isLoading) {
    return <LoadingSpinner message="Chargement de vos œuvres..." />
  }

  return (
    <div className="page-container">
      <h1 className="page-title">Mes Œuvres</h1>

      {error ? (
        <div className="alert alert-error">
          {error}
        </div>
      ) : !itemsData || itemsData.length === 0 ? (
        <div className="empty-state">
          <p>Aucune œuvre trouvée dans votre collection</p>
        </div>
      ) : (
        <>
          <div className="card">
            <h2 className="card-title">Collection de {userDB?.firstName} {userDB?.lastName}</h2>
          </div>

          <div className="section">
            <h3 className="section-title">Mes œuvres ({itemsData.length})</h3>
            
            <div className="products-grid">
              {itemsData.map((item) => (
                <ProductCard
                  key={item.id}
                  id={item.id}
                  title={item.title || 'Sans titre'}
                  price={item.price || '0.00'}
                  currency="EUR"
                  imageUrl={item.imageUrl || '/images/no-image.jpg'}
                  idShopify={item.id.toString()}
                  userId={userDB?.id}
                  status={item.status}
                  tags={item.tags}
                />
              ))}
            </div>
          </div>
        </>
      )}
    </div>
  )
} 