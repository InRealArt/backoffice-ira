'use client'

import { useState } from 'react'
import { User, Search } from 'lucide-react'

interface ArtistEditTabsProps {
  profileForm: React.ReactNode
  seoForm: React.ReactNode
}

const TABS = [
  { id: 'profile', label: 'Profil & Biographie', icon: User },
  { id: 'seo', label: 'SEO & Œuvres phares', icon: Search },
] as const

type TabId = (typeof TABS)[number]['id']

export default function ArtistEditTabs({ profileForm, seoForm }: ArtistEditTabsProps) {
  const [activeTab, setActiveTab] = useState<TabId>('profile')

  return (
    <div>
      {/* Tab bar */}
      <div
        className="bg-white dark:bg-gray-900 border-b border-gray-200 dark:border-gray-700 sticky top-0 z-10"
        style={{ marginBottom: 0 }}
      >
        <div
          className="flex gap-0"
          style={{ overflowX: 'auto', scrollbarWidth: 'none' }}
          role="tablist"
          aria-label="Sections de l'artiste"
        >
          {TABS.map((tab) => {
            const Icon = tab.icon
            const isActive = activeTab === tab.id
            return (
              <button
                key={tab.id}
                role="tab"
                aria-selected={isActive}
                aria-controls={`panel-${tab.id}`}
                onClick={() => setActiveTab(tab.id)}
                className={`
                  flex items-center gap-2 px-6 py-4 text-sm font-medium border-b-2 transition-all whitespace-nowrap
                  focus:outline-none focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-offset-2
                  ${isActive
                    ? 'border-primary text-primary'
                    : 'border-transparent text-gray-500 dark:text-gray-400 hover:text-gray-800 dark:hover:text-gray-200 hover:border-gray-300 dark:hover:border-gray-600'
                  }
                `}
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
