'use client';

import { useEffect, useState } from 'react';
import { authClient } from '@/lib/auth-client';
import { useRouter } from 'next/navigation';
import Image from 'next/image';
import LoadingSpinner from '../LoadingSpinner/LoadingSpinner';
import Button from '../Button/Button';
import { DashboardCard } from './DashboardCard/DashboardCard'
import { getPendingItemsCount, getUserMintedItemsCount, getUserListedItemsCount, getBackofficeUserByEmail, getArtistById } from '@/lib/actions/prisma-actions'
import { useIsAdmin } from '@/app/hooks/useIsAdmin';

export default function Dashboard() {
  const { data: session } = authClient.useSession();
  const user = session?.user;
  // Note: primaryWallet sera géré plus tard dans une migration séparée des wallets
  const primaryWallet = null as { address?: string } | null;
  const [isAdminNavigating, setIsAdminNavigating] = useState(false);
  const router = useRouter();
  const [pendingItemsCount, setPendingItemsCount] = useState(0)
  const [mintedItemsCount, setMintedItemsCount] = useState(0)
  const [listedItemsCount, setListedItemsCount] = useState(0)
  const [isLoadingCount, setIsLoadingCount] = useState(true)
  const [isLoadingUserCounts, setIsLoadingUserCounts] = useState(true)
  const [associatedArtist, setAssociatedArtist] = useState<any>(null)
  const [isLoadingArtist, setIsLoadingArtist] = useState(true)
  const { isAdmin, isLoading } = useIsAdmin()

  const truncateAddress = (address: string | undefined) => {
    if (!address) return 'Non défini';
    const start = address.substring(0, 6);
    const end = address.substring(address.length - 4);
    return `${start}...${end}`;
  };

  useEffect(() => {
    const fetchPendingItems = async () => {
      if (isAdmin) {
        try {
          const { count } = await getPendingItemsCount()
          setPendingItemsCount(count)
        } catch (error) {
          console.error('Erreur lors de la récupération du nombre d\'items:', error)
        } finally {
          setIsLoadingCount(false)
        }
      }
    }

    fetchPendingItems()
  }, [isAdmin])

  useEffect(() => {
    let isMounted = true

    const fetchUserItemsStats = async () => {
      const userEmail = user?.email
      
      if (!isAdmin && userEmail) {
        try {
          const backofficeUser = await getBackofficeUserByEmail(userEmail);
          
          if (!isMounted) return
          
          if (!backofficeUser) {
            console.error('Utilisateur Backoffice non trouvé pour cet email');
            setIsLoadingUserCounts(false);
            setIsLoadingArtist(false);
            return;
          }
          
          // Récupérer l'artiste associé via l'artistId
          if (backofficeUser.artistId) {
            const artist = await getArtistById(backofficeUser.artistId);
            if (!isMounted) return
            
            if (artist) {
              setAssociatedArtist(artist);
            }
          }
          
          if (!isMounted) return
          
          setIsLoadingArtist(false);
          
          const mintedResult = await getUserMintedItemsCount(backofficeUser.id);
          const listedResult = await getUserListedItemsCount(backofficeUser.id);
          
          if (!isMounted) return
          
          setMintedItemsCount(mintedResult.count);
          setListedItemsCount(listedResult.count);
        } catch (error) {
          if (!isMounted) return
          console.error('Erreur lors de la récupération des statistiques d\'items:', error)
        } finally {
          if (isMounted) {
            setIsLoadingUserCounts(false)
            setIsLoadingArtist(false)
          }
        }
      }
    }

    fetchUserItemsStats()

    return () => {
      isMounted = false
    }
  }, [isAdmin, user?.email]) // Utiliser user?.email au lieu de user pour stabiliser

  const handleAdminShowUsers = () => {
    setIsAdminNavigating(true);
    router.push('/boAdmin/users');
  };

  if (isLoading) return <LoadingSpinner fullPage message="Chargement du tableau de bord..." />;

  return (
    <div className="dashboard-container">
      <h2 className="dashboard-title">Tableau de bord</h2>
      
      <div className="dashboard-content">
        <DashboardCard title="Informations utilisateur">
          <p><strong>Email:</strong> {user?.email || 'Non défini'}</p>
          {!isAdmin && (
            <>
              {isLoadingArtist ? (
                <p><strong>Artiste associé:</strong> Chargement...</p>
              ) : associatedArtist ? (
                <>
                  <p><strong>Artiste associé:</strong> {associatedArtist.name} {associatedArtist.surname}</p>
                  {associatedArtist.imageUrl && (
                    <div className="artist-image-container" style={{ marginTop: '15px' }}>
                      <Image 
                        src={associatedArtist.imageUrl} 
                        alt={`${associatedArtist.name} ${associatedArtist.surname}`}
                        width={150}
                        height={150}
                        style={{ borderRadius: '8px', objectFit: 'cover' }}
                      />
                    </div>
                  )}
                </>
              ) : (
                <p><strong>Artiste associé:</strong> Aucun</p>
              )}
            </>
          )}
        </DashboardCard>

        {isAdmin ? (
          <>
            <DashboardCard title="Panneau d'Administration">
              <p>Voir les utilisateurs et leurs informations.</p>
              <Button
                onClick={handleAdminShowUsers}
                isLoading={isAdminNavigating}
                loadingText="Chargement..."
              >
                Voir les utilisateurs
              </Button>
            </DashboardCard>

            
          </>
        ) : (
          <>
            <DashboardCard title="Ma Collection">
              <p>Explorez et gérez votre collection d'œuvres d'art.</p>
              <Button onClick={() => router.push('/art/collection')}>
                Voir ma collection d'œuvres d'art
              </Button>
            </DashboardCard>
            
            <DashboardCard title="Création d'œuvre">
              <p>Créez et publiez une nouvelle œuvre d'art.</p>
              <button 
                className="dashboard-button" 
                onClick={() => router.push('/art/createArtwork')}
              >
                Créer une œuvre
              </button>
            </DashboardCard>

            <DashboardCard title="Statut de mes œuvres">
              {isLoadingUserCounts ? (
                <p>Chargement des statistiques...</p>
              ) : (
                <>
                  <p>Œuvres mintées : <strong>{mintedItemsCount}</strong></p>
                  <p>Œuvres en vente : <strong>{listedItemsCount}</strong></p>
                  <Button 
                    onClick={() => router.push('/art/collection')}
                  >
                    Voir le détail
                  </Button>
                </>
              )}
            </DashboardCard>
          </>
        )}
      </div>
    </div>
  );
}