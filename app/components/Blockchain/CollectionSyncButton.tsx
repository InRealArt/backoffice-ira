'use client'

import { useState } from 'react'
import { useToast } from '../Toast/ToastContext' 
import Button from '../Button/Button'
import { RefreshCw } from 'lucide-react'
import { syncCollection } from '@/lib/actions/collection-actions'
import toast from 'react-hot-toast'

export default function CollectionSyncButton({ collectionId }: { collectionId: number }) {
  const [isSyncing, setIsSyncing] = useState(false)
  const { success, error: errorToast } = useToast()
  const handleSync = async () => {
    if (isSyncing) return
    
    setIsSyncing(true)
    toast.loading('Synchronisation avec la blockchain en cours...')
    
    try {
      const result = await syncCollection(collectionId)
      
      if (result.success) {
        success(`Synchronisation terminée: ${result.updated || 0} collection(s) mise(s) à jour`)
        // Rafraîchir la page pour voir les changements
        window.location.reload()
      } else {
        errorToast(result.message || 'Erreur lors de la synchronisation')
      }
    } catch (error) {
      console.error('Erreur de synchronisation:', error)
      errorToast(`Erreur de synchronisation: ${(error as Error).message}`)
    } finally {
      setIsSyncing(false)
    }
  }
  
  return (
    <Button 
      onClick={handleSync} 
      disabled={isSyncing}
      variant="secondary"
      size="medium"
      isLoading={isSyncing}
      loadingText="Synchronisation..."
      className="flex items-center gap-2"
    >
      <RefreshCw className="h-4 w-4" />
      Synchroniser avec la blockchain
    </Button>
  )
} 