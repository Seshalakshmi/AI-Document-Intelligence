import React from 'react'
import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { useAuth } from '@/hooks/useAuth'
import { BarChart3, MessageSquare, Search, ShieldCheck, UploadCloud } from 'lucide-react'

export const Sidebar: React.FC = () => {
  const { user } = useAuth()
  const pathname = usePathname()
  const links = [
    { href: '/dashboard', label: 'Dashboard', icon: BarChart3 },
    { href: '/upload', label: 'Upload', icon: UploadCloud },
    { href: '/search', label: 'Search', icon: Search },
    { href: '/chat', label: 'Chat', icon: MessageSquare },
  ]

  return (
    <aside className="hidden w-64 shrink-0 border-r border-slate-200 bg-white/70 px-4 py-5 md:block">
      <nav className="flex flex-col gap-1">
        {links.map(({ href, label, icon: Icon }) => {
          const active = pathname === href || pathname.startsWith(`${href}/`)
          return (
            <Link
              key={href}
              href={href}
              className={`flex items-center gap-3 rounded-md px-3 py-2.5 text-sm font-medium transition ${
                active
                  ? 'bg-blue-50 text-blue-700'
                  : 'text-slate-600 hover:bg-slate-100 hover:text-slate-950'
              }`}
            >
              <Icon size={17} />
              {label}
            </Link>
          )
        })}
        {user?.is_admin && (
          <div className="mt-5 border-t border-slate-200 pt-5">
            <div className="mb-2 px-3 text-[11px] font-semibold uppercase tracking-[0.16em] text-slate-400">Admin</div>
            <Link
              href="/admin/users"
              className={`flex items-center gap-3 rounded-md px-3 py-2.5 text-sm font-medium transition ${
                pathname.startsWith('/admin')
                  ? 'bg-blue-50 text-blue-700'
                  : 'text-slate-600 hover:bg-slate-100 hover:text-slate-950'
              }`}
            >
              <ShieldCheck size={17} />
              Users
            </Link>
          </div>
        )}
      </nav>
    </aside>
  )
}

export default Sidebar
