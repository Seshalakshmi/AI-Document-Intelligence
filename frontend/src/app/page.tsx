import React from 'react'
import Link from 'next/link'

export default function HomePage() {
  return (
    <div className="container">
      <div className="py-12">
        <h1 className="text-2xl font-bold">AI Document Intelligence</h1>
        <p className="mt-4 text-slate-600">Upload documents, extract structured data, and review AI-extracted fields.</p>
        <div className="mt-6 flex gap-3">
          <Link href="/dashboard" className="px-4 py-2 bg-accent text-white rounded">Go to Dashboard</Link>
          <Link href="/upload" className="px-4 py-2 border rounded">Upload</Link>
        </div>
      </div>
    </div>
  )
}
