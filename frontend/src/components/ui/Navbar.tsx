import React from 'react'
import Link from 'next/link'
import { useAuth } from '../../hooks/useAuth'
import { LogOut } from 'lucide-react'

export const Navbar: React.FC = () => {
  const { user, logout } = useAuth()
  return (
    <header className="w-full border-b bg-white/50">
      <div className="container flex items-center justify-between h-14">
        <div className="flex items-center gap-4">
          <Link href="/" className="font-semibold text-lg">
            AI Document Intelligence
          </Link>
        </div>
        <div className="flex items-center gap-4">
          {user ? (
            <>
              <span className="text-sm text-slate-600">{user.email}</span>
              <button className="p-2 rounded hover:bg-slate-100" onClick={() => logout()} aria-label="Logout">
                <LogOut size={16} />
              </button>
            </>
          ) : (
            <Link href="/login" className="text-sm text-slate-700">
              Login
            </Link>
          )}
        </div>
      </div>
    </header>
  )
}

export default Navbar
