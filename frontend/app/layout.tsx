'use client'
import React from 'react'
import './globals.css'
import { AuthProvider } from '@/hooks/useAuth'
import AppShell from '@/components/ui/AppShell'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'

const queryClient = new QueryClient()

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <body>
        <AuthProvider>
          <QueryClientProvider client={queryClient}>
            <AppShell>{children}</AppShell>
          </QueryClientProvider>
        </AuthProvider>
      </body>
    </html>
  )
}
