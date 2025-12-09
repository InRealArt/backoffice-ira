import { generateSelfAddedInventoryExcel } from '@/lib/actions/inventory-actions'
import { NextResponse } from 'next/server'

export async function GET() {
  try {
    const buffer = await generateSelfAddedInventoryExcel()
    
    const filename = `inventaire-oeuvres-artistes-${new Date().toISOString().split('T')[0]}.xlsx`
    
    return new NextResponse(buffer, {
      headers: {
        'Content-Type': 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
        'Content-Disposition': `attachment; filename="${filename}"`,
      },
    })
  } catch (error) {
    console.error('Erreur lors de la génération de l\'inventaire Excel self-added:', error)
    return NextResponse.json(
      { error: 'Erreur lors de la génération du fichier Excel' },
      { status: 500 }
    )
  }
}

