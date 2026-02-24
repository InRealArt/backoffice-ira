'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import Image from 'next/image'
import { Plus, Users } from 'lucide-react'
import {
    PageContainer,
    PageHeader,
    PageContent,
    DataTable,
    EmptyState,
    ActionButton,
    Badge,
} from '@/app/components/PageLayout/index'
import type { Column } from '@/app/components/PageLayout/index'
import styles from '../../../../styles/list-components.module.scss'
import LoadingSpinner from '@/app/components/LoadingSpinner/LoadingSpinner'

type UgcProfile = {
    id: number
    name: string | null
    surname: string | null
    pseudo: string | null
    profileImageUrl: string | null
    title: string | null
    mediaUrls: string[]
    landingArtist: {
        id: number
        artist: { name: string | null; surname: string | null; pseudo: string | null }
    } | null
}

function getDisplayName(profile: UgcProfile): string {
    if (profile.name && profile.surname) return `${profile.name} ${profile.surname}`
    if (profile.pseudo) return profile.pseudo
    if (profile.name) return profile.name
    if (profile.surname) return profile.surname
    return '(Sans nom)'
}

interface Props {
    profiles: UgcProfile[]
}

export default function UgcArtistProfilesClient({ profiles }: Props) {
    const router = useRouter()
    const [loadingId, setLoadingId] = useState<number | null>(null)
    const [isCreating, setIsCreating] = useState(false)

    const handleRowClick = (profile: UgcProfile) => {
        setLoadingId(profile.id)
        router.push(`/landing/ugc/artist-profiles/${profile.id}/edit`)
    }

    const handleCreate = () => {
        setIsCreating(true)
        router.push('/landing/ugc/artist-profiles/create')
    }

    const columns: Column<UgcProfile>[] = [
        {
            key: 'name',
            header: 'Nom',
            render: (profile) => (
                <div className="d-flex align-items-center gap-sm">
                    {loadingId === profile.id && <LoadingSpinner size="small" message="" inline />}
                    <span className={loadingId === profile.id ? 'text-muted' : ''}>
                        {getDisplayName(profile)}
                    </span>
                </div>
            ),
        },
        {
            key: 'pseudo',
            header: 'Pseudo',
            render: (profile) => profile.pseudo ?? '-',
        },
        {
            key: 'ira',
            header: 'Artiste IRA',
            render: (profile) =>
                profile.landingArtist ? (
                    <Badge variant="success" text="Lié IRA" />
                ) : (
                    <Badge variant="secondary" text="Standalone" />
                ),
        },
        {
            key: 'medias',
            header: 'Médias',
            render: (profile) => <span>{profile.mediaUrls.length}</span>,
        },
        {
            key: 'image',
            header: 'Photo',
            className: 'hidden-mobile',
            render: (profile) =>
                profile.profileImageUrl ? (
                    <div className={styles.thumbnailContainer}>
                        <Image
                            src={profile.profileImageUrl}
                            alt={getDisplayName(profile)}
                            fill
                            style={{ objectFit: 'cover' }}
                        />
                    </div>
                ) : null,
        },
    ]

    return (
        <PageContainer>
            <PageHeader
                title="Profils Artistes UGC"
                subtitle="Liste des profils artistes pour la section UGC de la landing"
                actions={
                    <ActionButton
                        label="Créer un profil"
                        onClick={handleCreate}
                        size="small"
                        disabled={isCreating}
                        icon={isCreating ? undefined : <Plus size={16} />}
                        isLoading={isCreating}
                    />
                }
            />
            <PageContent>
                <DataTable
                    data={profiles}
                    columns={columns}
                    keyExtractor={(p) => p.id}
                    onRowClick={handleRowClick}
                    isLoading={false}
                    loadingRowId={loadingId}
                    emptyState={
                        <EmptyState
                            message="Aucun profil artiste UGC trouvé"
                            action={
                                <ActionButton
                                    label="Créer le premier profil"
                                    onClick={handleCreate}
                                    variant="primary"
                                />
                            }
                        />
                    }
                />
            </PageContent>
        </PageContainer>
    )
}
