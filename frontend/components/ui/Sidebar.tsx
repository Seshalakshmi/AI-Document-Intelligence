import React from 'react'
import Link from 'next/link'
import { useAuth } from '@/hooks/useAuth'

export const Sidebar: React.FC = () => {
  const { user } = useAuth()
  return (
    <aside className="w-64 border-r p-4 hidden md:block">
      <nav className="flex flex-col gap-2">
        <Link href="/dashboard" className="px-2 py-1 rounded hover:bg-slate-100">
          Dashboard
        </Link>
        <Link href="/upload" className="px-2 py-1 rounded hover:bg-slate-100">
          Upload
        </Link>
        <Link href="/search" className="px-2 py-1 rounded hover:bg-slate-100">
          Search
        </Link>
        {/* is_admin (not role === 'admin') matches the backend's actual get_current_admin_user check */}
        {user?.is_admin && (
          <div className="pt-2">
            <div className="text-xs text-slate-500 uppercase">Admin</div>
            <Link href="/admin/users" className="px-2 py-1 rounded hover:bg-slate-100">
              Users
            </Link>
          </div>
        )}
      </nav>
    </aside>
  )
}

export default Sidebar
