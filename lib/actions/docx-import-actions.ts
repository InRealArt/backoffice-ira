'use server'

import { parseDocxBuffer, DocxParseResult } from '@/lib/utils/docx-parser'

interface Category {
    id: number
    name: string
}

interface ParseDocxSuccess {
    success: true
    data: DocxParseResult
}

interface ParseDocxError {
    success: false
    error: string
}

export type ParseDocxResult = ParseDocxSuccess | ParseDocxError

export async function parseDocxFile(
    fileBase64: string,
    categories: Category[]
): Promise<ParseDocxResult> {
    try {
        // Décoder base64 → Buffer
        const binaryString = atob(fileBase64)
        const bytes = new Uint8Array(binaryString.length)
        for (let i = 0; i < binaryString.length; i++) {
            bytes[i] = binaryString.charCodeAt(i)
        }
        const buffer = Buffer.from(bytes)

        // Parser le DOCX
        const result = await parseDocxBuffer(buffer)

        // Résoudre categoryId depuis le nom de catégorie
        if (result.categoryName) {
            const normalizedCategoryName = result.categoryName.toLowerCase().trim()
            const matchedCategory = categories.find(
                (cat) => cat.name.toLowerCase().trim() === normalizedCategoryName
            )
            if (matchedCategory) {
                result.categoryId = matchedCategory.id
            }
        }

        return { success: true, data: result }
    } catch (err) {
        console.error('Erreur lors du parsing DOCX:', err)
        return {
            success: false,
            error: err instanceof Error ? err.message : 'Erreur inconnue lors du parsing du fichier DOCX',
        }
    }
}
