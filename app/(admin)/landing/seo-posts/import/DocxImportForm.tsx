'use client'

import { useState, useRef } from 'react'
import { useRouter } from 'next/navigation'
import { useToast } from '@/app/components/Toast/ToastContext'
import LoadingSpinner from '@/app/components/LoadingSpinner/LoadingSpinner'
import { parseDocxFile } from '@/lib/actions/docx-import-actions'
import { createSeoPost } from '@/lib/actions/seo-post-actions'
import type { DocxParseResult } from '@/lib/utils/docx-parser'

interface Category {
    id: number
    name: string
}

interface DocxImportFormProps {
    categories: Category[]
}

type Step = 'select' | 'preview'

export default function DocxImportForm({ categories }: DocxImportFormProps) {
    const router = useRouter()
    const { success, error } = useToast()

    const [step, setStep] = useState<Step>('select')
    const [selectedFile, setSelectedFile] = useState<File | null>(null)
    const [isParsing, setIsParsing] = useState(false)
    const [isCreating, setIsCreating] = useState(false)
    const [parseResult, setParseResult] = useState<DocxParseResult | null>(null)

    // Champs éditables de la prévisualisation
    const [title, setTitle] = useState('')
    const [metaDescription, setMetaDescription] = useState('')
    const [author, setAuthor] = useState('')
    const [excerpt, setExcerpt] = useState('')
    const [selectedCategoryId, setSelectedCategoryId] = useState<number | ''>('')
    const [keywordsInput, setKeywordsInput] = useState('')
    const [tagsInput, setTagsInput] = useState('')

    const fileInputRef = useRef<HTMLInputElement>(null)

    const DOCX_MIME = 'application/vnd.openxmlformats-officedocument.wordprocessingml.document'

    const handleFileChange = (event: React.ChangeEvent<HTMLInputElement>) => {
        const file = event.target.files?.[0]
        if (!file) return

        if (file.type !== DOCX_MIME && !file.name.endsWith('.docx')) {
            error('Veuillez sélectionner un fichier Word (.docx)')
            if (fileInputRef.current) fileInputRef.current.value = ''
            return
        }

        setSelectedFile(file)
    }

    const handleParse = async () => {
        if (!selectedFile) {
            error('Veuillez sélectionner un fichier .docx')
            return
        }

        setIsParsing(true)
        try {
            // arrayBuffer → base64
            const arrayBuffer = await selectedFile.arrayBuffer()
            const bytes = new Uint8Array(arrayBuffer)
            let binary = ''
            for (let i = 0; i < bytes.byteLength; i++) {
                binary += String.fromCharCode(bytes[i])
            }
            const base64 = btoa(binary)

            const result = await parseDocxFile(base64, categories)

            if (!result.success) {
                error(`Erreur lors du parsing : ${result.error}`)
                return
            }

            const data = result.data
            setParseResult(data)

            // Pré-remplir les champs éditables
            setTitle(data.title)
            setMetaDescription(data.metaDescription)
            setAuthor(data.author)
            setExcerpt(data.excerpt)
            setKeywordsInput(data.metaKeywords.join(', '))
            setTagsInput(data.tags.join(', '))
            setSelectedCategoryId(data.categoryId ?? '')

            setStep('preview')
        } catch (err: any) {
            console.error('Erreur parsing DOCX:', err)
            error(err.message || 'Erreur lors de la lecture du fichier')
        } finally {
            setIsParsing(false)
        }
    }

    const handleCreate = async () => {
        if (!parseResult) return

        if (!title.trim()) {
            error('Le titre est requis')
            return
        }
        if (!selectedCategoryId) {
            error('Veuillez sélectionner une catégorie')
            return
        }

        setIsCreating(true)
        try {
            const keywords = keywordsInput
                .split(',')
                .map(s => s.trim())
                .filter(Boolean)
            const tags = tagsInput
                .split(',')
                .map(s => s.trim())
                .filter(Boolean)

            const result = await createSeoPost({
                title: title.trim(),
                categoryId: selectedCategoryId as number,
                metaDescription: metaDescription.trim(),
                metaKeywords: keywords,
                listTags: tags,
                slug: parseResult.slug,
                content: JSON.stringify(parseResult.blogContent),
                excerpt: excerpt.trim() || undefined,
                author: author.trim(),
                status: 'DRAFT',
                autoTranslate: false,
            })

            if (!result.success) {
                error('message' in result ? (result.message || 'Erreur lors de la création') : 'Erreur lors de la création')
                return
            }

            success('Article créé en brouillon avec succès !')
            router.push(`/landing/seo-posts/${result.seoPost!.id}/edit`)
        } catch (err: any) {
            console.error('Erreur création post:', err)
            error(err.message || 'Erreur lors de la création de l\'article')
        } finally {
            setIsCreating(false)
        }
    }

    const handleBack = () => {
        setStep('select')
        setParseResult(null)
        setSelectedFile(null)
        if (fileInputRef.current) fileInputRef.current.value = ''
    }

    const totalElements = parseResult?.blogContent.reduce(
        (acc, section) => acc + section.elements.length,
        0
    ) ?? 0

    // ─── Étape 1 : Sélection du fichier ────────────────────────────────────────

    if (step === 'select') {
        return (
            <div className="form-container">
                <div className="form-card">
                    <div className="card-content">
                        <h2 className="form-title">Sélectionner un fichier Word</h2>
                        <p className="text-sm text-text-secondary mb-4">
                            Le fichier doit contenir les métadonnées en tête (Meta Title, Meta Description, Keywords, Tags, Auteur, Catégorie, Excerpt)
                            suivies du contenu structuré avec les styles Heading 1, Heading 2, Heading 3 et Normal.
                        </p>

                        <div className="form-group">
                            <label htmlFor="docxFile" className="form-label">
                                Fichier DOCX <span className="text-danger">*</span>
                            </label>
                            <input
                                ref={fileInputRef}
                                type="file"
                                id="docxFile"
                                accept=".docx,application/vnd.openxmlformats-officedocument.wordprocessingml.document"
                                onChange={handleFileChange}
                                className="form-input"
                                disabled={isParsing}
                            />
                            {selectedFile ? (
                                <p className="text-sm text-success mt-2">
                                    ✓ Fichier sélectionné : <strong>{selectedFile.name}</strong>
                                </p>
                            ) : (
                                <p className="text-xs text-text-secondary mt-1">
                                    Format accepté : .docx (Microsoft Word)
                                </p>
                            )}
                        </div>

                        <div className="form-group mt-4">
                            <details className="text-sm text-text-secondary">
                                <summary className="cursor-pointer font-medium mb-2">
                                    Structure attendue du fichier DOCX
                                </summary>
                                <div className="mt-2 p-3 bg-surface-secondary rounded-lg font-mono text-xs leading-relaxed">
                                    <p>Meta Title: Mon super titre</p>
                                    <p>Meta Description: Description...</p>
                                    <p>Keywords: mot-clé 1, mot-clé 2</p>
                                    <p>Tags: tag1, tag2</p>
                                    <p>Auteur: Prénom Nom</p>
                                    <p>Catégorie: Nom de la catégorie</p>
                                    <p>Excerpt: Résumé court...</p>
                                    <p className="mt-2 text-text-muted">[Heading 1] → nouvelle section</p>
                                    <p className="text-text-muted">[Paragraph] → paragraphe</p>
                                    <p className="text-text-muted">[Heading 2] → sous-titre H2</p>
                                    <p className="text-text-muted">[Heading 3] → sous-titre H3</p>
                                    <p className="text-text-muted">[Liste] → liste à puces</p>
                                </div>
                            </details>
                        </div>

                        {isParsing && (
                            <div className="mt-4 p-4 bg-surface-secondary rounded-lg">
                                <div className="d-flex align-items-center gap-md">
                                    <LoadingSpinner size="small" message="" inline />
                                    <span className="font-medium">Analyse du fichier en cours...</span>
                                </div>
                            </div>
                        )}
                    </div>
                </div>

                <div className="form-actions">
                    <button
                        type="button"
                        onClick={() => router.push('/landing/seo-posts')}
                        className="btn btn-secondary btn-medium"
                        disabled={isParsing}
                    >
                        Annuler
                    </button>
                    <button
                        type="button"
                        onClick={handleParse}
                        className="btn btn-primary btn-medium"
                        disabled={!selectedFile || isParsing}
                    >
                        {isParsing ? (
                            <>
                                <LoadingSpinner size="small" message="" inline />
                                Analyse...
                            </>
                        ) : (
                            'Analyser le fichier'
                        )}
                    </button>
                </div>
            </div>
        )
    }

    // ─── Étape 2 : Prévisualisation et confirmation ─────────────────────────────

    return (
        <div className="form-container">
            {/* Résumé du parsing */}
            <div className="form-card mb-4">
                <div className="card-content">
                    <h2 className="form-title">Aperçu du contenu extrait</h2>
                    <div className="d-flex gap-md flex-wrap mt-2">
                        <span className="status-badge status-info">
                            {parseResult?.blogContent.length ?? 0} section(s)
                        </span>
                        <span className="status-badge status-info">
                            {totalElements} élément(s) de contenu
                        </span>
                        {parseResult?.blogContent.map((section, i) => (
                            <span key={i} className="text-xs text-text-secondary">
                                § {section.title || `Section ${i + 1}`}
                            </span>
                        ))}
                    </div>
                </div>
            </div>

            {/* Champs éditables */}
            <div className="form-card">
                <div className="card-content">
                    <h2 className="form-title">Vérifier et compléter les métadonnées</h2>

                    <div className="form-group">
                        <label className="form-label">
                            Titre <span className="text-danger">*</span>
                        </label>
                        <input
                            type="text"
                            value={title}
                            onChange={e => setTitle(e.target.value)}
                            className="form-input"
                            placeholder="Titre de l'article"
                            disabled={isCreating}
                        />
                    </div>

                    <div className="form-group">
                        <label className="form-label">
                            Catégorie <span className="text-danger">*</span>
                        </label>
                        <select
                            value={selectedCategoryId}
                            onChange={e => setSelectedCategoryId(e.target.value ? parseInt(e.target.value, 10) : '')}
                            className="form-select"
                            disabled={isCreating}
                        >
                            <option value="">Sélectionnez une catégorie</option>
                            {categories.map(cat => (
                                <option key={cat.id} value={cat.id}>
                                    {cat.name}
                                </option>
                            ))}
                        </select>
                        {parseResult?.categoryName && !parseResult.categoryId && (
                            <p className="text-xs text-warning mt-1">
                                Catégorie "{parseResult.categoryName}" non trouvée — veuillez en sélectionner une manuellement.
                            </p>
                        )}
                    </div>

                    <div className="form-group">
                        <label className="form-label">Meta Description</label>
                        <textarea
                            value={metaDescription}
                            onChange={e => setMetaDescription(e.target.value)}
                            className="form-input"
                            rows={3}
                            placeholder="Description méta (150 caractères recommandés)"
                            disabled={isCreating}
                        />
                        <p className="text-xs text-text-secondary mt-1">
                            {metaDescription.length} caractère(s)
                        </p>
                    </div>

                    <div className="form-group">
                        <label className="form-label">Auteur</label>
                        <input
                            type="text"
                            value={author}
                            onChange={e => setAuthor(e.target.value)}
                            className="form-input"
                            placeholder="Prénom Nom"
                            disabled={isCreating}
                        />
                    </div>

                    <div className="form-group">
                        <label className="form-label">Excerpt</label>
                        <textarea
                            value={excerpt}
                            onChange={e => setExcerpt(e.target.value)}
                            className="form-input"
                            rows={2}
                            placeholder="Résumé court de l'article"
                            disabled={isCreating}
                        />
                    </div>

                    <div className="form-group">
                        <label className="form-label">Keywords (séparés par des virgules)</label>
                        <input
                            type="text"
                            value={keywordsInput}
                            onChange={e => setKeywordsInput(e.target.value)}
                            className="form-input"
                            placeholder="mot-clé 1, mot-clé 2, ..."
                            disabled={isCreating}
                        />
                    </div>

                    <div className="form-group">
                        <label className="form-label">Tags (séparés par des virgules)</label>
                        <input
                            type="text"
                            value={tagsInput}
                            onChange={e => setTagsInput(e.target.value)}
                            className="form-input"
                            placeholder="tag1, tag2, ..."
                            disabled={isCreating}
                        />
                    </div>

                    {isCreating && (
                        <div className="mt-4 p-4 bg-surface-secondary rounded-lg">
                            <div className="d-flex align-items-center gap-md">
                                <LoadingSpinner size="small" message="" inline />
                                <span className="font-medium">Création de l'article en cours...</span>
                            </div>
                        </div>
                    )}
                </div>
            </div>

            <div className="form-actions">
                <button
                    type="button"
                    onClick={handleBack}
                    className="btn btn-secondary btn-medium"
                    disabled={isCreating}
                >
                    ← Retour
                </button>
                <button
                    type="button"
                    onClick={handleCreate}
                    className="btn btn-primary btn-medium"
                    disabled={isCreating || !title.trim() || !selectedCategoryId}
                >
                    {isCreating ? (
                        <>
                            <LoadingSpinner size="small" message="" inline />
                            Création...
                        </>
                    ) : (
                        'Créer le post (brouillon)'
                    )}
                </button>
            </div>
        </div>
    )
}
