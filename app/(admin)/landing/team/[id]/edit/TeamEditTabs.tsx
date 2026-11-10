'use client'

import { formKit } from '@/app/components/Forms/FormKit/FormKit'
import { User } from 'lucide-react'

interface TeamEditTabsProps {
  profileForm: React.ReactNode
  memberName?: string
}

export default function TeamEditTabs({ profileForm, memberName }: TeamEditTabsProps) {
  return (
    <div className={formKit.tabsRoot}>
      <div className={formKit.tabBar}>
        <div
          className={formKit.tabList}
          role="tablist"
          aria-label="Sections du membre d'équipe"
        >
          <button
            id="tab-profile"
            role="tab"
            aria-selected={true}
            aria-controls="panel-profile"
            className={`${formKit.tabBtn} ${formKit.tabBtnActive}`}
            type="button"
          >
            <User size={16} />
            Profil
          </button>
        </div>
      </div>

      <div id="panel-profile" role="tabpanel" aria-labelledby="tab-profile">
        {profileForm}
      </div>
    </div>
  )
}
