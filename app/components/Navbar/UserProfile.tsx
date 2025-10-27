'use client'

import { useDynamicContext, useIsLoggedIn } from '@dynamic-labs/sdk-react-core'
import { useIsAdmin } from '@/app/hooks/useIsAdmin'

export default function UserProfile() {
  const { user, handleLogOut } = useDynamicContext()
  const isLoggedIn = useIsLoggedIn()
  const { isAdmin } = useIsAdmin()

  if (!isLoggedIn || !user) {
    return null
  }

  return (
    <div className="dropdown dropdown-end">
      <div tabIndex={0} role="button" className="btn btn-ghost btn-circle avatar">
        <div className="w-10 rounded-full bg-neutral text-neutral-content flex items-center justify-center">
          <span className="text-sm">{user?.email?.charAt(0).toUpperCase()}</span>
        </div>
      </div>
      <ul
        tabIndex={0}
        className="menu menu-sm dropdown-content bg-base-100/95 backdrop-blur-md rounded-box z-[1] mt-3 w-52 p-2 shadow-2xl border-2 border-base-300"
        style={{backgroundColor: 'rgb(255 255 255 / 0.98)', backdropFilter: 'blur(12px) saturate(180%)', WebkitBackdropFilter: 'blur(12px) saturate(180%)'}}
      >
        <li>
          <a className="justify-between font-semibold">
            Profil
            <span className="badge badge-primary">
              {isAdmin ? 'Admin' : 'User'}
            </span>
          </a>
        </li>
        <li className="divider my-0"></li>
        <li><a className="text-sm text-base-content/70">{user?.email}</a></li>
        <li className="divider my-0"></li>
        <li>
          <a onClick={handleLogOut} className="text-error hover:bg-error/10">
            🚪 Déconnexion
          </a>
        </li>
      </ul>
    </div>
  )
}
