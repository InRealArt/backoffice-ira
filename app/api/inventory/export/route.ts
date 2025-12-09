import { generateInventoryExcel } from '@/lib/actions/inventory-actions'
import { NextResponse } from 'next/server'

export async function GET() {
  try {
    const buffer = await generateInventoryExcel()
    
    const filename = `inventaire-total-${new Date().toISOString().split('T')[0]}.xlsx`
    
    return new NextResponse(buffer, {
      headers: {
        'Content-Type': 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
        'Content-Disposition': `attachment; filename="${filename}"`,
      },
    })
  } catch (error) {
    console.error('Erreur lors de la génération de l\'inventaire Excel:', error)
    return NextResponse.json(
      { error: 'Erreur lors de la génération du fichier Excel' },
      { status: 500 }
    )
  }
}

