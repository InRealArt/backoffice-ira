'use client'

import { useState } from 'react'
import { formKit } from '@/app/components/Forms/FormKit/FormKit'
import { User, Search } from 'lucide-react'

interface ArtistEditTabsProps {
  profileForm: React.ReactNode
  seoForm: React.ReactNode
  artistName?: string | null
}

const TABS = [
  { id: 'profile', label: 'Profil & Biographie', icon: User },
  { id: 'seo', label: 'SEO & Œuvres phares', icon: Search },
] as const

type TabId = (typeof TABS)[number]['id']

export default function ArtistEditTabs({ profileForm, seoForm, artistName }: ArtistEditTabsProps) {
  const [activeTab, setActiveTab] = useState<TabId>('profile')

  return (
    <div>
      {/* Tab bar */}
      <div className={formKit.tabBar}>
        <div
          className={formKit.tabList}
          role="tablist"
          aria-label="Sections de l'artiste"
        >
          {TABS.map((tab) => {
            const Icon = tab.icon
            const isActive = activeTab === tab.id
            return (
              <button
                key={tab.id}
                id={`tab-${tab.id}`}
                role="tab"
                aria-selected={isActive}
                aria-controls={`panel-${tab.id}`}
                onClick={() => setActiveTab(tab.id)}
                className={`${formKit.tabBtn} ${isActive ? formKit.tabBtnActive : ''}`}
                type="button"
              >
                <Icon size={16} />
                {tab.label}
              </button>
            )
          })}
        </div>
      </div>

      {/* Tab panels */}
      <div
        id="panel-profile"
        role="tabpanel"
        aria-labelledby="tab-profile"
        hidden={activeTab !== 'profile'}
      >
        {profileForm}
      </div>

      <div
        id="panel-seo"
        role="tabpanel"
        aria-labelledby="tab-seo"
        hidden={activeTab !== 'seo'}
      >
        {activeTab === 'seo' && (
          <div className="page-container">
            <div className="page-header">
              <div className="header-top-section">
                <h1 className="page-title">SEO &amp; Œuvres phares</h1>
              </div>
              <p className="page-subtitle">
                Données de référencement et sélection des œuvres à mettre en avant
              </p>
              {artistName && (
                <div className="mt-md d-inline-flex align-items-center gap-sm px-md py-sm rounded-lg bg-gray-50 dark:bg-gray-800/50 border border-gray-200 dark:border-gray-700">
                  <div>
                    <p className="text-xs text-gray-500 dark:text-gray-400 mb-0.5">Artiste en cours d'édition</p>
                    <p className="text-base font-semibold text-gray-900 dark:text-gray-100">{artistName}</p>
                  </div>
                </div>
              )}
            </div>
            <div className="form-container">
              <div className="form-card">
                <div className="card-content">
                  {seoForm}
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  )
}
