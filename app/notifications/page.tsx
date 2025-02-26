'use client';

import { useState, useEffect } from 'react';
import { useDynamicContext } from '@dynamic-labs/sdk-react-core';
import { useRouter } from 'next/navigation';
import Navbar from '../components/Navbar/Navbar';
import SideMenu from '../components/SideMenu/SideMenu';
import './notifications.css';
import Modal from '../components/Common/Modal';
import { getUserByEmail, createStaffAccount, User } from '../actions/shopify/shopifyActions';

// Interface basée sur le modèle Prisma
interface Notification {
  id: number;
  from: string;
  sentDate: string;
  subject: 'requestShopifyMember';
  complete: boolean;
}

export default function NotificationsPage() {
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isProcessing, setIsProcessing] = useState<number | null>(null);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [selectedNotification, setSelectedNotification] = useState<Notification | null>(null);
  const [selectedUser, setSelectedUser] = useState<User | null>(null);
  const [isUserLoading, setIsUserLoading] = useState(false);
  const { primaryWallet, user} = useDynamicContext();
  const router = useRouter();

  useEffect(() => {
    const fetchNotifications = async () => {
      if (!primaryWallet) {
        router.push('/dashboard');
        return;
      }

      try {
        // Vérifier si l'utilisateur est admin
        const adminCheck = await fetch('/api/shopify/isAdmin', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ walletAddress: primaryWallet.address }),
        });
        
        const adminData = await adminCheck.json();
        
        if (!adminCheck.ok || !adminData.isAdmin) {
          router.push('/dashboard');
          return;
        }

        // Récupérer les notifications
        const response = await fetch('/api/notifications/getAll');
        const data = await response.json();
        console.log('Notifications récupérées:', data);
        setNotifications(data.notifications || []);
      } catch (error) {
        console.error('Erreur:', error);
      } finally {
        setIsLoading(false);
      }
    };

    fetchNotifications();
  }, [primaryWallet, router]);

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return new Intl.DateTimeFormat('fr-FR', {
      day: '2-digit',
      month: 'short',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    }).format(date);
  };

  const getSubjectTitle = (subject: string) => {
    switch (subject) {
      case 'requestShopifyMember':
        return 'Demande d\'accès Shopify';
      default:
        return 'Notification';
    }
  };

  const handleApproveClick = async (notification: Notification) => {
    try {
      setIsUserLoading(true);
      
      // Utiliser l'action serveur au lieu d'une route API
      const result = await getUserByEmail(notification.from);
      
      setSelectedNotification(notification);
      setSelectedUser({
        id: result.user.id,
        email: result.user.email || '',
        firstName: result.user.name || '',
        lastName: result.user.surname || '',
        walletAddress: result.user.walletAddress
      });
      setIsModalOpen(true);
    } catch (error) {
      console.error('Erreur lors de la récupération des données utilisateur:', error);
      alert('Erreur: ' + (error instanceof Error ? error.message : 'Impossible de récupérer les informations utilisateur'));
    } finally {
      setIsUserLoading(false);
    }
  };

  const handleConfirmApprove = async () => {
    if (!selectedNotification || !selectedUser) return;
    
    try {
      setIsProcessing(selectedNotification.id);
      setIsModalOpen(false);
      
      // Utiliser l'action serveur pour créer le compte staff
      await createStaffAccount({
        email: selectedNotification.from,
        firstName: selectedUser.firstName,
        lastName: selectedUser.lastName,
        notificationId: selectedNotification.id
      });
      
      // Mettre à jour l'état local des notifications
      setNotifications(prevNotifications => 
        prevNotifications.map(notif => 
          notif.id === selectedNotification.id ? { ...notif, complete: true } : notif
        )
      );
      
      alert('Compte staff créé avec succès!');
    } catch (error) {
      console.error('Erreur lors de l\'approbation:', error);
      alert('Erreur lors de la création du compte: ' + (error instanceof Error ? error.message : 'Erreur inconnue'));
    } finally {
      setIsProcessing(null);
      setSelectedUser(null);
      setSelectedNotification(null);
    }
  };
  
  if (isLoading) {
    return (
      <>
        <Navbar />
        <div className="page-layout">
          <SideMenu />
          <div className="loading-container">
            Chargement des notifications...
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
        <div className="notifications-container">
          <h1>Notifications</h1>
          
          {notifications.length === 0 ? (
            <div className="empty-state">
              <p>Aucune notification à afficher</p>
            </div>
          ) : (
            <div className="notifications-list">
              {notifications.map(notification => (
                <div key={notification.id} className={`notification-item ${notification.complete ? 'read' : 'unread'}`}>
                  <div className="notification-content">
                    <div className="notification-header">
                      <h3 className="notification-title">{getSubjectTitle(notification.subject)}</h3>
                      <span className="notification-date">{formatDate(notification.sentDate)}</span>
                    </div>
                    <p className="notification-message">De: {notification.from}</p>
                    
                    {notification.subject === 'requestShopifyMember' && !notification.complete && (
                      <div className="notification-actions">
                        <button 
                          className={`action-button approve ${isProcessing === notification.id ? 'processing' : ''}`}
                          onClick={() => handleApproveClick(notification)}
                          disabled={isProcessing !== null}
                        >
                          {isProcessing === notification.id ? 'En cours...' : 'Approuver'}
                        </button>
                        <button 
                          className="action-button reject"
                          onClick={() => {
                            // Traiter le rejet
                            console.log('Rejeter demande de', notification.from);
                          }}
                        >
                          Rejeter
                        </button>
                      </div>
                    )}
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* Modale de confirmation */}
      <Modal 
        isOpen={isModalOpen} 
        onClose={() => setIsModalOpen(false)}
        title="Confirmation"
      >
        <div className="confirmation-modal">
          {isUserLoading ? (
            <p>Chargement des informations utilisateur...</p>
          ) : (
            <>
              <p>
                Rendez vous sur <strong>https://admin.shopify.com/store/inrealart-marketplace/settings/account</strong> pour créer un staff account (employé)
                <br/><br/>
                L'employé ne devra avoir que la permission de créer des articles.
                <br/>
                Après avoir créér l'artiste en tant qu'"employé", vous pourrez créer une collection pour l'artiste (qui portera son prénom + nom).
              </p>
              <div className="user-details">
                <p><strong>Email:</strong> {selectedUser?.email}</p>
                <p><strong>Prénom:</strong> {selectedUser?.firstName}</p>
                <p><strong>Nom:</strong> {selectedUser?.lastName}</p>
              </div>
              <div className="modal-actions">
                <button 
                  className="modal-button confirm"
                  onClick={() => window.open('https://admin.shopify.com/store/inrealart-marketplace/settings/account', '_blank')}
                >
                  Aller sur Shopify
                </button>
                <button 
                  className="modal-button cancel"
                  onClick={() => setIsModalOpen(false)}
                >
                  Fermer
                </button>
              </div>
            </>
          )}
        </div>
      </Modal>
    </>
  );
}