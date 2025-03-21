'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { SmartContract } from '@prisma/client'
import LoadingSpinner from '@/app/components/LoadingSpinner/LoadingSpinner'
import { formatChainName } from '@/lib/blockchain/chainUtils'
import BlockchainAddress from '@/app/components/blockchain/BlockchainAddress'
import Link from 'next/link'
import { StatusRow } from '@/app/components/Table'

interface SmartContractsClientProps {
  smartContracts: SmartContract[]
}

export default function SmartContractsClient({ smartContracts }: SmartContractsClientProps) {
  const [isMobile, setIsMobile] = useState(false)
  const router = useRouter()
  const [loadingContractId, setLoadingContractId] = useState<number | null>(null)
  const [copiedAddress, setCopiedAddress] = useState<string | null>(null)
  
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
  
  const handleContractClick = (contractId: number) => {
    setLoadingContractId(contractId)
    router.push(`/blockchain/smartContracts/${contractId}`)
  }
  
  const handleAddSmartContract = () => {
    router.push('/blockchain/smartContracts/create')
  }
  
  return (
    <div className="page-container">
      <div className="page-header">
        <div className="header-top-section">
          <h1 className="page-title">Smart Contracts</h1>
          <Link href="/blockchain/smartContracts/create" className="btn btn-primary">
            Créer des smart contracts
          </Link>
        </div>
        <p className="page-subtitle">
          Gérez les smart contracts déployés dans le système
        </p>
      </div>

      <div className="page-content">
        {smartContracts.length === 0 ? (
          <div className="empty-state">
            <p>Aucun smart contract trouvé</p>
          </div>
        ) : (
          <div className="table-container">
            <table className="data-table">
              <thead>
                <tr>
                  <th>ID</th>
                  <th>Factory</th>
                  <th>Royalties (Proxy)</th>
                  <th>Marketplace (Proxy)</th>
                  <th>Réseau</th>
                  <th>Statut</th>
                </tr>
              </thead>
              <tbody>
                {smartContracts.map((contract) => {
                  const isLoading = loadingContractId === contract.id;
                  return (
                    <StatusRow 
                      key={contract.id} 
                      isActive={contract.active}
                      colorType="danger"
                      className={`clickable-row ${isLoading ? 'loading-row' : ''} ${loadingContractId && !isLoading ? 'disabled-row' : ''}`}
                      onClick={() => !loadingContractId && handleContractClick(contract.id)}
                    >
                      <td>
                        <div className="d-flex align-items-center gap-sm">
                          {isLoading && <LoadingSpinner size="small" message="" inline />}
                          <span className={isLoading ? 'text-muted' : ''}>
                            {contract.id}
                          </span>
                        </div>
                      </td>
                      <td>
                        <BlockchainAddress
                          address={contract.factoryAddress}
                          network={contract.network}
                          showExplorerLink={true}
                        />
                      </td>
                      <td>
                        <BlockchainAddress
                          address={contract.royaltiesAddress}
                          network={contract.network}
                          showExplorerLink={true}
                        />
                      </td>
                      <td>
                        <BlockchainAddress
                          address={contract.marketplaceAddress}
                          network={contract.network}
                          showExplorerLink={true}
                        />
                      </td>
                      <td>
                        <span className="info-badge">
                          {formatChainName(contract.network)}
                        </span>
                      </td>
                      <td>
                        <span className={`status-badge ${contract.active ? 'active' : 'inactive'}`}>
                          {contract.active ? 'Actif' : 'Inactif'}
                        </span>
                      </td>
                    </StatusRow>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>
      
      {copiedAddress && (
        <div className="toast-notification">
          Adresse copiée !
        </div>
      )}
    </div>
  )
} 