import React from 'react'
import Link from 'next/link'
import { useAuth } from '@/hooks/useAuth'
import { FileSearch, LogOut, UserRound } from 'lucide-react'

export const Navbar: React.FC = () => {
  const { user, logout } = useAuth()
  return (
    <header className="sticky top-0 z-30 w-full border-b border-slate-200 bg-white/90 backdrop-blur">
      <div className="container flex h-16 items-center justify-between">
        <div className="flex min-w-0 items-center gap-3">
          <Link href="/" className="flex min-w-0 items-center gap-3">
            <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-blue-600 text-white shadow-sm">
              <FileSearch size={18} />
            </span>
            <span className="truncate text-base font-semibold tracking-normal text-slate-950">
              AI Document Intelligence
            </span>
          </Link>
        </div>
        <div className="flex items-center gap-3">
          {user ? (
            <>
              <div className="hidden items-center gap-2 rounded-full border border-slate-200 bg-slate-50 px-3 py-1.5 text-sm text-slate-700 sm:flex">
                <UserRound size={14} className="text-slate-400" />
                <span className="max-w-44 truncate">{user.fullname}</span>
              </div>
              <button className="btn btn-ghost h-9 w-9 p-0" onClick={() => logout()} aria-label="Logout">
                <LogOut size={16} />
              </button>
            </>
          ) : (
            <Link href="/login" className="btn btn-secondary">
              Login
            </Link>
          )}
        </div>
      </div>
    </header>
  )
}

export default Navbar
