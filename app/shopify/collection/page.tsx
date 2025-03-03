'use client';

import { useState, useEffect } from 'react';
import { useDynamicContext } from '@dynamic-labs/sdk-react-core';
import Navbar from '@/app/components/Navbar/Navbar';
import SideMenu from '@/app/components/SideMenu/SideMenu';
import LoadingSpinner from '@/app/components/LoadingSpinner/LoadingSpinner';
import ProductCard from '@/app/components/ProductCard/ProductCard';
import { fetchCollectionData, CollectionData } from '@/app/utils/shopify/collection';
import styles from './collection.module.scss';
import { getShopifyUserByEmail } from '@/app/actions/prisma/prismaActions';
import { ShopifyUser } from '@prisma/client';

export default function CollectionPage() {
  const { user } = useDynamicContext();
  const [isLoading, setIsLoading] = useState(true);
  const [collectionData, setCollectionData] = useState<CollectionData | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [userDB, setUserDB] = useState<ShopifyUser | null>(null);
  useEffect(() => {
    // Ne rien faire si l'utilisateur n'est pas connecté
    if (!user?.email) {
      setIsLoading(false);
      setError('Vous devez être connecté pour voir votre collection');
      return;
    }

    let isMounted = true;

    // Récupérer les données de collection
    const loadData = async () => {
      // Garantir que email n'est jamais undefined
      const email = user.email as string;
      const userDB = await getShopifyUserByEmail(user?.email as string)
      const result = await fetchCollectionData(email);
      setUserDB(userDB)
      if (isMounted) {
        if (!result.success) {
          setError(result.error);
        } else {
          setCollectionData(result.data);
        }
        setIsLoading(false);
      }
    };

    loadData();

    return () => {
      isMounted = false;
    };
  }, [user?.email]); // Dépendance uniquement sur l'email

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
          <div className={styles.container}>
            <h1 className={styles.pageTitle}>Ma Collection</h1>

            {error ? (
              <div className={styles.error}>{error}</div>
            ) : !collectionData ? (
              <div className={styles.empty}>
                <p>Aucune collection trouvée à votre nom</p>
              </div>
            ) : (
              <>
                <div className={styles.collectionInfo}>
                  <h2 className={styles.collectionTitle}>{collectionData.title}</h2>
                  
                  {collectionData.description ? (
                    <div 
                      className={styles.description}
                      dangerouslySetInnerHTML={{ __html: collectionData.description }}
                    />
                  ) : (
                    <p className={styles.emptyDescription}>Aucune description</p>
                  )}
                </div>

                <div className={styles.productsSection}>
                  <h3 className={styles.sectionTitle}>Mes œuvres</h3>
                  
                  {!collectionData.products || collectionData.products.length === 0 ? (
                    <div className={styles.emptyProducts}>
                      <p>Aucune œuvre dans votre collection</p>
                    </div>
                  ) : (
                    <div className={styles.productsGrid}>
                      {collectionData.products.map((product: any) => (
                        <ProductCard
                          key={product.id}
                          title={product.title}
                          price={product.price}
                          currency={product.currency}
                          imageUrl={product.imageUrl}
                          idShopify={product.id}
                          collectionId={collectionData.id}    
                          userId={userDB?.id}
                        />
                      ))}
                    </div>
                  )}
                </div>
              </>
            )}
          </div>
        </div>
      </div>
    </>
  );
}