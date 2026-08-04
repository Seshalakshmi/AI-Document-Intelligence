'use client'
import React, { useEffect, useState } from 'react'
import * as api from '@/lib/api'
import { User } from '@/types'
import { useAuth } from '@/hooks/useAuth'

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

  // Backend gates the real GET /api/users/ call server-side (get_current_admin_user);
  // this client-side check is just for UX, not security.
  if (!user || !user.is_admin) return <div className="container">Access denied</div>

  return (
    <div className="container">
      <h2 className="text-lg font-semibold mb-4">User Management</h2>
      {loading && <div>Loading…</div>}
      <div className="space-y-2">
        {users?.map((u) => (
          <div key={u.id} className="border rounded p-3 flex items-center justify-between">
            <div>
              <div className="text-sm font-medium">{u.fullname} <span className="text-slate-400">({u.email})</span></div>
              <div className="text-xs text-slate-500">Active: {u.is_active ? 'Yes' : 'No'}</div>
            </div>
            <div className="flex items-center gap-2">
              <select defaultValue={u.role} onChange={(e) => changeRole(u, e.target.value)} className="border rounded px-2 py-1">
                <option value="user">user</option>
                <option value="reviewer">reviewer</option>
                <option value="admin">admin</option>
              </select>
              <button onClick={() => toggleActive(u)} className="px-2 py-1 text-xs border rounded">
                {u.is_active ? 'Deactivate' : 'Activate'}
              </button>
            </div>
          </div>
        ))}
      </div>
    </div>
  )
}
