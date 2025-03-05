'use client'

import { useDynamicContext, useDynamicEvents, useUserWallets } from '@dynamic-labs/sdk-react-core'
import { updateLinkedWallets } from '@/app/actions/auth/updateLinkedWallets'
import toast from 'react-hot-toast'
import { useEffect } from 'react'

export default function WalletEventListener() {
  const { primaryWallet } = useDynamicContext()
  const userWallets = useUserWallets()

  // Logs de débogage améliorés et détection des wallets Turnkey HD
  useEffect(() => {
    // console.log('WalletEventListener monté')
    // console.log('Primary wallet:', primaryWallet)
    // console.log('Tous les wallets (useUserWallets):', userWallets)
    
    // Détection et traitement des wallets liés Turnkey HD
    if (primaryWallet && userWallets && userWallets.length > 0) {
      // Affichage détaillé de chaque wallet
      userWallets.forEach(async (wallet, index) => {
        const connectorType = wallet.connector?.name || 'unknown'
        // console.log(`Wallet ${index + 1}:`, {
        //   address: wallet.address,
        //   chain: wallet.chain,
        //   isAuthenticated: wallet.isAuthenticated,
        //   id: wallet.id,
        //   connectorType
        // })
        // console.log('connectorType', connectorType)

        // Si c'est un wallet Turnkey HD et pas le wallet principal, on le considère comme un wallet lié
        if (connectorType !== "Turnkey HD" && wallet.address !== primaryWallet.address) {
          console.log(`Détection d'un wallet lié Turnkey HD:`, wallet.address)
          
          try {
            // Préparer les informations du wallet
            const walletInfo = {
              address: wallet.address,
              chain: wallet.chain || 'unknown',
              connector: connectorType
            }
            
            // Mettre à jour la base de données
            console.log('Ajout automatique du wallet lié:', walletInfo)
            const result = await updateLinkedWallets(primaryWallet.address, walletInfo)
            
            if (result.success) {
              console.log('Wallet Turnkey HD ajouté avec succès aux wallets liés')
            } else {
              console.error('Échec de l\'ajout du wallet Turnkey HD:', result.message)
            }
          } catch (error) {
            console.error('Erreur lors de l\'ajout du wallet Turnkey HD:', error)
          }
        }
      })
    } else {
      console.log('Aucun wallet disponible')
    }
  }, [primaryWallet, userWallets])

  // Écouteur d'événement amélioré
  useDynamicEvents('walletAdded', async (newWallet) => {
    try {
      console.log('Événement walletAdded déclenché', newWallet)
      console.log('État actuel des wallets:', userWallets)
      
      // Ne rien faire si pas de wallet principal
      if (!primaryWallet) {
        console.log('Pas de wallet principal, opération annulée')
        return
      }

      // S'assurer que le wallet est valide
      if (!newWallet || !newWallet.address) {
        console.error('Wallet invalide:', newWallet)
        return
      }

      // Ne pas traiter le wallet principal à nouveau
      if (newWallet.address === primaryWallet.address) {
        console.log('Wallet identique au principal, opération annulée')
        return
      }

      console.log('Préparation de la mise à jour pour le wallet:', newWallet.address)

      // Préparer les informations du wallet
      const walletInfo = {
        address: newWallet.address,
        chain: newWallet.chain || 'unknown',
        connector: newWallet.connector?.name || 'unknown'
      }

      // Mettre à jour la base de données
      console.log('Appel à updateLinkedWallets avec:', primaryWallet.address, walletInfo)
      const result = await updateLinkedWallets(primaryWallet.address, walletInfo)
      console.log('Résultat de updateLinkedWallets:', result)

      if (result.success) {
        toast.success('Nouveau portefeuille lié avec succès')
      } else {
        toast.error(result.message || 'Erreur lors de la liaison du portefeuille')
      }
    } catch (error) {
      console.error('Erreur lors du traitement de l\'ajout de wallet:', error)
      toast.error('Erreur lors de la liaison du portefeuille')
    }
  })

  // Ce composant ne rend rien visuellement
  return null
} 