'use client'
import React, { useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { useAuth } from '@/hooks/useAuth'

export default function HomePage() {
  const { user, loading } = useAuth()
  const router = useRouter()

  useEffect(() => {
    if (loading) return
    router.replace(user ? '/dashboard' : '/login')
  }, [user, loading, router])

  return (
    <div className="container">
      <div className="panel panel-pad text-sm text-slate-500">Loading...</div>
    </div>
  )
}
