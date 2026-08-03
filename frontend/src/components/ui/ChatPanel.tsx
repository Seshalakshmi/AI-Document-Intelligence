import React, { useState } from 'react'
import { askDocumentQuestion } from '../../lib/api'

export const ChatPanel: React.FC<{ documentId: number }> = ({ documentId }) => {
  const [messages, setMessages] = useState<Array<{ from: 'user' | 'bot'; text: string }>>([])
  const [input, setInput] = useState('')
  const [loading, setLoading] = useState(false)

  async function send() {
    if (!input.trim()) return
    const userMsg = { from: 'user' as const, text: input }
    setMessages((m) => [...m, userMsg])
    setInput('')
    setLoading(true)
    try {
      // asks through single API surface; currently mocked in lib/api
      const res: any = await askDocumentQuestion(documentId, input)
      setMessages((m) => [...m, { from: 'bot', text: res.answer }])
    } catch (err: any) {
      setMessages((m) => [...m, { from: 'bot', text: 'Error: ' + err.message }])
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="border rounded-md p-4">
      <div className="h-64 overflow-y-auto mb-3 flex flex-col gap-2">
        {messages.map((m, i) => (
          <div key={i} className={`p-2 rounded ${m.from === 'user' ? 'bg-slate-100 self-end' : 'bg-indigo-50 self-start'}`}>
            {m.text}
          </div>
        ))}
      </div>
      <div className="flex gap-2">
        <input value={input} onChange={(e) => setInput(e.target.value)} className="flex-1 border rounded px-3 py-2" placeholder="Ask a question about this document" />
        <button onClick={send} disabled={loading} className="px-4 py-2 bg-accent text-white rounded">
          {loading ? '...' : 'Send'}
        </button>
      </div>
    </div>
  )
}

export default ChatPanel
