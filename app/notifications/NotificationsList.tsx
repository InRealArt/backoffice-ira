'use client'

import type { Notification } from './useNotifications'

interface NotificationListProps {
  notifications: Notification[]
  formatDate: (date: string) => string
  getSubjectTitle: (subject: string) => string
  isProcessing: number | null
  onApprove: (notification: Notification) => void
  onReject: (notification: Notification) => void
}

export default function NotificationList({
  notifications,
  formatDate,
  getSubjectTitle,
  isProcessing,
  onApprove,
  onReject
}: NotificationListProps) {
  if (notifications.length === 0) {
    return (
      <div className="empty-state">
        <p>Aucune notification à afficher</p>
      </div>
    )
  }

  return (
    <div className="notifications-list">
      {notifications.map(notification => (
        <div 
          key={notification.id} 
          className={`notification-item ${notification.complete ? 'read' : 'unread'}`}
        >
          <div className="notification-content">
            <div className="notification-header">
              <h3 className="notification-title">{getSubjectTitle(notification.subject)}</h3>
              <span className="notification-date">{formatDate(notification.sentDate)}</span>
            </div>
            <p className="notification-message">De: {notification.from}</p>
            
            {notification.status && (
              <div className={`notification-status ${notification.status.toLowerCase()}`}>
                {notification.status === 'APPROVED' ? 'Approuvée' : 'Rejetée'}
              </div>
            )}
            
            {notification.isAlreadyStaff && (
              <div className="notification-status already-staff">
                Déjà membre du staff Shopify
              </div>
            )}
            
            {notification.subject === 'requestShopifyMember' && !notification.complete && (
              <div className="notification-actions">
                {notification.isAlreadyStaff ? (
                  <p className="notification-warning">
                    Cette personne est déjà membre du staff Shopify.
                  </p>
                ) : (
                  <>
                    <button 
                      className={`action-button approve ${isProcessing === notification.id ? 'processing' : ''}`}
                      onClick={() => onApprove(notification)}
                      disabled={isProcessing !== null}
                    >
                      {isProcessing === notification.id ? 'En cours...' : 'Approuver'}
                    </button>
                    <button 
                      className="action-button reject"
                      onClick={() => onReject(notification)}
                      disabled={isProcessing !== null}
                    >
                      Rejeter
                    </button>
                  </>
                )}
              </div>
            )}
          </div>
        </div>
      ))}
    </div>
  )
}