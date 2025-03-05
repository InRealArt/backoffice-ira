'use client'

import { useState } from 'react'
import { toast } from 'react-hot-toast'
import Button from '../Button/Button'
import { RefreshCw } from 'lucide-react'
import { syncPendingCollections } from '@/lib/actions/collection-actions'

export default function CollectionSyncButton() {
  const [isSyncing, setIsSyncing] = useState(false)
  
  const handleSync = async () => {
    if (isSyncing) return
    
    setIsSyncing(true)
    toast.loading('Synchronisation avec la blockchain en cours...')
    
    try {
      const result = await syncPendingCollections()
      
      if (result.success) {
        toast.success(`Synchronisation terminée: ${result.updated || 0} collection(s) mise(s) à jour`)
        // Rafraîchir la page pour voir les changements
        window.location.reload()
      } else {
        toast.error(result.message || 'Erreur lors de la synchronisation')
      }
    } catch (error) {
      console.error('Erreur de synchronisation:', error)
      toast.error(`Erreur de synchronisation: ${(error as Error).message}`)
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