'use client'
import React from 'react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import * as z from 'zod'
import { useAuth } from '@/hooks/useAuth'
import { UserPlus } from 'lucide-react'

const schema = z.object({
  fullname: z.string().min(1, 'Name is required').max(100),
  email: z.string().email(),
  password: z.string().min(8, 'Password must be at least 8 characters'),
})
type RegisterFormValues = z.infer<typeof schema>

function getErrorMessage(error: unknown) {
  return error instanceof Error ? error.message : 'Unknown error'
}

export default function RegisterPage() {
  const { register: regFn } = useAuth()
  const router = useRouter()
  const { register, handleSubmit, formState: { errors, isSubmitting } } = useForm<RegisterFormValues>({ resolver: zodResolver(schema) })

  async function onSubmit(data: RegisterFormValues) {
    try {
      await regFn(data.fullname, data.email, data.password)
      router.push('/dashboard')
    } catch (err: unknown) {
      alert(getErrorMessage(err))
    }
  }

  return (
    <div className="container">
      <div className="mx-auto max-w-md py-10">
        <div className="panel panel-pad">
          <div>
            <div className="page-kicker">New workspace</div>
            <h1 className="page-title text-2xl sm:text-2xl">Create account</h1>
            <p className="page-subtitle">Start uploading and reviewing documents in a few moments.</p>
          </div>
          <form onSubmit={handleSubmit(onSubmit)} className="mt-6 space-y-4">
            <div>
              <label className="mb-1.5 block text-sm font-medium text-slate-700">Full name</label>
              <input {...register('fullname')} className="input" autoComplete="name" />
              {errors.fullname && <p className="mt-1 text-xs text-red-600">{errors.fullname.message as string}</p>}
            </div>
            <div>
              <label className="mb-1.5 block text-sm font-medium text-slate-700">Email</label>
              <input {...register('email')} className="input" autoComplete="email" />
              {errors.email && <p className="mt-1 text-xs text-red-600">{errors.email.message as string}</p>}
            </div>
            <div>
              <label className="mb-1.5 block text-sm font-medium text-slate-700">Password</label>
              <input type="password" {...register('password')} className="input" autoComplete="new-password" />
              {errors.password && <p className="mt-1 text-xs text-red-600">{errors.password.message as string}</p>}
            </div>
            <button type="submit" className="btn btn-primary w-full" disabled={isSubmitting}>
              <UserPlus size={17} />
              {isSubmitting ? 'Creating account...' : 'Create account'}
            </button>
          </form>
          <p className="mt-5 text-center text-sm text-slate-500">
            Already have an account? <Link href="/login" className="font-semibold text-blue-700 hover:underline">Sign in</Link>
          </p>
        </div>
      </div>
    </div>
  )
}
