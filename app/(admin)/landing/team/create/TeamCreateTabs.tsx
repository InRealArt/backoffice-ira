'use client'

import { formKit } from '@/app/components/Forms/FormKit/FormKit'
import { UserPlus } from 'lucide-react'

interface TeamCreateTabsProps {
  profileForm: React.ReactNode
}

export default function TeamCreateTabs({ profileForm }: TeamCreateTabsProps) {
  return (
    <div>
      <div className={formKit.tabBar}>
        <div
          className={formKit.tabList}
          role="tablist"
          aria-label="Sections du nouveau membre d'équipe"
        >
          <button
            id="tab-profile"
            role="tab"
            aria-selected={true}
            aria-controls="panel-profile"
            className={`${formKit.tabBtn} ${formKit.tabBtnActive}`}
            type="button"
          >
            <UserPlus size={16} />
            Nouveau membre
          </button>
        </div>
      </div>

      <div id="panel-profile" role="tabpanel" aria-labelledby="tab-profile">
        {profileForm}
      </div>
    </div>
  )
}
