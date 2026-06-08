'use client'

import { UserPlus } from 'lucide-react'

interface TeamCreateTabsProps {
  profileForm: React.ReactNode
}

export default function TeamCreateTabs({ profileForm }: TeamCreateTabsProps) {
  return (
    <div>
      <div
        className="bg-white dark:bg-gray-900 border-b border-gray-200 dark:border-gray-700 sticky top-0 z-10"
        style={{ marginBottom: 0 }}
      >
        <div
          className="flex gap-0"
          style={{ overflowX: 'auto', scrollbarWidth: 'none' }}
          role="tablist"
          aria-label="Sections du nouveau membre d'équipe"
        >
          <button
            role="tab"
            aria-selected={true}
            aria-controls="panel-profile"
            className="flex items-center gap-2 px-6 py-4 text-sm font-medium border-b-2 transition-all whitespace-nowrap border-primary text-primary focus:outline-none"
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
