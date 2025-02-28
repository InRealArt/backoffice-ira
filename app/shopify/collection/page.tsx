'use client';

import { useEffect, useState } from 'react';
import { useDynamicContext } from '@dynamic-labs/sdk-react-core';
import toast, { Toaster } from 'react-hot-toast';
import styles from './collection.module.scss';
import SideMenu from '@/app/components/SideMenu/SideMenu';
import Navbar from '@/app/components/Navbar/Navbar';
import LoadingSpinner from '@/app/components/LoadingSpinner/LoadingSpinner';
import { getShopifyCollectionByTitle, updateShopifyCollection } from '@/app/actions/shopify/shopifyActions';
import { getShopifyUserByEmail } from '@/app/actions/prisma/prismaActions';
import Button from '@/app/components/Button/Button';

export default function MyCollection() {
  const { user, primaryWallet } = useDynamicContext();
  const [isLoading, setIsLoading] = useState(true);
  const [collectionId, setCollectionId] = useState<string | null>(null);
  const [collectionTitle, setCollectionTitle] = useState<string | null>(null);
  const [collectionDescription, setCollectionDescription] = useState<string | null>(null);
  const [collectionPublishedAt, setCollectionPublishedAt] = useState<string | null>(null);
  const [collectionError, setCollectionError] = useState<string | null>(null);
  
  // Nouveaux états pour l'édition
  const [isEditingDescription, setIsEditingDescription] = useState(false);
  const [editedDescription, setEditedDescription] = useState<string>('');
  const [isSaving, setIsSaving] = useState(false);
  const [updateError, setUpdateError] = useState<string | null>(null);

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

  // Fonction pour démarrer l'édition
  const handleStartEditing = () => {
    setEditedDescription(collectionDescription || '');
    setIsEditingDescription(true);
    setUpdateError(null);
  };
  
  // Fonction pour annuler l'édition
  const handleCancelEditing = () => {
    setIsEditingDescription(false);
    setUpdateError(null);
  };
  
  // Fonction pour sauvegarder les modifications
  const handleSaveDescription = async () => {
    if (!collectionId) return;
    
    setIsSaving(true);
    setUpdateError(null);
    
    try {
      const result = await updateShopifyCollection(collectionId, {
        description: editedDescription
      });
      
      if (result.success) {
        setCollectionDescription(result.collection?.body_html || '');
        setIsEditingDescription(false);
        toast.success('Description mise à jour avec succès', {
          duration: 3000,
          position: 'top-center',
        });
      } else {
        setUpdateError(result.message || 'Erreur lors de la mise à jour de la collection');
        toast.error(result.message || 'Erreur lors de la mise à jour de la collection', {
          duration: 4000,
          position: 'top-center',
        });
      }
    } catch (error: any) {
      console.error('Erreur lors de la sauvegarde de la description:', error);
      setUpdateError(error.message || 'Une erreur est survenue lors de la sauvegarde');
      toast.error(error.message || 'Une erreur est survenue lors de la sauvegarde', {
        duration: 4000,
        position: 'top-center',
      });
    } finally {
      setIsSaving(false);
    }
  };

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
                    
                    {isEditingDescription ? (
                      <div className={styles.descriptionEditor}>
                        <textarea
                          className={styles.descriptionTextarea}
                          value={editedDescription}
                          onChange={(e) => setEditedDescription(e.target.value)}
                          rows={5}
                          placeholder="Entrez une description pour votre collection..."
                        />
                        
                        <p className={styles.infoText}>
                          Cette description est affichée sur la page de votre collection Shopify.<br/>
                          Vous pouvez utiliser du HTML pour mettre en forme le texte en vous aidant de l'éditeur HTML gratuit <a href="https://onlinehtmleditor.dev/" target="_blank" rel="noopener noreferrer">https://onlinehtmleditor.dev/</a>.
                        </p>
                        
                        {updateError && (
                          <p className={styles.errorMessage}>{updateError}</p>
                        )}
                        
                        <div className={styles.editorActions}>
                          <Button 
                            onClick={handleSaveDescription} 
                            isLoading={isSaving}
                            loadingText="Enregistrement..."
                            disabled={isSaving}
                          >
                            Enregistrer
                          </Button>
                          <Button 
                            variant="secondary" 
                            onClick={handleCancelEditing}
                            disabled={isSaving}
                          >
                            Annuler
                          </Button>
                        </div>
                      </div>
                    ) : (
                      <div className={styles.descriptionContainer}>
                        {collectionDescription ? (
                          <div 
                            className={styles.collectionDescription}
                            dangerouslySetInnerHTML={{ __html: collectionDescription }}
                          />
                        ) : (
                          <p className={styles.emptyDescription}>Aucune description n'a été ajoutée à votre collection.</p>
                        )}
                        
                        <Button 
                          variant="secondary" 
                          className={styles.editButton}
                          onClick={handleStartEditing}
                        >
                          Modifier la description
                        </Button>
                      </div>
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
      
      <Toaster />
    </>
  );
}