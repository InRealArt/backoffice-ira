import { useState, useCallback } from 'react'
import { BlogContent, BlogSection } from '../types'
import { v4 as uuidv4 } from 'uuid'

// Fonction utilitaire pour générer des IDs uniques
const generateId = () => uuidv4()

interface UseSectionOrderingReturn {
    sections: BlogContent
    addSection: () => void
    updateSection: (index: number, updated: BlogSection) => void
    deleteSection: (index: number) => void
    moveSection: (index: number, direction: 'up' | 'down') => void
    canMoveUp: (index: number) => boolean
    canMoveDown: (index: number) => boolean
    reorderSections: (newOrder: BlogContent) => void
}

export function useSectionOrdering(initialContent: BlogContent = []): UseSectionOrderingReturn {
    const [sections, setSections] = useState<BlogContent>(initialContent)

    const addSection = useCallback(() => {
        const newSection: BlogSection = {
            id: generateId(),
            title: `Section ${sections.length + 1}`,
            elements: []
        }
        setSections(prev => [...prev, newSection])
    }, [sections.length])

    const updateSection = useCallback((index: number, updated: BlogSection) => {
        setSections(prev => {
            const newSections = [...prev]
            newSections[index] = updated
            return newSections
        })
    }, [])

    const deleteSection = useCallback((index: number) => {
        setSections(prev => {
            const newSections = [...prev]
            newSections.splice(index, 1)
            return newSections
        })
    }, [])

    const moveSection = useCallback((index: number, direction: 'up' | 'down') => {
        setSections(prev => {
            // Vérifier les limites
            if (
                (direction === 'up' && index === 0) ||
                (direction === 'down' && index === prev.length - 1)
            ) {
                return prev
            }

            const newSections = [...prev]
            const targetIndex = direction === 'up' ? index - 1 : index + 1

            // Échanger les sections
            const temp = newSections[index]
            newSections[index] = newSections[targetIndex]
            newSections[targetIndex] = temp

            return newSections
        })
    }, [])

    const canMoveUp = useCallback((index: number) => index > 0, [])

    const canMoveDown = useCallback((index: number) => index < sections.length - 1, [sections.length])

    const reorderSections = useCallback((newOrder: BlogContent) => {
        setSections(newOrder)
    }, [])

    return {
        sections,
        addSection,
        updateSection,
        deleteSection,
        moveSection,
        canMoveUp,
        canMoveDown,
        reorderSections
    }
}
