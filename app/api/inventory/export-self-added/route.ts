import { generateSelfAddedInventoryExcel } from '@/lib/actions/inventory-actions'
import { NextResponse } from 'next/server'
import { requireAdmin, UnauthorizedError } from '@/lib/auth-helpers'

export async function GET() {
  try {
    await requireAdmin()
    const buffer = await generateSelfAddedInventoryExcel()
    
    const filename = `inventaire-oeuvres-artistes-${new Date().toISOString().split('T')[0]}.xlsx`
    
    return new NextResponse(buffer, {
      headers: {
        'Content-Type': 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
        'Content-Disposition': `attachment; filename="${filename}"`,
      },
    })
  } catch (error) {
    if (error instanceof UnauthorizedError) {
      return NextResponse.json(
        { error: error.message },
        { status: error.message === 'Non authentifié' ? 401 : 403 }
      )
    }
    console.error('Erreur lors de la génération de l\'inventaire Excel self-added:', error)
    return NextResponse.json(
      { error: 'Erreur lors de la génération du fichier Excel' },
      { status: 500 }
    )
  }
}

