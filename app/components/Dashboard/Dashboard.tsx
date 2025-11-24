'use client';

import { useEffect, useState } from 'react';
import { authClient } from '@/lib/auth-client';
import { useRouter } from 'next/navigation';
import Image from 'next/image';
import { User, Settings, FolderOpen, PlusCircle } from 'lucide-react';
import LoadingSpinner from '../LoadingSpinner/LoadingSpinner';
import Button from '../Button/Button';
import { DashboardCard } from './DashboardCard/DashboardCard'
import { getPendingItemsCount, getUserMintedItemsCount, getUserListedItemsCount, getBackofficeUserByEmail, getArtistById } from '@/lib/actions/prisma-actions'
import { getPresaleArtworkCountByArtist } from '@/lib/actions/presale-artwork-actions'
import { useIsAdmin } from '@/app/hooks/useIsAdmin'
import { DashboardStats } from './DashboardStats'

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
  const [presaleArtworkCount, setPresaleArtworkCount] = useState(0)
  const [isLoadingPresaleCount, setIsLoadingPresaleCount] = useState(true)
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
          
          console.log('🔍 DEBUG - backofficeUser:', backofficeUser);
          console.log('🔍 DEBUG - backofficeUser.artistId:', backofficeUser.artistId);
          console.log('🔍 DEBUG - backofficeUser.artist:', backofficeUser.artist);
          
          // Récupérer l'artiste associé via l'artistId
          if (backofficeUser.artistId) {
            const artist = await getArtistById(backofficeUser.artistId);
            if (!isMounted) return
            
            console.log('🔍 DEBUG - artist from getArtistById:', artist);
            
            if (artist) {
              setAssociatedArtist(artist);
              
              // Récupérer le nombre d'œuvres en prévente pour cet artiste
              const presaleCountResult = await getPresaleArtworkCountByArtist(artist.id);
              if (!isMounted) return
              setPresaleArtworkCount(presaleCountResult.count);
            }
          } else {
            console.log('⚠️ DEBUG - Pas d\'artistId sur backofficeUser');
          }
          
          if (!isMounted) return
          
          setIsLoadingArtist(false);
          setIsLoadingPresaleCount(false);
          
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
      
      <DashboardStats
        presaleArtworkCount={presaleArtworkCount}
        isLoadingPresaleCount={isLoadingPresaleCount}
        mintedItemsCount={mintedItemsCount}
        isLoadingMintedCount={isLoadingUserCounts}
        listedItemsCount={listedItemsCount}
        isLoadingListedCount={isLoadingUserCounts}
        pendingItemsCount={pendingItemsCount}
        isLoadingPendingCount={isLoadingCount}
        isAdmin={isAdmin}
      />
      
      <div className="dashboard-content">
        <DashboardCard 
          title="Informations utilisateur"
          icon={<User />}
          description="Vos informations de compte"
        >
          <p><strong>Email:</strong> {user?.email || 'Non défini'}</p>
          {!isAdmin && (
            <>
              {isLoadingArtist ? (
                <p><strong>Artiste associé:</strong> Chargement...</p>
              ) : associatedArtist ? (
                <>
                  <p><strong>Artiste associé:</strong> {associatedArtist.name} {associatedArtist.surname}</p>
                  {associatedArtist.imageUrl && (
                    <div className="artist-image-container">
                      <Image 
                        src={associatedArtist.imageUrl} 
                        alt={`${associatedArtist.name} ${associatedArtist.surname}`}
                        width={150}
                        height={150}
                        style={{ borderRadius: '12px', objectFit: 'cover', width: '100%', height: 'auto' }}
                      />
                    </div>
                  )}
                  <div className="mt-3">
                    <Button
                      onClick={() => router.push('/art/edit-artist-profile')}
                      variant="primary"
                    >
                      Éditer mon profil artiste
                    </Button>
                  </div>
                </>
              ) : (
                <>
                  <p><strong>Artiste associé:</strong> Aucun</p>
                  <div className="mt-3">
                    <Button
                      onClick={() => router.push('/art/create-artist-profile')}
                      variant="primary"
                    >
                      Créer mon profil Artiste
                    </Button>
                  </div>
                </>
              )}
            </>
          )}
        </DashboardCard>

        {isAdmin ? (
          <>
            <DashboardCard 
              title="Panneau d'Administration"
              icon={<Settings />}
              description="Gérez les utilisateurs et les paramètres"
            >
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
            {!isLoadingArtist && associatedArtist && (
              <>
                <DashboardCard 
                  title="Ma Collection"
                  icon={<FolderOpen />}
                  description="Explorez et gérez vos œuvres"
                >
                  <p>Explorez et gérez votre collection d'œuvres d'art.</p>
                  <Button onClick={() => router.push('/art/collection')}>
                    Voir ma collection
                  </Button>
                </DashboardCard>
                
                <DashboardCard 
                  title="Création d'œuvre"
                  icon={<PlusCircle />}
                  description="Créez de nouvelles œuvres d'art"
                >
                  <p>Créez et publiez une nouvelle œuvre d'art.</p>
                  <Button 
                    onClick={() => router.push('/art/createArtwork')}
                  >
                    Créer une œuvre
                  </Button>
                </DashboardCard>
              </>
            )}
          </>
        )}
      </div>
    </div>
  );
}