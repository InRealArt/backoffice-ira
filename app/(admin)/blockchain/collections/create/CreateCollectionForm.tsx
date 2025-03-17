'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { z } from 'zod'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { toast } from 'react-hot-toast'
import styles from './CreateCollectionForm.module.scss'
import { Artist, SmartContract } from '@prisma/client'
import { createCollection, syncCollection, updateCollection } from '@/lib/actions/collection-actions'
import { useAccount } from 'wagmi'
import { factoryABI } from '@/lib/contracts/factoryABI'
import { getChainId, getChainByName, formatChainName } from '@/lib/blockchain/chainUtils'
import { publicClient } from '@/lib/providers'
import { useWalletClient } from 'wagmi'
import { Address } from 'viem'
import { useChainId, useConfig } from 'wagmi'
import { InRealArtRoles } from '@/lib/blockchain/smartContractConstants'
import { decodeEventLog } from 'viem'
import { useDynamicContext, useWalletConnectorEvent } from '@/lib/dynamic'

// Validation pour les adresses Ethereum
const ethereumAddressRegex = /^0x[a-fA-F0-9]{40}$/

// Schéma de validation
const formSchema = z.object({
  name: z.string().min(1, 'Le nom de la collection est requis'),
  symbol: z.string().min(1, 'Le symbole est requis')
    .max(10, 'Le symbole ne doit pas dépasser 10 caractères')
    .regex(/^[A-Z0-9]+$/, 'Le symbole doit être en majuscules et sans espaces'),
  addressAdmin: z.string()
    .min(1, 'L\'adresse admin est requise')
    .regex(ethereumAddressRegex, 'Adresse Ethereum invalide'),
  artistPublicKey: z.string()
    .min(1, 'Le wallet de l\'artiste est requis')
    .regex(ethereumAddressRegex, 'Adresse Ethereum invalide'),
  artistId: z.string().min(1, 'Veuillez sélectionner un artiste'),
  smartContractId: z.string().min(1, 'Veuillez sélectionner des smarts contracts'),
})

type FormValues = z.infer<typeof formSchema>

interface CreateCollectionFormProps {
  artists: Artist[]
  smartContracts: SmartContract[]
}

export default function CreateCollectionForm({ artists, smartContracts }: CreateCollectionFormProps) {
  const router = useRouter()
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [selectedArtist, setSelectedArtist] = useState<Artist | null>(null)
  const [selectedSmartContract, setSelectedSmartContract] = useState<SmartContract | null>(null)
  // Wagmi hooks - mise à jour selon la documentation
  const { address, status, chain } = useAccount()
  const config = useConfig()
  const chainId = useChainId()
  
  const {
    register,
    handleSubmit,
    setValue,
    watch,
    formState: { errors }
  } = useForm<FormValues>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      name: '',
      symbol: '',
      addressAdmin: '',
      artistPublicKey: '',
      artistId: '',
      smartContractId: '',
    }
  })
  
  // Surveiller les changements d'artiste et de factory
  const artistId = watch('artistId')
  const smartContractId = watch('smartContractId')
  
  // Mettre à jour les sélections quand les valeurs changent
  useEffect(() => {
    if (artistId) {
      const artist = artists.find(a => a.id.toString() === artistId)
      if (artist) {
        setSelectedArtist(artist)
        setValue('artistPublicKey', artist.publicKey)
      }
    }
    
    if (smartContractId) {
      const smartContract = smartContracts.find(f => f.id.toString() === smartContractId)
      if (smartContract) {
        setSelectedSmartContract(smartContract)
      }
    }
  }, [artistId, smartContractId, artists, smartContracts, setValue])
  
  // Récupérer le walletClient pour les transactions
  const { data: walletClient } = useWalletClient()
  
  // États de transaction
  const [isTransactionPending, setIsTransactionPending] = useState(false)
  const [transactionHash, setTransactionHash] = useState<Address | null>(null)
  const [transactionSuccess, setTransactionSuccess] = useState(false)
  const [transactionError, setTransactionError] = useState<Error | null>(null)
  
  const [hasDeployerRole, setHasDeployerRole] = useState<boolean>(false)
  const [isCheckingRole, setIsCheckingRole] = useState<boolean>(false)
  
  const { primaryWallet } = useDynamicContext()
  
  // Fonction pour vérifier si l'utilisateur a le rôle DEPLOYER_ARTIST_ROLE
  const checkDeployerRole = async (factoryAddress: string, userAddress: string) => {
    if (!factoryAddress || !userAddress) return false
    console.log('factoryAddress', factoryAddress)
    console.log('userAddress', userAddress)
    setIsCheckingRole(true)
    try {
      const hasRole = await publicClient.readContract({
        address: factoryAddress as Address,
        abi: factoryABI,
        functionName: 'hasRole',
        args: [InRealArtRoles.DEPLOYER_ARTIST_ROLE, userAddress as Address]
      })
      
      console.log(`Rôle DEPLOYER_ARTIST_ROLE pour ${userAddress}: ${hasRole}`)
      return !!hasRole
    } catch (error) {
      console.error('Erreur lors de la vérification du rôle:', error)
      return false
    } finally {
      setIsCheckingRole(false)
    }
  }
  
  const verifyRole = async () => {
    console.log('Vérification du rôle avec:', { 
      selectedSmartContract, 
      address, 
      chainId: chain?.id, 
      contractNetwork: selectedSmartContract?.network 
    })
    
    if (selectedSmartContract && address && chain && getChainId(selectedSmartContract.network) === chain.id) {
      const result = await checkDeployerRole(selectedSmartContract.factoryAddress, address)
      console.log('Résultat vérification rôle:', result)
      setHasDeployerRole(result)
    } else {
      console.log('Conditions non remplies pour vérifier le rôle')
      setHasDeployerRole(false)
    }
  }
  

  useWalletConnectorEvent(
    primaryWallet?.connector, 
    'accountChange',
    async ({ accounts }, connector) => {
      if (connector.name === 'Rabby') {
        console.log('Rabby wallet account changed:', accounts);
        // Handle Rabby wallet account change
        await verifyRole()
      }
    }
  );

  
  // Vérifie le rôle lorsque la factory ou l'adresse de l'utilisateur change
  useEffect(() => {
    verifyRole()
  }, [selectedSmartContract, address, chain?.id])
  
  // Mettre à jour l'adresse du wallet artiste quand l'artiste est sélectionné
  const handleArtistChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    const selectedId = e.target.value
    if (selectedId) {
      const artist = artists.find(a => a.id.toString() === selectedId)
      if (artist) {
        setSelectedArtist(artist)
        setValue('artistPublicKey', artist.publicKey)
      }
    } else {
      setSelectedArtist(null)
      setValue('artistPublicKey', '')
    }
  }
  
  // Gérer le changement de factory
  const handleFactoryChange = async (e: React.ChangeEvent<HTMLSelectElement>) => {
    const selectedId = e.target.value
    if (selectedId) {
      const smartContract = smartContracts.find(f => f.id.toString() === selectedId)
      if (smartContract) {
        setSelectedSmartContract(smartContract)
        
        // Vérifier si nous devons changer de réseau
        if (smartContract.network && getChainId(smartContract.network) !== chainId) {
          try {
            console.log('smartContract.network', smartContract.network)
            const targetChainId = getChainId(smartContract.network)
            toast.success(`Changement vers le réseau ${formatChainName(smartContract.network)}...`)
            
            // Utiliser switchChain au lieu de switchNetwork
            const targetChain = getChainByName(smartContract.network)
            // await switchChain(config, { chainId: targetChainId })
            
            // Vérifier le rôle après le changement de réseau, mais seulement s'il y a une adresse
            if (address) {
              const hasRole = await checkDeployerRole(smartContract.factoryAddress, address)
              setHasDeployerRole(hasRole)
            }
          } catch (error) {
            toast.error(`Erreur lors du changement de réseau: ${(error as Error).message}`)
          }
        } else if (address) {
          // Si nous sommes déjà sur le bon réseau, vérifier le rôle immédiatement
          const hasRole = await checkDeployerRole(smartContract.factoryAddress, address)
          setHasDeployerRole(hasRole)
        }
      }
    } else {
      setSelectedSmartContract(null)
      setHasDeployerRole(false)
    }
  }
  
  // Tronquer l'adresse
  const truncateAddress = (address: string): string => {
    if (!address || address.length <= 16) return address
    return `${address.substring(0, 8)}...${address.substring(address.length - 8)}`
  }
  
  
  // Sauvegarder la collection dans la base de données
  const saveCollectionToDB = async (data: {
    name: string
    symbol: string
    addressAdmin: string
    artistId: number
    smartContractId: number
    contractAddress?: string
    transactionHash?: string
  }, redirect: boolean = false) => {
    console.log('name', data.name)
    console.log('symbol', data.symbol)
    console.log('addressAdmin', data.addressAdmin)
    console.log('artistId', data.artistId)
    console.log('smartContractId', data.smartContractId)
    console.log('contractAddress', data.contractAddress)
    console.log('transactionHash', data.transactionHash)
    try {
      const result = await createCollection({
        ...data
      })
      
      if (result.success) {
        toast.success(data.contractAddress
          ? 'Collection soumise avec succès! Confirmation en attente...'
          : 'Collection créée avec succès!'
        )
        if (redirect) {
          router.push('/blockchain/collections')
        }
      } else {
        toast.error(result.message || 'Erreur lors de la création de la collection')
        setIsSubmitting(false)
      }
      return result.collection
    } catch (error) {
      console.error('Erreur:', error)
      toast.error('Une erreur est survenue lors de l\'enregistrement de la collection')
      setIsSubmitting(false)
    }
  }
  
  // Annuler et retourner à la liste
  const handleCancel = () => {
    router.push('/blockchain/collections')
  }
  
  // Soumettre le formulaire
  const onSubmit = async (data: FormValues) => {
    setIsSubmitting(true)
    
    // Vérifier si le wallet est connecté
    if (status !== 'connected' || !address) {
      toast.error('Veuillez connecter votre wallet')
      setIsSubmitting(false)
      return
    }
    
    // Vérifier si nous sommes sur le bon réseau
    if (selectedSmartContract && chain && getChainId(selectedSmartContract.network) !== chain.id) {
      toast.error(`Veuillez passer sur le réseau ${formatChainName(selectedSmartContract.network)}`)
      setIsSubmitting(false)
      return
    }
    
    if (!selectedSmartContract) {
      toast.error('Aucune factory sélectionnée')
      setIsSubmitting(false)
      return
    }
    
    try {
      setIsTransactionPending(true)
      
      /******************************************************/
      /********* STEP 1 : Créer la collection en DB *********/
      /******************************************************/
      //Créer la collection en DB vierge avec juste les infos nécessaires
      const {success, message, errorCode, collection} = await createCollection({
        name: data.name,
        symbol: data.symbol,
        addressAdmin: data.addressAdmin,
        artistId: parseInt(data.artistId),
        smartContractId: parseInt(data.smartContractId)
      })
      if (!success) {
        toast.error(message || 'Erreur lors de la création de la collection avec code erreur: ' + errorCode)
        setIsSubmitting(false)
        return
      }
      
      // Simuler et exécuter la transaction comme avant
      const { request } = await publicClient.simulateContract({
        address: selectedSmartContract.factoryAddress as Address,
        abi: factoryABI,
        functionName: 'createArtist',
        args: [
          data.name,
          data.symbol,
          data.addressAdmin as Address,
          data.artistPublicKey as Address,
        ],
        account: address as Address
      })
      
      // Exécuter la transaction
      const hash = await walletClient?.writeContract(request)
      setTransactionHash(hash as Address)

      /******************************************************/
      /********* STEP 2 : Update la collection en DB avec son txHash *********/
      /******************************************************/
      await updateCollection(collection?.id as number, {
        transactionHash: hash as string
        })
      console.log('updatedNftCollection', collection)
      
      // Attendre la confirmation avec un timeout plus long et gestion d'erreur
      try {
        const receipt = await publicClient.waitForTransactionReceipt({ 
          hash: hash as Address
        })
        //Synchroniser la collection avec la blockchain pour mettre à jour son adresse
        const {success, updated, contractAddress, message} = await syncCollection(collection?.id as number)

        if (contractAddress) {
          setTransactionSuccess(true)
          router.push('/blockchain/collections')
        } else {
          throw new Error('Impossible de récupérer l\'adresse du contrat déployé')
        }
      } catch (timeoutError) {
        console.warn('Timeout lors de l\'attente de la confirmation:', timeoutError)
        toast.loading('La transaction a été soumise mais n\'est pas encore confirmée. Vous pourrez la synchroniser depuis la liste des collections.')
        
        // Ne pas rediriger, juste informer l'utilisateur
        toast.success('Collection enregistrée en attente de confirmation blockchain')
        router.push('/blockchain/collections')
      }
    } catch (error) {
      console.error('Erreur lors de l\'appel au smart contract:', error)
      setTransactionError(error as Error)
      toast.error(`Erreur lors de l'appel au smart contract: ${(error as Error).message}`)
    } finally {
      setIsTransactionPending(false)
      setIsSubmitting(false)
    }
  }
  
  // Ajoutez un log pour déboguer
  useEffect(() => {
    console.log('Address changée:', address)
    console.log('Chain changée:', chain)
  }, [address, chain])
  
  return (
<div className={styles.container}>
      <form onSubmit={handleSubmit(onSubmit)} className={styles.formContainer}>
        
        
        <div className={styles.formCard}>
          <div className={styles.cardContent}>
            <div className={styles.formGroup}>
              <label htmlFor="name" className={styles.formLabel}>
                Nom de la collection
              </label>
              <input
                id="name"
                type="text"
                {...register('name')}
                className={`${styles.formInput} ${errors.name ? styles.formInputError : ''}`}
                placeholder="My Collection"
              />
              {errors.name && (
                <p className={styles.formError}>{errors.name.message}</p>
              )}
            </div>
            
            <div className={styles.formGroup}>
              <label htmlFor="symbol" className={styles.formLabel}>
                Symbole
              </label>
              <input
                id="symbol"
                type="text"
                {...register('symbol')}
                className={`${styles.formInput} ${errors.symbol ? styles.formInputError : ''}`}
                placeholder="SYMB"
              />
              {errors.symbol && (
                <p className={styles.formError}>{errors.symbol.message}</p>
              )}
              <p className={styles.formHelp}>
                Le symbole doit être en majuscules, sans espaces (ex: SYMB)
              </p>
            </div>
            
            <div className={styles.formGroup}>
              <label htmlFor="artistId" className={styles.formLabel}>
                Artiste
              </label>
              <select
                id="artistId"
                {...register('artistId')}
                onChange={handleArtistChange}
                className={`${styles.formSelect} ${errors.artistId ? styles.formInputError : ''}`}
              >
                <option value="">Sélectionner un artiste</option>
                {artists.map(artist => (
                  <option key={artist.id} value={artist.id}>
                    {artist.pseudo} - {truncateAddress(artist.publicKey)}
                  </option>
                ))}
              </select>
              {errors.artistId && (
                <p className={styles.formError}>{errors.artistId.message}</p>
              )}
            </div>
            
            <div className={styles.formGroup}>
              <label htmlFor="artistPublicKey" className={styles.formLabel}>
                Wallet de l'artiste
              </label>
              <input
                id="artistPublicKey"
                type="text"
                {...register('artistPublicKey')}
                className={`${styles.formInput} ${errors.artistPublicKey ? styles.formInputError : ''}`}
                placeholder="0x..."
                readOnly={!!selectedArtist}
              />
              {errors.artistPublicKey && (
                <p className={styles.formError}>{errors.artistPublicKey.message}</p>
              )}
              {selectedArtist && (
                <p className={styles.formHelp}>
                  Adresse automatiquement remplie depuis le profil de l'artiste
                </p>
              )}
            </div>
            
            <div className={styles.formGroup}>
              <label htmlFor="smartContractId" className={styles.formLabel}>
                Smart contract
              </label>
              <select
                id="smartContractId"
                {...register('smartContractId')}
                onChange={handleFactoryChange}
                className={`${styles.formSelect} ${errors.smartContractId ? styles.formInputError : ''}`}
              >
                <option value="">Sélectionner des smart contracts</option>
                {smartContracts.map(smartContract => (
                  <option key={smartContract.id} value={smartContract.id}>
                    {formatChainName(smartContract.network)} - (Factory address) {truncateAddress(smartContract.factoryAddress)}
                  </option>
                ))}
              </select>
              {errors.smartContractId && (
                <p className={styles.formError}>{errors.smartContractId.message}</p>
              )}
              {selectedSmartContract && chain && getChainId(selectedSmartContract.network) !== chain.id && (
                <p className={styles.networkWarning}>
                  ⚠️ Vous devez être sur le réseau {formatChainName(selectedSmartContract.network)}
                </p>
              )}
            </div>
            
            <div className={styles.formGroup}>
              <label htmlFor="addressAdmin" className={styles.formLabel}>
                Admin de la collection
              </label>
              <input
                id="addressAdmin"
                type="text"
                {...register('addressAdmin')}
                className={`${styles.formInput} ${errors.addressAdmin ? styles.formInputError : ''}`}
                placeholder="0x..."
              />
              {errors.addressAdmin && (
                <p className={styles.formError}>{errors.addressAdmin.message}</p>
              )}
            </div>
          </div>
        </div>
        
        
        
        <div className={styles.formActions}>
          <button 
            type="button" 
            onClick={handleCancel}
            className={`${styles.button} ${styles.buttonSecondary}`}
            disabled={isSubmitting}
          >
            Annuler
          </button>
          <button 
            type="submit" 
            className={`${styles.button} ${styles.buttonPrimary}`}
            disabled={
              isSubmitting || 
              isTransactionPending || 
              status !== 'connected' || 
              !hasDeployerRole || 
              isCheckingRole
            }
          >
            {isSubmitting || isTransactionPending 
              ? 'Transaction en cours...' 
              : isCheckingRole 
                ? 'Vérification des permissions...'
                : !hasDeployerRole && selectedSmartContract
                ? 'Permission insuffisante'
                : 'Créer la collection'
            }
          </button>
        </div>
      </form>
    </div>
  )
}