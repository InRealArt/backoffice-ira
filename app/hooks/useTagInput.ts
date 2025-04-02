import { useState } from 'react'

const useTagInput = (maxTags = 10) => {
    // Garder une trace des tags dans un tableau
    const [tags, setTags] = useState<string[]>([])

    // Fonction pour ajouter un tag au tableau
    const handleAddTag = (newTag: string) => {
        if (newTag && !tags.includes(newTag) && tags.length < maxTags) {
            setTags([...tags, newTag])
        }
    }

    // Fonction pour supprimer un tag du tableau
    const handleRemoveTag = (tag: string) =>
        setTags(tags.filter((t) => t !== tag))

    // Retourner les tags et les fonctions
    return { tags, handleAddTag, handleRemoveTag }
}

export default useTagInput 