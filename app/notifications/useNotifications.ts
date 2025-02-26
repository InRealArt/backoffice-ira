'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { 
  getUserByEmail, 
} from '../actions/shopify/shopifyActions'
import { updateNotificationStatus } from '../actions/prisma/prismaActions'

export interface Notification {
    id: number
    from: string
    sentDate: string
    subject: 'requestShopifyMember'
    complete: boolean
    status?: 'APPROVED' | 'REJECTED' | null
    isAlreadyStaff?: boolean
    staffData?: any
  }

export interface User {
  id: number
  email: string
  firstName: string
  lastName: string
  walletAddress: string
}

interface UseNotificationsProps {
  walletAddress?: string
}

export default function useNotifications({ walletAddress }: UseNotificationsProps) {
  const [notifications, setNotifications] = useState<Notification[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [isProcessing, setIsProcessing] = useState<number | null>(null)
  const [isModalOpen, setIsModalOpen] = useState(false)
  const [isApproveModal, setIsApproveModal] = useState(false)
  const [isRejectModal, setIsRejectModal] = useState(false)
  const [isSuccessModal, setIsSuccessModal] = useState(false)
  const [successMessage, setSuccessMessage] = useState('')
  const [selectedNotification, setSelectedNotification] = useState<Notification | null>(null)
  const [selectedUser, setSelectedUser] = useState<User | null>(null)
  const [isUserLoading, setIsUserLoading] = useState(false)
  const router = useRouter()

  useEffect(() => {
    if (walletAddress) {
      fetchNotifications()
    } else {
      router.push('/dashboard')
    }
  }, [walletAddress, router])

  const fetchNotifications = async () => {
    try {
      // Vérifier si l'utilisateur est admin
      const adminCheck = await fetch('/api/shopify/isAdmin', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ walletAddress }),
      })
      
      const adminData = await adminCheck.json()
      
      if (!adminCheck.ok || !adminData.isAdmin) {
        router.push('/dashboard')
        return
      }

      // Récupérer les notifications
      const response = await fetch('/api/notifications/getAll')
      const data = await response.json()

      setNotifications(data.notifications || [])

    } catch (error) {
      console.error('Erreur:', error)
    } finally {
      setIsLoading(false)
    }
  }

  const handleApproveClick = async (notification: Notification) => {
    try {
      setIsUserLoading(true)
      
      // Utiliser l'action serveur pour récupérer les données de l'utilisateur
      const result = await getUserByEmail(notification.from)
      
      setSelectedNotification(notification)
      setSelectedUser({
        id: result.user.id,
        email: result.user.email || '',
        firstName: result.user.firstName || '',
        lastName: result.user.lastName || '',
        walletAddress: result.user.walletAddress
      })
      setIsApproveModal(true)
      setIsModalOpen(true)
    } catch (error) {
      console.error('Erreur lors de la récupération des données utilisateur:', error)
      showSuccessMessage('Erreur: ' + (error instanceof Error ? error.message : 'Impossible de récupérer les informations utilisateur'))
    } finally {
      setIsUserLoading(false)
    }
  }

  const handleRejectClick = (notification: Notification) => {
    setSelectedNotification(notification)
    setIsRejectModal(true)
    setIsModalOpen(true)
  }

  const handleConfirmReject = async () => {
    if (!selectedNotification) return
    
    try {
      setIsProcessing(selectedNotification.id)
      setIsModalOpen(false)
      
      // Mettre à jour le statut de la notification à "REJECTED"
      await updateNotificationStatus(selectedNotification.id, 'REJECTED')
      
      // Mettre à jour l'état local des notifications
      setNotifications(prevNotifications => 
        prevNotifications.map(notif => 
          notif.id === selectedNotification.id 
            ? { ...notif, complete: true, status: 'REJECTED' } 
            : notif
        )
      )
      
      showSuccessMessage('La demande a été rejetée avec succès')
    } catch (error) {
      console.error('Erreur lors du rejet:', error)
      showSuccessMessage('Erreur lors du rejet de la demande: ' + (error instanceof Error ? error.message : 'Erreur inconnue'))
    } finally {
      setIsProcessing(null)
      setSelectedNotification(null)
      setIsRejectModal(false)
    }
  }

  const showSuccessMessage = (message: string) => {
    setSuccessMessage(message)
    setIsSuccessModal(true)
    setIsModalOpen(true)
    
    // Fermer automatiquement après 3 secondes
    setTimeout(() => {
      setIsSuccessModal(false)
      setIsModalOpen(false)
    }, 3000)
  }

  const closeModal = () => {
    setIsModalOpen(false)
    setIsApproveModal(false)
    setIsRejectModal(false)
    setIsSuccessModal(false)
    setSelectedNotification(null)
    setSelectedUser(null)
  }

  const formatDate = (dateString: string) => {
    const date = new Date(dateString)
    return new Intl.DateTimeFormat('fr-FR', {
      day: '2-digit',
      month: 'short',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    }).format(date)
  }

  const getSubjectTitle = (subject: string) => {
    switch (subject) {
      case 'requestShopifyMember':
        return 'Demande d\'accès Shopify'
      default:
        return 'Notification'
    }
  }

  return {
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
  }
}