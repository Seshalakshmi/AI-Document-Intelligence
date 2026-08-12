'use client'
import React, { useEffect, useState } from 'react'
import * as api from '@/lib/api'
import { User } from '@/types'
import { useAuth } from '@/hooks/useAuth'
import { ShieldAlert, UsersRound } from 'lucide-react'

export default function AdminUsersPage() {
  const { token, user } = useAuth()
  const [users, setUsers] = useState<User[] | null>(null)
  const [loading, setLoading] = useState(false)

  useEffect(() => {
    if (!user || !user.is_admin) return
    let cancelled = false
    async function load() {
      setLoading(true)
      try {
        const res = await api.listUsers(token ?? undefined)
        if (!cancelled) setUsers(res)
      } catch (err: any) {
        alert(err.message)
      } finally {
        setLoading(false)
      }
    }
    load()
    return () => { cancelled = true }
  }, [token, user])

  async function changeRole(u: User, role: string) {
    try {
      const updated = await api.updateUserRole(u.id, role, token ?? undefined)
      setUsers((cur) => cur?.map((x) => (x.id === u.id ? updated : x)) ?? null)
    } catch (err: any) {
      alert(err.message)
    }
  }

  async function toggleActive(u: User) {
    try {
      const updated = await api.setUserActive(u.id, !u.is_active, token ?? undefined)
      setUsers((cur) => cur?.map((x) => (x.id === u.id ? updated : x)) ?? null)
    } catch (err: any) {
      alert(err.message)
    }
  }

  if (!user || !user.is_admin) {
    return (
      <div className="container">
        <div className="panel panel-pad flex items-center gap-3 text-sm text-rose-700">
          <ShieldAlert size={18} />
          Access denied.
        </div>
      </div>
    )
  }

  return (
    <div className="container page-stack">
      <div className="page-header">
        <div>
          <div className="page-kicker">Administration</div>
          <h1 className="page-title">User management</h1>
          <p className="page-subtitle">Manage account access, roles, and active status for your workspace.</p>
        </div>
        <div className="rounded-full border border-slate-200 bg-white px-3 py-1.5 text-sm font-medium text-slate-600">
          {users?.length ?? 0} users
        </div>
      </div>

      {loading && <div className="panel panel-pad text-sm text-slate-500">Loading users...</div>}

      <div className="table-shell">
        <div className="hidden grid-cols-[1fr_140px_140px_150px] gap-4 border-b border-slate-200 bg-slate-50 px-4 py-3 text-xs font-semibold uppercase tracking-wide text-slate-500 md:grid">
          <div>User</div>
          <div>Role</div>
          <div>Status</div>
          <div className="text-right">Action</div>
        </div>
        <div className="divide-y divide-slate-200">
          {users?.map((u) => (
            <div key={u.id} className="grid gap-3 px-4 py-4 md:grid-cols-[1fr_140px_140px_150px] md:items-center">
              <div className="flex min-w-0 items-center gap-3">
                <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-blue-50 text-blue-700">
                  <UsersRound size={17} />
                </span>
                <div className="min-w-0">
                  <div className="truncate text-sm font-semibold text-slate-950">{u.fullname}</div>
                  <div className="truncate text-xs text-slate-500">{u.email}</div>
                </div>
              </div>
              <select value={u.role} onChange={(e) => changeRole(u, e.target.value)} className="select">
                <option value="user">User</option>
                <option value="reviewer">Reviewer</option>
                <option value="admin">Admin</option>
              </select>
              <span
                className={`inline-flex w-fit rounded-full px-2.5 py-1 text-xs font-semibold ${
                  u.is_active ? 'bg-emerald-50 text-emerald-700' : 'bg-slate-100 text-slate-500'
                }`}
              >
                {u.is_active ? 'Active' : 'Inactive'}
              </span>
              <button onClick={() => toggleActive(u)} className="btn btn-secondary md:justify-self-end">
                {u.is_active ? 'Deactivate' : 'Activate'}
              </button>
            </div>
          ))}
          {!loading && users?.length === 0 && (
            <div className="px-4 py-10 text-center text-sm text-slate-500">No users found.</div>
          )}
        </div>
      </div>
    </div>
  )
}
