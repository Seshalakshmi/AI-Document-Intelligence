'use client'
import React, { useState } from 'react'
import FileDropzone from '@/components/ui/FileDropzone'
import { useAuth } from '@/hooks/useAuth'
import * as api from '@/lib/api'
import { FileUp, ShieldCheck } from 'lucide-react'

function getErrorMessage(error: unknown) {
  return error instanceof Error ? error.message : 'Unknown error'
}

export default function UploadPage() {
  const { user, token } = useAuth()
  const [progress, setProgress] = useState<number | null>(null)
  const [message, setMessage] = useState<string | null>(null)
  const [tone, setTone] = useState<'success' | 'danger' | 'neutral'>('neutral')

  async function handleFile(file: File) {
    if (!user) {
      setTone('danger')
      setMessage('You must be logged in to upload.')
      return
    }
    setTone('neutral')
    setMessage(null)
    setProgress(0)
    try {
      await api.uploadDocument(file, user.id, token ?? undefined, (p) => setProgress(Math.round(p * 100)))
      setTone('success')
      setMessage('Upload complete. Processing has started.')
    } catch (err: unknown) {
      setTone('danger')
      setMessage('Upload failed: ' + getErrorMessage(err))
    } finally {
      setProgress(null)
    }
  }

  return (
    <div className="container page-stack">
      <div className="page-header">
        <div>
          <div className="page-kicker">Ingestion</div>
          <h1 className="page-title">Upload document</h1>
          <p className="page-subtitle">
            Add invoices, contracts, reports, or text files to extract content and prepare them for search.
          </p>
        </div>
      </div>

      <div className="grid gap-6 lg:grid-cols-[minmax(0,1fr)_320px]">
        <div className="panel panel-pad">
          <FileDropzone onFile={handleFile} accept="pdf|txt|docx" maxSizeBytes={10 * 1024 * 1024} />

          {progress !== null && (
            <div className="mt-5">
              <div className="mb-2 flex items-center justify-between text-sm">
                <span className="font-medium text-slate-700">Uploading</span>
                <span className="tabular-nums text-slate-500">{progress}%</span>
              </div>
              <div className="h-2 overflow-hidden rounded-full bg-slate-100">
                <div className="h-full rounded-full bg-blue-600 transition-all" style={{ width: `${progress}%` }} />
              </div>
            </div>
          )}

          {message && (
            <div
              className={`mt-4 rounded-md border px-3 py-2 text-sm ${
                tone === 'success'
                  ? 'border-emerald-200 bg-emerald-50 text-emerald-700'
                  : tone === 'danger'
                    ? 'border-rose-200 bg-rose-50 text-rose-700'
                    : 'border-slate-200 bg-slate-50 text-slate-600'
              }`}
            >
              {message}
            </div>
          )}
        </div>

        <aside className="space-y-4">
          <div className="panel panel-pad">
            <div className="flex items-center gap-3">
              <div className="flex h-9 w-9 items-center justify-center rounded-md bg-blue-50 text-blue-700">
                <FileUp size={18} />
              </div>
              <div className="text-sm font-semibold text-slate-950">Supported files</div>
            </div>
            <div className="mt-4 space-y-2 text-sm text-slate-600">
              <div>PDF, DOCX, and TXT</div>
              <div>Maximum file size: 10MB</div>
              <div>Processing runs automatically after upload.</div>
            </div>
          </div>
          <div className="panel panel-pad">
            <div className="flex items-center gap-3">
              <div className="flex h-9 w-9 items-center justify-center rounded-md bg-emerald-50 text-emerald-700">
                <ShieldCheck size={18} />
              </div>
              <div className="text-sm font-semibold text-slate-950">Review ready</div>
            </div>
            <p className="mt-3 text-sm leading-6 text-slate-600">
              Extracted invoice fields can be reviewed from the document detail page once processing is complete.
            </p>
          </div>
        </aside>
      </div>
    </div>
  )
}
