'use client';

import { useState, useEffect } from 'react';
import { useDynamicContext } from '@dynamic-labs/sdk-react-core';
import Navbar from '@/app/components/Navbar/Navbar';
import SideMenu from '@/app/components/SideMenu/SideMenu';
import LoadingSpinner from '@/app/components/LoadingSpinner/LoadingSpinner';
import ProductCard from '@/app/components/ProductCard/ProductCard';
import { getShopifyUserByEmail } from '@/app/actions/prisma/prismaActions';
import { getShopifyCollectionByTitle, getShopifyCollectionProducts } from '@/app/actions/shopify/shopifyActions';
import styles from './collection.module.scss';

// Fonction d'aide pour récupérer la collection et ses produits
async function fetchCollectionData(email: string) {
  try {
    // 1. Récupérer les infos utilisateur
    const user = await getShopifyUserByEmail(email);
    if (!user || !user.firstName || !user.lastName) {
      return { error: 'Informations utilisateur incomplètes' };
    }

    // 2. Récupérer la collection avec la fonction de shopifyActions
    const collectionTitle = `${user.firstName} ${user.lastName}`.trim();
    const collectionResult = await getShopifyCollectionByTitle(collectionTitle);
    
    if (!collectionResult.success || !collectionResult.collection) {
      return { error: collectionResult.message || 'Collection non trouvée' };
    }
    
    // 3. Récupérer les produits de la collection
    const productsResult = await getShopifyCollectionProducts(collectionResult.collection.id);
    console.log('productsResult', productsResult);
    // 4. Construire et retourner l'objet résultat
    return {
      id: collectionResult.collection.id,
      title: collectionResult.collection.title,
      description: collectionResult.collection.body_html,
      products: productsResult.success ? productsResult.products : []
    };
  } catch (error) {
    console.error('Erreur lors du chargement des données:', error);
    return { error: 'Erreur lors du chargement des données' };
  }
}

export default function CollectionPage() {
  const { user } = useDynamicContext();
  const [isLoading, setIsLoading] = useState(true);
  const [collectionData, setCollectionData] = useState<any>(null);
  const [error, setError] = useState<string | null>(null);
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
      const data = await fetchCollectionData(email);
      
      if (isMounted) {
        if (data.error) {
          setError(data.error);
        } else {
          setCollectionData(data);
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