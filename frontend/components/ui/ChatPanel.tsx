'use client'

import React, { useState } from 'react'
import Link from 'next/link'
import { Bot, FileText, Send, UserRound } from 'lucide-react'

import {
  askAllDocumentsQuestion,
  askDocumentQuestion,
} from '@/lib/api'

import { GlobalChatSource } from '@/types'
import { useAuth } from '@/hooks/useAuth'
import AssistantMarkdown from '@/components/ui/AssistantMarkdown'

interface Props {
  documentId?: number
  onSourceSelect?: (documentId: number) => void
}

type ChatMessage = {
  from: 'user' | 'bot'
  text: string
  sources?: GlobalChatSource[]
}

export const ChatPanel: React.FC<Props> = ({
  documentId,
  onSourceSelect,
}) => {
  const { token } = useAuth()

  const [messages, setMessages] =
    useState<ChatMessage[]>([])

  const [input, setInput] = useState('')
  const [loading, setLoading] = useState(false)

  async function send() {
    const question = input.trim()

    if (!question || loading) {
      return
    }

    setMessages((messages) => [
      ...messages,
      {
        from: 'user',
        text: question,
      },
    ])

    setInput('')
    setLoading(true)

    try {
      if (documentId != null) {
        const res = await askDocumentQuestion(
          documentId,
          question,
          token ?? undefined
        )

        setMessages((messages) => [
          ...messages,
          {
            from: 'bot',
            text: res.answer,
          },
        ])
      } else {
        const res = await askAllDocumentsQuestion(
          question,
          token ?? undefined
        )

        setMessages((messages) => [
          ...messages,
          {
            from: 'bot',
            text: res.answer,
            sources: res.sources,
          },
        ])
      }
    } catch (err: unknown) {
      setMessages((messages) => [
        ...messages,
        {
          from: 'bot',
          text: `Error: ${getErrorMessage(err)}`,
        },
      ])
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="panel flex h-full min-h-0 min-w-0 flex-col overflow-hidden">
      <div className="shrink-0 border-b border-slate-200 px-4 py-3">
        <div className="flex items-center gap-2 text-sm font-semibold text-slate-950">
          <Bot
            size={17}
            className="text-blue-600"
          />

          Document assistant
        </div>

        <div className="mt-1 text-xs text-slate-500">
          {documentId == null
            ? 'Searching across all vectorized documents'
            : 'Focused on the current document'}
        </div>
      </div>

      <div className="min-h-0 min-w-0 flex-1 space-y-3 overflow-y-auto bg-slate-50/70 p-4">
        {messages.length === 0 && (
          <div className="rounded-lg border border-dashed border-slate-300 bg-white p-5 text-center text-sm text-slate-500">
            Ask a question to get an answer with source references.
          </div>
        )}

        {messages.map((message, index) => {
          const isUser =
            message.from === 'user'

          return (
            <div
              key={index}
              className={`flex min-w-0 gap-2 ${
                isUser
                  ? 'justify-end'
                  : 'justify-start'
              }`}
            >
              {!isUser && (
                <span className="mt-1 flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-blue-100 text-blue-700">
                  <Bot size={14} />
                </span>
              )}

              <div
                className={`min-w-0 ${
                  isUser
                    ? 'max-w-[86%]'
                    : 'max-w-[calc(100%-36px)] flex-1'
                }`}
              >
                <div
                  className={`min-w-0 rounded-lg px-3 py-2 text-sm leading-6 shadow-sm ${
                    isUser
                      ? 'bg-blue-600 text-white'
                      : 'overflow-hidden border border-slate-200 bg-white text-slate-700'
                  }`}
                >
                  {isUser ? (
                    <div className="whitespace-pre-wrap break-words">
                      {message.text}
                    </div>
                  ) : (
                    <AssistantMarkdown
                      content={message.text}
                    />
                  )}
                </div>

                {message.sources &&
                  message.sources.length > 0 && (
                    <div className="mt-2 rounded-lg border border-slate-200 bg-white p-3">
                      <div className="mb-2 text-[11px] font-semibold uppercase tracking-wide text-slate-400">
                        Sources
                      </div>

                      <div className="flex flex-wrap gap-2">
                        {dedupeSources(
                          message.sources
                        ).map((source) =>
                          onSourceSelect ? (
                            <button
                              key={
                                source.document_id
                              }
                              type="button"
                              onClick={() =>
                                onSourceSelect(
                                  source.document_id
                                )
                              }
                              className="inline-flex max-w-full items-center gap-1.5 rounded-md bg-slate-100 px-2 py-1 text-left text-xs text-slate-600 transition hover:bg-slate-200"
                            >
                              <FileText
                                size={13}
                                className="shrink-0"
                              />

                              <span className="truncate">
                                {
                                  source.original_filename
                                }
                              </span>
                            </button>
                          ) : (
                            <Link
                              key={
                                source.document_id
                              }
                              href={`/documents/${source.document_id}`}
                              className="inline-flex max-w-full items-center gap-1.5 rounded-md bg-slate-100 px-2 py-1 text-xs text-slate-600 transition hover:bg-slate-200"
                            >
                              <FileText
                                size={13}
                                className="shrink-0"
                              />

                              <span className="truncate">
                                {
                                  source.original_filename
                                }
                              </span>
                            </Link>
                          )
                        )}
                      </div>
                    </div>
                  )}
              </div>

              {isUser && (
                <span className="mt-1 flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-slate-200 text-slate-600">
                  <UserRound size={14} />
                </span>
              )}
            </div>
          )
        })}

        {loading && (
          <div className="flex min-w-0 gap-2 justify-start">
            <span className="mt-1 flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-blue-100 text-blue-700">
              <Bot size={14} />
            </span>

            <div className="rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm text-slate-500 shadow-sm">
              Searching documents...
            </div>
          </div>
        )}
      </div>

      <div className="shrink-0 border-t border-slate-200 bg-white p-3">
        <div className="flex min-w-0 gap-2">
          <input
            value={input}
            onChange={(event) =>
              setInput(event.target.value)
            }
            onKeyDown={(event) => {
              if (
                event.key === 'Enter' &&
                !event.shiftKey
              ) {
                event.preventDefault()
                void send()
              }
            }}
            className="input min-w-0 flex-1"
            placeholder={
              documentId != null
                ? 'Ask about this document'
                : 'Ask about any document'
            }
            disabled={loading}
          />

          <button
            type="button"
            onClick={() => void send()}
            disabled={
              loading || !input.trim()
            }
            className="btn btn-primary shrink-0"
          >
            <Send size={16} />

            {loading
              ? 'Sending...'
              : 'Send'}
          </button>
        </div>
      </div>
    </div>
  )
}

function dedupeSources(
  sources: GlobalChatSource[]
) {
  return Array.from(
    new Map(
      sources.map((source) => [
        source.document_id,
        source,
      ])
    ).values()
  )
}

function getErrorMessage(
  error: unknown
) {
  return error instanceof Error
    ? error.message
    : 'Unknown error'
}

export default ChatPanel
