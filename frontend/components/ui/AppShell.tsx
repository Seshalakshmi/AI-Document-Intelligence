import React from 'react'
import Navbar from './Navbar'
import Sidebar from './Sidebar'

export const AppShell: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  return (
    <div className="min-h-screen bg-slate-50 text-slate-950">
      <Navbar />
      <div className="flex min-h-[calc(100vh-4rem)]">
        <Sidebar />
        <main className="flex-1 px-0 py-6 md:py-8">{children}</main>
      </div>
    </div>
  )
}

export default AppShell
