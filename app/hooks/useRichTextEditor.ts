'use client'

import { useState, useEffect } from 'react'
import { UseFormSetValue, UseFormWatch, Path, PathValue } from 'react-hook-form'

/**
 * Hook personnalisé pour faciliter l'utilisation d'un textarea pour le contenu
 * avec react-hook-form
 * 
 * @param fieldName Nom du champ dans le formulaire
 * @param setValue Fonction setValue de react-hook-form
 * @param watch Fonction watch de react-hook-form
 * @returns Un objet contenant la valeur actuelle et une fonction de mise à jour
 */
export function useRichTextEditor<T extends Record<string, any>>(
    fieldName: Path<T>,
    setValue: UseFormSetValue<T>,
    watch: UseFormWatch<T>
) {
    // Récupérer la valeur actuelle du champ
    const fieldValue = watch(fieldName) as string || ''
    const [textContent, setTextContent] = useState<string>(fieldValue)

    // Mettre à jour l'état local quand la valeur du champ change
    useEffect(() => {
        setTextContent(fieldValue)
    }, [fieldValue])

    // Fonction pour mettre à jour la valeur du champ
    const handleTextChange = (content: string) => {
        setTextContent(content)
        setValue(fieldName, content as unknown as PathValue<T, Path<T>>, {
            shouldValidate: true,
            shouldDirty: true,
            shouldTouch: true
        })
    }

    return {
        value: textContent,
        onChange: handleTextChange
    }
} 