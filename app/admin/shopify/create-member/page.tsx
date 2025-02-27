'use client'

import { useDynamicContext } from '@dynamic-labs/sdk-react-core'
import Navbar from '@/app/components/Navbar/Navbar'
import SideMenu from '@/app/components/SideMenu/SideMenu'
import CreateMemberForm from './CreateMemberForm'
import { Toaster } from 'react-hot-toast'
import './page.css'

export default function CreateMemberPage() {
  const { primaryWallet } = useDynamicContext()
  
  return (
    <>
      <Navbar />
      <div className="page-layout">
        <SideMenu />
        <div className="content-container">
          <Toaster position="top-right" />
          
          <div className="create-member-header">
            <h1>Créer un membre Shopify</h1>
            <p className="subtitle">
              Ajoutez un nouvel artiste ou galleriste à votre boutique Shopify
            </p>
          </div>
          
          <div className="create-member-content">
            <CreateMemberForm />
          </div>
        </div>
      </div>
    </>
  )
} 