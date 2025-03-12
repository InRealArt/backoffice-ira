'use server';

import { memberSchema } from "@/app/(admin)/shopify/create-member/schema";
import { MemberFormData } from "@/app/(admin)/shopify/create-member/schema";
import { prisma } from "@/lib/prisma"
import { NotificationStatus, BackofficeUser, ResourceTypes, ResourceNftStatuses, CollectionStatus, ItemStatus } from "@prisma/client"
import { revalidatePath } from "next/cache";
import { PrismaClient } from '@prisma/client'
import { Decimal } from '@prisma/client/runtime/library'
import { artistNftCollectionAbi } from "@/lib/contracts/ArtistNftCollectionAbi";
import { decodeEventLog } from "viem";
import { serverPublicClient } from "@/lib/server-providers";
const prismaClient = new PrismaClient()

type CreateMemberResult = {
  success: boolean
  message: string
}

type CheckUserExistsParams = {
  email: string;
  firstName: string;
  lastName: string;
}

type CheckUserExistsResult = {
  unique: boolean;
  message: string;
}

type CheckListingRequestParams = {
  idProductShopify: string | number | bigint
  idUser: number
}

interface UpdateStatusParams {
  idProductShopify: number
  idUser: number
  status: string
}

interface StatusUpdateResult {
  success: boolean
  message?: string
}

interface CheckStatusParams {
  idProductShopify: number
  idUser: number
}

interface StatusCheckResult {
  exists: boolean
  status?: string
}

type CreateNftResourceParams = {
  itemId: string
  imageUri: string
  certificateUri: string
  type: ResourceTypes
  status: ResourceNftStatuses
  name: string
  description: string
  collectionId: number
}

interface UpdateNftResourceStatusResult {
  success: boolean
  message?: string
  error?: string
}

interface UpdateTokenIdResult {
  success: boolean
  tokenId?: string
  message?: string
  error?: string
}

// Fonction utilitaire pour convertir les objets Decimal en nombres
function serializeData(data: any): any {
  if (data === null || data === undefined) {
    return data
  }

  if (data instanceof Decimal) {
    return parseFloat(data.toString())
  }

  if (Array.isArray(data)) {
    return data.map(item => serializeData(item))
  }

  if (typeof data === 'object') {
    const result: Record<string, any> = {}
    for (const key in data) {
      result[key] = serializeData(data[key])
    }
    return result
  }

  return data
}

export async function createMember(data: MemberFormData): Promise<CreateMemberResult> {
  try {
    // Valider les données avec Zod
    const validatedData = memberSchema.parse(data)

    // Vérifier si l'email existe déjà
    const existingUser = await prisma.backofficeUser.findUnique({
      where: { email: validatedData.email }
    })

    if (existingUser) {
      return {
        success: false,
        message: 'Un utilisateur avec cet email existe déjà'
      }
    }

    // Créer l'utilisateur dans la base de données
    await prisma.backofficeUser.create({
      data: {
        email: validatedData.email,
        firstName: validatedData.firstName,
        lastName: validatedData.lastName,
        role: validatedData.role,
        walletAddress: '', // Valeur par défaut pour le champ obligatoire
        lastLogin: new Date(), // Date actuelle par défaut
        userMetadata: {}
      }
    })

    // Rafraîchir la page après création
    revalidatePath('/admin/shopify/create-member')

    return {
      success: true,
      message: 'Membre créé avec succès'
    }
  } catch (error) {
    console.error('Erreur lors de la création du membre:', error)

    if (error instanceof Error) {
      return {
        success: false,
        message: error.message || 'Une erreur est survenue lors de la création du membre'
      }
    }

    return {
      success: false,
      message: 'Une erreur inconnue est survenue'
    }
  }
}

// Fonction qui vérifie si un utilisateur avec la même combinaison email+nom+prénom existe déjà
export async function checkUserExists(
  params: CheckUserExistsParams
): Promise<CheckUserExistsResult> {
  try {
    // Vérifier si l'email existe déjà
    const existingUserByEmail = await prisma.backofficeUser.findUnique({
      where: { email: params.email }
    })

    if (existingUserByEmail) {
      return {
        unique: false,
        message: 'Un utilisateur avec cet email existe déjà'
      }
    }

    // Vérifier si la combinaison prénom+nom existe déjà
    const existingUserByName = await prisma.backofficeUser.findFirst({
      where: {
        firstName: params.firstName,
        lastName: params.lastName
      }
    })

    if (existingUserByName) {
      return {
        unique: false,
        message: `Un utilisateur avec le nom "${params.firstName} ${params.lastName}" existe déjà`
      }
    }

    // Si aucun utilisateur existant n'est trouvé, la combinaison est unique
    return {
      unique: true,
      message: 'La combinaison est unique'
    }
  } catch (error) {
    console.error('Erreur lors de la vérification de l\'unicité:', error)
    return {
      unique: false,
      message: 'Une erreur est survenue lors de la vérification de l\'unicité. Veuillez réessayer.'
    }
  }
}


export async function getShopifyUsers(): Promise<BackofficeUser[]> {
  try {
    const users = await prisma.backofficeUser.findMany({
      orderBy: {
        createdAt: 'desc'
      }
    })

    return users
  } catch (error) {
    console.error('Erreur lors de la récupération des utilisateurs Shopify:', error)
    return []
  }
}

type UpdateShopifyUserResult = {
  success: boolean
  message: string
}

// Ajouter cette fonction pour récupérer un utilisateur par son ID
export async function getShopifyUserById(id: string) {
  try {
    const user = await prisma.backofficeUser.findUnique({
      where: { id: parseInt(id) }
    })

    return user
  } catch (error) {
    console.error('Erreur lors de la récupération de l\'utilisateur Shopify:', error)
    return null
  }
}

// Ajouter cette fonction pour mettre à jour un utilisateur
export async function updateShopifyUser(
  data: any
): Promise<UpdateShopifyUserResult> {
  try {
    // Vérifier si l'utilisateur existe
    const existingUser = await prisma.backofficeUser.findUnique({
      where: { id: parseInt(data.id) }
    })

    if (!existingUser) {
      return {
        success: false,
        message: 'Utilisateur non trouvé'
      }
    }

    // Vérifier si l'email existe déjà pour un autre utilisateur
    if (data.email !== existingUser.email) {
      const emailExists = await prisma.backofficeUser.findFirst({
        where: {
          email: data.email,
          id: { not: parseInt(data.id) }
        }
      })

      if (emailExists) {
        return {
          success: false,
          message: 'Cet email est déjà utilisé par un autre utilisateur'
        }
      }
    }

    // Mettre à jour l'utilisateur
    await prisma.backofficeUser.update({
      where: { id: parseInt(data.id) },
      data: {
        firstName: data.firstName,
        lastName: data.lastName,
        email: data.email,
        role: data.role || null,
        walletAddress: data.walletAddress || '',
        isShopifyGranted: data.isShopifyGranted,
      }
    })

    // Revalider les chemins pour forcer le rafraîchissement
    revalidatePath(`/shopify/users/${data.id}/edit`)
    revalidatePath('/shopify/users')

    return {
      success: true,
      message: 'Utilisateur mis à jour avec succès'
    }
  } catch (error) {
    console.error('Erreur lors de la mise à jour de l\'utilisateur:', error)

    if (error instanceof Error) {
      return {
        success: false,
        message: error.message || 'Une erreur est survenue lors de la mise à jour'
      }
    }

    return {
      success: false,
      message: 'Une erreur inconnue est survenue'
    }
  }
}

// Ajouter cette fonction pour récupérer un utilisateur par son email
export async function getBackofficeUserByEmail(email: string) {
  try {
    const user = await prisma.backofficeUser.findUnique({
      where: { email }
    })

    return user
  } catch (error) {
    console.error('Erreur lors de la récupération de l\'utilisateur Backoffice par email:', error)
    return null
  }
}



export async function createItemRecord(
  userId: number,
  productId: string,
  status: string,
  tags: string[] = [],
  additionalData?: {
    height?: number,
    width?: number,
    intellectualProperty?: boolean,
    intellectualPropertyEndDate?: Date | null,
    creationDate?: Date | null,
    priceBeforeTax?: number,
    artworkSupport?: string | null
  }
) {
  try {
    // S'assurer que les tags sont bien un tableau de chaînes
    const processedTags = Array.isArray(tags)
      ? tags.filter(tag => tag && typeof tag === 'string')
      : []

    const newItem = await prisma.item.create({
      data: {
        idUser: userId,
        idShopify: BigInt(productId),
        status: status as ItemStatus,
        tags: processedTags, // Utiliser directement le tableau traité
        height: additionalData?.height ? new Decimal(additionalData.height) : null,
        width: additionalData?.width ? new Decimal(additionalData.width) : null,
        intellectualProperty: additionalData?.intellectualProperty || false,
        intellectualPropertyEndDate: additionalData?.intellectualPropertyEndDate || null,
        creationDate: additionalData?.creationDate || null,
        priceBeforeTax: additionalData?.priceBeforeTax || 0,
        artworkSupport: additionalData?.artworkSupport || null
      },
      include: {
        user: true
      }
    })

    return serializeData({ success: true, item: newItem })
  } catch (error) {
    console.error('Erreur lors de la création de l\'item:', error)
    return { success: false, error }
  }
}

/**
 * Met à jour le statut d'un item
 */
export async function updateItemStatus(
  itemId: number,
  newStatus: string
): Promise<StatusUpdateResult> {
  try {
    // Vérifier si l'item existe
    const existingItem = await prisma.item.findUnique({
      where: { id: itemId }
    })

    if (!existingItem) {
      return {
        success: false,
        message: 'Item non trouvé'
      }
    }

    // Mettre à jour le statut de l'item
    await prisma.item.update({
      where: { id: itemId },
      data: { status: newStatus as any }
    })

    // Revalider le chemin pour rafraîchir les données sur l'interface
    revalidatePath('/shopify/collections')

    return {
      success: true,
      message: 'Statut de l\'item mis à jour avec succès'
    }
  } catch (error) {
    console.error('Erreur lors de la mise à jour du statut:', error)
    return {
      success: false,
      message: error instanceof Error ? error.message : 'Une erreur est survenue lors de la mise à jour du statut'
    }
  }
}

/**
 * Vérifie le statut d'un item en base de données
 */
export async function checkItemStatus({
  idProductShopify,
  idUser
}: CheckStatusParams): Promise<StatusCheckResult> {
  try {
    const item = await prisma.item.findFirst({
      where: {
        idShopify: idProductShopify,
        idUser: idUser
      },
      select: {
        status: true
      }
    })

    if (item) {
      return {
        exists: true,
        status: item.status
      }
    }

    return {
      exists: false
    }
  } catch (error) {
    console.error('Erreur lors de la vérification du statut:', error)
    return {
      exists: false
    }
  }
}

/**
 * Sauvegarde un certificat d'authenticité pour un item spécifique
 */
export async function saveAuthCertificate(itemId: number, fileData: Uint8Array) {
  console.log('saveAuthCertificate === ', itemId, fileData);
  try {
    const certificate = await prismaClient.authCertificate.create({
      data: {
        idItem: itemId,
        file: fileData
      }
    })

    return certificate
  } catch (error) {
    console.error('Erreur lors de la sauvegarde du certificat d\'authenticité:', error)
    throw new Error('Échec de la sauvegarde du certificat d\'authenticité')
  }
}

/**
 * Récupère le certificat d'authenticité pour un item spécifique
 */
export async function getAuthCertificateByItemId(itemId: number) {
  try {
    // Récupérer le certificat
    const certificate = await prisma.authCertificate.findFirst({
      where: {
        idItem: itemId
      }
    })

    if (!certificate) {
      return null
    }

    // Créer une URL temporaire pour le fichier PDF
    const fileUrl = `/api/certificates/${certificate.id}`

    return {
      id: certificate.id,
      fileUrl
    }
  } catch (error) {
    console.error('Erreur lors de la récupération du certificat:', error)
    return null
  }
}

export async function getItemByShopifyId(shopifyId: bigint) {
  try {
    const item = await prisma.item.findFirst({
      where: { idShopify: shopifyId }
    })
    return serializeData(item)
  } catch (error) {
    console.error('Erreur lors de la récupération de l\'item:', error)
    return null
  }
}

// Fonction pour récupérer l'utilisateur associé à un item
export async function getUserByItemId(itemId: number) {
  try {
    const item = await prisma.item.findUnique({
      where: { id: itemId },
      include: { user: true }
    })

    if (!item || !item.user) {
      return null
    }

    return serializeData(item.user)
  } catch (error) {
    console.error('Erreur lors de la récupération de l\'utilisateur par itemId:', error)
    return null
  }
}

// Fonction pour récupérer un item par son ID
export async function getItemById(itemId: number) {
  console.log('Recherche de l\'item avec l\'ID de base de données:', itemId)
  try {
    const item = await prisma.item.findUnique({
      where: { id: itemId }
    })

    if (item) {
      console.log('Item trouvé - ID en base de données:', item.id, 'ID Shopify:', item.idShopify.toString())
    } else {
      console.log('Aucun item trouvé avec cet ID')
    }

    return serializeData(item)
  } catch (error) {
    console.error('Erreur lors de la récupération de l\'item par ID:', error)
    throw error
  }
}


/**
 * Récupère toutes les collections
 */
export async function getAllCollections() {
  try {
    // Récupérer toutes les collections sans filtrer par statut
    const collections = await prisma.nftCollection.findMany({
      select: {
        id: true,
        name: true,
        symbol: true,
        status: true,
        artist: {
          select: {
            name: true,
            surname: true,
            pseudo: true
          }
        }
      },
      // Sans condition de filtrage sur le statut
      orderBy: {
        name: 'asc'
      }
    })

    // Filtrer côté serveur plutôt que dans la requête
    const confirmedCollections = collections.filter(
      collection => collection.status === 'confirmed'
    )

    return confirmedCollections
  } catch (error) {
    console.error('Erreur lors de la récupération des collections:', error)
    return [] // Retourner un tableau vide en cas d'erreur
  }
}

/**
 * Crée une ressource NFT
 */
export async function createNftResource(params: {
  itemId: string,
  imageUri: string,
  tokenUri: string,
  certificateUri: string,
  type: 'IMAGE' | 'VIDEO',
  status: 'UPLOADIPFS' | 'UPLOADCERTIFICATE' | 'UPLOADMETADATA' | 'MINED' | 'LISTED' | 'SOLD',
  name: string,
  description: string,
  collectionId: number
}) {
  try {
    const { itemId, imageUri, certificateUri, tokenUri, type, status, name, description, collectionId } = params

    // Vérifier si l'item existe
    const item = await prisma.item.findUnique({
      where: { id: parseInt(itemId) }
    })

    if (!item) {
      return {
        success: false,
        error: 'Item non trouvé'
      }
    }

    // Vérifier si la collection existe
    const collection = await prisma.nftCollection.findUnique({
      where: { id: collectionId }
    })

    if (!collection) {
      return {
        success: false,
        error: 'Collection non trouvée'
      }
    }

    // Créer la ressource NFT
    const mockups: string[] = []
    const tags: string[] = []

    const nftResource = await prisma.nftResource.create({
      data: {
        imageUri,
        certificateUri,
        tokenUri,
        type,
        status,
        name,
        description,
        mockups,
        tags,
        collection: { connect: { id: collectionId } },
        items: { connect: { id: parseInt(itemId) } },
        minter: '', // À remplir lors du minting
        purchasedOnce: false
      }
    })

    return {
      success: true,
      nftResource
    }
  } catch (error: any) {
    console.error('Erreur lors de la création de la ressource NFT:', error)

    return {
      success: false,
      error: error.message || 'Une erreur est survenue lors de la création de la ressource NFT'
    }
  }
}

/**
 * Récupère la ressource NFT associée à un item spécifique
 * en utilisant le champ idNftResource de l'item
 * @param itemId - L'ID de l'item pour lequel récupérer la ressource NFT
 * @returns La ressource NFT associée à l'item ou null si aucune n'est trouvée
 */
export async function getNftResourceByItemId(itemId: number) {
  try {
    // Récupérer d'abord l'item pour obtenir l'idNftResource
    const item = await prisma.item.findUnique({
      where: {
        id: itemId
      },
      select: {
        idNftResource: true
      }
    })

    // Si l'item n'existe pas ou n'a pas d'idNftResource, retourner null
    if (!item || !item.idNftResource) {
      return null
    }

    // Récupérer la ressource NFT avec toutes les informations de la collection
    const nftResource = await prisma.nftResource.findUnique({
      where: {
        id: item.idNftResource
      },
      include: {
        collection: {
          select: {
            id: true,
            name: true,
            symbol: true,
            status: true,
            contractAddress: true,
            smartContractId: true,
            artist: {
              select: {
                id: true,
                name: true,
                surname: true,
                pseudo: true,
                publicKey: true
              }
            },
            smartContract: {
              select: {
                id: true,
                factoryAddress: true,
                royaltiesAddress: true,
                marketplaceAddress: true,
                network: true,
                active: true
              }
            }
          }
        }
      }
    })

    return nftResource
  } catch (error) {
    console.error('Erreur lors de la récupération de la ressource NFT:', error)
    return null
  }
}


export async function getPendingItemsCount() {
  try {
    const count = await prisma.item.count({
      where: {
        status: ItemStatus.pending
      }
    })
    return { count }
  } catch (error) {
    console.error('Erreur lors du comptage des items en attente:', error)
    return { count: 0 }
  }
}

/**
 * Vérifie si un utilisateur est administrateur
 * @param email - L'email de l'utilisateur
 * @param walletAddress - L'adresse du portefeuille de l'utilisateur
 * @returns Un objet contenant le statut admin et une erreur éventuelle
 */
export async function checkIsAdmin(email?: string | null, walletAddress?: string | null): Promise<{
  isAdmin: boolean,
  error?: string
}> {
  try {
    if (!email && !walletAddress) {
      return {
        isAdmin: false,
        error: 'Email ou adresse de portefeuille requis'
      }
    }

    // Recherche de l'utilisateur par email ou walletAddress
    const user = await prisma.backofficeUser.findFirst({
      where: {
        OR: [
          { email: email || null },
          { walletAddress: walletAddress || '' }
        ]
      },
      select: {
        role: true
      }
    })

    // Vérification du rôle admin
    const isAdmin = user?.role === 'admin'

    // Utiliser serializeData pour s'assurer que tous les objets sont sérialisables
    return serializeData({ isAdmin })
  } catch (error) {
    console.error('Erreur lors de la vérification du rôle admin:', error)
    return {
      isAdmin: false,
      error: (error as Error).message
    }
  }
}

/**
 * Récupère toutes les collections associées à des smart contracts actifs
 */
export async function getActiveCollections() {
  try {
    const collections = await prisma.nftCollection.findMany({
      where: {
        smartContract: {
          active: true
        }
      },
      select: {
        id: true,
        name: true,
        symbol: true,
        status: true,
        contractAddress: true,
        smartContractId: true,
        artist: {
          select: {
            id: true,
            name: true,
            surname: true,
            pseudo: true,
            publicKey: true
          }
        },
        smartContract: {
          select: {
            id: true,
            factoryAddress: true,
            royaltiesAddress: true,
            marketplaceAddress: true,
            network: true
          }
        }
      },
      orderBy: {
        name: 'asc'
      }
    });

    return collections;
  } catch (error) {
    console.error('Erreur lors de la récupération des collections actives:', error);
    throw error;
  }
}

export async function getUserMintedItemsCount(userId: number) {
  try {
    const count = await prisma.item.count({
      where: {
        idUser: userId,
        status: ItemStatus.minted
      }
    })
    return { count }
  } catch (error) {
    console.error('Erreur lors du comptage des items mintés:', error)
    return { count: 0 }
  }
}

export async function getUserListedItemsCount(userId: number) {
  try {
    const count = await prisma.item.count({
      where: {
        idUser: userId,
        status: ItemStatus.listed
      }
    })
    return { count }
  } catch (error) {
    console.error('Erreur lors du comptage des items en vente:', error)
    return { count: 0 }
  }
}

/**
 * Vérifie si un nom de NFT existe déjà dans la table NftResource
 * @param name Le nom du NFT à vérifier
 * @returns true si le nom existe déjà, false sinon
 */
export async function checkNftResourceNameExists(name: string): Promise<boolean> {
  'use server'

  try {
    const existingResource = await prisma.nftResource.findFirst({
      where: {
        name: {
          equals: name,
          mode: 'insensitive'
        }
      }
    })

    return !!existingResource
  } catch (error) {
    console.error('Erreur lors de la vérification du nom NFT:', error)
    throw new Error('Impossible de vérifier l\'unicité du nom NFT')
  }
}

//--------------------------------------------------------------------------
// Mise à jour du txHash de la resource NFT
//--------------------------------------------------------------------------
export async function updateNftResourceTxHash(id: number, txHash: string) {
  try {
    await prisma.nftResource.update({
      where: { id },
      data: {
        transactionHash: txHash
      }
    })

    return { success: true }
  } catch (error) {
    console.error('Erreur lors de la mise à jour du txHash:', error)
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Une erreur inconnue est survenue'
    }
  }
}

/**
 * Met à jour le statut d'une ressource NFT à MINTED
 * @param id - L'ID de la ressource NFT à mettre à jour
 * @returns Un objet indiquant le succès ou l'échec de l'opération
 */
export async function updateNftResourceStatusToMinted(id: number): Promise<UpdateNftResourceStatusResult> {
  try {
    // Vérifier si la ressource existe
    const existingResource = await prisma.nftResource.findUnique({
      where: { id }
    })

    if (!existingResource) {
      return {
        success: false,
        message: 'Ressource NFT non trouvée'
      }
    }

    // Mettre à jour le statut de la ressource NFT
    await prisma.nftResource.update({
      where: { id },
      data: {
        status: ResourceNftStatuses.MINED
      }
    })

    // Revalider les chemins potentiels où cette donnée pourrait être affichée
    revalidatePath('/marketplace/nftsToMint')

    return {
      success: true,
      message: 'Statut de la ressource NFT mis à jour avec succès'
    }
  } catch (error) {
    console.error('Erreur lors de la mise à jour du statut de la ressource NFT:', error)
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Une erreur inconnue est survenue lors de la mise à jour du statut'
    }
  }
}

/**
 * Extrait le tokenId des logs de transaction et met à jour la ressource NFT
 * @param id - L'ID de la ressource NFT à mettre à jour
 * @param transactionHash - Le hash de la transaction de minting
 * @param minterWallet - L'adresse du wallet qui a minté le NFT
 * @param contractAddress - L'adresse du smart contract de la collection NFT
 * @returns Un objet indiquant le succès ou l'échec de l'opération avec le tokenId extrait
 */
export async function updateNftResourceTokenId(
  id: number,
  transactionHash: string,
  minterWallet?: string,
  contractAddress?: string
): Promise<UpdateTokenIdResult> {
  try {
    // Vérifier si la ressource existe
    const existingResource = await prisma.nftResource.findUnique({
      where: { id }
    })

    if (!existingResource) {
      return {
        success: false,
        message: 'Ressource NFT non trouvée'
      }
    }

    // Récupérer les logs de transaction pour extraire le tokenId
    const receipt = await serverPublicClient.getTransactionReceipt({
      hash: transactionHash as `0x${string}`
    })

    if (!receipt) {
      return {
        success: false,
        message: 'Transaction toujours en attente de confirmation'
      }
    }

    if (receipt.status !== 'success') {
      return {
        success: false,
        message: 'La transaction a échoué'
      }
    }

    // Chercher l'événement NftMinted dans les logs
    let tokenId: bigint | undefined

    for (const log of receipt.logs) {
      try {
        const event = decodeEventLog({
          abi: artistNftCollectionAbi,
          data: log.data,
          topics: log.topics,
          eventName: 'NftMinted'
        })

        if (event.eventName === 'NftMinted') {
          const args = event.args as any
          tokenId = args.tokenId
          break
        }
      } catch (e) {
        // Ignorer les erreurs de décodage, continuer à vérifier les autres logs
        continue
      }
    }

    if (!tokenId) {
      return {
        success: false,
        message: 'Impossible de trouver le tokenId dans les logs de la transaction'
      }
    }

    // Convertir le tokenId en string pour le stockage
    const tokenIdString = tokenId.toString()

    // Préparer les données de mise à jour
    const updateData: any = {
      tokenId: parseInt(tokenIdString)
    }

    // Ajouter le minter s'il est fourni
    if (minterWallet) {
      updateData.minter = minterWallet
    }

    // Ajouter l'owner (adresse du contrat) s'il est fourni
    if (contractAddress) {
      updateData.owner = contractAddress
    }

    // Mettre à jour la ressource NFT avec toutes les données
    await prisma.nftResource.update({
      where: { id },
      data: updateData
    })

    // Revalider les chemins potentiels où cette donnée pourrait être affichée
    revalidatePath('/marketplace/nftsToMint')

    return {
      success: true,
      tokenId: tokenIdString,
      message: 'TokenId, minter et owner de la ressource NFT mis à jour avec succès'
    }
  } catch (error) {
    console.error('Erreur lors de la mise à jour des données de la ressource NFT:', error)
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Une erreur inconnue est survenue lors de la mise à jour des données'
    }
  }
}
