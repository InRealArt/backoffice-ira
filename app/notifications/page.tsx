'use client';

import { useState, useEffect } from 'react';
import { useDynamicContext } from '@dynamic-labs/sdk-react-core';
import { useRouter } from 'next/navigation';
import './notifications.css';
import SideMenu from '../components/SideMenu/SideMenu';
import Navbar from '../components/Navbar/Navbar';

interface Notification {
  id: string;
  type: 'request' | 'info' | 'success' | 'error';
  title: string;
  message: string;
  walletAddress?: string;
  userName?: string;
  createdAt: string;
  read: boolean;
}

export default function NotificationsPage() {
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [filter, setFilter] = useState<string>('all');
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
        
        if (!adminCheck.ok) {
          router.push('/dashboard');
          return;
        }
        
        const adminResult = await adminCheck.json();
        if (!adminResult.isAdmin) {
          router.push('/dashboard');
          return;
        }

        // Récupérer les notifications
        const response = await fetch('/api/notifications/getAll');
        if (!response.ok) throw new Error('Erreur lors de la récupération des notifications');
        
        const data = await response.json();
        setNotifications(data.notifications);
      } catch (error) {
        console.error('Erreur:', error);
      } finally {
        setIsLoading(false);
      }
    };

    fetchNotifications();
  }, [primaryWallet, router]);

  const markAsRead = async (id: string) => {
    try {
      const response = await fetch('/api/notifications/markAsRead', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ notificationId: id }),
      });
      
      if (!response.ok) throw new Error('Erreur lors du marquage de la notification');
      
      setNotifications(notifications.map(notif => 
        notif.id === id ? { ...notif, read: true } : notif
      ));
    } catch (error) {
      console.error('Erreur:', error);
    }
  };

  const handleAction = async (notification: Notification, action: 'approve' | 'reject') => {
    try {
      const response = await fetch('/api/shopify/processRequest', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ 
          notificationId: notification.id,
          walletAddress: notification.walletAddress,
          action
        }),
      });
      
      if (!response.ok) throw new Error(`Erreur lors de l'action ${action}`);
      
      // Mettre à jour la notification localement
      const updatedNotifications = notifications.filter(n => n.id !== notification.id);
      setNotifications(updatedNotifications);
      
    } catch (error) {
      console.error('Erreur:', error);
    }
  };

  const getFilteredNotifications = () => {
    if (filter === 'all') return notifications;
    return notifications.filter(notif => notif.type === filter);
  };

  const getIcon = (type: string) => {
    switch (type) {
      case 'request': return '🔔';
      case 'info': return 'ℹ️';
      case 'success': return '✅';
      case 'error': return '❌';
      default: return '📩';
    }
  };

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

  if (isLoading) {
    return <div className="loading-container">Chargement des notifications...</div>;
  }

  return (
    <>
      <Navbar />
      <div className="page-layout">
        <SideMenu />
        <div className="notifications-container">
          <div className="notifications-header">
            <h1>Notifications</h1>
            <div className="filter-options">
              <button 
                className={`filter-button ${filter === 'all' ? 'active' : ''}`}
                onClick={() => setFilter('all')}
              >
                Toutes
              </button>
              <button 
                className={`filter-button ${filter === 'request' ? 'active' : ''}`}
                onClick={() => setFilter('request')}
              >
                Demandes
              </button>
              <button 
                className={`filter-button ${filter === 'info' ? 'active' : ''}`}
                onClick={() => setFilter('info')}
              >
                Informations
              </button>
            </div>
          </div>

          <div className="notifications-list">
            {getFilteredNotifications().length === 0 ? (
              <div className="empty-state">
                <p>Aucune notification à afficher</p>
              </div>
            ) : (
          getFilteredNotifications().map(notification => (
            <div 
              key={notification.id} 
              className={`notification-item ${notification.read ? 'read' : 'unread'}`}
              onClick={() => !notification.read && markAsRead(notification.id)}
            >
              <div className="notification-icon">{getIcon(notification.type)}</div>
              <div className="notification-content">
                <div className="notification-header">
                  <h3 className="notification-title">{notification.title}</h3>
                  <span className="notification-date">{formatDate(notification.createdAt)}</span>
                </div>
                <p className="notification-message">{notification.message}</p>
                {notification.userName && (
                  <p className="notification-user">Utilisateur: {notification.userName}</p>
                )}
                {notification.walletAddress && (
                  <p className="notification-wallet">
                    Wallet: {notification.walletAddress.substring(0, 6)}...{notification.walletAddress.substring(notification.walletAddress.length - 4)}
                  </p>
                )}
                {notification.type === 'request' && (
                  <div className="notification-actions">
                    <button 
                      className="action-button approve"
                      onClick={(e) => {
                        e.stopPropagation();
                        handleAction(notification, 'approve');
                      }}
                    >
                      Approuver
                    </button>
                    <button 
                      className="action-button reject"
                      onClick={(e) => {
                        e.stopPropagation();
                        handleAction(notification, 'reject');
                      }}
                    >
                      Rejeter
                    </button>
                  </div>
                )}
              </div>
            </div>
          ))
        )}
        </div>
      </div>
    </div>
  </>
  );
}