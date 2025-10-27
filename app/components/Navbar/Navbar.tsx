'use client'

import { DynamicWidget } from '@dynamic-labs/sdk-react-core'
import Image from 'next/image'
import { ThemeToggle } from '../ThemeToggle/ThemeToggle'

export default function Navbar() {

  return (
    <div 
      className="navbar fixed top-0 w-full z-50 shadow-lg backdrop-blur-md bg-white/95 dark:bg-gray-900/95 transition-all duration-300 font-sans" 
      style={{ padding: '0 32px', height: '90px' }}
    >
      <div className="flex-1">
        <div className="flex items-center gap-3">
          <div className="bg-black rounded-md p-1 flex items-center justify-center w-[70px] h-[70px]">
            <Image
              src="/img/Logo_InRealArt.svg"
              alt="InRealArt Logo"
              width={60}
              height={60}
              className="logo-image"
            />
          </div>
          <span className="text-xl font-semibold text-gray-900 dark:text-white">InRealArt backoffice</span>
        </div>
      </div>
      
      <div className="flex-none">
        <div className="flex items-center gap-2">
          <ThemeToggle />
          <div className="dropdown dropdown-end">
            <div tabIndex={0} role="button" className="btn btn-ghost btn-circle hover:bg-gray-100 dark:hover:bg-gray-800">
              <svg width="24" height="24" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg" className="text-gray-700 dark:text-gray-300">
                <path d="M3 12H21M3 6H21M3 18H21" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
              </svg>
            </div>
            <div tabIndex={0} className="dropdown-content z-[1] menu p-4 shadow-xl bg-white dark:bg-gray-800 rounded-box w-80 mt-3 border border-gray-200 dark:border-gray-600">
              <div className="flex flex-col gap-2">
                <span className="font-medium text-gray-700 dark:text-gray-300 mb-2">Connexion</span>
                <div className="dynamic-widget-container">
                  <DynamicWidget variant="modal" />
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}