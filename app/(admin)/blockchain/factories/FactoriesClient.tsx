'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { Factory } from '@prisma/client'
import styles from './FactoriesClient.module.scss'
import LoadingSpinner from '@/app/components/LoadingSpinner/LoadingSpinner'
import { formatChainName } from '@/lib/blockchain/chainUtils'

interface FactoriesClientProps {
  factories: Factory[]
}

export default function FactoriesClient({ factories }: FactoriesClientProps) {
  const [isMobile, setIsMobile] = useState(false)
  const router = useRouter()
  const [loadingFactoryId, setLoadingFactoryId] = useState<number | null>(null)
  
  // Détecte si l'écran est de taille mobile
  useEffect(() => {
    const checkIfMobile = () => {
      setIsMobile(window.innerWidth < 768)
    }
    
    // Vérifier au chargement
    checkIfMobile()
    
    // Écouter les changements de taille d'écran
    window.addEventListener('resize', checkIfMobile)
    
    return () => {
      window.removeEventListener('resize', checkIfMobile)
    }
  }, [])
  
  const handleFactoryClick = (factoryId: number) => {
    setLoadingFactoryId(factoryId)
    router.push(`/blockchain/factories/${factoryId}/edit`)
  }
  
  const handleAddFactory = () => {
    router.push('/blockchain/factories/create')
  }
  
  // Fonction pour tronquer l'adresse du contrat
  function truncateAddress(address: string): string {
    if (address.length <= 16) return address
    return `${address.substring(0, 8)}...${address.substring(address.length - 8)}`
  }

  return (
    <div className={styles.factoriesContainer}>
      <div className={styles.factoriesHeader}>
        <div className={styles.headerTopSection}>
          <h1 className={styles.pageTitle}>Factories</h1>
          <button 
            onClick={handleAddFactory}
            className={styles.addButton}
          >
            Ajouter une factory
          </button>
        </div>
        <p className={styles.subtitle}>
          Liste des contrats factory déployés
        </p>
      </div>
      
      <div className={styles.factoriesContent}>
        {factories.length === 0 ? (
          <div className={styles.emptyState}>
            <p>Aucune factory trouvée</p>
          </div>
        ) : (
          <div className={styles.tableContainer}>
            <table className={styles.factoriesTable}>
              <thead>
                <tr>
                  <th>ID</th>
                  <th>Réseau</th>
                  <th>Adresse du contrat</th>
                </tr>
              </thead>
              <tbody>
                {factories.map((factory) => {
                  const isLoading = loadingFactoryId === factory.id
                  return (
                    <tr 
                      key={factory.id} 
                      onClick={() => !loadingFactoryId && handleFactoryClick(factory.id)}
                      className={`${styles.clickableRow} ${isLoading ? styles.loadingRow : ''} ${loadingFactoryId && !isLoading ? styles.disabledRow : ''}`}
                    >
                      <td>
                        <div className={styles.idCell}>
                          {isLoading && <LoadingSpinner size="small" message="" inline />}
                          <span className={isLoading ? styles.loadingText : ''}>
                            {factory.id}
                          </span>
                        </div>
                      </td>
                      <td>
                        <div className={styles.chainBadge}>
                          {formatChainName(factory.chain)}
                        </div>
                      </td>
                      <td>
                        <span className={styles.truncatedAddress} title={factory.contractAddress}>
                          {truncateAddress(factory.contractAddress)}
                        </span>
                      </td>
                    </tr>
                  )
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  )
} 