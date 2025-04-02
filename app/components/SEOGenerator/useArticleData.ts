'use client'

import { useState, useCallback, useEffect } from 'react'
import { ArticleContent } from './SEOContentGenerator'

/**
 * Hook personnalisé pour gérer les données d'un article SEO
 * 
 * @param initialData Données initiales à utiliser pour l'article
 * @returns Objet contenant les données et méthodes pour manipuler l'article
 */
export default function useArticleData(initialData: Partial<ArticleContent> = {}) {
    // État pour les données de l'article
    const [article, setArticle] = useState<ArticleContent>({
        title: initialData.title || '',
        mainImage: initialData.mainImage || { url: '', alt: '' },
        introduction: initialData.introduction || '',
        sections: initialData.sections || [],
        conclusion: initialData.conclusion || '',
        tags: initialData.tags || []
    })

    // État pour le compteur de mots
    const [wordCount, setWordCount] = useState(0)

    // Mettre à jour le compteur de mots
    useEffect(() => {
        // Calculer le nombre de mots
        const allText = [
            article.title,
            article.introduction,
            ...article.sections.flatMap(section => [
                section.title,
                section.content,
                ...section.subsections.flatMap(subsection => [
                    subsection.title,
                    subsection.content
                ])
            ]),
            article.conclusion
        ].join(' ')

        const count = allText.split(/\s+/).filter(Boolean).length
        setWordCount(count)
    }, [article])

    // Méthodes pour manipuler l'article

    // Mettre à jour le titre
    const updateTitle = useCallback((title: string) => {
        setArticle(prev => ({ ...prev, title }))
    }, [])

    // Mettre à jour l'image principale
    const updateMainImage = useCallback((url: string, alt: string) => {
        setArticle(prev => ({ ...prev, mainImage: { url, alt } }))
    }, [])

    // Mettre à jour l'introduction
    const updateIntroduction = useCallback((introduction: string) => {
        setArticle(prev => ({ ...prev, introduction }))
    }, [])

    // Mettre à jour la conclusion
    const updateConclusion = useCallback((conclusion: string) => {
        setArticle(prev => ({ ...prev, conclusion }))
    }, [])

    // Ajouter une section
    const addSection = useCallback(() => {
        setArticle(prev => ({
            ...prev,
            sections: [...prev.sections, {
                id: Date.now(),
                title: '',
                content: '',
                subsections: []
            }]
        }))
    }, [])

    // Supprimer une section
    const removeSection = useCallback((sectionId: number) => {
        setArticle(prev => ({
            ...prev,
            sections: prev.sections.filter(section => section.id !== sectionId)
        }))
    }, [])

    // Mettre à jour une section
    const updateSection = useCallback((sectionId: number, title: string, content: string) => {
        setArticle(prev => ({
            ...prev,
            sections: prev.sections.map(section =>
                section.id === sectionId
                    ? { ...section, title, content }
                    : section
            )
        }))
    }, [])

    // Ajouter une sous-section
    const addSubsection = useCallback((sectionId: number) => {
        setArticle(prev => ({
            ...prev,
            sections: prev.sections.map(section =>
                section.id === sectionId
                    ? {
                        ...section,
                        subsections: [...section.subsections, {
                            id: Date.now(),
                            title: '',
                            content: '',
                            elements: []
                        }]
                    }
                    : section
            )
        }))
    }, [])

    // Supprimer une sous-section
    const removeSubsection = useCallback((sectionId: number, subsectionId: number) => {
        setArticle(prev => ({
            ...prev,
            sections: prev.sections.map(section =>
                section.id === sectionId
                    ? {
                        ...section,
                        subsections: section.subsections.filter(subsection => subsection.id !== subsectionId)
                    }
                    : section
            )
        }))
    }, [])

    // Gérer les tags
    const addTag = useCallback((tag: string) => {
        if (tag && !article.tags.includes(tag)) {
            setArticle(prev => ({
                ...prev,
                tags: [...prev.tags, tag]
            }))
        }
    }, [article.tags])

    const removeTag = useCallback((tagToRemove: string) => {
        setArticle(prev => ({
            ...prev,
            tags: prev.tags.filter(tag => tag !== tagToRemove)
        }))
    }, [])

    return {
        article,
        wordCount,
        updateTitle,
        updateMainImage,
        updateIntroduction,
        updateConclusion,
        addSection,
        removeSection,
        updateSection,
        addSubsection,
        removeSubsection,
        addTag,
        removeTag,
        // Pour les cas où l'on veut mettre à jour directement l'article entier
        setArticle
    }
} 