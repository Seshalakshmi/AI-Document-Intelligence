'use client'
import React from 'react'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import * as z from 'zod'
import { useAuth } from '../../hooks/useAuth'

const schema = z.object({ email: z.string().email(), password: z.string().min(6) })

export default function LoginPage() {
  const { login } = useAuth()
  const { register, handleSubmit, formState } = useForm({ resolver: zodResolver(schema) })

  async function onSubmit(data: any) {
    try {
      await login(data.email, data.password)
      // redirect to dashboard
      window.location.href = '/dashboard'
    } catch (err: any) {
      alert(err.message)
    }
  }

  return (
    <div className="container">
      <div className="max-w-md mx-auto mt-12">
        <h2 className="text-lg font-semibold">Login</h2>
        <form onSubmit={handleSubmit(onSubmit)} className="mt-4 space-y-3">
          <div>
            <label className="block text-sm">Email</label>
            <input {...register('email')} className="w-full border rounded px-3 py-2" />
          </div>
          <div>
            <label className="block text-sm">Password</label>
            <input type="password" {...register('password')} className="w-full border rounded px-3 py-2" />
          </div>
          <div>
            <button type="submit" className="px-4 py-2 bg-accent text-white rounded">Sign in</button>
          </div>
        </form>
      </div>
    </div>
  )
}
