'use server'

import { prisma } from '@/lib/prisma'
import ExcelJS from 'exceljs'

/**
 * Récupère les artistes visibles avec leurs œuvres en prévente pour l'inventaire Excel
 */
export async function getArtistsForInventoryExport() {
  try {
    // Récupérer tous les artistes avec leurs LandingArtist et PresaleArtworks
    const artists = await prisma.artist.findMany({
      where: {
        isGallery: false
      },
      select: {
        id: true,
        name: true,
        surname: true,
        LandingArtist: {
          select: {
            id: true
          },
          take: 1
        },
        PresaleArtworks: {
          select: {
            name: true,
            price: true,
            width: true,
            height: true
          },
          orderBy: {
            displayOrder: 'asc'
          }
        }
      },
      orderBy: {
        name: 'asc'
      }
    })

    // Filtrer pour ne garder que les artistes qui ont :
    // 1. Un LandingArtist (donc visibles sur le site)
    // 2. Au moins une PresaleArtwork
    const filteredArtists = artists.filter(artist => 
      artist.LandingArtist.length > 0 && artist.PresaleArtworks.length > 0
    )

    // Retourner seulement les données nécessaires
    return filteredArtists.map(artist => ({
      id: artist.id,
      name: artist.name,
      surname: artist.surname,
      PresaleArtworks: artist.PresaleArtworks
    }))
  } catch (error) {
    console.error('Erreur lors de la récupération des artistes pour l\'export:', error)
    return []
  }
}

/**
 * Génère un fichier Excel avec l'inventaire total
 */
export async function generateInventoryExcel(): Promise<Buffer> {
  const artists = await getArtistsForInventoryExport()

  const workbook = new ExcelJS.Workbook()
  workbook.creator = 'InRealArt Backoffice'
  workbook.created = new Date()

  // Créer un onglet pour chaque artiste
  for (const artist of artists) {
    const sheetName = `${artist.name} ${artist.surname}`.substring(0, 31) // Excel limite à 31 caractères
    const worksheet = workbook.addWorksheet(sheetName)

    // Définir les colonnes
    worksheet.columns = [
      { header: 'Nom de l\'œuvre', key: 'name', width: 30 },
      { header: 'Prix', key: 'price', width: 15 },
      { header: 'Dimensions', key: 'dimensions', width: 20 }
    ]

    // Style de l'en-tête
    worksheet.getRow(1).font = { bold: true }
    worksheet.getRow(1).fill = {
      type: 'pattern',
      pattern: 'solid',
      fgColor: { argb: 'FFE0E0E0' }
    }

    // Ajouter les données
    for (const artwork of artist.PresaleArtworks) {
      const dimensions = artwork.width && artwork.height
        ? `${artwork.width} x ${artwork.height} cm`
        : artwork.width
          ? `${artwork.width} cm`
          : artwork.height
            ? `${artwork.height} cm`
            : '-'

      const price = artwork.price ? `${artwork.price} €` : '-'

      worksheet.addRow({
        name: artwork.name,
        price: price,
        dimensions: dimensions
      })
    }

    // Appliquer des bordures à toutes les cellules
    worksheet.eachRow((row, rowNumber) => {
      row.eachCell((cell) => {
        cell.border = {
          top: { style: 'thin' },
          left: { style: 'thin' },
          bottom: { style: 'thin' },
          right: { style: 'thin' }
        }
        if (rowNumber === 1) {
          cell.alignment = { vertical: 'middle', horizontal: 'center' }
        }
      })
    })
  }

  // Générer le buffer
  const buffer = await workbook.xlsx.writeBuffer()
  return Buffer.from(buffer)
}

/**
 * Récupère les artistes avec leurs œuvres créées après leur date d'onboarding
 */
export async function getArtistsForSelfAddedInventoryExport() {
  try {
    // Récupérer tous les artistes avec leurs LandingArtist (avec onboardingBo) et PresaleArtworks
    const artists = await prisma.artist.findMany({
      where: {
        isGallery: false
      },
      select: {
        id: true,
        name: true,
        surname: true,
        LandingArtist: {
          select: {
            id: true,
            onboardingBo: true
          },
          take: 1
        },
        PresaleArtworks: {
          select: {
            name: true,
            price: true,
            width: true,
            height: true,
            createdAt: true
          },
          orderBy: {
            displayOrder: 'asc'
          }
        }
      },
      orderBy: {
        name: 'asc'
      }
    })

    // Filtrer pour ne garder que les artistes qui ont :
    // 1. Un LandingArtist avec une date d'onboarding renseignée
    // 2. Au moins une PresaleArtwork créée après la date d'onboarding
    const filteredArtists = artists
      .filter(artist => {
        const landingArtist = artist.LandingArtist[0]
        if (!landingArtist || !landingArtist.onboardingBo) {
          return false
        }
        return true
      })
      .map(artist => {
        const landingArtist = artist.LandingArtist[0]
        const onboardingDate = landingArtist?.onboardingBo

        if (!onboardingDate) {
          return null
        }

        // Filtrer les œuvres créées après la date d'onboarding
        const selfAddedArtworks = artist.PresaleArtworks.filter(artwork => {
          const artworkDate = new Date(artwork.createdAt)
          const onboarding = new Date(onboardingDate)
          return artworkDate >= onboarding
        })

        if (selfAddedArtworks.length === 0) {
          return null
        }

        return {
          id: artist.id,
          name: artist.name,
          surname: artist.surname,
          PresaleArtworks: selfAddedArtworks
        }
      })
      .filter((artist): artist is NonNullable<typeof artist> => artist !== null)

    return filteredArtists
  } catch (error) {
    console.error('Erreur lors de la récupération des artistes pour l\'export self-added:', error)
    return []
  }
}

/**
 * Génère un fichier Excel avec l'inventaire des œuvres ajoutées par les artistes
 */
export async function generateSelfAddedInventoryExcel(): Promise<Buffer> {
  const artists = await getArtistsForSelfAddedInventoryExport()

  const workbook = new ExcelJS.Workbook()
  workbook.creator = 'InRealArt Backoffice'
  workbook.created = new Date()

  // Créer un onglet pour chaque artiste
  for (const artist of artists) {
    const sheetName = `${artist.name} ${artist.surname}`.substring(0, 31) // Excel limite à 31 caractères
    const worksheet = workbook.addWorksheet(sheetName)

    // Définir les colonnes
    worksheet.columns = [
      { header: 'Nom de l\'œuvre', key: 'name', width: 30 },
      { header: 'Prix', key: 'price', width: 15 },
      { header: 'Dimensions', key: 'dimensions', width: 20 }
    ]

    // Style de l'en-tête
    worksheet.getRow(1).font = { bold: true }
    worksheet.getRow(1).fill = {
      type: 'pattern',
      pattern: 'solid',
      fgColor: { argb: 'FFE0E0E0' }
    }

    // Ajouter les données
    for (const artwork of artist.PresaleArtworks) {
      const dimensions = artwork.width && artwork.height
        ? `${artwork.width} x ${artwork.height} cm`
        : artwork.width
          ? `${artwork.width} cm`
          : artwork.height
            ? `${artwork.height} cm`
            : '-'

      const price = artwork.price ? `${artwork.price} €` : '-'

      worksheet.addRow({
        name: artwork.name,
        price: price,
        dimensions: dimensions
      })
    }

    // Appliquer des bordures à toutes les cellules
    worksheet.eachRow((row, rowNumber) => {
      row.eachCell((cell) => {
        cell.border = {
          top: { style: 'thin' },
          left: { style: 'thin' },
          bottom: { style: 'thin' },
          right: { style: 'thin' }
        }
        if (rowNumber === 1) {
          cell.alignment = { vertical: 'middle', horizontal: 'center' }
        }
      })
    })
  }

  // Générer le buffer
  const buffer = await workbook.xlsx.writeBuffer()
  return Buffer.from(buffer)
}

