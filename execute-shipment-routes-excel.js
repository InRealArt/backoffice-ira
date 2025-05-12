require('dotenv').config() // Chargement des variables d'environnement

const axios = require('axios')
const ExcelJS = require('exceljs')

// Configuration
const SHIPPO_TOKEN = process.env.SHIPPO_API_KEY
const API_BASE_URL = 'https://api.goshippo.com'
const OUTPUT_FILE = 'shipment-rates.xlsx'

// Adresses (format court pour la lisibilité dans le fichier final)
const addresses = {
  ira: {
    name: 'IRA',
    full: '62 rue des forges, Plélan-le-grand, 35380, FR'
  },
  camille: {
    name: 'Camille Bernard',
    full: '18 Cours du Chapeau Rouge, Bordeaux, 33000, FR'
  },
  martin: {
    name: 'Martin Dupont',
    full: '25 Rue de Rivoli, Paris, 75004, FR'
  },
  pierre: {
    name: 'Pierre Lefebvre',
    full: '35 Rue de la Grande Chaussée, Lille, 59800, FR'
  },
  sophie: {
    name: 'Sophie Moreau',
    full: '37 Promenade des Anglais, Nice, 06000, FR'
  }
}

// Colis
const parcels = {
  petit: {
    name: 'Petit tableau',
    dimensions: '40x30x5 cm',
    weight: 1.5,
    data: {
      length: '40.0000',
      width: '30.0000',
      height: '5.0000',
      distance_unit: 'cm',
      weight: '1.5000',
      mass_unit: 'kg',
      metadata: 'Tableau d\'artiste'
    }
  },
  moyen: {
    name: 'Tableau moyen',
    dimensions: '90x70x8 cm',
    weight: 3,
    data: {
      length: '90.0000',
      width: '70.0000',
      height: '8.0000',
      distance_unit: 'cm',
      weight: '3.0000',
      mass_unit: 'kg',
      metadata: 'Tableau d\'artiste'
    }
  },
  grand: {
    name: 'Grand tableau',
    dimensions: '150x120x12 cm',
    weight: 7,
    data: {
      length: '150.0000',
      width: '120.0000',
      height: '12.0000',
      distance_unit: 'cm',
      weight: '7.0000',
      mass_unit: 'kg',
      metadata: 'Tableau d\'artiste'
    }
  }
}

// Fonction pour obtenir les données complètes d'une adresse
function getFullAddressData(addr, isResidential) {
  const type = isResidential ? 'residential' : 'commercial'
  const [street1, city, zip, country] = addr.full.split(', ')
  
  return {
    name: addr.name,
    street1,
    city,
    state: '', // On peut laisser vide car déjà présent dans addr.full
    zip,
    country,
    address_type: type
  }
}

// Fonction pour créer une requête d'expédition
function createShipmentRequest(from, to, parcel, isFromResidential = true, isToResidential = true) {
  return {
    address_from: getFullAddressData(from, isFromResidential),
    address_to: getFullAddressData(to, isToResidential),
    parcels: [parcel.data],
    async: false
  }
}

// Fonction pour envoyer la requête à l'API Shippo
async function getShipmentRates(from, to, parcel, isFromResidential = true, isToResidential = true) {
  const shipmentData = createShipmentRequest(from, to, parcel, isFromResidential, isToResidential)
  
  try {
    const response = await axios.post(`${API_BASE_URL}/shipments/`, shipmentData, {
      headers: {
        'Authorization': `ShippoToken ${SHIPPO_TOKEN}`,
        'Content-Type': 'application/json'
      }
    })
    
    if (response.data && response.data.rates) {
      return {
        from,
        to,
        parcel,
        rates: response.data.rates
      }
    } else {
      console.error('Pas de rates retournés pour cette requête:', from.name, 'à', to.name)
      return {
        from,
        to,
        parcel,
        rates: []
      }
    }
  } catch (error) {
    console.error('Erreur lors de la requête:', error.message)
    console.error('Détails:', error.response ? error.response.data : 'Pas de détails')
    return {
      from,
      to,
      parcel,
      rates: [],
      error: error.message
    }
  }
}

// Initialisation du fichier Excel
async function initExcelFile() {
  const workbook = new ExcelJS.Workbook()
  workbook.creator = 'Script Shipment Rates'
  workbook.created = new Date()
  
  const worksheet = workbook.addWorksheet('Tarifs d\'expédition')
  
  // Définition des colonnes
  worksheet.columns = [
    { header: 'Expéditeur', key: 'expediteur', width: 15 },
    { header: 'Adresse expéditeur', key: 'adresseExpediteur', width: 30 },
    { header: 'Destinataire', key: 'destinataire', width: 15 },
    { header: 'Adresse destinataire', key: 'adresseDestinataire', width: 30 },
    { header: 'Dimensions (cm)', key: 'dimensions', width: 15 },
    { header: 'Poids (kg)', key: 'poids', width: 10 },
    { header: 'Transporteur', key: 'transporteur', width: 20 },
    { header: 'Service', key: 'service', width: 25 },
    { header: 'Durée (jours)', key: 'duree', width: 12 },
    { header: 'Prix', key: 'prix', width: 10 },
    { header: 'Devise', key: 'devise', width: 8 }
  ]
  
  // Style des en-têtes
  worksheet.getRow(1).font = { bold: true }
  worksheet.getRow(1).fill = {
    type: 'pattern',
    pattern: 'solid',
    fgColor: { argb: 'FFE0E0E0' }
  }
  
  return { workbook, worksheet }
}

// Fonction pour ajouter les résultats au fichier Excel
function addResultsToExcel(worksheet, result) {
  if (!result.rates || result.rates.length === 0) {
    // Écrire une ligne même s'il n'y a pas de rates disponibles
    worksheet.addRow({
      expediteur: result.from.name,
      adresseExpediteur: result.from.full,
      destinataire: result.to.name,
      adresseDestinataire: result.to.full,
      dimensions: result.parcel.dimensions,
      poids: result.parcel.weight,
      transporteur: 'Aucun service disponible',
      service: '-',
      duree: '-',
      prix: '-',
      devise: '-'
    })
    return
  }
  
  // Écrire une ligne pour chaque rate disponible
  result.rates.forEach(rate => {
    worksheet.addRow({
      expediteur: result.from.name,
      adresseExpediteur: result.from.full,
      destinataire: result.to.name,
      adresseDestinataire: result.to.full,
      dimensions: result.parcel.dimensions,
      poids: result.parcel.weight,
      transporteur: rate.provider,
      service: rate.servicelevel.name,
      duree: rate.estimated_days || '-',
      prix: parseFloat(rate.amount),
      devise: rate.currency
    })
  })
}

// Fonction principale qui exécute toutes les combinaisons
async function executeAllShipments() {
  console.log('Initialisation du fichier Excel...')
  const { workbook, worksheet } = await initExcelFile()
  
  console.log('Démarrage des requêtes d\'expédition...')
  
  // Liste des expéditeurs et destinataires
  const allAddresses = [addresses.ira, addresses.camille, addresses.martin, addresses.pierre, addresses.sophie]
  const allParcels = [parcels.petit, parcels.moyen, parcels.grand]
  
  // Statut pour le suivi
  let completed = 0
  const total = allAddresses.length * (allAddresses.length - 1) * allParcels.length
  
  // Pour chaque expéditeur
  for (const from of allAddresses) {
    // Pour chaque destinataire (différent de l'expéditeur)
    for (const to of allAddresses) {
      if (from.name === to.name) continue
      
      // Pour chaque type de colis
      for (const parcel of allParcels) {
        console.log(`Traitement: ${from.name} → ${to.name} (${parcel.name})`)
        
        // Déterminer si l'adresse est résidentielle (simple exemple, à adapter)
        const isFromResidential = from.name !== 'Pierre Lefebvre' && from.name !== 'Martin Dupont'
        const isToResidential = to.name !== 'Pierre Lefebvre' && to.name !== 'Martin Dupont'
        
        try {
          // Obtenir les tarifs
          const result = await getShipmentRates(from, to, parcel, isFromResidential, isToResidential)
          
          // Ajouter au fichier Excel
          addResultsToExcel(worksheet, result)
          
          // Incrémenter le compteur
          completed++
          console.log(`Progression: ${completed}/${total} (${Math.round(completed/total*100)}%)`)
          
          // Petite pause pour éviter de surcharger l'API
          await new Promise(resolve => setTimeout(resolve, 1000))
        } catch (error) {
          console.error(`Erreur lors du traitement ${from.name} → ${to.name}:`, error)
        }
      }
    }
  }
  
  // Appliquer des filtres automatiques
  worksheet.autoFilter = {
    from: { row: 1, column: 1 },
    to: { row: 1, column: worksheet.columns.length }
  }
  
  // Formater la colonne prix en nombre
  worksheet.getColumn('prix').numFmt = '0.00'
  
  // Enregistrer le fichier Excel
  await workbook.xlsx.writeFile(OUTPUT_FILE)
  
  console.log(`Terminé! Le fichier Excel a été enregistré sous ${OUTPUT_FILE}`)
}

// Exécution du script
console.log('Script de génération des tarifs d\'expédition (Excel)')
executeAllShipments().catch(err => {
  console.error('Erreur globale:', err)
  process.exit(1)
}) 