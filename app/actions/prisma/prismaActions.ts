'use server';

import { memberSchema } from "@/app/(admin)/shopify/create-member/schema";
import { MemberFormData } from "@/app/(admin)/shopify/create-member/schema";
import { prisma } from "@/lib/prisma"
import { NotificationStatus, BackofficeUser, ResourceTypes, ResourceNftStatuses, CollectionStatus } from "@prisma/client"
import { revalidatePath } from "next/cache";
import { PrismaClient } from '@prisma/client'
const prismaClient = new PrismaClient()

type UpdateNotificationResult = {
  success: boolean
  message: string
}

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

// Action pour mettre à jour le statut d'une notification
export async function updateNotificationStatus(
  notificationId: number,
  status: NotificationStatus
): Promise<UpdateNotificationResult> {
  try {
    if (!notificationId) {
      return {
        success: false,
        message: 'ID de notification requis'
      }
    }

    // Mise à jour du statut de la notification
    await prisma.notification.update({
      where: {
        id: notificationId
      },
      data: {
        status: status,
        complete: true
      }
    })


    // Revalider le chemin des notifications pour forcer le rafraîchissement
    revalidatePath('/notifications')

    return {
      success: true,
      message: `Statut de la notification mis à jour avec succès`
    }
  } catch (error: any) {
    console.error('Erreur serveur lors de la mise à jour de notification:', error)
    return {
      success: false,
      message: error.message || 'Une erreur est survenue lors de la mise à jour du statut'
    }
  }
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



export async function createItemRecord(userId: number, shopifyId: string, status: string = 'created') {
  try {
    const shopifyIdString = shopifyId.toString()


    // Créer l'enregistrement dans la table Item
    const newItem = await prisma.item.create({
      data: {
        idUser: userId,
        idShopify: parseInt(shopifyIdString),
        status: status as any
      }
    })

    return { success: true, item: newItem }
  } catch (error) {
    console.error('Erreur lors de la création de l\'enregistrement Item:', error)
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Erreur inconnue'
    }
  }
}

/**
 * Met à jour le statut d'un produit Shopify
 */
export async function updateItemStatus({
  idProductShopify,
  idUser,
  status
}: UpdateStatusParams): Promise<StatusUpdateResult> {
  try {
    // Vérifier si le produit existe déjà dans notre base
    const existingProduct = await prisma.item.findFirst({
      where: {
        idShopify: idProductShopify,
        idUser: idUser
      }
    })

    if (existingProduct) {
      // Mettre à jour le statut du produit existant
      await prisma.item.update({
        where: { id: existingProduct.id },
        data: { status: status as any }
      })
    } else {
      // Créer une nouvelle entrée si le produit n'existe pas
      await prisma.item.create({
        data: {
          idShopify: idProductShopify,
          idUser: idUser,
          status: status as any
        }
      })
    }

    // Revalider le chemin pour rafraîchir les données sur l'interface
    revalidatePath('/shopify/collections')

    return {
      success: true,
      message: 'Statut du produit mis à jour avec succès'
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
    return item
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

    return item.user
  } catch (error) {
    console.error('Erreur lors de la récupération de l\'utilisateur par itemId:', error)
    return null
  }
}

// Fonction pour récupérer un item par son ID
export async function getItemById(itemId: number) {
  try {
    const item = await prisma.item.findUnique({
      where: { id: itemId }
    })

    return item
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
    const collections = await prisma.collection.findMany({
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
  certificateUri: string,
  type: 'IMAGE' | 'VIDEO',
  status: 'UPLOADIPFS' | 'UPLOADCERTIFICATE' | 'UPLOADMETADATA' | 'MINED' | 'LISTED' | 'SOLD',
  name: string,
  description: string,
  collectionId: number
}) {
  try {
    const { itemId, imageUri, certificateUri, type, status, name, description, collectionId } = params

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
    const collection = await prisma.collection.findUnique({
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

    // Récupérer la ressource NFT en utilisant l'idNftResource de l'item
    // et inclure la collection associée via le champ collectionId
    const nftResource = await prisma.nftResource.findUnique({
      where: {
        id: item.idNftResource
      },
      include: {
        collection: {
          select: {
            id: true,
            name: true
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