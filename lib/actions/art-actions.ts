'use server';

import { prisma } from '@/lib/prisma';
import { revalidatePath } from 'next/cache'
import { getItemById } from './prisma-actions';
import { HeartIcon } from 'lucide-react';

type CreateCollectionResult = {
  success: boolean
  message: string
  collection?: any
}

type GetCollectionResult = {
  success: boolean
  message: string
  collection?: any
}

type UpdateCollectionResult = {
  success: boolean
  message: string
  collection?: any
}

type GetCollectionProductsResult = {
  success: boolean
  message: string
  products?: any[]
}

export interface User {
  id: number;
  email: string;
  firstName: string;
  lastName: string;
  walletAddress: string;
}

type CreateArtworkResult = {
  success: boolean
  message: string
  productId?: string
}


export async function getUserByEmail(email: string) {
  try {
    if (!email) {
      throw new Error('Email requis');
    }

    const user = await prisma.backofficeUser.findUnique({
      where: { email }
    });

    if (!user) {
      throw new Error('Utilisateur non trouvé');
    }

    return { success: true, user };
  } catch (error) {
    console.error('Erreur lors de la récupération de l\'utilisateur:', error);
    throw error;
  }
}

export async function createArtwork(formData: FormData): Promise<CreateArtworkResult> {
  try {
    const title = formData.get('title') as string
    const description = formData.get('description') as string
    const medium = formData.get('medium') as string
    const height = formData.get('height') as string || ''
    const width = formData.get('width') as string || ''
    const year = formData.get('year') as string || ''
    const creationYear = formData.get('creationYear') as string || ''
    const edition = formData.get('edition') as string || ''
    const tagsString = formData.get('tags') as string || ''
    const tags = tagsString ? tagsString.split(',').map(tag => tag.trim()) : []
    const userEmail = formData.get('userEmail') as string
    const weight = formData.get('weight') as string || ''

    // Récupérer les options de prix
    const hasPhysicalOnly = formData.get('hasPhysicalOnly') === 'true'
    const hasNftOnly = formData.get('hasNftOnly') === 'true'
    const hasNftPlusPhysical = formData.get('hasNftPlusPhysical') === 'true'

    const pricePhysicalBeforeTax = hasPhysicalOnly ? formData.get('pricePhysicalBeforeTax') as string : ''
    const priceNftBeforeTax = hasNftOnly ? formData.get('priceNftBeforeTax') as string : ''
    const priceNftPlusPhysicalBeforeTax = hasNftPlusPhysical ? formData.get('priceNftPlusPhysicalBeforeTax') as string : ''

    // Récupérer le certificat d'authenticité
    const certificate = formData.get('certificate') as File

    // Validation des champs obligatoires
    if (!title || !description) {
      console.log('title', title)
      console.log('description', description)
      return {
        success: false,
        message: 'Veuillez remplir tous les champs obligatoires'
      }
    }

    // Vérifier qu'au moins une option de prix est sélectionnée
    if (!hasPhysicalOnly && !hasNftOnly && !hasNftPlusPhysical) {
      return {
        success: false,
        message: 'Veuillez sélectionner au moins une option de prix'
      }
    }

    // Vérifier que toutes les options sélectionnées ont un prix valide
    if ((hasPhysicalOnly && (!pricePhysicalBeforeTax || isNaN(parseFloat(pricePhysicalBeforeTax)))) ||
      (hasNftOnly && (!priceNftBeforeTax || isNaN(parseFloat(priceNftBeforeTax)))) ||
      (hasNftPlusPhysical && (!priceNftPlusPhysicalBeforeTax || isNaN(parseFloat(priceNftPlusPhysicalBeforeTax))))) {
      return {
        success: false,
        message: 'Veuillez spécifier un prix valide pour chaque option sélectionnée'
      }
    }

    // Collecter les images
    const images = []
    for (const pair of formData.entries()) {
      if (pair[0].startsWith('image-') && pair[1] instanceof File) {
        images.push(pair[1] as File)
      }
    }

    if (images.length === 0) {
      return {
        success: false,
        message: 'Au moins une image est requise'
      }
    }

    // Construire les métadonnées pour l'œuvre
    const metafields = [
      {
        key: 'medium',
        value: medium,
        type: 'single_line_text_field',
        namespace: 'artwork',
      },
      {
        key: 'dimensions',
        value: height + ' x ' + width,
        type: 'single_line_text_field',
        namespace: 'artwork',
      }
    ]

    if (year) {
      metafields.push({
        key: 'year',
        value: year,
        type: 'single_line_text_field',
        namespace: 'artwork',
      })
    }

    if (creationYear) {
      metafields.push({
        key: 'creationYear',
        value: creationYear,
        type: 'single_line_text_field',
        namespace: 'artwork',
      })
    }

    if (edition) {
      metafields.push({
        key: 'edition',
        value: edition,
        type: 'single_line_text_field',
        namespace: 'artwork',
      })
    }

    // Convertir le poids en nombre
    const weightValue = weight ? parseFloat(weight.replace(',', '.')) : 0

    // Préparer les images (encodage Base64)
    const imageUrls = []
    for (const image of images) {
      const buffer = Buffer.from(await image.arrayBuffer())
      imageUrls.push({
        attachment: buffer.toString('base64')
      })
    }

    // Ajouter le produit à la collection de l'utilisateur connecté
    try {
      // Récupérer les informations de l'utilisateur pour construire le titre de la collection
      const userResponse = await getUserByEmail(userEmail)

      if (!userResponse.success || !userResponse.user || !userResponse.user.firstName || !userResponse.user.lastName) {
        throw new Error('Informations utilisateur incomplètes ou utilisateur non trouvé')
      }

      
    } catch (error) {
      console.error('Erreur lors de l\'ajout du produit à la collection de l\'utilisateur:', error)
      // Ne pas échouer la création du produit si l'ajout à la collection échoue
    }

    // Rafraîchir la page après création
    revalidatePath('/art/create')
    revalidatePath('/art/collection')

    return {
      success: true,
      message: `L'œuvre "${title}" a été créée avec succès!`
    }

  } catch (error) {
    console.error('Erreur serveur lors de la création de l\'œuvre:', error)
    return {
      success: false,
      message: error instanceof Error ? error.message : 'Une erreur est survenue lors de la création de l\'œuvre'
    }
  }
}





