'use client'
import React, { useState } from 'react'
import { askDocumentQuestion, askAllDocumentsQuestion } from '@/lib/api'
import { GlobalChatSource } from '@/types'

interface Props {
  // Omit documentId (or pass undefined) for global chat across every
  // vectorized document. Pass a documentId to scope chat to just that one.
  documentId?: number
}

export const ChatPanel: React.FC<Props> = ({ documentId }) => {
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
        const res = await askDocumentQuestion(documentId, question)
        setMessages((m) => [...m, { from: 'bot', text: res.answer }])
      } else {
        const res = await askAllDocumentsQuestion(question)
        setMessages((m) => [...m, { from: 'bot', text: res.answer, sources: res.sources }])
      }
    } catch (err: any) {
      setMessages((m) => [...m, { from: 'bot', text: 'Error: ' + err.message }])
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
              <div className="mt-1 flex flex-wrap gap-1">
                {[...new Set(m.sources.map((s) => s.original_filename))].map((filename) => (
                  <span key={filename} className="text-[11px] px-2 py-0.5 bg-slate-100 text-slate-500 rounded-full">
                    {filename}
                  </span>
                ))}
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

export default ChatPanel
