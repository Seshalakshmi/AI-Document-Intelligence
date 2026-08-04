'use client'
import React from 'react'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import * as z from 'zod'
import { useAuth } from '@/hooks/useAuth'

// Backend UserCreate requires fullname (1-100 chars) -- it's not optional
const schema = z.object({
  fullname: z.string().min(1, 'Name is required').max(100),
  email: z.string().email(),
  password: z.string().min(8, 'Password must be at least 8 characters'), // backend enforces min_length=8
})

export default function RegisterPage() {
  const { register: regFn } = useAuth()
  const { register, handleSubmit, formState: { errors } } = useForm({ resolver: zodResolver(schema) })

  async function onSubmit(data: any) {
    try {
      await regFn(data.fullname, data.email, data.password)
      window.location.href = '/dashboard'
    } catch (err: any) {
      alert(err.message)
    }
  }

  return (
    <div className="container">
      <div className="max-w-md mx-auto mt-12">
        <h2 className="text-lg font-semibold">Register</h2>
        <form onSubmit={handleSubmit(onSubmit)} className="mt-4 space-y-3">
          <div>
            <label className="block text-sm">Full name</label>
            <input {...register('fullname')} className="w-full border rounded px-3 py-2" />
            {errors.fullname && <p className="text-xs text-red-600 mt-1">{errors.fullname.message as string}</p>}
          </div>
          <div>
            <label className="block text-sm">Email</label>
            <input {...register('email')} className="w-full border rounded px-3 py-2" />
            {errors.email && <p className="text-xs text-red-600 mt-1">{errors.email.message as string}</p>}
          </div>
          <div>
            <label className="block text-sm">Password</label>
            <input type="password" {...register('password')} className="w-full border rounded px-3 py-2" />
            {errors.password && <p className="text-xs text-red-600 mt-1">{errors.password.message as string}</p>}
          </div>
          <div>
            <button type="submit" className="px-4 py-2 bg-accent text-white rounded">Create account</button>
          </div>
        </form>
      </div>
    </div>
  )
}
