'use client'
import React, { useState } from 'react'
import Link from 'next/link'
import { askAllDocumentsQuestion, askDocumentQuestion } from '@/lib/api'
import { GlobalChatSource } from '@/types'
import { useAuth } from '@/hooks/useAuth'
import { Bot, FileText, Send, UserRound } from 'lucide-react'

interface Props {
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
    <div className="panel flex min-h-[460px] flex-col overflow-hidden">
      <div className="border-b border-slate-200 px-4 py-3">
        <div className="flex items-center gap-2 text-sm font-semibold text-slate-950">
          <Bot size={17} className="text-blue-600" />
          Document assistant
        </div>
        <div className="mt-1 text-xs text-slate-500">
          {documentId == null ? 'Searching across all vectorized documents' : 'Focused on the current document'}
        </div>
      </div>

      <div className="flex-1 space-y-3 overflow-y-auto bg-slate-50/70 p-4">
        {messages.length === 0 && (
          <div className="rounded-lg border border-dashed border-slate-300 bg-white p-5 text-center text-sm text-slate-500">
            Ask a question to get an answer with source references.
          </div>
        )}
        {messages.map((m, i) => (
          <div key={i} className={`flex gap-2 ${m.from === 'user' ? 'justify-end' : 'justify-start'}`}>
            {m.from === 'bot' && (
              <span className="mt-1 flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-blue-100 text-blue-700">
                <Bot size={14} />
              </span>
            )}
            <div className={`max-w-[86%] ${m.from === 'user' ? 'items-end' : 'items-start'}`}>
              <div
                className={`rounded-lg px-3 py-2 text-sm leading-6 shadow-sm ${
                  m.from === 'user' ? 'bg-blue-600 text-white' : 'border border-slate-200 bg-white text-slate-700'
                }`}
              >
                {m.text}
              </div>
              {m.sources && m.sources.length > 0 && (
                <div className="mt-2 rounded-lg border border-slate-200 bg-white p-3">
                  <div className="mb-2 text-[11px] font-semibold uppercase tracking-wide text-slate-400">Sources</div>
                  <div className="flex flex-wrap gap-2">
                    {dedupeSources(m.sources).map((source) =>
                      onSourceSelect ? (
                        <button
                          key={source.document_id}
                          type="button"
                          onClick={() => onSourceSelect(source.document_id)}
                          className="inline-flex max-w-full items-center gap-1.5 rounded-md bg-slate-100 px-2 py-1 text-left text-xs text-slate-600 hover:bg-slate-200"
                        >
                          <FileText size={13} className="shrink-0" />
                          <span className="truncate">{source.original_filename}</span>
                        </button>
                      ) : (
                        <Link
                          key={source.document_id}
                          href={`/documents/${source.document_id}`}
                          className="inline-flex max-w-full items-center gap-1.5 rounded-md bg-slate-100 px-2 py-1 text-xs text-slate-600 hover:bg-slate-200"
                        >
                          <FileText size={13} className="shrink-0" />
                          <span className="truncate">{source.original_filename}</span>
                        </Link>
                      )
                    )}
                  </div>
                </div>
              )}
            </div>
            {m.from === 'user' && (
              <span className="mt-1 flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-slate-200 text-slate-600">
                <UserRound size={14} />
              </span>
            )}
          </div>
        ))}
      </div>

      <div className="border-t border-slate-200 bg-white p-3">
        <div className="flex gap-2">
          <input
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyDown={(e) => e.key === 'Enter' && send()}
            className="input"
            placeholder={documentId != null ? 'Ask about this document' : 'Ask about any document'}
          />
          <button onClick={send} disabled={loading} className="btn btn-primary shrink-0">
            <Send size={16} />
            {loading ? 'Sending...' : 'Send'}
          </button>
        </div>
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
