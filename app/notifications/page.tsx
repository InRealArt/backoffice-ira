'use client'

import { useDynamicContext } from '@dynamic-labs/sdk-react-core'
import Navbar from '../components/Navbar/Navbar'
import SideMenu from '../components/SideMenu/SideMenu'
import ApproveModal from './ApproveModal'
import RejectModal from './RejectModal'
import SuccessModal from './SuccessModal'
import NotificationList from './NotificationsList'
import useNotifications from './useNotifications'
import './notifications.css'

export default function NotificationsPage() {
  const { primaryWallet } = useDynamicContext()
  
  const {
    notifications,
    isLoading,
    isProcessing,
    isModalOpen,
    isApproveModal,
    isRejectModal,
    isSuccessModal,
    successMessage,
    selectedNotification,
    selectedUser,
    isUserLoading,
    handleApproveClick,
    handleRejectClick,
    handleConfirmReject,
    closeModal,
    formatDate,
    getSubjectTitle
  } = useNotifications({ walletAddress: primaryWallet?.address })

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
    )
  }

  return (
    <>
      <Navbar />
      <div className="page-layout">
        <SideMenu />
        <div className="notifications-container">
          <h1>Notifications</h1>
          
          <NotificationList 
            notifications={notifications}
            formatDate={formatDate}
            getSubjectTitle={getSubjectTitle}
            isProcessing={isProcessing}
            onApprove={handleApproveClick}
            onReject={handleRejectClick}
          />
        </div>
      </div>

      {/* Modale d'approbation */}
      {isModalOpen && isApproveModal && (
        <ApproveModal 
          isOpen={isModalOpen && isApproveModal}
          onClose={closeModal}
          onConfirm={closeModal}
          userEmail={selectedUser?.email}
          userFirstName={selectedUser?.firstName}
          userLastName={selectedUser?.lastName}
          isLoading={isUserLoading}
        />
      )}

      {/* Modale de rejet */}
      {isModalOpen && isRejectModal && (
        <RejectModal 
          isOpen={isModalOpen && isRejectModal}
          onClose={closeModal}
          onConfirm={handleConfirmReject}
          userEmail={selectedNotification?.from}
        />
      )}

      {/* Modale de succès */}
      {isModalOpen && isSuccessModal && (
        <SuccessModal 
          isOpen={isModalOpen && isSuccessModal}
          onClose={closeModal}
          message={successMessage}
        />
      )}
    </>
  )
}