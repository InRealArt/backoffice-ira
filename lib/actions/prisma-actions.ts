'use server';

import { memberSchema } from "@/app/(admin)/boAdmin/create-member/schema";
import { MemberFormData } from "@/app/(admin)/boAdmin/create-member/schema";
import { prisma } from "@/lib/prisma"
import { BackofficeUser, WhiteListedUser, Artist, ResourceTypes, ResourceNftStatuses, CollectionStatus, ItemStatus, NetworkType, PhysicalItemStatus, NftItemStatus } from "@prisma/client"
import { revalidatePath } from "next/cache";
import { PrismaClient } from '@prisma/client'
import { Decimal } from '@prisma/client/runtime/library'
import { artistNftCollectionAbi } from "@/lib/contracts/ArtistNftCollectionAbi";
import { decodeEventLog } from "viem";
import { serverPublicClient } from "@/lib/server-providers";

type CreateMemberResult = {
  success: boolean
  message: string
}

type CheckUserExistsParams = {
  email: string;
}

type CheckUserExistsResult = {
  unique: boolean;
  message: string;
}

interface StatusUpdateResult {
  success: boolean
  message?: string
}

interface CheckStatusParams {
  idUser: string
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

interface CreateRoyaltyBeneficiaryResult {
  success: boolean
  message?: string
  error?: string
  beneficiary?: any
}

// Fonction utilitaire pour convertir les objets Decimal en nombres
function serializeData(data: any): any {
  if (data === null || data === undefined) {
    return data
  }

  // Vérifier si c'est un Decimal (instanceof ou par la présence de propriétés spécifiques aux Decimal de Prisma)
  if (data instanceof Decimal || (typeof data === 'object' && data !== null && 'd' in data && 'e' in data && 's' in data && typeof data.toString === 'function')) {
    return parseFloat(data.toString())
  }

  if (Array.isArray(data)) {
    return data.map(item => serializeData(item))
  }

  if (typeof data === 'object') {
    // Ignorer les objets Date, etc.
    if (data instanceof Date) {
      return data.toISOString()
    }

    const result: Record<string, any> = {}
    for (const key in data) {
      if (data.hasOwnProperty(key)) {
        result[key] = serializeData(data[key])
      }
    }
    return result
  }

  return data
}

export async function createMember(data: MemberFormData): Promise<CreateMemberResult> {
  try {
    // Valider les données avec Zod
    const validatedData = memberSchema.parse(data)

    // Vérifier si l'email existe déjà dans WhiteListedUser
    const existingUser = await prisma.whiteListedUser.findUnique({
      where: { email: validatedData.email }
    })

    if (existingUser) {
      return {
        success: false,
        message: 'Un utilisateur avec cet email existe déjà'
      }
    }

    // Si le rôle est "artist" et qu'un artistId est fourni, vérifier que l'artiste existe
    if (validatedData.role === 'artist' && validatedData.artistId) {
      const artist = await prisma.artist.findUnique({
        where: { id: validatedData.artistId }
      })

      if (!artist) {
        return {
          success: false,
          message: 'L\'artiste sélectionné n\'existe pas'
        }
      }
    }

    // Créer l'utilisateur dans la table WhiteListedUser
    await prisma.whiteListedUser.create({
      data: {
        email: validatedData.email,
        role: validatedData.role,
        artistId: (validatedData.role === 'artist' || validatedData.role === 'galleryManager') ? validatedData.artistId : null
      }
    })

    // Rafraîchir les pages concernées
    revalidatePath('/boAdmin/users')

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
    // Vérifier si l'email existe déjà dans WhiteListedUser
    const existingUser = await prisma.whiteListedUser.findUnique({
      where: { email: params.email.toLowerCase() }
    })

    if (existingUser) {
      return {
        unique: false,
        message: 'Un utilisateur avec cet email existe déjà'
      }
    }

    // Si aucun utilisateur existant n'est trouvé, l'email est unique
    return {
      unique: true,
      message: 'L\'email est unique'
    }
  } catch (error) {
    console.error('Erreur lors de la vérification de l\'unicité:', error)
    return {
      unique: false,
      message: 'Une erreur est survenue lors de la vérification de l\'unicité. Veuillez réessayer.'
    }
  }
}

export async function getWhiteListedUsers(): Promise<(WhiteListedUser & { artist: Artist | null })[]> {
  try {
    const users = await prisma.whiteListedUser.findMany({
      include: {
        artist: true
      },
      orderBy: {
        id: 'desc'
      }
    })

    return users
  } catch (error) {
    console.error('Erreur lors de la récupération des utilisateurs whitelistés:', error)
    return []
  }
}

// Fonction de compatibilité - utilise WhiteListedUser maintenant
export async function getBackofficeUsers(): Promise<any[]> {
  return getWhiteListedUsers()
}

type UpdateBackofficeUserResult = {
  success: boolean
  message: string
}

// Récupérer un utilisateur whitelisté par son ID
export async function getWhiteListedUserById(id: string) {
  try {
    const user = await prisma.whiteListedUser.findUnique({
      where: { id: parseInt(id) },
      include: { artist: true }
    })

    return user
  } catch (error) {
    console.error('Erreur lors de la récupération de l\'utilisateur whitelisté:', error)
    return null
  }
}

// Fonction de compatibilité
export async function getBackofficeUserById(id: string) {
  return getWhiteListedUserById(id)
}

// Mettre à jour un utilisateur whitelisté
export async function updateWhiteListedUser(
  data: any
): Promise<UpdateBackofficeUserResult> {
  try {
    // Vérifier si l'utilisateur existe
    const existingUser = await prisma.whiteListedUser.findUnique({
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
      const emailExists = await prisma.whiteListedUser.findFirst({
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

    // Si le rôle est "artist", vérifier que l'artistId est fourni
    if (data.role === 'artist' && !data.artistId) {
      return {
        success: false,
        message: 'Un artiste doit être sélectionné pour un utilisateur avec le rôle "artist"'
      }
    }

    // Si le rôle n'est pas "artist", s'assurer que artistId est null
    const artistId = data.role === 'artist' ? data.artistId : null

    // Mettre à jour l'utilisateur dans WhiteListedUser
    await prisma.whiteListedUser.update({
      where: { id: parseInt(data.id) },
      data: {
        email: data.email,
        role: data.role || null,
        artistId: artistId
      }
    })

    // Revalider les chemins pour forcer le rafraîchissement
    revalidatePath(`/boAdmin/users/${data.id}/edit`)
    revalidatePath('/boAdmin/users')

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

// Fonction de compatibilité
export async function updateBackofficeUser(
  data: any
): Promise<UpdateBackofficeUserResult> {
  return updateWhiteListedUser(data)
}

// Ajouter cette fonction pour récupérer un utilisateur par son email
export async function getBackofficeUserByEmail(email: string) {
  try {
    const user = await prisma.backofficeAuthUser.findUnique({
      where: { email },
      include: { artist: true }
    })

    console.log('🔍 DEBUG getBackofficeUserByEmail - email:', email);
    console.log('🔍 DEBUG getBackofficeUserByEmail - user:', user);
    console.log('🔍 DEBUG getBackofficeUserByEmail - user?.artistId:', user?.artistId);
    console.log('🔍 DEBUG getBackofficeUserByEmail - user?.artist:', user?.artist);

    return user
  } catch (error) {
    console.error('Erreur lors de la récupération de l\'utilisateur Backoffice par email:', error)
    return null
  }
}

// Fonction pour récupérer les adresses d'un utilisateur backoffice
export async function getBackofficeUserAddresses(email: string) {
  try {
    // Récupérer le BackofficeAuthUser avec ses adresses via la relation
    const backofficeUser = await prisma.backofficeAuthUser.findUnique({
      where: { email },
      include: {
        artistAddresses: {
          select: {
            id: true,
            name: true,
            firstName: true,
            lastName: true,
            streetAddress: true,
            postalCode: true,
            city: true,
            country: true
          },
          orderBy: {
            name: 'asc'
          }
        }
      }
    })

    if (!backofficeUser) {
      return []
    }

    return serializeData(backofficeUser.artistAddresses || [])
  } catch (error) {
    console.error('Erreur lors de la récupération des adresses:', error)
    // Retourner un tableau vide en cas d'erreur
    return []
  }
}

/**
 * Génère un slug unique pour un item
 */
async function generateUniqueSlug(baseSlug: string): Promise<string> {
  // Si le slug de base est vide, null ou undefined, générer un slug par défaut
  if (!baseSlug || baseSlug.trim() === '') {
    baseSlug = `item-${Date.now()}`
  }

  // Nettoyer le slug de base
  baseSlug = baseSlug.trim()

  // Vérifier si le slug de base est disponible
  const existingItem = await prisma.item.findUnique({
    where: { slug: baseSlug },
    select: { id: true, slug: true }
  })

  if (!existingItem) {
    return baseSlug
  }

  // Si le slug existe déjà, ajouter un suffix numérique
  let counter = 1
  let uniqueSlug = `${baseSlug}-${counter}`

  while (true) {
    const conflictingItem = await prisma.item.findUnique({
      where: { slug: uniqueSlug },
      select: { id: true, slug: true }
    })

    if (!conflictingItem) {
      return uniqueSlug
    }

    counter++
    uniqueSlug = `${baseSlug}-${counter}`

    // Limite de sécurité pour éviter une boucle infinie
    if (counter > 1000) {
      return `${baseSlug}-${Date.now()}`
    }
  }
}

export async function createItemRecord(
  userId: string,
  status: string,
  tags: string[] = [],
  itemData?: {
    name?: string,
    metaTitle?: string,
    metaDescription?: string,
    description?: string,
    slug?: string,
    mainImageUrl?: string | null,
    artistId?: number | null
  },
  physicalItemData?: {
    price?: number,
    initialQty?: number,
    height?: number,
    width?: number,
    weight?: number,
    creationYear?: number | null,
    shippingAddressId?: number,
    mediumId?: number,
    styleIds?: number[],
    techniqueIds?: number[],
    themeIds?: number[]
  } | null,
  nftItemData?: {
    price?: number,
  } | null
) {
  try {
    // S'assurer que les tags sont bien un tableau de chaînes
    const processedTags = Array.isArray(tags)
      ? tags.filter(tag => tag && typeof tag === 'string')
      : []

    // Générer un slug unique
    const uniqueSlug = await generateUniqueSlug(itemData?.slug || '')

    // Utiliser une transaction Prisma pour garantir l'intégrité des données
    // Soit les deux enregistrements (Item et PhysicalItem) sont créés, soit aucun
    const result = await prisma.$transaction(async (tx) => {
      // Créer l'Item principal sans spécifier d'ID (laisser Prisma générer l'autoincrement)
      const newItem = await tx.item.create({
        data: {
          idUser: userId,
          name: itemData?.name || 'Sans nom',
          tags: processedTags,
          metaTitle: itemData?.metaTitle || '',
          metaDescription: itemData?.metaDescription || '',
          description: itemData?.description || '',
          slug: uniqueSlug,
          mainImageUrl: itemData?.mainImageUrl || null,
          artistId: itemData?.artistId || null
        },
        include: {
          user: true
        }
      })

      // Créer le PhysicalItem si les données sont fournies
      if (physicalItemData) {
        const physicalItem = await tx.physicalItem.create({
          data: {
            itemId: newItem.id,
            price: physicalItemData.price || 0,
            initialQty: physicalItemData.initialQty || 1,
            stockQty: physicalItemData.initialQty || 1, // Initialiser le stock avec la quantité initiale
            height: physicalItemData.height ? new Decimal(physicalItemData.height) : null,
            width: physicalItemData.width ? new Decimal(physicalItemData.width) : null,
            weight: physicalItemData.weight ? new Decimal(physicalItemData.weight) : null,
            creationYear: physicalItemData.creationYear || null,
            shippingAddressId: physicalItemData.shippingAddressId || null,
            mediumId: physicalItemData.mediumId || null,
            status: status as PhysicalItemStatus // Utiliser status comme enum pour PhysicalItem
          }
        })

        // Créer les relations many-to-many pour les styles
        if (physicalItemData.styleIds && physicalItemData.styleIds.length > 0) {
          await tx.itemStyle.createMany({
            data: physicalItemData.styleIds.map(styleId => ({
              physicalItemId: physicalItem.id,
              styleId
            }))
          })
        }

        // Créer les relations many-to-many pour les techniques
        if (physicalItemData.techniqueIds && physicalItemData.techniqueIds.length > 0) {
          await tx.itemTechnique.createMany({
            data: physicalItemData.techniqueIds.map(techniqueId => ({
              physicalItemId: physicalItem.id,
              techniqueId
            }))
          })
        }

        // Créer les relations many-to-many pour les thèmes
        if (physicalItemData.themeIds && physicalItemData.themeIds.length > 0) {
          await tx.itemTheme.createMany({
            data: physicalItemData.themeIds.map(themeId => ({
              physicalItemId: physicalItem.id,
              themeId
            }))
          })
        }
      }

      return newItem
    })

    return serializeData({ success: true, item: result })
  } catch (error) {
    console.error('Erreur lors de la création de l\'item:', error)

    // Analyser l'erreur pour identifier quelle contrainte unique a échoué
    let errorMessage = 'Une erreur est survenue lors de la création de l\'item'

    if (error instanceof Error) {
      const errorText = error.message

      if (errorText.includes('Unique constraint failed')) {
        if (errorText.includes('slug')) {
          errorMessage = 'Un item avec ce slug existe déjà. Veuillez choisir un nom différent.'
        } else if (errorText.includes('id')) {
          errorMessage = 'Erreur de génération d\'identifiant unique. Veuillez réessayer.'
        } else {
          errorMessage = `Contrainte d'unicité échouée: ${errorText}`
        }
      } else {
        errorMessage = error.message
      }
    }

    return {
      success: false,
      error: errorMessage
    }
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
      where: { id: itemId },
      select: {
        id: true,
        physicalItem: {
          select: {
            id: true
          }
        }
      }
    })

    if (!existingItem) {
      return {
        success: false,
        message: 'Item non trouvé'
      }
    }

    // Mise à jour des statuts dans une transaction pour garantir la cohérence
    await prisma.$transaction(async (tx) => {
      // Mettre à jour le statut du PhysicalItem s'il existe
      if (existingItem.physicalItem) {
        await tx.physicalItem.update({
          where: { id: existingItem.physicalItem.id },
          data: { status: newStatus as PhysicalItemStatus }
        })
      }
    })

    // Revalider le chemin pour rafraîchir les données sur l'interface
    revalidatePath('/art/collections')

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
export async function checkItemStatus({ idUser }: CheckStatusParams): Promise<StatusCheckResult> {
  try {
    const item = await prisma.item.findFirst({
      where: {
        idUser: idUser
      },
      include: {
        physicalItem: {
          select: { status: true }
        }
      }
    })

    if (item) {
      // Déterminer le statut à retourner (priorité au NFT si les deux existent)
      const status = item.physicalItem?.status || 'created'

      return {
        exists: true,
        status: status
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
  try {
    // D'abord récupérer l'item pour obtenir le PhysicalItem associé
    const physicalItem = await prisma.physicalItem.findUnique({
      where: { itemId }
    })

    if (!physicalItem) {
      console.warn(`Aucun PhysicalItem trouvé pour l'itemId ${itemId}. Le certificat ne peut être sauvegardé que pour des œuvres physiques.`)
      return null
    }

    // Convertir Uint8Array en Buffer pour la compatibilité Prisma
    const fileBuffer = Buffer.from(fileData)

    // Maintenant créer le certificat avec la référence correcte au physicalItemId
    const certificate = await prisma.authCertificatePhysicalArtwork.create({
      data: {
        physicalItemId: physicalItem.id,
        file: fileBuffer
      }
    })

    return certificate
  } catch (error) {
    console.error('Erreur lors de la sauvegarde du certificat d\'authenticité:', error)
    throw new Error('Échec de la sauvegarde du certificat d\'authenticité')
  }
}

/**
 * Sauvegarde un certificat d'œuvre physique pour un item spécifique
 */
export async function savePhysicalCertificate(itemId: number, fileData: Uint8Array) {
  try {
    // D'abord récupérer l'item pour obtenir le PhysicalItem associé
    const physicalItem = await prisma.physicalItem.findUnique({
      where: { itemId }
    })

    if (!physicalItem) {
      console.warn(`Aucun PhysicalItem trouvé pour l'itemId ${itemId}. Le certificat ne peut être sauvegardé que pour des œuvres physiques.`)
      return null
    }

    // Convertir Uint8Array en Buffer pour la compatibilité Prisma
    const fileBuffer = Buffer.from(fileData)

    // Maintenant créer le certificat avec la référence correcte au physicalItemId
    const certificate = await prisma.authCertificatePhysicalArtwork.create({
      data: {
        physicalItemId: physicalItem.id,
        file: fileBuffer
      }
    })

    return certificate
  } catch (error) {
    console.error('Erreur lors de la sauvegarde du certificat d\'œuvre physique:', error)
    throw new Error('Échec de la sauvegarde du certificat d\'œuvre physique')
  }
}

/**
 * Sauvegarde un certificat NFT pour un item spécifique
 */
export async function saveNftCertificate(itemId: number, fileData: Uint8Array) {
  try {
    // D'abord récupérer l'item pour obtenir le PhysicalItem associé
    const physicalItem = await prisma.physicalItem.findUnique({
      where: { itemId }
    })

    if (!physicalItem) {
      console.warn(`Aucun PhysicalItem trouvé pour l'itemId ${itemId}. Le certificat ne peut être sauvegardé que pour des œuvres physiques.`)
      return null
    }

    // Convertir Uint8Array en Buffer pour la compatibilité Prisma
    const fileBuffer = Buffer.from(fileData)

    // Maintenant créer le certificat avec la référence correcte au physicalItemId
    const certificate = await prisma.authCertificatePhysicalArtwork.create({
      data: {
        physicalItemId: physicalItem.id,
        file: fileBuffer
      }
    })

    return certificate
  } catch (error) {
    console.error('Erreur lors de la sauvegarde du certificat NFT:', error)
    throw new Error('Échec de la sauvegarde du certificat NFT')
  }
}


/**
 * Récupère le certificat d'œuvre physique pour un item spécifique
 */
export async function getPhysicalCertificateByItemId(itemId: number) {
  try {
    // D'abord récupérer le PhysicalItem associé à l'item
    // Sélection explicite pour éviter les champs qui n'existent pas en base
    const physicalItem = await prisma.physicalItem.findUnique({
      where: { itemId },
      select: {
        id: true
      }
    })

    if (!physicalItem) {
      console.log(`Aucun PhysicalItem trouvé pour l'itemId ${itemId}`)
      return null
    }

    // Ensuite récupérer le certificat associé au PhysicalItem
    const certificate = await prisma.authCertificatePhysicalArtwork.findFirst({
      where: {
        physicalItemId: physicalItem.id
      }
    })

    if (!certificate) {
      console.log(`Aucun certificat trouvé pour le PhysicalItem ${physicalItem.id}`)
      return null
    }

    // Créer une URL temporaire pour le fichier PDF
    const fileUrl = `/api/certificates/${certificate.id}`

    return {
      id: certificate.id,
      fileUrl
    }
  } catch (error) {
    console.error('Erreur lors de la récupération du certificat d\'œuvre physique:', error)
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
  try {
    const item = await prisma.item.findUnique({
      where: { id: itemId },
      select: {
        id: true,
        name: true,
        description: true,
        tags: true,
        metaTitle: true,
        metaDescription: true,
        slug: true,
        mainImageUrl: true,
        secondaryImagesUrl: true,
        idUser: true,
        artistId: true,
        physicalItem: {
          select: {
            id: true,
            price: true,
            status: true,
            initialQty: true,
            stockQty: true,
            isOnline: true,
            height: true,
            width: true,
            weight: true,
            creationYear: true,
            shippingAddressId: true,
            realViewCount: true,
            fakeViewCount: true,
            // Caractéristiques artistiques (déplacées de Item vers PhysicalItem)
            mediumId: true,
            medium: {
              select: {
                id: true,
                name: true
              }
            },
            itemStyles: {
              select: {
                id: true,
                styleId: true,
                style: {
                  select: {
                    id: true,
                    name: true
                  }
                }
              }
            },
            itemTechniques: {
              select: {
                id: true,
                techniqueId: true,
                technique: {
                  select: {
                    id: true,
                    name: true
                  }
                }
              }
            },
            itemThemes: {
              select: {
                id: true,
                themeId: true,
                theme: {
                  select: {
                    id: true,
                    name: true
                  }
                }
              }
            }
          }
        },
        // Inclure l'utilisateur associé
        user: {
          select: {
            id: true,
            name: true,
            email: true
          }
        }
      }
    });

    if (item) {
      //console.log('Item trouvé - ID en base de données:', item.id)
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
      where: { id: parseInt(itemId) },
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

export async function getPendingItemsCount() {
  try {
    const count = await prisma.item.count({
      where: {
        OR: [
          { physicalItem: { status: PhysicalItemStatus.pending } }
        ]
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

export async function getUserMintedItemsCount(userId: string) {
  try {
    const count = await prisma.item.count({
      where: {
        idUser: userId,
      }
    })
    return { count }
  } catch (error) {
    console.error('Erreur lors du comptage des items mintés:', error)
    return { count: 0 }
  }
}

export async function getUserListedItemsCount(userId: string) {
  try {
    const count = await prisma.item.count({
      where: {
        idUser: userId,
        OR: [
          { physicalItem: { status: PhysicalItemStatus.listed } }
        ]
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
 * Met à jour le statut d'une ressource NFT à MINTED
 * @param id - L'ID de la ressource NFT à mettre à jour
 * @returns Un objet indiquant le succès ou l'échec de l'opération
 */
export async function updateNftResourceStatusToRoyaltySet(id: number): Promise<UpdateNftResourceStatusResult> {
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
        status: ResourceNftStatuses.ROYALTYSET
      }
    })

    // Revalider les chemins potentiels où cette donnée pourrait être affichée
    revalidatePath('/marketplace/royaltiesSettings')

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
* Met à jour le statut d'une ressource NFT à LISTED
* @param id - L'ID de la ressource NFT à mettre à jour
* @returns Un objet indiquant le succès ou l'échec de l'opération
*/
export async function updateNftResourceStatusToListed(id: number): Promise<UpdateNftResourceStatusResult> {
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
        status: ResourceNftStatuses.LISTED
      }
    })

    // Revalider les chemins potentiels où cette donnée pourrait être affichée
    revalidatePath('/marketplace/marketplaceListing')

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

export async function isCertificateUriUnique(uri: string) {
  try {
    const existingResource = await prisma.nftResource.findFirst({
      where: { certificateUri: uri }
    })

    return !!existingResource
  } catch (error) {
    console.error('Erreur lors de la vérification de l\'unicité du certificat:', error)
    throw new Error('Impossible de vérifier l\'unicité du certificat')
  }
}

/**
 * Crée un bénéficiaire de royalties pour une ressource NFT
 * @param nftResourceId - L'ID de la ressource NFT associée
 * @param wallet - L'adresse du portefeuille du bénéficiaire
 * @param percentage - Le pourcentage de royalties (0-100)
 * @param totalPercentage - Le pourcentage total de royalties (0-100)
 * @param txHash - Le hash de la transaction
 * @returns Un objet indiquant le succès ou l'échec de l'opération
 */
export async function createRoyaltyBeneficiary(
  nftResourceId: number,
  wallet: string,
  percentage: number,
  totalPercentage: number,
  txHash: string
): Promise<CreateRoyaltyBeneficiaryResult> {
  try {
    // Vérifier si la ressource NFT existe
    const existingResource = await prisma.nftResource.findUnique({
      where: { id: nftResourceId }
    })

    if (!existingResource) {
      return {
        success: false,
        message: 'Ressource NFT non trouvée'
      }
    }

    // Vérifier que le pourcentage est valide
    if (percentage < 0 || percentage > 100) {
      return {
        success: false,
        message: 'Le pourcentage doit être compris entre 0 et 100'
      }
    }

    // Vérifier si l'adresse wallet est valide (format basique)
    if (!wallet.startsWith('0x') || wallet.length !== 42) {
      return {
        success: false,
        message: 'Format d\'adresse de portefeuille invalide'
      }
    }

    // Créer le bénéficiaire de royalties
    const beneficiary = await prisma.royaltyBeneficiary.create({
      data: {
        wallet,
        percentage,
        totalPercentage,
        txHash,
        nftResourceId
      }
    })

    // Revalider les chemins potentiels où cette donnée pourrait être affichée
    revalidatePath('/marketplace/royaltiesSettings')

    return {
      success: true,
      message: 'Bénéficiaire de royalties créé avec succès',
      beneficiary: serializeData(beneficiary)
    }
  } catch (error) {
    console.error('Erreur lors de la création du bénéficiaire de royalties:', error)
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Une erreur inconnue est survenue lors de la création du bénéficiaire'
    }
  }
}

/**
 * Récupère l'adresse d'un smart contract actif en fonction du type spécifié et du réseau
 * @param type - Le type d'adresse à récupérer: 'Factory', 'Royalties' ou 'Marketplace'
 * @param network - Le réseau sur lequel se trouve le smart contract (optionnel)
 * @returns L'adresse du smart contract correspondant au type et au réseau, ou null si aucun trouvé
 */
export async function getSmartContractAddress(
  type: 'Factory' | 'Royalties' | 'Marketplace',
  network?: NetworkType
): Promise<string | null> {
  try {
    // Préparer la condition de recherche
    const whereCondition: any = {
      active: true
    }

    // Ajouter le filtre par réseau si spécifié
    if (network) {
      whereCondition.network = network
    }

    // Récupérer un smart contract actif sur le réseau spécifié
    const smartContract = await prisma.smartContract.findFirst({
      where: whereCondition,
      select: {
        factoryAddress: true,
        royaltiesAddress: true,
        marketplaceAddress: true,
        network: true
      }
    })

    if (!smartContract) {
      console.error(`Aucun smart contract actif trouvé${network ? ` pour le réseau ${network}` : ''}`)
      return null
    }

    // Retourner l'adresse correspondante selon le type demandé
    switch (type) {
      case 'Factory':
        return smartContract.factoryAddress
      case 'Royalties':
        return smartContract.royaltiesAddress
      case 'Marketplace':
        return smartContract.marketplaceAddress
      default:
        return null
    }
  } catch (error) {
    console.error(`Erreur lors de la récupération de l'adresse du smart contract:`, error)
    return null
  }
}


/**
 * Crée un enregistrement de transaction marketplace pour une ressource NFT
 * @param params - Les paramètres de la transaction
 * @returns Un objet indiquant le succès ou l'échec de l'opération
 */
export async function createMarketPlaceTransaction(params: {
  nftResourceId: number;
  functionName?: string;
  transactionHash?: string;
  from: string;
  to: string;
  price?: number | string;
  transferFrom?: string;
  transferTo?: string;
  contractAddress?: string;
}): Promise<{
  success: boolean;
  message?: string;
  error?: string;
  transaction?: any;
}> {
  'use server';

  try {
    // Vérifier si la ressource NFT existe
    const nftResource = await prisma.nftResource.findUnique({
      where: { id: params.nftResourceId }
    });

    if (!nftResource) {
      return {
        success: false,
        message: 'Ressource NFT non trouvée'
      };
    }

    // Convertir le prix en Decimal si fourni
    let priceDecimal = null;
    if (params.price !== undefined) {
      try {
        priceDecimal = new Decimal(params.price.toString());
      } catch (error) {
        console.error('Erreur lors de la conversion du prix en Decimal:', error);
        return {
          success: false,
          message: 'Format de prix invalide',
          error: 'Le prix fourni ne peut pas être converti en format décimal'
        };
      }
    }

    // Créer l'enregistrement de transaction
    const transaction = await prisma.marketPlaceTransaction.create({
      data: {
        nftResourceId: params.nftResourceId,
        functionName: params.functionName,
        transactionHash: params.transactionHash,
        from: params.from,
        to: params.to,
        price: priceDecimal,
        transferFrom: params.transferFrom,
        transferTo: params.transferTo,
        contractAddress: params.contractAddress,
      }
    });

    // Revalider les chemins pour rafraîchir les données sur l'interface
    revalidatePath('/marketplace/marketplaceListing');
    revalidatePath('/marketplace');

    return {
      success: true,
      message: 'Transaction marketplace enregistrée avec succès',
      transaction: serializeData(transaction)
    };
  } catch (error) {
    console.error('Erreur lors de la création de la transaction marketplace:', error);
    return {
      success: false,
      message: error instanceof Error ? error.message : 'Une erreur est survenue lors de la création de la transaction',
      error: error instanceof Error ? error.message : 'Erreur inconnue'
    };
  }
}

/**
 * Met à jour le propriétaire d'une ressource NFT
 * @param nftResourceId - L'ID de la ressource NFT
 * @param newOwner - La nouvelle adresse du propriétaire
 * @returns Un objet indiquant le succès ou l'échec de l'opération
 */
export async function updateNftResourceOwner(
  nftResourceId: number,
  newOwner: string
): Promise<{
  success: boolean;
  message?: string;
}> {
  'use server';

  try {
    // Vérifier si la ressource NFT existe
    const nftResource = await prisma.nftResource.findUnique({
      where: { id: nftResourceId }
    });

    if (!nftResource) {
      return {
        success: false,
        message: 'Ressource NFT non trouvée'
      };
    }

    // Vérifier que l'adresse du nouveau propriétaire est valide (format basique)
    if (!newOwner.startsWith('0x') || newOwner.length !== 42) {
      return {
        success: false,
        message: 'Format d\'adresse de portefeuille invalide'
      };
    }

    // Stocker l'ancien propriétaire dans previousOwner
    const previousOwner = nftResource.owner;

    // Mettre à jour le propriétaire de la ressource NFT
    await prisma.nftResource.update({
      where: { id: nftResourceId },
      data: {
        owner: newOwner,
        previousOwner: previousOwner || undefined
      }
    });

    // Revalider les chemins pour rafraîchir les données sur l'interface
    revalidatePath('/marketplace/marketplaceListing');
    revalidatePath('/marketplace');

    return {
      success: true,
      message: 'Propriétaire de la ressource NFT mis à jour avec succès'
    };
  } catch (error) {
    console.error('Erreur lors de la mise à jour du propriétaire de la ressource NFT:', error);
    return {
      success: false,
      message: error instanceof Error ? error.message : 'Une erreur est survenue lors de la mise à jour du propriétaire'
    };
  }
}

/**
 * Récupère tous les artistes
 */
export async function getAllArtists() {
  try {
    const artists = await prisma.artist.findMany({
      where: {
        isGallery: false
      },
      select: {
        id: true,
        name: true,
        surname: true,
        pseudo: true,
        description: true,
        publicKey: true,
        imageUrl: true,
        isGallery: true,
        backgroundImage: true,
        BackofficeUser: {
          select: {
            id: true
          }
        }
      },
      orderBy: {
        name: 'asc'
      }
    })

    // Mapper les artistes pour correspondre au type FilterArtist
    return artists.map(artist => {
      const { BackofficeUser, ...artistWithoutBackofficeUser } = artist
      return {
        ...artistWithoutBackofficeUser,
        idUser: BackofficeUser.length > 0 ? String(BackofficeUser[0].id) : null
      }
    })
  } catch (error) {
    console.error('Erreur lors de la récupération des artistes:', error)
    return []
  }
}

/**
 * Récupère tous les artistes
 */
export async function getAllArtistsAndGalleries() {
  try {
    const artists = await prisma.artist.findMany({
      select: {
        id: true,
        name: true,
        surname: true,
        pseudo: true,
        description: true,
        publicKey: true,
        imageUrl: true,
        isGallery: true,
        backgroundImage: true
      },
      orderBy: {
        name: 'asc'
      }
    })

    return artists
  } catch (error) {
    console.error('Erreur lors de la récupération des artistes:', error)
    return []
  }
}

/**
 * Récupère toutes les galleries
 */
export async function getAllGalleries() {
  try {
    const artists = await prisma.artist.findMany({
      where: {
        isGallery: true
      },
      select: {
        id: true,
        name: true,
        surname: true,
        pseudo: true,
        description: true,
        publicKey: true,
        imageUrl: true,
        isGallery: true,
        backgroundImage: true
      },
      orderBy: {
        name: 'asc'
      }
    })

    return artists
  } catch (error) {
    console.error('Erreur lors de la récupération des artistes:', error)
    return []
  }
}

/**
 * Récupère un artiste par son ID
 */
export async function getArtistById(id: number) {
  try {
    const artist = await prisma.artist.findUnique({
      where: { id },
      select: {
        id: true,
        name: true,
        surname: true,
        pseudo: true,
        description: true,
        publicKey: true,
        imageUrl: true,
        isGallery: true,
        backgroundImage: true
      }
    })

    return artist
  } catch (error) {
    console.error('Erreur lors de la récupération de l\'artiste:', error)
    return null
  }
}

/**
 * Récupère tous les Items avec leurs relations pour l'admin
 */
export async function getAllItemsForAdmin() {
  try {
    const items = await prisma.item.findMany({
      include: {
        artist: {
          select: {
            id: true,
            name: true,
            surname: true,
            pseudo: true,
            imageUrl: true,
            BackofficeUser: {
              select: {
                id: true
              }
            }
          }
        },
        physicalItem: {
          select: {
            id: true,
            price: true,
            initialQty: true,
            stockQty: true,
            isOnline: true,
            height: true,
            width: true,
            weight: true,
            creationYear: true,
            status: true,
            // Caractéristiques artistiques
            mediumId: true,
            medium: {
              select: {
                id: true,
                name: true
              }
            },
            itemStyles: {
              select: {
                id: true,
                styleId: true,
                style: {
                  select: {
                    id: true,
                    name: true
                  }
                }
              }
            },
            itemTechniques: {
              select: {
                id: true,
                techniqueId: true,
                technique: {
                  select: {
                    id: true,
                    name: true
                  }
                }
              }
            },
            itemThemes: {
              select: {
                id: true,
                themeId: true,
                theme: {
                  select: {
                    id: true,
                    name: true
                  }
                }
              }
            }
          }
        }
      },
      orderBy: {
        id: 'desc'
      }
    })

    return items.map(item => ({
      ...item,
      // Mapper l'artiste pour correspondre au type ItemWithRelations
      artist: item.artist ? {
        id: item.artist.id,
        name: item.artist.name,
        surname: item.artist.surname,
        pseudo: item.artist.pseudo,
        imageUrl: item.artist.imageUrl,
        backofficeUserId: item.artist.BackofficeUser.length > 0 ? item.artist.BackofficeUser[0].id : null
      } : null
    }))
  } catch (error) {
    console.error('Erreur lors de la récupération des items:', error)
    return []
  }
}

/**
 * Met à jour un item existant
 */
export async function updateItemRecord(
  itemId: number,
  data?: {
    name?: string,
    metaTitle?: string,
    metaDescription?: string,
    description?: string,
    slug?: string,
    tags?: string[],
    mainImageUrl?: string | null,
    artistId?: number | null,
    physicalItemData?: {
      price?: number,
      initialQty?: number,
      height?: number,
      width?: number,
      weight?: number,
      creationYear?: number | null,
      shippingAddressId?: number,
      mediumId?: number,
      styleIds?: number[],
      techniqueIds?: number[],
      themeIds?: number[]
    },
    nftItemData?: {
      price?: number
    }
  }
): Promise<{ success: boolean, message?: string, item?: any }> {
  try {
    // Vérifier si l'item existe
    const existingItem = await prisma.item.findUnique({
      where: { id: itemId },
      select: {
        id: true,
        physicalItem: {
          select: {
            id: true
          }
        }
      }
    })

    if (!existingItem) {
      return {
        success: false,
        message: 'Item non trouvé'
      }
    }

    // Préparer les données de mise à jour pour l'Item principal
    const updateData: any = {}

    // Ajouter les champs s'ils sont fournis
    if (data?.name !== undefined) updateData.name = data.name
    if (data?.metaTitle !== undefined) updateData.metaTitle = data.metaTitle
    if (data?.metaDescription !== undefined) updateData.metaDescription = data.metaDescription
    if (data?.description !== undefined) updateData.description = data.description
    if (data?.slug !== undefined) updateData.slug = data.slug
    if (data?.tags) updateData.tags = data.tags
    if (data?.mainImageUrl !== undefined) updateData.mainImageUrl = data.mainImageUrl
    if (data?.artistId !== undefined) updateData.artistId = data.artistId

    // Mise à jour transaction avec Prisma pour assurer la cohérence des données
    const result = await prisma.$transaction(async (tx) => {
      // Mettre à jour l'item principal
      const updatedItem = await tx.item.update({
        where: { id: itemId },
        data: updateData,
        select: {
          id: true,
          user: {
            select: {
              id: true,
              email: true
            }
          },
          physicalItem: {
            select: {
              id: true
            }
          }
        }
      })

      // Mettre à jour ou créer le PhysicalItem si les données sont fournies
      if (data?.physicalItemData) {
        const physicalData = data.physicalItemData
        const existingPhysicalItem = existingItem.physicalItem

        const physicalUpdateData: any = {}
        if (physicalData.price !== undefined) physicalUpdateData.price = physicalData.price
        if (physicalData.initialQty !== undefined) {
          physicalUpdateData.initialQty = physicalData.initialQty
          physicalUpdateData.stockQty = physicalData.initialQty // Mettre à jour le stock si la quantité initiale a changé
        }
        if (physicalData.height !== undefined) physicalUpdateData.height = new Decimal(physicalData.height)
        if (physicalData.width !== undefined) physicalUpdateData.width = new Decimal(physicalData.width)
        if (physicalData.weight !== undefined) physicalUpdateData.weight = new Decimal(physicalData.weight)
        if (physicalData.creationYear !== undefined) physicalUpdateData.creationYear = physicalData.creationYear
        if (physicalData.shippingAddressId !== undefined) physicalUpdateData.shippingAddressId = physicalData.shippingAddressId
        if (physicalData.mediumId !== undefined) physicalUpdateData.mediumId = physicalData.mediumId

        if (existingPhysicalItem) {
          // Mettre à jour le PhysicalItem existant
          await tx.physicalItem.update({
            where: { itemId },
            data: physicalUpdateData
          })

          // Gérer les relations many-to-many pour les styles
          if (physicalData.styleIds !== undefined) {
            // Supprimer les anciennes associations
            await tx.itemStyle.deleteMany({
              where: { physicalItemId: existingPhysicalItem.id }
            })
            // Créer les nouvelles associations
            if (physicalData.styleIds.length > 0) {
              await tx.itemStyle.createMany({
                data: physicalData.styleIds.map(styleId => ({
                  physicalItemId: existingPhysicalItem.id,
                  styleId
                }))
              })
            }
          }

          // Gérer les relations many-to-many pour les techniques
          if (physicalData.techniqueIds !== undefined) {
            // Supprimer les anciennes associations
            await tx.itemTechnique.deleteMany({
              where: { physicalItemId: existingPhysicalItem.id }
            })
            // Créer les nouvelles associations
            if (physicalData.techniqueIds.length > 0) {
              await tx.itemTechnique.createMany({
                data: physicalData.techniqueIds.map(techniqueId => ({
                  physicalItemId: existingPhysicalItem.id,
                  techniqueId
                }))
              })
            }
          }

          // Gérer les relations many-to-many pour les thèmes
          if (physicalData.themeIds !== undefined) {
            // Supprimer les anciennes associations
            await tx.itemTheme.deleteMany({
              where: { physicalItemId: existingPhysicalItem.id }
            })
            // Créer les nouvelles associations
            if (physicalData.themeIds.length > 0) {
              await tx.itemTheme.createMany({
                data: physicalData.themeIds.map(themeId => ({
                  physicalItemId: existingPhysicalItem.id,
                  themeId
                }))
              })
            }
          }
        } else {
          // Créer un nouveau PhysicalItem
          const newPhysicalItem = await tx.physicalItem.create({
            data: {
              itemId,
              price: physicalData.price || 0,
              initialQty: physicalData.initialQty || 1,
              stockQty: physicalData.initialQty || 1,
              height: physicalData.height ? new Decimal(physicalData.height) : null,
              width: physicalData.width ? new Decimal(physicalData.width) : null,
              weight: physicalData.weight ? new Decimal(physicalData.weight) : null,
              creationYear: physicalData.creationYear || null,
              shippingAddressId: physicalData.shippingAddressId || null,
              mediumId: physicalData.mediumId || null,
              status: PhysicalItemStatus.created
            }
          })

          // Créer les relations many-to-many pour les styles
          if (physicalData.styleIds && physicalData.styleIds.length > 0) {
            await tx.itemStyle.createMany({
              data: physicalData.styleIds.map(styleId => ({
                physicalItemId: newPhysicalItem.id,
                styleId
              }))
            })
          }

          // Créer les relations many-to-many pour les techniques
          if (physicalData.techniqueIds && physicalData.techniqueIds.length > 0) {
            await tx.itemTechnique.createMany({
              data: physicalData.techniqueIds.map(techniqueId => ({
                physicalItemId: newPhysicalItem.id,
                techniqueId
              }))
            })
          }

          // Créer les relations many-to-many pour les thèmes
          if (physicalData.themeIds && physicalData.themeIds.length > 0) {
            await tx.itemTheme.createMany({
              data: physicalData.themeIds.map(themeId => ({
                physicalItemId: newPhysicalItem.id,
                themeId
              }))
            })
          }
        }
      }

      return updatedItem
    })

    return {
      success: true,
      message: 'Item mis à jour avec succès',
      item: serializeData(result)
    }
  } catch (error) {
    console.error('Erreur lors de la mise à jour de l\'item:', error)
    return {
      success: false,
      message: error instanceof Error ? error.message : 'Une erreur est survenue lors de la mise à jour de l\'item'
    }
  }
}

/**
 * Sauvegarde les URLs des images pour un item
 */
export async function saveItemImages(
  itemId: number,
  mainImageUrl: string | null | undefined,
  secondaryImageUrls: string[] = []
) {
  try {
    console.log(`Début de la sauvegarde des images pour l'item #${itemId}`);
    console.log(`- URL principale: ${mainImageUrl || '(aucune modification)'}`);
    console.log(`- ${secondaryImageUrls.length} URLs secondaires:`, secondaryImageUrls);

    // Préparer les données de mise à jour
    const updateData: any = {};

    // N'ajouter l'URL principale que si elle est définie et non vide
    if (mainImageUrl) {
      updateData.mainImageUrl = mainImageUrl;
    }

    // Ajouter les URLs secondaires si elles existent
    if (secondaryImageUrls.length > 0) {
      updateData.secondaryImagesUrl = secondaryImageUrls;
    }

    console.log('Données de mise à jour:', JSON.stringify(updateData));

    // Ne mettre à jour que si nous avons des données à mettre à jour
    if (Object.keys(updateData).length > 0) {
      // Mettre à jour l'item avec les URLs d'images
      const updatedItem = await prisma.item.update({
        where: { id: itemId },
        data: updateData
      });

      console.log(`Images sauvegardées avec succès pour l'item #${itemId}`);
    } else {
      console.log(`Aucune modification d'image pour l'item #${itemId}`);
    }

    return {
      success: true,
      message: `Images sauvegardées pour l'item #${itemId}`,
      data: {
        mainImageUrl: mainImageUrl || undefined,
        secondaryImagesCount: secondaryImageUrls.length
      }
    };
  } catch (error) {
    console.error('Erreur lors de la sauvegarde des images:', error);
    throw new Error(`Échec de la sauvegarde des images: ${error instanceof Error ? error.message : 'Erreur inconnue'}`);
  }
}

/**
 * Supprime une image secondaire de la liste d'un item
 */
export async function removeSecondaryImage(
  itemId: number,
  imageUrl: string
) {
  try {
    console.log(`Suppression de l'image secondaire pour l'item #${itemId}`);
    console.log(`URL à supprimer: ${imageUrl}`);

    // Récupérer l'item et ses images secondaires actuelles
    const item = await prisma.item.findUnique({
      where: { id: itemId },
      select: { secondaryImagesUrl: true }
    });

    if (!item) {
      throw new Error(`Item #${itemId} non trouvé`);
    }

    // Traiter le tableau d'images secondaires
    let secondaryImages: string[] = [];

    // Si secondaryImagesUrl est un tableau, l'utiliser directement
    if (Array.isArray(item.secondaryImagesUrl)) {
      secondaryImages = item.secondaryImagesUrl as string[];
    }
    // Si c'est une chaîne, essayer de la parser comme JSON
    else if (typeof item.secondaryImagesUrl === 'string') {
      try {
        const parsed = JSON.parse(item.secondaryImagesUrl);
        if (Array.isArray(parsed)) {
          secondaryImages = parsed;
        }
      } catch (e) {
        console.error('Erreur lors du parsing des images secondaires:', e);
      }
    }

    // Filtrer l'URL à supprimer
    const updatedImages = secondaryImages.filter(url => url !== imageUrl);
    console.log(`Images restantes après suppression: ${updatedImages.length}`);

    // Mettre à jour l'item avec le nouveau tableau d'images
    const updatedItem = await prisma.item.update({
      where: { id: itemId },
      data: {
        secondaryImagesUrl: updatedImages
      }
    });

    return {
      success: true,
      message: `Image secondaire supprimée avec succès`,
      remainingImagesCount: updatedImages.length
    };
  } catch (error) {
    console.error('Erreur lors de la suppression de l\'image secondaire:', error);
    throw new Error(`Échec de la suppression de l'image: ${error instanceof Error ? error.message : 'Erreur inconnue'}`);
  }
}

export async function deletePhysicalItem(
  physicalItemId: number
): Promise<{ success: boolean; message?: string }> {
  try {
    // Vérifier si le physicalItem existe
    const physicalItem = await prisma.physicalItem.findUnique({
      where: { id: physicalItemId }
    })

    console.log("****** physicalItem", physicalItem)

    if (!physicalItem) {
      return {
        success: false,
        message: 'PhysicalItem introuvable'
      }
    }

    // Vérifier si le statut permet la suppression
    if (physicalItem.status === 'listed' || physicalItem.status === 'sold') {
      return {
        success: false,
        message: 'Impossible de supprimer un PhysicalItem qui est listé ou vendu'
      }
    }

    // Supprimer le PhysicalItem
    await prisma.physicalItem.delete({
      where: { id: physicalItemId }
    })

    return {
      success: true,
      message: 'PhysicalItem supprimé avec succès'
    }
  } catch (error) {
    console.error('Erreur lors de la suppression du PhysicalItem:', error)

    if (error instanceof Error) {
      return {
        success: false,
        message: error.message
      }
    }

    return {
      success: false,
      message: 'Une erreur est survenue lors de la suppression du PhysicalItem'
    }
  }
}

/**
 * Récupère tous les mediums artistiques
 */
export async function getAllArtworkMediums() {
  try {
    return await prisma.artworkMedium.findMany({
      orderBy: { name: 'asc' }
    })
  } catch (error) {
    console.error('Erreur lors de la récupération des mediums:', error)
    return []
  }
}

/**
 * Récupère tous les styles artistiques
 */
export async function getAllArtworkStyles() {
  try {
    return await prisma.artworkStyle.findMany({
      orderBy: { name: 'asc' }
    })
  } catch (error) {
    console.error('Erreur lors de la récupération des styles:', error)
    return []
  }
}

/**
 * Récupère toutes les techniques artistiques
 */
export async function getAllArtworkTechniques() {
  try {
    return await prisma.artworkTechnique.findMany({
      orderBy: { name: 'asc' }
    })
  } catch (error) {
    console.error('Erreur lors de la récupération des techniques:', error)
    return []
  }
}

/**
 * Récupère tous les thèmes artistiques
 */
export async function getAllArtworkThemes() {
  try {
    return await prisma.artworkTheme.findMany({
      orderBy: { name: 'asc' }
    })
  } catch (error) {
    console.error('Erreur lors de la récupération des thèmes:', error)
    return []
  }
}

