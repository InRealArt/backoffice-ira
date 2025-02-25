'use client';

import { useState, useEffect } from 'react';
import { useDynamicContext } from '@dynamic-labs/sdk-react-core';
import { useRouter } from 'next/navigation';
import Navbar from '../components/Navbar/Navbar';
import SideMenu from '../components/SideMenu/SideMenu';
import './notifications.css';

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
  const { primaryWallet } = useDynamicContext();
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
  }, [primaryWallet]);

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
                          className="action-button approve"
                          onClick={() => {
                            // Traiter l'approbation
                            console.log('Approuver demande de', notification.from);
                          }}
                        >
                          Approuver
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
    </>
  );
}