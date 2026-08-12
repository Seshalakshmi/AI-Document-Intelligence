'use client'
import React from 'react'
import Link from 'next/link'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import * as z from 'zod'
import { useAuth } from '@/hooks/useAuth'
import { FileSearch, LogIn } from 'lucide-react'

const schema = z.object({ email: z.string().email(), password: z.string().min(1, 'Password is required') })

export default function LoginPage() {
  const { login } = useAuth()
  const { register, handleSubmit, formState: { errors, isSubmitting } } = useForm({ resolver: zodResolver(schema) })

  async function onSubmit(data: any) {
    try {
      await login(data.email, data.password)
      window.location.href = '/dashboard'
    } catch (err: any) {
      alert(err.message)
    }
  }

  return (
    <div className="container">
      <div className="mx-auto grid min-h-[calc(100vh-10rem)] max-w-5xl items-center gap-8 lg:grid-cols-[1fr_420px]">
        <div className="hidden lg:block">
          <div className="inline-flex h-12 w-12 items-center justify-center rounded-lg bg-blue-600 text-white shadow-sm">
            <FileSearch size={24} />
          </div>
          <h1 className="mt-6 text-4xl font-semibold tracking-normal text-slate-950">Turn documents into searchable answers.</h1>
          <p className="mt-4 max-w-xl text-base leading-7 text-slate-600">
            Upload, extract, review, search, and chat with your document library from one focused workspace.
          </p>
        </div>

        <div className="panel panel-pad">
          <div>
            <div className="page-kicker">Welcome back</div>
            <h2 className="page-title text-2xl sm:text-2xl">Sign in</h2>
          </div>
          <form onSubmit={handleSubmit(onSubmit)} className="mt-6 space-y-4">
            <div>
              <label className="mb-1.5 block text-sm font-medium text-slate-700">Email</label>
              <input {...register('email')} className="input" autoComplete="email" />
              {errors.email && <p className="mt-1 text-xs text-red-600">{errors.email.message as string}</p>}
            </div>
            <div>
              <label className="mb-1.5 block text-sm font-medium text-slate-700">Password</label>
              <input type="password" {...register('password')} className="input" autoComplete="current-password" />
              {errors.password && <p className="mt-1 text-xs text-red-600">{errors.password.message as string}</p>}
            </div>
            <button type="submit" className="btn btn-primary w-full" disabled={isSubmitting}>
              <LogIn size={17} />
              {isSubmitting ? 'Signing in...' : 'Sign in'}
            </button>
          </form>
          <p className="mt-5 text-center text-sm text-slate-500">
            No account? <Link href="/register" className="font-semibold text-blue-700 hover:underline">Create one</Link>
          </p>
        </div>
      </div>
    </div>
  )
}
