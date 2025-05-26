'use client'

import { useState, useEffect, useCallback } from 'react'
import { useRouter } from 'next/navigation'
import { useToast } from '@/app/components/Toast/ToastContext'
import { deleteSeoCategory } from '@/lib/actions/seo-category-actions'

interface CategoryProps {
    id: number
    name: string
    url?: string | null
    color?: string | null
    shortDescription?: string | null
    _count?: { posts: number }
}

interface UseCategoriesProps {
    initialCategories: CategoryProps[] | undefined
}

export function useCategories({ initialCategories }: UseCategoriesProps) {
    const router = useRouter()
    const [categories, setCategories] = useState<CategoryProps[] | undefined>(initialCategories)
    const [loadingCategoryId, setLoadingCategoryId] = useState<number | null>(null)
    const [deletingCategoryId, setDeletingCategoryId] = useState<number | null>(null)
    const { success, error } = useToast()

    // Synchroniser avec les nouvelles props
    useEffect(() => {
        setCategories(initialCategories)
    }, [initialCategories])

    const navigateToEdit = useCallback((categoryId: number) => {
        setLoadingCategoryId(categoryId)
        router.push(`/landing/blog-categories/${categoryId}/edit`)
    }, [router])

    const navigateToCreate = useCallback(() => {
        router.push(`/landing/blog-categories/create`)
    }, [router])

    const deleteCategory = useCallback(async (categoryId: number) => {
        if (!categories) return false

        setDeletingCategoryId(categoryId)

        try {
            const result = await deleteSeoCategory(categoryId)

            if (result.success) {
                // Mise à jour optimiste
                setCategories(prevCategories =>
                    prevCategories?.filter(category => category.id !== categoryId)
                )
                success('Catégorie supprimée avec succès')

                // Rafraîchir en arrière-plan
                router.refresh()
                return true
            } else {
                error(result.message || 'Une erreur est survenue lors de la suppression')
                return false
            }
        } catch (error: any) {
            console.error('Erreur lors de la suppression:', error)
            error('Une erreur est survenue lors de la suppression')

            // Restaurer l'état en cas d'erreur
            router.refresh()
            return false
        } finally {
            setDeletingCategoryId(null)
        }
    }, [categories, router])

    const refreshCategories = useCallback(() => {
        router.refresh()
    }, [router])

    return {
        categories,
        loadingCategoryId,
        deletingCategoryId,
        navigateToEdit,
        navigateToCreate,
        deleteCategory,
        refreshCategories,
        isLoading: loadingCategoryId !== null || deletingCategoryId !== null
    }
} 