'use client'

import { useState } from 'react'

export interface TabItem {
  id: string
  label: string
  content: React.ReactNode
}

interface TabsProps {
  tabs: TabItem[]
  defaultTabId?: string
  activeTabId?: string
  onTabChange?: (tabId: string) => void
}

export default function Tabs({ tabs, defaultTabId, activeTabId: externalActiveTabId, onTabChange }: TabsProps) {
  const [internalActiveTabId, setInternalActiveTabId] = useState(defaultTabId || tabs[0]?.id)

  // Utilise l'onglet contrôlé depuis l'extérieur s'il est fourni, sinon l'état interne
  const activeTabId = externalActiveTabId ?? internalActiveTabId

  const activeTab = tabs.find(tab => tab.id === activeTabId)

  const handleTabClick = (tabId: string) => {
    setInternalActiveTabId(tabId)
    onTabChange?.(tabId)
  }

  return (
    <div className="w-full mb-4">
      <div className="flex border-b border-border mb-4">
        {tabs.map(tab => (
          <div
            key={tab.id}
            className={[
              'px-4 py-3 text-sm font-medium cursor-pointer border-b-2 transition-colors',
              activeTabId === tab.id ? 'text-primary border-primary' : 'border-transparent hover:text-primary',
            ].join(' ')}
            onClick={() => handleTabClick(tab.id)}
          >
            {tab.label}
          </div>
        ))}
      </div>

      <div className="py-2">
        {activeTab?.content}
      </div>
    </div>
  )
} 