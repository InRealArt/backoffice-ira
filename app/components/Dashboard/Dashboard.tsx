'use client';

import { useEffect, useState } from 'react';
import { useDynamicContext } from '@dynamic-labs/sdk-react-core';
import { useRouter } from 'next/navigation';
import Image from 'next/image';
import LoadingSpinner from '../LoadingSpinner/LoadingSpinner';
import Button from '../Button/Button';
import { DashboardCard } from './DashboardCard/DashboardCard'
import { getPendingItemsCount, getUserMintedItemsCount, getUserListedItemsCount, getBackofficeUserByEmail, getArtistById } from '@/lib/actions/prisma-actions'
import { useIsAdmin } from '@/app/hooks/useIsAdmin';

export default function Dashboard() {
  const { user, primaryWallet } = useDynamicContext();
  const [shopifyGranted, setShopifyGranted] = useState(false);
  const [isModalOpen, setIsModalOpen] = useState(false);
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
    const fetchUserItemsStats = async () => {
      if (!isAdmin && user?.email) {
        try {
          const backofficeUser = await getBackofficeUserByEmail(user.email);
          
          if (!backofficeUser) {
            console.error('Utilisateur Backoffice non trouvé pour cet email');
            setIsLoadingUserCounts(false);
            setIsLoadingArtist(false);
            return;
          }
          
          // Récupérer l'artiste associé via l'artistId
          if (backofficeUser.artistId) {
            const artist = await getArtistById(backofficeUser.artistId);
            if (artist) {
              setAssociatedArtist(artist);
            }
          }
          setIsLoadingArtist(false);
          
          const mintedResult = await getUserMintedItemsCount(backofficeUser.id);
          const listedResult = await getUserListedItemsCount(backofficeUser.id);
          
          setMintedItemsCount(mintedResult.count);
          setListedItemsCount(listedResult.count);
        } catch (error) {
          console.error('Erreur lors de la récupération des statistiques d\'items:', error)
        } finally {
          setIsLoadingUserCounts(false)
          setIsLoadingArtist(false)
        }
      }
    }

    fetchUserItemsStats()
  }, [isAdmin, user])

  const handleAdminShowUsers = () => {
    setIsAdminNavigating(true);
    router.push('/admin/boAdmin/users');
  };

  if (isLoading) return <LoadingSpinner fullPage message="Chargement du tableau de bord..." />;

  return (
    <div className="dashboard-container">
      <h2 className="dashboard-title">Tableau de bord</h2>
      
      <div className="dashboard-content">
        <DashboardCard title="Informations utilisateur">
          <p><strong>Email:</strong> {user?.email || 'Non défini'}</p>
          <p><strong>Adresse wallet:</strong> <span className="dashboard-small-text">{truncateAddress(primaryWallet?.address)}</span></p>
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

            <DashboardCard title="Items en attente">
              {isLoadingCount ? (
                <p>Chargement du nombre d'items...</p>
              ) : (
                <>
                  <p>Nombre d'items en attente de validation : <strong>{pendingItemsCount}</strong></p>
                  <Button 
                    onClick={() => router.push('/marketplace/nftsToMint')}
                  >
                    Voir les items en attente
                  </Button>
                </>
              )}
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