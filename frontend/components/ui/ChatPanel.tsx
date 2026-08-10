'use client'
import React, { useState } from 'react'
import Link from 'next/link'
import { askDocumentQuestion, askAllDocumentsQuestion } from '@/lib/api'
import { GlobalChatSource } from '@/types'
import { useAuth } from '@/hooks/useAuth'
import { FileText } from 'lucide-react'

interface Props {
  // Omit documentId (or pass undefined) for global chat across every
  // vectorized document. Pass a documentId to scope chat to just that one.
  documentId?: number
  onSourceSelect?: (documentId: number) => void
}

export const ChatPanel: React.FC<Props> = ({ documentId, onSourceSelect }) => {
  const { token } = useAuth()
  const [messages, setMessages] = useState<
    Array<{ from: 'user' | 'bot'; text: string; sources?: GlobalChatSource[] }>
  >([])
  const [input, setInput] = useState('')
  const [loading, setLoading] = useState(false)

  async function send() {
    if (!input.trim()) return
    const question = input
    setMessages((m) => [...m, { from: 'user', text: question }])
    setInput('')
    setLoading(true)
    try {
      if (documentId != null) {
        const res = await askDocumentQuestion(documentId, question, token ?? undefined)
        setMessages((m) => [...m, { from: 'bot', text: res.answer }])
      } else {
        const res = await askAllDocumentsQuestion(question, token ?? undefined)
        setMessages((m) => [...m, { from: 'bot', text: res.answer, sources: res.sources }])
      }
    } catch (err: unknown) {
      setMessages((m) => [...m, { from: 'bot', text: 'Error: ' + getErrorMessage(err) }])
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="border rounded-md p-4">
      {documentId == null && (
        <div className="text-xs text-slate-400 mb-2">Searching across all your vectorized documents</div>
      )}
      <div className="h-64 overflow-y-auto mb-3 flex flex-col gap-2">
        {messages.map((m, i) => (
          <div key={i} className={`max-w-[85%] ${m.from === 'user' ? 'self-end' : 'self-start'}`}>
            <div className={`p-2 rounded ${m.from === 'user' ? 'bg-slate-100' : 'bg-indigo-50'}`}>{m.text}</div>
            {m.sources && m.sources.length > 0 && (
              <div className="mt-2 rounded border bg-white p-2">
                <div className="mb-1 text-[11px] font-medium text-slate-500">Sources</div>
                <div className="flex flex-wrap gap-1">
                  {dedupeSources(m.sources).map((source) =>
                    onSourceSelect ? (
                      <button
                        key={source.document_id}
                        type="button"
                        onClick={() => onSourceSelect(source.document_id)}
                        className="inline-flex max-w-full items-center gap-1 rounded bg-slate-100 px-2 py-1 text-left text-[11px] text-slate-600 hover:bg-slate-200"
                      >
                        <FileText size={12} className="shrink-0" />
                        <span className="truncate">{source.original_filename}</span>
                      </button>
                    ) : (
                      <Link
                        key={source.document_id}
                        href={`/documents/${source.document_id}`}
                        className="inline-flex max-w-full items-center gap-1 rounded bg-slate-100 px-2 py-1 text-[11px] text-slate-600 hover:bg-slate-200"
                      >
                        <FileText size={12} className="shrink-0" />
                        <span className="truncate">{source.original_filename}</span>
                      </Link>
                    )
                  )}
                </div>
              </div>
            )}
          </div>
        ))}
      </div>
      <div className="flex gap-2">
        <input
          value={input}
          onChange={(e) => setInput(e.target.value)}
          onKeyDown={(e) => e.key === 'Enter' && send()}
          className="flex-1 border rounded px-3 py-2"
          placeholder={documentId != null ? 'Ask a question about this document' : 'Ask a question about any of your documents'}
        />
        <button onClick={send} disabled={loading} className="px-4 py-2 bg-accent text-white rounded">
          {loading ? '...' : 'Send'}
        </button>
      </div>
    </div>
  )
}

function dedupeSources(sources: GlobalChatSource[]) {
  return Array.from(new Map(sources.map((source) => [source.document_id, source])).values())
}

function getErrorMessage(error: unknown) {
  return error instanceof Error ? error.message : 'Unknown error'
}

export default ChatPanel
