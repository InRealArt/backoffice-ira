'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { Team } from '@prisma/client'
import LoadingSpinner from '@/app/components/LoadingSpinner/LoadingSpinner'
import Image from 'next/image'
import {
  PageContainer,
  PageHeader,
  PageContent,
  DataTable,
  EmptyState,
  ActionButton,
  Column
} from '../index'

interface TeamClientRefactoredProps {
  teamMembers: Team[]
}

export default function TeamClientRefactored({ teamMembers }: TeamClientRefactoredProps) {
  const [isMobile, setIsMobile] = useState(false)
  const router = useRouter()
  const [loadingMemberId, setLoadingMemberId] = useState<number | null>(null)
  const [sortColumn, setSortColumn] = useState<string>('order')
  const [sortDirection, setSortDirection] = useState<'asc' | 'desc'>('asc')
  
  // Détecte si l'écran est de taille mobile
  useEffect(() => {
    const checkIfMobile = () => {
      setIsMobile(window.innerWidth < 768)
    }
    
    // Vérifier au chargement
    checkIfMobile()
    
    // Écouter les changements de taille d'écran
    window.addEventListener('resize', checkIfMobile)
    
    return () => {
      window.removeEventListener('resize', checkIfMobile)
    }
  }, [])
  
  const handleMemberClick = (member: Team) => {
    setLoadingMemberId(member.id)
    router.push(`/landing/team/${member.id}/edit`)
  }

  const handleCreateMember = () => {
    router.push('/landing/team/create')
  }
  
  const handleSort = (column: string) => {
    if (sortColumn === column) {
      setSortDirection(prev => prev === 'asc' ? 'desc' : 'asc')
    } else {
      setSortColumn(column)
      setSortDirection('asc')
    }
  }
  
  // Trier les membres de l'équipe selon le champ sélectionné
  const sortedTeamMembers = [...teamMembers].sort((a, b) => {
    const valueA = (a as any)[sortColumn] ?? 0
    const valueB = (b as any)[sortColumn] ?? 0
    
    if (sortDirection === 'asc') {
      return typeof valueA === 'string' 
        ? valueA.localeCompare(valueB) 
        : valueA - valueB
    } else {
      return typeof valueA === 'string' 
        ? valueB.localeCompare(valueA) 
        : valueB - valueA
    }
  })
  
  // Définition des colonnes pour le DataTable
  const columns: Column<Team>[] = [
    {
      key: 'id',
      header: 'ID',
      width: '80px'
    },
    {
      key: 'name',
      header: 'Nom',
      render: (member) => (
        <div className="d-flex align-items-center gap-sm">
          {loadingMemberId === member.id && <LoadingSpinner size="small" message="" inline />}
          <div className="d-flex align-items-center gap-md">
            {member.photoUrl1 && (
              <div style={{ width: '32px', height: '32px', borderRadius: '50%', overflow: 'hidden', position: 'relative' }}>
                <Image
                  src={member.photoUrl1}
                  alt={`${member.firstName} ${member.lastName}`}
                  fill
                  style={{ objectFit: 'cover' }}
                />
              </div>
            )}
            <span className={loadingMemberId === member.id ? 'text-muted' : ''}>
              {member.firstName} {member.lastName}
            </span>
          </div>
        </div>
      )
    },
    {
      key: 'role',
      header: 'Rôle'
    },
    {
      key: 'email',
      header: 'Email'
    },
    {
      key: 'order',
      header: 'Ordre',
      sortable: true
    }
  ]
  
  return (
    <PageContainer>
      <PageHeader 
        title="Équipe"
        subtitle="Liste des membres de l'équipe affichés sur le site"
        actions={
          <ActionButton 
            label="Ajouter un membre"
            onClick={handleCreateMember}
            size="small"
          />
        }
      />
      
      <PageContent>
        <DataTable
          data={sortedTeamMembers}
          columns={columns}
          keyExtractor={(member) => member.id}
          onRowClick={handleMemberClick}
          isLoading={false}
          loadingRowId={loadingMemberId}
          sortColumn={sortColumn}
          sortDirection={sortDirection}
          onSort={handleSort}
          emptyState={
            <EmptyState 
              message="Aucun membre trouvé"
              action={
                <ActionButton
                  label="Ajouter un premier membre"
                  onClick={handleCreateMember}
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