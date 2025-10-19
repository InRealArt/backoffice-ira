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
}

export default function Tabs({ tabs, defaultTabId }: TabsProps) {
  const [activeTabId, setActiveTabId] = useState(defaultTabId || tabs[0]?.id)
  
  const activeTab = tabs.find(tab => tab.id === activeTabId)
  
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
            onClick={() => setActiveTabId(tab.id)}
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