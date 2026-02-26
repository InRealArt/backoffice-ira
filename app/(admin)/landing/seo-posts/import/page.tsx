import { getAllSeoCategories } from '@/lib/actions/seo-category-actions'
import DocxImportForm from './DocxImportForm'

export const dynamic = 'force-dynamic'

export default async function ImportDocxPage() {
    const { categories = [] } = await getAllSeoCategories()

    return (
        <div className="page-container">
            <div className="page-header">
                <h1 className="page-title">Importer un article depuis un fichier DOCX</h1>
                <p className="page-subtitle">
                    Importez un fichier Word (.docx) préformaté pour créer automatiquement un article SEO.
                </p>
            </div>

            <DocxImportForm categories={categories.map(c => ({ id: c.id, name: c.name }))} />
        </div>
    )
}
