'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { Team } from '@prisma/client'
import LoadingSpinner from '@/app/components/LoadingSpinner/LoadingSpinner'
import Image from 'next/image'

interface TeamClientProps {
  teamMembers: Team[]
}

export default function TeamClient({ teamMembers }: TeamClientProps) {
  const [isMobile, setIsMobile] = useState(false)
  const router = useRouter()
  const [loadingMemberId, setLoadingMemberId] = useState<number | null>(null)
  
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
  
  const handleMemberClick = (memberId: number) => {
    setLoadingMemberId(memberId)
    router.push(`/landing/team/${memberId}/edit`)
  }

  const handleCreateMember = () => {
    router.push('/landing/team/new')
  }
  
  return (
    <div className="page-container">
      <div className="page-header">
        <div className="header-top-section">
          <h1 className="page-title">Équipe</h1>
          <button 
            className="btn btn-primary btn-small"
            onClick={handleCreateMember}
          >
            Ajouter un membre
          </button>
        </div>
        <p className="page-subtitle">
          Liste des membres de l'équipe affichés sur le site
        </p>
      </div>
      
      <div className="page-content">
        {teamMembers.length === 0 ? (
          <div className="empty-state">
            <p>Aucun membre trouvé</p>
          </div>
        ) : (
          <div className="table-container">
            <table className="data-table">
              <thead>
                <tr>
                  <th>Nom</th>
                  <th>Rôle</th>
                  <th>Email</th>
                  <th className={isMobile ? 'hidden-mobile' : ''}>LinkedIn</th>
                </tr>
              </thead>
              <tbody>
                {teamMembers.map((member) => {
                  const isLoading = loadingMemberId === member.id
                  return (
                    <tr 
                      key={member.id} 
                      onClick={() => !loadingMemberId && handleMemberClick(member.id)}
                      className={`clickable-row ${isLoading ? 'loading-row' : ''} ${loadingMemberId && !isLoading ? 'disabled-row' : ''}`}
                    >
                      <td>
                        <div className="d-flex align-items-center gap-sm">
                          {isLoading && <LoadingSpinner size="small" message="" inline />}
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
                            <span className={isLoading ? 'text-muted' : ''}>
                              {member.firstName} {member.lastName}
                            </span>
                          </div>
                        </div>
                      </td>
                      <td>{member.role}</td>
                      <td>{member.email}</td>
                      <td className={isMobile ? 'hidden-mobile' : ''}>
                        {member.linkedinUrl ? (
                          <a 
                            href={member.linkedinUrl} 
                            target="_blank"
                            rel="noopener noreferrer"
                            onClick={(e) => e.stopPropagation()}
                            className="external-link"
                          >
                            Voir le profil
                          </a>
                        ) : (
                          <span className="text-muted">Non renseigné</span>
                        )}
                      </td>
                    </tr>
                  )
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  )
} 