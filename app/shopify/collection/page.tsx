'use client';

import { useEffect, useState } from 'react';
import { useDynamicContext } from '@dynamic-labs/sdk-react-core';
import styles from './collection.module.scss';
import SideMenu from '@/app/components/SideMenu/SideMenu';
import Navbar from '@/app/components/Navbar/Navbar';
import LoadingSpinner from '@/app/components/LoadingSpinner/LoadingSpinner';
import { getShopifyCollectionByTitle } from '@/app/actions/shopify/shopifyActions';
import { getShopifyUserByEmail } from '@/app/actions/prisma/prismaActions';

export default function MyCollection() {
  const { user, primaryWallet } = useDynamicContext();
  const [isLoading, setIsLoading] = useState(true);
  const [collectionId, setCollectionId] = useState<string | null>(null);
  const [collectionTitle, setCollectionTitle] = useState<string | null>(null);
  const [collectionDescription, setCollectionDescription] = useState<string | null>(null);
  const [collectionPublishedAt, setCollectionPublishedAt] = useState<string | null>(null);
  const [collectionError, setCollectionError] = useState<string | null>(null);

  // Récupérer les informations de l'utilisateur et de sa collection
  useEffect(() => {
    let isMounted = true;
    setIsLoading(true);
    
    const fetchUserCollectionInfo = async () => {
      if (!user?.email) {
        setIsLoading(false);
        setCollectionError('Aucun email d\'utilisateur trouvé');
        return;
      }
      
      try {
        // Récupérer les informations de l'utilisateur depuis la base de données
        const shopifyUser = await getShopifyUserByEmail(user.email);
        
        if (!shopifyUser || !shopifyUser.firstName || !shopifyUser.lastName) {
          throw new Error('Informations utilisateur incomplètes');
        }
        
        // Récupérer la collection avec le titre basé sur le nom et prénom
        const collectionTitle = `${shopifyUser.firstName} ${shopifyUser.lastName}`.trim();
        const result = await getShopifyCollectionByTitle(collectionTitle);
        
        if (isMounted) {
          if (result.success && result.collection) {
            setCollectionId(result.collection.id);
            setCollectionTitle(result.collection.title);
            setCollectionDescription(result.collection.body_html || '');
            setCollectionPublishedAt(result.collection.published_at);
            setCollectionError(null);
          } else {
            setCollectionError(result.message || 'Aucune collection trouvée à votre nom');
          }
        }
      } catch (error: any) {
        console.error('Erreur lors de la récupération des données:', error);
        if (isMounted) {
          setCollectionError(error.message || 'Une erreur est survenue lors du chargement de vos données');
        }
      } finally {
        if (isMounted) {
          setIsLoading(false);
        }
      }
    };

    fetchUserCollectionInfo();
    
    // Nettoyage pour éviter les mises à jour sur un composant démonté
    return () => {
      isMounted = false;
    };
  }, [user]);

  if (isLoading) {
    return (
      <>
        <Navbar />
        <div className="page-layout">
          <SideMenu />
          <div className="content-container">
            <LoadingSpinner message="Chargement de votre collection..." />
          </div>
        </div>
      </>
    );
  }

  return (
    <>
      <Navbar />
      <div className="page-layout">
        <SideMenu />
        <div className="content-container">
          <div className={styles.collectionContainer}>
            <h1 className={styles.collectionTitle}>Ma Collection</h1>
            
            <div className={styles.collectionContent}>
              {collectionError ? (
                <div className={styles.errorMessage}>
                  <p>{collectionError}</p>
                </div>
              ) : collectionId ? (
                <>
                  <div className={styles.collectionInfo}>
                    <h2>{collectionTitle}</h2>
                    
                    {collectionDescription ? (
                      <div 
                        className={styles.collectionDescription}
                        dangerouslySetInnerHTML={{ __html: collectionDescription }}
                      />
                    ) : (
                      <p className={styles.emptyDescription}>Aucune description n'a été ajoutée à votre collection.</p>
                    )}
                    
                    <div className={styles.collectionStats}>
                      <p className={styles.collectionStat}>
                        <span className={styles.statLabel}>Date de création:</span>
                        <span className={styles.statValue}>
                          {collectionPublishedAt 
                            ? new Date(collectionPublishedAt).toLocaleDateString('fr-FR') 
                            : 'Non disponible'}
                        </span>
                      </p>
                    </div>
                  </div>
                  
                  <div className={styles.productsList}>
                    <h3 className={styles.productsTitle}>Œuvres dans cette collection</h3>
                    <p>Les œuvres de votre collection apparaîtront ici.</p>
                  </div>
                </>
              ) : (
                <div className={styles.emptyState}>
                  <p>Aucune collection n'a été trouvée à votre nom.</p>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </>
  );
}