'use client'

import { useState } from 'react'
import styles from './Tabs.module.scss'

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
    <div className={styles.tabsContainer}>
      <div className={styles.tabHeaders}>
        {tabs.map(tab => (
          <div
            key={tab.id}
            className={`${styles.tabHeader} ${activeTabId === tab.id ? styles.active : ''}`}
            onClick={() => setActiveTabId(tab.id)}
          >
            {tab.label}
          </div>
        ))}
      </div>
      
      <div className={styles.tabContent}>
        {activeTab?.content}
      </div>
    </div>
  )
} 