'use client'
import React, { useState } from 'react'
import FileDropzone from '../../components/ui/FileDropzone'
import { useAuth } from '../../hooks/useAuth'
import api from '../../lib/api'

export default function UploadPage() {
  const { token } = useAuth()
  const [progress, setProgress] = useState<number | null>(null)
  const [message, setMessage] = useState<string | null>(null)

  async function handleFile(file: File) {
    if (!user) { setMessage('You must be logged in to upload'); return }
    setMessage(null)
    setProgress(0)
    try {
      const res: any = await api.uploadDocument(file, user.id, token ?? undefined, (p) => setProgress(Math.round(p * 100)))
      setMessage('Uploaded — processing started')
    } catch (err: any) {
      setMessage('Upload failed: ' + err.message)
    } finally {
      setProgress(null)
    }
  }

  return (
    <div className="container">
      <h2 className="text-lg font-semibold mb-4">Upload Document</h2>
      <FileDropzone onFile={handleFile} accept="pdf|image|docx" maxSizeBytes={20 * 1024 * 1024} />
      {progress !== null && <div className="mt-4">Progress: {progress}%</div>}
      {message && <div className="mt-2 text-sm">{message}</div>}
    </div>
  )
}
